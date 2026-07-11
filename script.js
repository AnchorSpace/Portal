/**
 * Property Submission Landing Page — Client Script
 * Handles form validation, media compression, upload progress, and API communication.
 */

/* ==========================================================================
   Configuration — Replace WEB_APP_URL with your deployed Google Apps Script URL
   ========================================================================== */
const CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwqH56iq1wTf4gPzhFQeVSvERdx2drmqh3iqepnGhZntetUNLwUfkviWqzaWcyU8bhS/exec',

  MAX_IMAGES: 20,
  MAX_VIDEOS: 3,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,       // 10 MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024,      // 500 MB before compression

  IMAGE_MAX_WIDTH: 1920,
  IMAGE_QUALITY: 0.78,                     // 75–80% WebP quality
  IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],

  VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
  VIDEO_EXTENSIONS: ['.mp4', '.mov', '.webm'],

  UPLOAD_CHUNK_SIZE: 8 * 1024 * 1024,     // 8 MB per chunk for large files
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000
};

/* ==========================================================================
   Application State
   ========================================================================== */
const state = {
  images: [],           // { id, file, compressedBlob, previewUrl, originalSize, compressedSize, name }
  videos: [],           // { id, file, compressedBlob, previewUrl, thumbnailUrl, duration, originalSize, compressedSize, name, compressed }
  isSubmitting: false,
  submissionId: null,     // Prevents duplicate submissions
  ffmpegLoaded: false,
  ffmpegInstance: null,
  videoFallbackResolve: null
};

/* ==========================================================================
   DOM References
   ========================================================================== */
const DOM = {
  form: document.getElementById('propertyForm'),
  submitBtn: document.getElementById('submitBtn'),
  progressOverlay: document.getElementById('progressOverlay'),
  progressFill: document.getElementById('progressFill'),
  progressTitle: document.getElementById('progressTitle'),
  progressStatus: document.getElementById('progressStatus'),
  progressEta: document.getElementById('progressEta'),
  successMessage: document.getElementById('successMessage'),
  successText: document.getElementById('successText'),
  submitAnother: document.getElementById('submitAnother'),
  imageDropzone: document.getElementById('imageDropzone'),
  imageInput: document.getElementById('imageInput'),
  imagePreview: document.getElementById('imagePreview'),
  imageCount: document.getElementById('imageCount'),
  videoDropzone: document.getElementById('videoDropzone'),
  videoInput: document.getElementById('videoInput'),
  videoPreview: document.getElementById('videoPreview'),
  videoCount: document.getElementById('videoCount'),
  description: document.getElementById('description'),
  charCount: document.getElementById('charCount'),
  navToggle: document.getElementById('navToggle'),
  navLinks: document.getElementById('navLinks'),
  videoFallbackModal: document.getElementById('videoFallbackModal'),
  modalCancel: document.getElementById('modalCancel'),
  modalConfirm: document.getElementById('modalConfirm'),
  header: document.querySelector('.site-header')
};

/* ==========================================================================
   Utility Functions
   ========================================================================== */

/** Generate a unique ID for media items */
function generateId() {
  return 'media_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

/** Format bytes to human-readable string */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/** Calculate percentage saved between original and compressed sizes */
function percentSaved(original, compressed) {
  if (original <= 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}

/** Sanitize text input — strip HTML tags and trim */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.textContent.trim();
}

/** Validate email format */
function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate URL format */
function isValidUrl(url) {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Get file extension in lowercase */
function getExtension(filename) {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

/** Delay helper for retry logic */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Format seconds as mm:ss */
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ==========================================================================
   Image Compression — Web Worker
   ========================================================================== */

/** Inline worker source for off-main-thread image compression */
const IMAGE_WORKER_SOURCE = `
  self.onmessage = async function(e) {
    const { imageBitmap, maxWidth, quality, skipRecompress, fileName } = e.data;

    try {
      let width = imageBitmap.width;
      let height = imageBitmap.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0, width, height);
      imageBitmap.close();

      // Try WebP first, fall back to JPEG
      let blob = await canvas.convertToBlob({ type: 'image/webp', quality: quality });
      let mimeType = 'image/webp';
      let ext = '.webp';

      if (!blob || blob.size === 0) {
        blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality });
        mimeType = 'image/jpeg';
        ext = '.jpg';
      }

      const buffer = await blob.arrayBuffer();
      self.postMessage({
        success: true,
        buffer: buffer,
        mimeType: mimeType,
        ext: ext,
        compressedSize: blob.size,
        fileName: fileName
      }, [buffer]);
    } catch (err) {
      self.postMessage({ success: false, error: err.message });
    }
  };
`;

/** Compress a single image file; returns Blob and metadata */
async function compressImage(file) {
  const originalSize = file.size;

  // Skip recompression if already small WebP under max width
  if (file.type === 'image/webp' && originalSize < 500 * 1024) {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width <= CONFIG.IMAGE_MAX_WIDTH) {
      bitmap.close();
      return {
        blob: file,
        mimeType: file.type,
        ext: getExtension(file.name) || '.webp',
        originalSize,
        compressedSize: originalSize,
        skipped: true
      };
    }
    bitmap.close();
  }

  const imageBitmap = await createImageBitmap(file);

  // Fallback: compress on main thread if workers unavailable
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    return compressImageMainThread(imageBitmap, file.name, originalSize);
  }

  return new Promise((resolve, reject) => {
    const blob = new Blob([IMAGE_WORKER_SOURCE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      URL.revokeObjectURL(workerUrl);
      worker.terminate();

      if (e.data.success) {
        const compressedBlob = new Blob([e.data.buffer], { type: e.data.mimeType });
        const baseName = file.name.replace(/\.[^.]+$/, '');
        resolve({
          blob: compressedBlob,
          mimeType: e.data.mimeType,
          ext: e.data.ext,
          name: baseName + e.data.ext,
          originalSize,
          compressedSize: e.data.compressedSize,
          skipped: false
        });
      } else {
        reject(new Error(e.data.error));
      }
    };

    worker.onerror = (err) => {
      URL.revokeObjectURL(workerUrl);
      worker.terminate();
      reject(err);
    };

    worker.postMessage({
      imageBitmap,
      maxWidth: CONFIG.IMAGE_MAX_WIDTH,
      quality: CONFIG.IMAGE_QUALITY,
      fileName: file.name
    }, [imageBitmap]);
  });
}

/** Main-thread fallback for image compression */
async function compressImageMainThread(imageBitmap, fileName, originalSize) {
  let width = imageBitmap.width;
  let height = imageBitmap.height;

  if (width > CONFIG.IMAGE_MAX_WIDTH) {
    height = Math.round((height * CONFIG.IMAGE_MAX_WIDTH) / width);
    width = CONFIG.IMAGE_MAX_WIDTH;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', CONFIG.IMAGE_QUALITY);
  });

  const mimeType = 'image/webp';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  return {
    blob: blob || file,
    mimeType,
    ext: '.webp',
    name: baseName + '.webp',
    originalSize,
    compressedSize: blob ? blob.size : originalSize,
    skipped: false
  };
}

/* ==========================================================================
   Video Compression — FFmpeg.wasm
   ========================================================================== */

/** Check if SharedArrayBuffer is available (required for FFmpeg.wasm threads) */
function isFFmpegSupported() {
  return typeof SharedArrayBuffer !== 'undefined' && typeof WebAssembly !== 'undefined';
}

/** Dynamically load FFmpeg from CDN */
async function loadFFmpeg() {
  if (state.ffmpegLoaded && state.ffmpegInstance) {
    return state.ffmpegInstance;
  }

  try {
    const { FFmpeg } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm');
    const { fetchFile, toBlobURL } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/+esm');

    const ffmpeg = new FFmpeg();

    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    });

    state.ffmpegInstance = { ffmpeg, fetchFile };
    state.ffmpegLoaded = true;
    return state.ffmpegInstance;
  } catch (err) {
    console.warn('FFmpeg load failed:', err);
    return null;
  }
}

/** Extract video thumbnail and duration */
function getVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth)) || 180;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve({ thumbnailUrl, duration });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata'));
    };

    video.src = url;
  });
}

/** Compress video using FFmpeg.wasm */
async function compressVideo(file, onProgress) {
  const originalSize = file.size;
  const metadata = await getVideoMetadata(file);

  if (!isFFmpegSupported()) {
    const confirmed = await showVideoFallbackModal();
    if (!confirmed) throw new Error('Upload cancelled by user');
    return {
      blob: file,
      mimeType: file.type || 'video/mp4',
      ext: getExtension(file.name) || '.mp4',
      name: file.name,
      originalSize,
      compressedSize: originalSize,
      duration: metadata.duration,
      thumbnailUrl: metadata.thumbnailUrl,
      compressed: false
    };
  }

  const ffmpegData = await loadFFmpeg();
  if (!ffmpegData) {
    const confirmed = await showVideoFallbackModal();
    if (!confirmed) throw new Error('Upload cancelled by user');
    return {
      blob: file,
      mimeType: file.type || 'video/mp4',
      ext: getExtension(file.name) || '.mp4',
      name: file.name,
      originalSize,
      compressedSize: originalSize,
      duration: metadata.duration,
      thumbnailUrl: metadata.thumbnailUrl,
      compressed: false
    };
  }

  const { ffmpeg, fetchFile } = ffmpegData;
  const inputName = 'input' + getExtension(file.name);
  const outputName = 'output.mp4';

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Scale to max 1080p, H.264 + AAC, 3 Mbps target bitrate
  await ffmpeg.exec([
    '-i', inputName,
    '-vf', "scale='min(1920,iw)':-2",
    '-c:v', 'libx264',
    '-b:v', '3M',
    '-maxrate', '4M',
    '-bufsize', '6M',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-preset', 'fast',
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });

  // Cleanup FFmpeg filesystem
  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch (_) { /* ignore cleanup errors */ }

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return {
    blob: compressedBlob,
    mimeType: 'video/mp4',
    ext: '.mp4',
    name: baseName + '_compressed.mp4',
    originalSize,
    compressedSize: compressedBlob.size,
    duration: metadata.duration,
    thumbnailUrl: metadata.thumbnailUrl,
    compressed: true
  };
}

/** Show modal when video compression is unavailable */
function showVideoFallbackModal() {
  return new Promise((resolve) => {
    state.videoFallbackResolve = resolve;
    DOM.videoFallbackModal.hidden = false;
    document.body.style.overflow = 'hidden';
  });
}

function closeVideoFallbackModal(result) {
  DOM.videoFallbackModal.hidden = true;
  document.body.style.overflow = '';
  if (state.videoFallbackResolve) {
    state.videoFallbackResolve(result);
    state.videoFallbackResolve = null;
  }
}

/* ==========================================================================
   File Validation
   ========================================================================== */

function validateImageFile(file) {
  const ext = getExtension(file.name);
  if (!CONFIG.IMAGE_TYPES.includes(file.type) && !CONFIG.IMAGE_EXTENSIONS.includes(ext)) {
    return `Unsupported image type: ${file.name}`;
  }
  if (file.size > CONFIG.MAX_IMAGE_SIZE) {
    return `${file.name} exceeds 10 MB limit`;
  }
  if (state.images.length >= CONFIG.MAX_IMAGES) {
    return `Maximum ${CONFIG.MAX_IMAGES} images allowed`;
  }
  return null;
}

function validateVideoFile(file) {
  const ext = getExtension(file.name);
  if (!CONFIG.VIDEO_TYPES.includes(file.type) && !CONFIG.VIDEO_EXTENSIONS.includes(ext)) {
    return `Unsupported video type: ${file.name}`;
  }
  if (file.size > CONFIG.MAX_VIDEO_SIZE) {
    return `${file.name} exceeds 500 MB limit`;
  }
  if (state.videos.length >= CONFIG.MAX_VIDEOS) {
    return `Maximum ${CONFIG.MAX_VIDEOS} videos allowed`;
  }
  return null;
}

/* ==========================================================================
   Image Upload UI — Drag & Drop, Preview, Reorder
   ========================================================================== */

function setupDropzone(dropzone, input, type) {
  dropzone.addEventListener('click', () => input.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (type === 'image') handleImageFiles(files);
    else handleVideoFiles(files);
  });

  input.addEventListener('change', () => {
    const files = Array.from(input.files);
    if (type === 'image') handleImageFiles(files);
    else handleVideoFiles(files);
    input.value = '';
  });
}

async function handleImageFiles(files) {
  const errors = [];
  for (const file of files) {
    const error = validateImageFile(file);
    if (error) {
      errors.push(error);
      continue;
    }
    if (state.images.length >= CONFIG.MAX_IMAGES) break;

    const id = generateId();
    const previewUrl = URL.createObjectURL(file);

    const item = {
      id,
      file,
      compressedBlob: null,
      previewUrl,
      originalSize: file.size,
      compressedSize: file.size,
      name: file.name,
      compressing: true
    };

    state.images.push(item);
    renderImagePreviews();
    updateImageCount();

    try {
      const result = await compressImage(file);
      item.compressedBlob = result.blob;
      item.compressedSize = result.compressedSize;
      item.name = result.name || file.name;
      item.mimeType = result.mimeType;

      // Update preview with compressed version
      URL.revokeObjectURL(previewUrl);
      item.previewUrl = URL.createObjectURL(result.blob);
    } catch (err) {
      console.error('Image compression failed:', err);
      item.compressedBlob = file;
      item.compressedSize = file.size;
    }

    item.compressing = false;
    renderImagePreviews();
  }

  if (errors.length) alert(errors.join('\n'));
}

async function handleVideoFiles(files) {
  const errors = [];
  for (const file of files) {
    const error = validateVideoFile(file);
    if (error) {
      errors.push(error);
      continue;
    }
    if (state.videos.length >= CONFIG.MAX_VIDEOS) break;

    const id = generateId();
    const item = {
      id,
      file,
      compressedBlob: null,
      originalSize: file.size,
      compressedSize: file.size,
      name: file.name,
      duration: 0,
      thumbnailUrl: '',
      compressing: true,
      compressed: false
    };

    state.videos.push(item);
    renderVideoPreviews();
    updateVideoCount();

    try {
      const result = await compressVideo(file);
      item.compressedBlob = result.blob;
      item.compressedSize = result.compressedSize;
      item.name = result.name;
      item.mimeType = result.mimeType;
      item.duration = result.duration;
      item.thumbnailUrl = result.thumbnailUrl;
      item.compressed = result.compressed;
    } catch (err) {
      if (err.message !== 'Upload cancelled by user') {
        console.error('Video processing failed:', err);
      }
      const idx = state.videos.findIndex(v => v.id === id);
      if (idx >= 0) state.videos.splice(idx, 1);
    }

    item.compressing = false;
    renderVideoPreviews();
    updateVideoCount();
  }

  if (errors.length) alert(errors.join('\n'));
}

function renderImagePreviews() {
  DOM.imagePreview.innerHTML = '';

  state.images.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'media-item';
    el.draggable = true;
    el.dataset.id = item.id;

    const saved = percentSaved(item.originalSize, item.compressedSize);
    const compressionText = item.compressing
      ? 'Compressing...'
      : saved > 0
        ? `Saved ${saved}% (${formatBytes(item.originalSize)} → ${formatBytes(item.compressedSize)})`
        : `Optimized (${formatBytes(item.compressedSize)})`;

    el.innerHTML = `
      <span class="media-item__drag-handle" title="Drag to reorder" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
      </span>
      <img class="media-item__thumb" src="${item.previewUrl}" alt="${sanitizeText(item.name)}" loading="lazy">
      <span class="media-item__order">${index + 1}</span>
      <button type="button" class="media-item__remove" aria-label="Remove image">&times;</button>
      <div class="media-item__info">
        <strong>${sanitizeText(item.name)}</strong>
        <span class="media-item__compression">${compressionText}</span>
      </div>
    `;

    el.querySelector('.media-item__remove').addEventListener('click', () => removeImage(item.id));

    // Drag-and-drop reorder
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      reorderImages(draggedId, item.id);
    });

    DOM.imagePreview.appendChild(el);
  });
}

function renderVideoPreviews() {
  DOM.videoPreview.innerHTML = '';

  state.videos.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'media-item video-item';

    const saved = percentSaved(item.originalSize, item.compressedSize);
    const compressionText = item.compressing
      ? 'Compressing video...'
      : item.compressed
        ? `Compressed: saved ${saved}% (${formatBytes(item.originalSize)} → ${formatBytes(item.compressedSize)})`
        : `Original upload (${formatBytes(item.originalSize)}) — device limitations`;

    el.innerHTML = `
      <div class="video-item__thumb-wrap">
        ${item.thumbnailUrl ? `<img class="video-item__thumb" src="${item.thumbnailUrl}" alt="Video thumbnail" loading="lazy">` : '<div class="video-item__thumb"></div>'}
        ${item.duration ? `<span class="video-item__duration">${formatDuration(item.duration)}</span>` : ''}
      </div>
      <div class="video-item__details">
        <strong>${sanitizeText(item.name)}</strong>
        <p>${compressionText}</p>
        ${item.duration ? `<p>Duration: ${formatDuration(item.duration)}</p>` : ''}
      </div>
      <button type="button" class="media-item__remove" aria-label="Remove video">&times;</button>
    `;

    el.querySelector('.media-item__remove').addEventListener('click', () => removeVideo(item.id));
    DOM.videoPreview.appendChild(el);
  });
}

function removeImage(id) {
  const idx = state.images.findIndex(img => img.id === id);
  if (idx >= 0) {
    URL.revokeObjectURL(state.images[idx].previewUrl);
    state.images.splice(idx, 1);
    renderImagePreviews();
    updateImageCount();
  }
}

function removeVideo(id) {
  const idx = state.videos.findIndex(v => v.id === id);
  if (idx >= 0) {
    state.videos.splice(idx, 1);
    renderVideoPreviews();
    updateVideoCount();
  }
}

function reorderImages(draggedId, targetId) {
  if (draggedId === targetId) return;
  const fromIdx = state.images.findIndex(img => img.id === draggedId);
  const toIdx = state.images.findIndex(img => img.id === targetId);
  if (fromIdx < 0 || toIdx < 0) return;

  const [moved] = state.images.splice(fromIdx, 1);
  state.images.splice(toIdx, 0, moved);
  renderImagePreviews();
}

function updateImageCount() {
  DOM.imageCount.textContent = state.images.length;
}

function updateVideoCount() {
  DOM.videoCount.textContent = state.videos.length;
}

/* ==========================================================================
   Form Validation
   ========================================================================== */

function validateForm() {
  let valid = true;
  const fields = [
    { id: 'sellerName', errorId: 'sellerNameError', validate: (v) => v.length >= 2 || 'Name must be at least 2 characters' },
    { id: 'phone', errorId: 'phoneError', validate: (v) => /^[\d\s+\-()]{7,20}$/.test(v) || 'Enter a valid phone number' },
    { id: 'email', errorId: 'emailError', validate: (v) => isValidEmail(v) || 'Enter a valid email address' },
    { id: 'propertyType', errorId: 'propertyTypeError', validate: (v) => v !== '' || 'Select a property type' },
    { id: 'county', errorId: 'countyError', validate: (v) => v.length >= 2 || 'County is required' },
    { id: 'city', errorId: 'cityError', validate: (v) => v.length >= 2 || 'City is required' },
    { id: 'address', errorId: 'addressError', validate: (v) => v.length >= 3 || 'Address is required' },
    { id: 'mapsLink', errorId: 'mapsLinkError', validate: (v) => isValidUrl(v) || 'Enter a valid URL' }
  ];

  fields.forEach(({ id, errorId, validate }) => {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(errorId);
    const value = sanitizeText(input.value);

    const result = validate(value);
    if (result !== true) {
      input.classList.add('error');
      errorEl.textContent = result;
      valid = false;
    } else {
      input.classList.remove('error');
      errorEl.textContent = '';
    }
  });

  return valid;
}

/** Collect form data into a structured object */
function collectFormData() {
  return {
    sellerName: sanitizeText(document.getElementById('sellerName').value),
    phone: sanitizeText(document.getElementById('phone').value),
    email: sanitizeText(document.getElementById('email').value),
    contactMethod: document.getElementById('contactMethod').value,
    propertyType: document.getElementById('propertyType').value,
    county: sanitizeText(document.getElementById('county').value),
    city: sanitizeText(document.getElementById('city').value),
    estate: sanitizeText(document.getElementById('estate').value),
    address: sanitizeText(document.getElementById('address').value),
    mapsLink: sanitizeText(document.getElementById('mapsLink').value),
    description: sanitizeText(document.getElementById('description').value)
  };
}

/* ==========================================================================
   Progress UI
   ========================================================================== */

let progressStartTime = 0;

function showProgress(title, status, percent) {
  DOM.progressOverlay.hidden = false;
  DOM.progressTitle.textContent = title;
  DOM.progressStatus.textContent = status;
  DOM.progressFill.style.width = percent + '%';
  updateETA(percent);
}

function updateETA(percent) {
  if (percent <= 0 || percent >= 100) {
    DOM.progressEta.textContent = '';
    return;
  }
  const elapsed = Date.now() - progressStartTime;
  const estimated = (elapsed / percent) * (100 - percent);
  const seconds = Math.ceil(estimated / 1000);
  if (seconds > 0) {
    DOM.progressEta.textContent = `Estimated time remaining: ${seconds < 60 ? seconds + 's' : Math.ceil(seconds / 60) + ' min'}`;
  }
}

function hideProgress() {
  DOM.progressOverlay.hidden = true;
}

/* ==========================================================================
   API Communication — Google Apps Script Web App
   ========================================================================== */

/** Convert Blob to base64 string */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** POST JSON to Google Apps Script with retry logic */
async function apiRequest(payload, retries = CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(CONFIG.WEB_APP_URL, {
        method: 'POST',
        // text/plain avoids CORS preflight with Google Apps Script
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server. Check your Web App URL and deployment settings.');
      }

      if (!data.success) {
        throw new Error(data.message || 'Server returned an error');
      }

      return data;
    } catch (err) {
      if (attempt === retries) throw err;
      await delay(CONFIG.RETRY_DELAY_MS * attempt);
    }
  }
}

/** Full submission flow: init → upload files → finalize */
async function submitProperty() {
  const formData = collectFormData();
  const submissionToken = generateId();
  state.submissionId = submissionToken;

  const totalSteps = 2 + state.images.length + state.videos.length;
  let currentStep = 0;

  const advance = (title, status) => {
    currentStep++;
    const percent = Math.round((currentStep / totalSteps) * 100);
    showProgress(title, status, percent);
  };

  progressStartTime = Date.now();
  showProgress('Saving Property...', 'Creating your property listing...', 5);

  // Step 1: Initialize submission — creates Drive folder and Property ID
  const initResult = await apiRequest({
    action: 'init',
    submissionToken,
    ...formData
  });

  const propertyId = initResult.propertyId;

  // Step 2: Upload images
  if (state.images.length > 0) {
    showProgress('Compressing Images...', 'Images already compressed. Uploading...', 15);
  }

  const imageUrls = [];
  for (let i = 0; i < state.images.length; i++) {
    const img = state.images[i];
    const blob = img.compressedBlob || img.file;
    const base64 = await blobToBase64(blob);

    advance('Uploading Files...', `Uploading image ${i + 1} of ${state.images.length}...`);

    const result = await apiRequest({
      action: 'uploadFile',
      propertyId,
      submissionToken,
      fileType: 'image',
      fileName: img.name,
      mimeType: img.mimeType || blob.type,
      index: i,
      data: base64
    });

    imageUrls.push(result.fileUrl);
  }

  // Step 3: Upload videos
  if (state.videos.length > 0) {
    showProgress('Compressing Videos...', 'Videos processed. Uploading...', 50);
  }

  const videoUrls = [];
  for (let i = 0; i < state.videos.length; i++) {
    const vid = state.videos[i];
    const blob = vid.compressedBlob || vid.file;
    const base64 = await blobToBase64(blob);

    advance('Uploading Files...', `Uploading video ${i + 1} of ${state.videos.length}...`);

    const result = await apiRequest({
      action: 'uploadFile',
      propertyId,
      submissionToken,
      fileType: 'video',
      fileName: vid.name,
      mimeType: vid.mimeType || blob.type,
      index: i,
      data: base64
    });

    videoUrls.push(result.fileUrl);
  }

  // Step 4: Finalize — update sheet row with media URLs
  advance('Saving Property...', 'Finalizing your submission...');

  await apiRequest({
    action: 'finalize',
    propertyId,
    submissionToken,
    imageUrls,
    videoUrls
  });

  showProgress('Submission Complete', 'Your property has been submitted successfully!', 100);
  await delay(800);
  hideProgress();

  return { propertyId };
}

/* ==========================================================================
   Form Submit Handler
   ========================================================================== */

async function handleSubmit(e) {
  e.preventDefault();

  if (state.isSubmitting) return;
  if (!validateForm()) {
    const firstError = document.querySelector('.form-field input.error, .form-field select.error');
    if (firstError) firstError.focus();
    return;
  }

  if (CONFIG.WEB_APP_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    alert('Please configure the Web App URL in script.js before submitting.');
    return;
  }

  // Check if any media is still compressing
  const stillCompressing = state.images.some(i => i.compressing) || state.videos.some(v => v.compressing);
  if (stillCompressing) {
    alert('Please wait for media compression to finish before submitting.');
    return;
  }

  state.isSubmitting = true;
  DOM.submitBtn.disabled = true;

  try {
    const result = await submitProperty();

    DOM.form.querySelectorAll('fieldset, .privacy-notice, .form-actions').forEach(el => {
      el.style.display = 'none';
    });
    DOM.successMessage.hidden = false;
    DOM.successText.textContent = `Thank you! Your property (ID: ${result.propertyId}) has been submitted. Our team will review your listing and contact you shortly.`;

    DOM.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    hideProgress();
    alert('Submission failed: ' + err.message + '\n\nPlease try again. If the problem persists, contact support.');
    console.error('Submission error:', err);
  } finally {
    state.isSubmitting = false;
    DOM.submitBtn.disabled = false;
    state.submissionId = null;
  }
}

/** Reset form for another submission */
function resetForm() {
  state.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
  state.images = [];
  state.videos = [];

  DOM.form.reset();
  DOM.form.querySelectorAll('fieldset, .privacy-notice, .form-actions').forEach(el => {
    el.style.display = '';
  });
  DOM.successMessage.hidden = true;
  DOM.charCount.textContent = '0';
  renderImagePreviews();
  renderVideoPreviews();
  updateImageCount();
  updateVideoCount();
  document.getElementById('submit-form').scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   Initialization
   ========================================================================== */

function init() {
  // Navigation toggle
  DOM.navToggle.addEventListener('click', () => {
    const open = DOM.navLinks.classList.toggle('open');
    DOM.navToggle.setAttribute('aria-expanded', open);
  });

  // Close mobile nav on link click
  DOM.navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => DOM.navLinks.classList.remove('open'));
  });

  // Header scroll shadow
  window.addEventListener('scroll', () => {
    DOM.header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // Character counter
  DOM.description.addEventListener('input', () => {
    DOM.charCount.textContent = DOM.description.value.length;
  });

  // Dropzones
  setupDropzone(DOM.imageDropzone, DOM.imageInput, 'image');
  setupDropzone(DOM.videoDropzone, DOM.videoInput, 'video');

  // Form submit
  DOM.form.addEventListener('submit', handleSubmit);

  // Submit another
  DOM.submitAnother.addEventListener('click', resetForm);

  // Video fallback modal
  DOM.modalCancel.addEventListener('click', () => closeVideoFallbackModal(false));
  DOM.modalConfirm.addEventListener('click', () => closeVideoFallbackModal(true));
  DOM.videoFallbackModal.querySelector('.modal__backdrop').addEventListener('click', () => closeVideoFallbackModal(false));

  // Clear field errors on input
  DOM.form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const errorEl = document.getElementById(input.id + 'Error');
      if (errorEl) errorEl.textContent = '';
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
