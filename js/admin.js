// ================================================================
// Vastuchitra Admin Panel — Engine (Next-Gen Obsidian Edition)
// ================================================================
(() => {
  'use strict';
  const hostedShowcase = !!window.VASTUCHITRA?.settings?.meetingPreview;

  // ---------------------------------------------------------------- State
  const state = {
    settings: {
      columns: 6, rows: 4, idleSeconds: 120, kiosk: false,
      cardGap: 16, cardRadius: 22, showClock: true, showAdmin: true,
      cardRowHeight: 130, pagePadding: 32, titleScale: 100, showBrandSubtitle: true, showDescriptions: true,
      showCategories: true, showGridDots: true, clock24Hour: false,
      showClockIcon: true, showSlidePager: true, motion: true, cardTilt: true,
      autoplaySlides: true, kioskHoldSeconds: 2, toolRevealSeconds: 15,
      showProjectCount: true, hideIdleCursor: true, resetSlidesOnIdle: true, disableSelection: true,
      headerGap: 20, cardContentPadding: 20, introAnimation: true,
      tiltStrength: 7, hoverZoom: 107, transitionSpeed: 100
    },
    projects: [],
    apps: {},
    assets: [],
    mediaConfig: { rootPath: 'assets', mirrorPath: '', collisionPolicy: 'rename' },
    currentMediaFolder: '',
    selectedMedia: new Set(),
    mediaEditMode: false,
    mediaViewMode: 'comfortable',
    pendingMediaFiles: [],
    pendingMediaCallback: null,
    mediaPreviewItems: [],
    mediaContextTarget: null,
    mediaActionMode: null,
    dirty: false,
    currentEdit: null,
    isNew: false,
    viewMode: 'grid', // 'grid' | 'list'
    activeEditorSection: 'general',
    assetPickerCallback: null,
    previewAssetIndex: -1
  };

  const ICONS = {
    cube: `<span class="material-symbols-outlined">deployed_code</span>`,
    orbit: `<span class="material-symbols-outlined">360</span>`,
    ar: `<span class="material-symbols-outlined">view_in_ar</span>`,
    vr: `<span class="material-symbols-outlined">vrpano</span>`,
    projector: `<span class="material-symbols-outlined">video_camera_front</span>`,
    reel: `<span class="material-symbols-outlined">movie</span>`,
    frames: `<span class="material-symbols-outlined">photo_library</span>`,
    building: `<span class="material-symbols-outlined">apartment</span>`,
    home: `<span class="material-symbols-outlined">home_work</span>`,
    landscape: `<span class="material-symbols-outlined">landscape</span>`,
    lighting: `<span class="material-symbols-outlined">lightbulb</span>`,
    model: `<span class="material-symbols-outlined">view_in_ar</span>`,
    blueprint: `<span class="material-symbols-outlined">architecture</span>`,
    garden: `<span class="material-symbols-outlined">park</span>`,
    hospitality: `<span class="material-symbols-outlined">king_bed</span>`,
    museum: `<span class="material-symbols-outlined">museum</span>`,
    retail: `<span class="material-symbols-outlined">storefront</span>`,
    wellness: `<span class="material-symbols-outlined">spa</span>`,
    cinema: `<span class="material-symbols-outlined">theaters</span>`,
    map: `<span class="material-symbols-outlined">map</span>`
  };

  const ACCENTS = {
    cyan: '#d7a34a',
    violet: '#68b89c',
    amber: '#e57c48',
    rose: '#d95f70',
    ocean: '#4d8fe8',
    orchid: '#a879e8',
    aqua: '#38c9c5',
    lime: '#9acb5a',
    cobalt: '#356de8',
    indigo: '#5c5bd6',
    plum: '#8247ad',
    magenta: '#d4479c',
    coral: '#f06f65',
    tangerine: '#ed8a2f',
    gold: '#c69b42',
    mint: '#70cdb1',
    emerald: '#168c68',
    glacier: '#7fc9df',
    slate: '#708394',
    pearl: '#c9c4b7'
  };

  const ACCENT_GLOWS = {
    cyan: 'rgba(215, 163, 74, 0.24)',
    violet: 'rgba(104, 184, 156, 0.24)',
    amber: 'rgba(229, 124, 72, 0.24)',
    rose: 'rgba(217, 95, 112, 0.24)',
    ocean: 'rgba(77, 143, 232, 0.24)',
    orchid: 'rgba(168, 121, 232, 0.24)',
    aqua: 'rgba(56, 201, 197, 0.24)',
    lime: 'rgba(154, 203, 90, 0.24)',
    cobalt: 'rgba(53, 109, 232, 0.24)',
    indigo: 'rgba(92, 91, 214, 0.24)',
    plum: 'rgba(130, 71, 173, 0.24)',
    magenta: 'rgba(212, 71, 156, 0.24)',
    coral: 'rgba(240, 111, 101, 0.24)',
    tangerine: 'rgba(237, 138, 47, 0.24)',
    gold: 'rgba(198, 155, 66, 0.24)',
    mint: 'rgba(112, 205, 177, 0.24)',
    emerald: 'rgba(22, 140, 104, 0.24)',
    glacier: 'rgba(127, 201, 223, 0.24)',
    slate: 'rgba(112, 131, 148, 0.24)',
    pearl: 'rgba(201, 196, 183, 0.24)'
  };

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const cssUrl = value => `url("${String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
  const formatBytes = b => {
    if (!b || b === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  const MEDIA_VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|avi|ogv)(?:[?#].*)?$/i;
  const isVideoPath = src => MEDIA_VIDEO_EXT.test(String(src || ''));

  function sourceRelativePath(src){
    const value = String(src || '');
    try {
      const url = new URL(value, window.location.origin);
      if (url.pathname === '/api/media-preview') return url.searchParams.get('path') || '';
      if (url.pathname.startsWith('/media/')) return decodeURIComponent(url.pathname.slice(7));
    } catch (_) {}
    return value.replace(/^[/\\]+/, '');
  }

  function assetForSource(src){
    const relative = sourceRelativePath(src).replace(/\\/g, '/');
    return state.assets.find(asset => {
      if (!asset || asset.kind === 'folder') return false;
      if ([asset.path, asset.previewPath, asset.thumbnailPath].filter(Boolean).includes(src)) return true;
      return String(asset.relativePath || '').replace(/\\/g, '/') === relative;
    }) || null;
  }

  function mediaDisplayName(src){
    const asset = assetForSource(src);
    if (asset?.name) return asset.name;
    const relative = sourceRelativePath(src);
    const parts = relative.replace(/\\/g, '/').split('/');
    try { return decodeURIComponent(parts.pop() || relative) || 'Untitled media'; }
    catch (_) { return parts.pop() || relative || 'Untitled media'; }
  }

  function mediaCandidates(src, thumbnail = false){
    const asset = assetForSource(src);
    const values = asset
      ? (thumbnail ? [asset.thumbnailPath, asset.previewPath, asset.path, src] : [asset.previewPath, asset.thumbnailPath, asset.path, src])
      : [src];
    const relative = sourceRelativePath(src);
    if (!asset && /\.tiff?$/i.test(relative)) {
      values.unshift(`/api/media-preview?path=${encodeURIComponent(relative)}&mode=${thumbnail ? 'thumb' : 'full'}`);
    }
    return [...new Set(values.filter(Boolean))];
  }

  function applyBackgroundWithFallback(element, src, thumbnail = false){
    const candidates = mediaCandidates(src, thumbnail);
    let index = 0;
    element.classList.add('media-loading');
    element.classList.remove('media-missing');
    const tryNext = () => {
      if (index >= candidates.length){
        element.style.backgroundImage = 'none';
        element.classList.remove('media-loading');
        element.classList.add('media-missing');
        return;
      }
      const candidate = candidates[index++];
      const probe = new Image();
      probe.onload = () => {
        element.style.backgroundImage = cssUrl(candidate);
        element.classList.remove('media-loading', 'media-missing');
        element.querySelector('.slide-thumb-fallback')?.remove();
      };
      probe.onerror = tryNext;
      probe.src = candidate;
    };
    tryNext();
  }

  // ---------------------------------------------------------------- Toast
  function showToast(msg, type = 'info'){
    const container = $('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${esc(msg)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ---------------------------------------------------------------- API
  async function api(path, method = 'GET', body = null){
    if (hostedShowcase){
      const assets = Array.from({ length:18 }, (_, i) => ({
        name:`project-${i + 1}.webp`, relativePath:`project-${i + 1}.webp`,
        path:`/public/demo/project-${i + 1}.webp`, kind:'file', mediaType:'image'
      }));
      if (path === '/api/config' && method === 'POST'){
        const config = { settings: { ...body.settings, meetingPreview:true, showAdmin:true, showTools:false }, projects:body.projects, apps:body.apps || {} };
        localStorage.setItem('vastuchitra-showcase-config-v1', JSON.stringify(config));
        window.VASTUCHITRA = config;
        return { success:true };
      }
      if (path === '/api/config') return { ...window.VASTUCHITRA, assets, mediaConfig:{ rootPath:'Bundled showcase images', mirrorPath:'', collisionPolicy:'rename' } };
      if (path === '/api/assets') return { assets };
      throw new Error('This feature needs the local PC server. Open Admin at http://localhost:4000/admin.html.');
    }
    const opts = {
      method,
      headers: {
        'x-requested-with': 'vastuchitra'
      }
    };
    if (body){
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    if (!res.ok){
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ---------------------------------------------------------------- Load Data
  async function loadConfig(){
    try {
      const data = await api('/api/config');
      state.settings = Object.assign({
        columns: 6, rows: 4, idleSeconds: 120, kiosk: false,
        cardGap: 16, cardRadius: 22, showClock: true, showAdmin: true,
        cardRowHeight: 130, pagePadding: 32, titleScale: 100, showBrandSubtitle: true, showDescriptions: true,
        showCategories: true, showGridDots: true, clock24Hour: false,
        showClockIcon: true, showSlidePager: true, motion: true, cardTilt: true,
        autoplaySlides: true, kioskHoldSeconds: 2, toolRevealSeconds: 15,
        showProjectCount: true, hideIdleCursor: true, resetSlidesOnIdle: true, disableSelection: true,
        headerGap: 20, cardContentPadding: 20, introAnimation: true,
        tiltStrength: 7, hoverZoom: 107, transitionSpeed: 100
      }, data.settings);
      state.projects = Array.isArray(data.projects) ? data.projects : [];
      state.apps = data.apps || {};
      state.assets = Array.isArray(data.assets) ? data.assets : [];
      state.mediaConfig = Object.assign({ rootPath:'assets', mirrorPath:'', collisionPolicy:'rename' }, data.mediaConfig || {});
      renderAll();
    } catch (e){
      console.error('Failed to load config:', e);
      showToast('Could not load configuration: ' + e.message, 'error');
    }
  }

  // ---------------------------------------------------------------- Auto-Save to Server
  let autoSaveTimeout = null;
  async function autoSave(showSuccessToast = false){
    readSettingsForm();
    const payload = {
      settings: state.settings,
      projects: state.projects,
      apps: state.apps
    };

    const indicator = $('autoSaveIndicator');
    if (indicator) {
      indicator.style.opacity = '1';
      indicator.innerHTML = `<span style="color:var(--cyan)">●</span> <span>Saving...</span>`;
    }

    try {
      await api('/api/config', 'POST', payload);
      if (indicator) {
        indicator.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> <span>Auto-Saved</span>`;
        setTimeout(() => {
          if (indicator) indicator.style.opacity = '0.75';
        }, 1200);
      }
      if (showSuccessToast) {
        showToast('Changes applied and saved to launcher!', 'success');
      }
    } catch (e){
      if (indicator) {
        indicator.innerHTML = `<span style="color:var(--rose)">✕</span> <span>Save Failed</span>`;
      }
      showToast('Auto-save failed: ' + e.message, 'error');
    }
  }

  // ---------------------------------------------------------------- Rendering
  function renderAll(){
    updateMetrics();
    renderProjectsList();
    renderAssets();
    renderSettings();
    updateBadges();
  }

  function updateMetrics(){
    const total = state.projects.length;
    let exeCount = 0;
    let webCount = 0;
    let slideCount = 0;

    state.projects.forEach(p => {
      const act = p.action || {};
      if (act.type === 'exe' || (act.type === 'detail' && act.app)) exeCount++;
      if (act.type === 'url' || (p.cat && p.cat.toLowerCase().includes('360'))) webCount++;
      if (Array.isArray(p.slides)) slideCount += p.slides.length;
    });

    if ($('statTotalCards')) $('statTotalCards').textContent = total;
    if ($('statExeCards')) $('statExeCards').textContent = exeCount;
    if ($('statWebCards')) $('statWebCards').textContent = webCount;
    if ($('statTotalSlides')) $('statTotalSlides').textContent = slideCount;
  }

  function updateBadges(){
    if ($('projectCountBadge')) $('projectCountBadge').textContent = state.projects.length;
    if ($('assetCountBadge')) $('assetCountBadge').textContent = state.assets.filter(item => item.kind !== 'folder').length;
  }

  function getProjectThumbnail(p){
    if (p.slides && p.slides.length > 0){
      const s0 = typeof p.slides[0] === 'string' ? p.slides[0] : p.slides[0].src;
      return mediaCandidates(s0, true)[0] || '';
    }
    return '';
  }

  // ---------------------------------------------------------------- Big Nice Cards Rendering
  function renderProjectsList(){
    const list = $('projectsList');
    if (!list) return;
    list.className = `cards-grid-view ${state.viewMode === 'list' ? 'list-mode' : ''}`;
    
    const query = ($('projectSearch') ? $('projectSearch').value : '').trim().toLowerCase();
    const filtered = state.projects.filter(p => {
      // Text query
      if (!query) return true;
      return (p.title && p.title.toLowerCase().includes(query)) ||
             (p.cat && p.cat.toLowerCase().includes(query)) ||
             (p.sub && p.sub.toLowerCase().includes(query)) ||
             (p.id && p.id.toLowerCase().includes(query));
    });

    if (filtered.length === 0){
      list.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 48px 20px; background: var(--panel); border: 1px dashed var(--line); border-radius: var(--radius-xl);">
          <p style="font-size:16px; font-weight:600; margin-bottom:8px; color: var(--text);">No experience cards found</p>
          <p style="font-size:13px; color:var(--muted);">Adjust your search query, or click <strong>+ Add New Card</strong> above.</p>
        </div>`;
      return;
    }

    list.innerHTML = '';
    filtered.forEach((p, idx) => {
      const thumb = getProjectThumbnail(p);
      const accent = p.accent || 'cyan';
      const accentHex = ACCENTS[accent] || ACCENTS.cyan;
      const accentGlow = ACCENT_GLOWS[accent] || ACCENT_GLOWS.cyan;
      const item = document.createElement('div');
      item.className = 'big-card-item';
      item.style.setProperty('--card-accent', accentHex);
      item.style.setProperty('--card-glow', accentGlow);
      item.dataset.id = p.id;
      item.dataset.index = idx;
      item.draggable = !query;

      item.innerHTML = `
        <div class="project-art">
          <div class="project-art-scrim"></div>
          <span class="project-drag-cue" aria-hidden="true"><span class="material-symbols-outlined">drag_indicator</span></span>
          <div class="project-card-actions">
            <button type="button" class="project-action-btn btn-edit" aria-label="Edit ${esc(p.title)}"><span class="material-symbols-outlined">edit_square</span></button>
            <button type="button" class="project-action-btn danger btn-del" aria-label="Delete ${esc(p.title)}"><span class="material-symbols-outlined">delete</span></button>
          </div>
          <div class="project-title-overlay">${esc(p.title)}</div>
        </div>
      `;

      if (thumb) applyBackgroundWithFallback(item.querySelector('.project-art'), thumb, true);

      // Event listeners
      item.querySelector('.btn-edit').addEventListener('click', () => openEditor(p));
      item.querySelector('.btn-del').addEventListener('click', () => deleteProject(p));
      if (!query) setupProjectDrag(item, list);

      list.appendChild(item);
    });
  }

  let draggedProjectCard = null;
  let projectOrderChanged = false;

  function animateProjectGrid(list, before){
    [...list.children].forEach(card => {
      if (card === draggedProjectCard) return;
      const old = before.get(card);
      if (!old) return;
      const now = card.getBoundingClientRect();
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      card.animate(
        [{ transform:`translate(${dx}px, ${dy}px)` }, { transform:'translate(0, 0)' }],
        { duration:260, easing:'cubic-bezier(.2,.8,.2,1)' }
      );
    });
  }

  function commitProjectOrder(list){
    if (!projectOrderChanged) return;
    const ids = [...list.querySelectorAll('.big-card-item')].map(card => card.dataset.id);
    const byId = new Map(state.projects.map(project => [project.id, project]));
    if (ids.length === state.projects.length) state.projects = ids.map(id => byId.get(id)).filter(Boolean);
    projectOrderChanged = false;
    updateMetrics();
    autoSave(false);
    showToast('Project order updated', 'success');
  }

  function setupProjectDrag(item, list){
    item.addEventListener('dragstart', e => {
      draggedProjectCard = item;
      projectOrderChanged = false;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.id);
      requestAnimationFrame(() => item.classList.add('is-dragging'));
    });
    item.addEventListener('dragover', e => {
      if (!draggedProjectCard || draggedProjectCard === item) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const before = new Map([...list.children].map(card => [card, card.getBoundingClientRect()]));
      const target = item.getBoundingClientRect();
      const source = draggedProjectCard.getBoundingClientRect();
      const sameRow = Math.abs(source.top - target.top) < target.height * .45;
      const placeBefore = sameRow ? e.clientX < target.left + target.width / 2 : e.clientY < target.top + target.height / 2;
      list.insertBefore(draggedProjectCard, placeBefore ? item : item.nextSibling);
      projectOrderChanged = true;
      animateProjectGrid(list, before);
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      commitProjectOrder(list);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('is-dragging');
      commitProjectOrder(list);
      draggedProjectCard = null;
    });
  }

  function deleteProject(p){
    if (!confirm(`Are you sure you want to delete "${p.title}"?`)) return;
    state.projects = state.projects.filter(x => x.id !== p.id);
    renderProjectsList();
    updateMetrics();
    updateBadges();
    autoSave(true);
  }

  // ---------------------------------------------------------------- Media Library
  const parentPath = value => {
    const parts = String(value || '').split('/').filter(Boolean);
    parts.pop();
    return parts.join('/');
  };

  const currentMediaItems = () => state.assets.filter(item => parentPath(item.relativePath) === state.currentMediaFolder);
  const currentMediaFiles = () => currentMediaItems().filter(item => item.kind !== 'folder');

  function renderMediaConfig(){
    if ($('mediaRootPath')) $('mediaRootPath').value = state.mediaConfig.rootPath || 'assets';
    if ($('mediaMirrorPath')) $('mediaMirrorPath').value = state.mediaConfig.mirrorPath || '';
    const status = $('mediaStorageStatus');
    if (status) status.textContent = `${state.currentMediaFolder ? `Media / ${state.currentMediaFolder}` : `Watching ${state.mediaConfig.rootPath || 'assets'}`}${state.mediaConfig.mirrorPath ? ` · Mirror active` : ''}`;
  }

  function renderMediaBreadcrumb(){
    const root = $('mediaBreadcrumb');
    if (!root) return;
    const parts = state.currentMediaFolder.split('/').filter(Boolean);
    root.innerHTML = '';
    const add = (label, folder) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = label;
      button.addEventListener('click', () => { state.currentMediaFolder = folder; state.selectedMedia.clear(); renderAssets(); });
      root.appendChild(button);
    };
    add('Media', '');
    let cursor = '';
    parts.forEach(part => {
      const separator = document.createElement('span'); separator.textContent = 'chevron_right'; separator.className = 'material-symbols-outlined'; root.appendChild(separator);
      cursor = cursor ? `${cursor}/${part}` : part;
      add(part, cursor);
    });
    if ($('btnMediaUp')) $('btnMediaUp').disabled = !state.currentMediaFolder;
  }

  function updateMediaSelectionUI(){
    const count = state.selectedMedia.size;
    if ($('mediaSelectionCount')) $('mediaSelectionCount').textContent = `${count} selected`;
    if ($('ctxMoveCount')) $('ctxMoveCount').textContent = String(count);
    if ($('ctxDeleteCount')) $('ctxDeleteCount').textContent = String(count);
    document.querySelectorAll('.asset-card').forEach(card => card.classList.toggle('selected', state.selectedMedia.has(card.dataset.path)));
    document.body.classList.toggle('media-editing', state.mediaEditMode);
    if ($('mediaSelectionToolbar')) {
      $('mediaSelectionToolbar').classList.toggle('open', state.mediaEditMode);
      $('mediaSelectionToolbar').setAttribute('aria-hidden', String(!state.mediaEditMode));
    }
    if ($('btnToggleMediaEdit')) {
      $('btnToggleMediaEdit').classList.toggle('active', state.mediaEditMode);
      $('btnToggleMediaEdit').setAttribute('aria-pressed', String(state.mediaEditMode));
      $('btnToggleMediaEdit').querySelector('span:last-child').textContent = state.mediaEditMode ? 'Editing' : 'Edit';
    }
    if ($('btnMoveSelectedMedia')) $('btnMoveSelectedMedia').disabled = count === 0;
    if ($('btnDeleteSelectedMedia')) $('btnDeleteSelectedMedia').disabled = count === 0;
  }

  function setMediaEditMode(enabled){
    state.mediaEditMode = !!enabled;
    if (!enabled) state.selectedMedia.clear();
    updateMediaSelectionUI();
  }

  function toggleMediaSelection(relativePath, additive = true){
    if (!additive) state.selectedMedia.clear();
    if (state.selectedMedia.has(relativePath)) state.selectedMedia.delete(relativePath);
    else state.selectedMedia.add(relativePath);
    updateMediaSelectionUI();
  }

  function renderAssets(){
    const grid = $('assetsGrid');
    if (!grid) return;
    renderMediaConfig();
    renderMediaBreadcrumb();
    grid.classList.toggle('compact', state.mediaViewMode === 'compact');
    const items = currentMediaItems();
    if (items.length === 0){
      grid.innerHTML = `<div class="media-empty"><span class="material-symbols-outlined">folder_open</span><strong>This folder is empty</strong><p>Drop images or videos above, or create a folder to organize the library.</p></div>`;
      updateMediaSelectionUI();
      return;
    }
    grid.innerHTML = '';
    items.forEach(a => {
      const card = document.createElement('div');
      card.className = `asset-card ${a.kind === 'folder' ? 'asset-folder' : ''}`;
      card.dataset.path = a.relativePath;
      const media = a.kind === 'folder'
        ? `<div class="folder-art"><span class="material-symbols-outlined">folder</span><small>Open folder</small></div>`
        : a.mediaType === 'video'
          ? `<video src="${a.path}" muted playsinline preload="metadata"></video><span class="video-badge"><span class="material-symbols-outlined">play_arrow</span>Video</span>`
          : a.mediaType === 'pdf'
            ? `<div class="pdf-art"><span class="material-symbols-outlined">picture_as_pdf</span><small>PDF DOCUMENT</small></div>`
            : `<span class="asset-loading"><span class="material-symbols-outlined">progress_activity</span><small>${a.originalFormat === 'tiff' ? 'Creating PNG preview' : 'Loading preview'}</small></span><img src="${a.thumbnailPath || a.previewPath || a.path}" alt="${esc(a.name)}" loading="lazy">`;
      card.innerHTML = `
        <button type="button" class="asset-preview" aria-label="${a.kind === 'folder' ? 'Open' : 'Preview'} ${esc(a.name)}">
          ${media}
          <span class="asset-image-scrim"></span>
          <span class="asset-caption">
            <strong>${esc(a.name)}</strong>
            <small>${a.kind === 'folder' ? 'Folder' : `${formatBytes(a.sizeBytes)} · ${esc((a.name.split('.').pop() || a.mediaType).toUpperCase())}`}</small>
          </span>
          <span class="asset-preview-indicator"><span class="material-symbols-outlined">${a.kind === 'folder' ? 'arrow_forward' : 'zoom_out_map'}</span></span>
        </button>
        <button type="button" class="asset-select" aria-label="Select ${esc(a.name)}"><span class="material-symbols-outlined">check</span></button>
        <div class="asset-floating-actions">
          <button type="button" class="asset-float-btn danger btn-delete-asset" aria-label="Delete ${esc(a.name)}"><span class="material-symbols-outlined">delete</span></button>
        </div>
      `;

      const image = card.querySelector('.asset-preview img');
      if (image) {
        image.addEventListener('load', () => card.classList.add('asset-image-ready'));
        image.addEventListener('error', () => card.classList.add('asset-image-unavailable'));
      }

      card.querySelector('.asset-preview').addEventListener('click', e => {
        if (state.mediaEditMode || e.ctrlKey || e.metaKey || e.shiftKey) {
          if (!state.mediaEditMode) setMediaEditMode(true);
          return toggleMediaSelection(a.relativePath, true);
        }
        if (a.kind === 'folder'){
          state.currentMediaFolder = a.relativePath;
          state.selectedMedia.clear();
          renderAssets();
        } else openMediaPreviewAsset(a);
      });
      card.querySelector('.asset-select').addEventListener('click', e => { e.stopPropagation(); toggleMediaSelection(a.relativePath, true); });
      card.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (state.mediaEditMode && !state.selectedMedia.has(a.relativePath)){ state.selectedMedia.clear(); state.selectedMedia.add(a.relativePath); }
        state.mediaContextTarget = a;
        updateMediaSelectionUI();
        showMediaContextMenu(e.clientX, e.clientY);
      });

      card.querySelector('.btn-delete-asset').addEventListener('click', e => {
        e.stopPropagation();
        if (!state.selectedMedia.has(a.relativePath)){ state.selectedMedia.clear(); state.selectedMedia.add(a.relativePath); }
        openMediaAction('delete');
      });

      grid.appendChild(card);
    });
  }

  async function refreshAssets(silent = false){
    try {
      const data = await api('/api/assets');
      state.assets = Array.isArray(data.assets) ? data.assets : [];
      if (data.mediaConfig) state.mediaConfig = Object.assign({}, state.mediaConfig, data.mediaConfig);
      state.selectedMedia = new Set([...state.selectedMedia].filter(rel => state.assets.some(item => item.relativePath === rel)));
      if (state.currentMediaFolder && !state.assets.some(item => item.kind === 'folder' && item.relativePath === state.currentMediaFolder)) state.currentMediaFolder = '';
      renderAssets(); updateBadges();
      if (!silent) showToast('Media library refreshed', 'success');
    } catch (error){ if (!silent) showToast('Could not refresh media: ' + error.message, 'error'); }
  }

  function updateMediaPreview(){
    const list = state.mediaPreviewItems;
    if (!list.length || state.previewAssetIndex < 0) return;
    state.previewAssetIndex = (state.previewAssetIndex + list.length) % list.length;
    const asset = list[state.previewAssetIndex];
    const image = $('mediaPreviewImage');
    const video = $('mediaPreviewVideo');
    const pdf = $('mediaPreviewPdf');
    const stage = image.closest('.media-preview-stage');
    stage.classList.remove('image-unavailable');
    $('mediaPreviewName').textContent = asset.name;
    $('mediaPreviewMeta').textContent = `${formatBytes(asset.sizeBytes)} · ${state.previewAssetIndex + 1} of ${list.length}`;
    image.hidden = asset.mediaType !== 'image';
    video.hidden = asset.mediaType !== 'video';
    pdf.hidden = asset.mediaType !== 'pdf';
    video.pause(); video.removeAttribute('src');
    image.removeAttribute('src');
    pdf.removeAttribute('src');
    if (asset.mediaType === 'video'){
      video.src = asset.path;
      video.onloadedmetadata = () => { $('mediaPreviewMeta').textContent = `${Math.round(video.duration || 0)} sec · ${formatBytes(asset.sizeBytes)} · ${state.previewAssetIndex + 1} of ${list.length}`; };
      video.onerror = () => { stage.classList.add('image-unavailable'); $('mediaPreviewMeta').textContent = `Video preview unavailable · ${formatBytes(asset.sizeBytes)}`; };
    } else if (asset.mediaType === 'pdf') {
      pdf.src = asset.path;
      $('mediaPreviewMeta').textContent = `PDF document · ${formatBytes(asset.sizeBytes)} · ${state.previewAssetIndex + 1} of ${list.length}`;
    } else {
    image.alt = asset.name;
    image.onload = () => {
      stage.classList.remove('image-unavailable');
        $('mediaPreviewMeta').textContent = `${image.naturalWidth} × ${image.naturalHeight}px · ${formatBytes(asset.sizeBytes)} · ${state.previewAssetIndex + 1} of ${list.length}`;
    };
    image.onerror = () => {
      stage.classList.add('image-unavailable');
        $('mediaPreviewMeta').textContent = `Browser preview unavailable · ${formatBytes(asset.sizeBytes)} · ${state.previewAssetIndex + 1} of ${list.length}`;
    };
    image.src = asset.previewPath || asset.path;
    }
    $('btnMediaPrev').hidden = list.length < 2;
    $('btnMediaNext').hidden = list.length < 2;
  }

  function openMediaPreviewAsset(asset){
    state.mediaPreviewItems = currentMediaFiles();
    state.previewAssetIndex = state.mediaPreviewItems.findIndex(item => item.relativePath === asset.relativePath);
    updateMediaPreview();
    $('mediaPreviewModal').classList.add('open');
    $('mediaPreviewModal').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    $('btnMediaPreviewClose').focus({ preventScroll: true });
  }

  function closeMediaPreview(){
    const modal = $('mediaPreviewModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    $('mediaPreviewImage').removeAttribute('src');
    $('mediaPreviewVideo').pause();
    $('mediaPreviewVideo').removeAttribute('src');
    $('mediaPreviewPdf').removeAttribute('src');
    state.previewAssetIndex = -1;
  }

  function stepMediaPreview(direction){
    if (!state.mediaPreviewItems.length) return;
    state.previewAssetIndex += direction;
    updateMediaPreview();
  }

  async function uploadFile(file, folder, collisionPolicy){
    if (hostedShowcase) throw new Error('Uploads need the local PC server. The web editor can use the bundled image library.');
    const response = await fetch('/api/upload-media', {
      method:'POST', body:file,
      headers:{
        'x-requested-with':'vastuchitra',
        'x-file-name':encodeURIComponent(file.name),
        'x-media-folder':encodeURIComponent(folder || ''),
        'x-collision-policy':collisionPolicy || 'rename',
        'content-type':file.type || 'application/octet-stream'
      }
    });
    const result = await response.json().catch(() => ({ error:'Upload failed' }));
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return result;
  }

  async function handleFilesUpload(files, onComplete = null){
    if (!files || files.length === 0) return;
    state.pendingMediaFiles = Array.from(files);
    state.pendingMediaCallback = typeof onComplete === 'function' ? onComplete : null;
    openMediaImport();
  }

  function mediaFolders(){
    return state.assets.filter(item => item.kind === 'folder').sort((a,b) => a.relativePath.localeCompare(b.relativePath));
  }

  function updateMediaImportConflicts(){
    const destination = $('mediaImportDestination')?.value || '';
    const existing = new Set(state.assets.filter(item => item.kind === 'file' && parentPath(item.relativePath) === destination).map(item => item.name.toLowerCase()));
    const conflicts = state.pendingMediaFiles.filter(file => existing.has(file.name.toLowerCase()));
    const box = $('mediaImportConflicts');
    if (!box) return;
    box.classList.toggle('has-conflicts', conflicts.length > 0);
    box.innerHTML = conflicts.length
      ? `<span class="material-symbols-outlined">error</span><div><strong>${conflicts.length} filename conflict${conflicts.length === 1 ? '' : 's'}</strong><p>${conflicts.slice(0,3).map(file => esc(file.name)).join(', ')}${conflicts.length > 3 ? ` and ${conflicts.length - 3} more` : ''}. Choose how to handle them below.</p></div>`
      : `<span class="material-symbols-outlined">check_circle</span><div><strong>Ready to upload</strong><p>No matching filenames in this folder.</p></div>`;
  }

  function openMediaImport(){
    const modal = $('mediaImportModal');
    const destination = $('mediaImportDestination');
    const folders = mediaFolders();
    destination.innerHTML = `<option value="">Media (root)</option>${folders.map(folder => `<option value="${esc(folder.relativePath)}">${esc(folder.relativePath)}</option>`).join('')}`;
    destination.value = folders.some(folder => folder.relativePath === state.currentMediaFolder) ? state.currentMediaFolder : '';
    $('mediaImportCollision').value = state.mediaConfig.collisionPolicy || 'rename';
    const totalBytes = state.pendingMediaFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    $('mediaImportSummary').innerHTML = `<span class="material-symbols-outlined">collections</span><div><strong>${state.pendingMediaFiles.length} file${state.pendingMediaFiles.length === 1 ? '' : 's'}</strong><p>${formatBytes(totalBytes)} total · uploads stream directly to disk</p></div>`;
    updateMediaImportConflicts();
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeMediaImport(cancelled = true){
    const modal = $('mediaImportModal');
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    state.pendingMediaFiles = [];
    if (cancelled) state.pendingMediaCallback = null;
    if (!$('mediaPreviewModal').classList.contains('open') && !$('editorModal').classList.contains('open')) document.body.classList.remove('modal-open');
  }

  async function confirmMediaImport(){
    if (!state.pendingMediaFiles.length) return closeMediaImport();
    const files = [...state.pendingMediaFiles];
    const folder = $('mediaImportDestination').value;
    const collisionPolicy = $('mediaImportCollision').value;
    const completion = state.pendingMediaCallback;
    const button = $('btnConfirmMediaImport');
    let count = 0, skipped = 0, uploadedPaths = [];
    const zone = $('assetDropZone');
    button.disabled = true;
    closeMediaImport(false);
    zone.classList.add('uploading');
    zone.querySelector('h3').textContent = `Uploading ${files.length} file${files.length === 1 ? '' : 's'}…`;
    for (const f of files){
      try {
        const result = await uploadFile(f, folder, collisionPolicy);
        if (result.skipped) skipped++; else { count++; if (result.path) uploadedPaths.push(result.path); }
      } catch (e){
        showToast(`Failed uploading ${f.name}: ${e.message}`, 'error');
      }
    }
    zone.classList.remove('uploading');
    zone.querySelector('h3').textContent = 'Drop images, videos or PDFs here';
    await refreshAssets(true);
    if (count > 0) showToast(`Added ${count} media file${count === 1 ? '' : 's'}${skipped ? ` · ${skipped} skipped` : ''}`, 'success');
    else if (skipped) showToast(`${skipped} duplicate file${skipped === 1 ? '' : 's'} skipped`, 'info');
    if (completion && uploadedPaths.length) completion(uploadedPaths);
    state.pendingMediaCallback = null;
    button.disabled = false;
  }

  function hideMediaContextMenu(){
    const menu = $('mediaContextMenu');
    if (!menu) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  }

  function showMediaContextMenu(x, y){
    const menu = $('mediaContextMenu');
    if (!menu) return;
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(10, Math.min(x, window.innerWidth - rect.width - 10))}px`;
    menu.style.top = `${Math.max(10, Math.min(y, window.innerHeight - rect.height - 10))}px`;
    const hasSelection = state.selectedMedia.size > 0;
    menu.querySelector('[data-media-action="move"]').disabled = !hasSelection || !state.mediaEditMode;
    menu.querySelector('[data-media-action="delete"]').disabled = !hasSelection || !state.mediaEditMode;
    menu.querySelector('[data-media-action="open"]').disabled = !state.mediaContextTarget;
  }

  function closeMediaAction(){
    const modal = $('mediaActionModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    state.mediaActionMode = null;
  }

  function openMediaAction(mode){
    hideMediaContextMenu();
    state.mediaActionMode = mode;
    const modal = $('mediaActionModal');
    const title = $('mediaActionTitle');
    const description = $('mediaActionDescription');
    const icon = $('mediaActionIcon');
    const field = $('mediaActionField');
    const confirm = $('btnConfirmMediaAction');
    field.innerHTML = '';
    confirm.className = 'btn primary';
    if (mode === 'new-folder'){
      icon.textContent = 'create_new_folder'; title.textContent = 'Create a folder';
      description.textContent = `Add a folder inside ${state.currentMediaFolder || 'Media'}.`;
      field.innerHTML = `<label class="media-dialog-label">Folder name<input class="form-input" id="newMediaFolderName" maxlength="80" placeholder="Project renders"></label>`;
      confirm.textContent = 'Create folder';
    } else if (mode === 'move'){
      icon.textContent = 'drive_file_move'; title.textContent = `Move ${state.selectedMedia.size} item${state.selectedMedia.size === 1 ? '' : 's'}`;
      description.textContent = 'Choose a destination folder. Filename conflicts follow the selected storage policy.';
      const selected = [...state.selectedMedia];
      const folders = state.assets.filter(item => item.kind === 'folder' && !selected.some(rel => item.relativePath === rel || item.relativePath.startsWith(rel + '/')));
      field.innerHTML = `<label class="media-dialog-label">Destination<select class="form-input" id="mediaMoveDestination"><option value="">Media (root)</option>${folders.map(folder => `<option value="${esc(folder.relativePath)}">${esc(folder.relativePath)}</option>`).join('')}</select></label>`;
      confirm.textContent = 'Move items';
    } else {
      icon.textContent = 'delete_forever'; title.textContent = `Delete ${state.selectedMedia.size} item${state.selectedMedia.size === 1 ? '' : 's'}?`;
      description.textContent = 'Folders and everything inside them will be removed from the media library. This cannot be undone.';
      field.innerHTML = `<div class="delete-summary">${[...state.selectedMedia].slice(0,4).map(rel => `<span><span class="material-symbols-outlined">${state.assets.find(item => item.relativePath === rel)?.kind === 'folder' ? 'folder' : 'draft'}</span>${esc(rel)}</span>`).join('')}${state.selectedMedia.size > 4 ? `<small>and ${state.selectedMedia.size - 4} more…</small>` : ''}</div>`;
      confirm.textContent = 'Delete permanently'; confirm.className = 'btn danger-solid';
    }
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => field.querySelector('input,select')?.focus(), 0);
  }

  async function confirmMediaAction(){
    const mode = state.mediaActionMode;
    const button = $('btnConfirmMediaAction');
    button.disabled = true;
    try {
      if (mode === 'new-folder'){
        const name = $('newMediaFolderName').value.trim();
        if (!name) throw new Error('Enter a folder name.');
        await api('/api/media/create-folder', 'POST', { parent:state.currentMediaFolder, name });
        showToast(`Created ${name}`, 'success');
      } else if (mode === 'move'){
        const destination = $('mediaMoveDestination').value;
        const result = await api('/api/media/move', 'POST', { paths:[...state.selectedMedia], destination, collisionPolicy:state.mediaConfig.collisionPolicy });
        showToast(`Moved ${result.moved} item${result.moved === 1 ? '' : 's'}${result.skipped ? ` · ${result.skipped} skipped` : ''}`, 'success');
      } else if (mode === 'delete'){
        const result = await api('/api/media/delete', 'POST', { paths:[...state.selectedMedia] });
        showToast(`Deleted ${result.deleted} item${result.deleted === 1 ? '' : 's'}`, 'info');
      }
      state.selectedMedia.clear(); closeMediaAction(); await refreshAssets(true);
    } catch (error){ showToast(error.message, 'error'); }
    finally { button.disabled = false; }
  }

  async function saveMediaStorage(){
    const button = $('btnSaveMediaConfig');
    button.disabled = true;
    try {
      const result = await api('/api/media-config', 'POST', {
        rootPath:$('mediaRootPath').value.trim() || 'assets',
        mirrorPath:$('mediaMirrorPath').value.trim(),
        collisionPolicy:state.mediaConfig.collisionPolicy || 'rename'
      });
      state.mediaConfig = result.mediaConfig;
      state.assets = result.assets || [];
      state.currentMediaFolder = ''; state.selectedMedia.clear();
      renderAssets(); updateBadges(); showToast('Media storage updated and watcher restarted', 'success');
    } catch (error){ showToast('Could not update storage: ' + error.message, 'error'); }
    finally { button.disabled = false; }
  }

  // ---------------------------------------------------------------- Settings & Visualizer
  function renderSettings(){
    if ($('cfgColumns')) $('cfgColumns').value = state.settings.columns || 6;
    if ($('cfgRows')) $('cfgRows').value = state.settings.rows || 4;
    if ($('cfgIdleSeconds')) $('cfgIdleSeconds').value = state.settings.idleSeconds != null ? state.settings.idleSeconds : 120;
    if ($('cfgCardGap')) $('cfgCardGap').value = state.settings.cardGap != null ? state.settings.cardGap : 16;
    if ($('cfgCardRadius')) $('cfgCardRadius').value = state.settings.cardRadius != null ? state.settings.cardRadius : 22;
    if ($('cfgCardRowHeight')) $('cfgCardRowHeight').value = state.settings.cardRowHeight != null ? state.settings.cardRowHeight : 130;
    if ($('cfgPagePadding')) $('cfgPagePadding').value = state.settings.pagePadding != null ? state.settings.pagePadding : 32;
    if ($('cfgTitleScale')) $('cfgTitleScale').value = state.settings.titleScale != null ? state.settings.titleScale : 100;
    if ($('cfgHeaderGap')) $('cfgHeaderGap').value = state.settings.headerGap != null ? state.settings.headerGap : 20;
    if ($('cfgCardContentPadding')) $('cfgCardContentPadding').value = state.settings.cardContentPadding != null ? state.settings.cardContentPadding : 20;
    if ($('cfgKiosk')) $('cfgKiosk').checked = !!state.settings.kiosk;
    if ($('cfgShowClock')) $('cfgShowClock').checked = state.settings.showClock !== false;
    if ($('cfgShowAdmin')) $('cfgShowAdmin').checked = state.settings.showAdmin !== false;
    if ($('cfgAdminPasswordRequired')) $('cfgAdminPasswordRequired').checked = state.settings.adminPasswordRequired !== false;
    if ($('cfgShowDescriptions')) $('cfgShowDescriptions').checked = state.settings.showDescriptions !== false;
    if ($('cfgShowCategories')) $('cfgShowCategories').checked = state.settings.showCategories !== false;
    if ($('cfgShowGridDots')) $('cfgShowGridDots').checked = state.settings.showGridDots !== false;
    if ($('cfgClock24Hour')) $('cfgClock24Hour').checked = !!state.settings.clock24Hour;
    if ($('cfgShowClockIcon')) $('cfgShowClockIcon').checked = state.settings.showClockIcon !== false;
    if ($('cfgShowSlidePager')) $('cfgShowSlidePager').checked = state.settings.showSlidePager !== false;
    if ($('cfgShowProjectCount')) $('cfgShowProjectCount').checked = state.settings.showProjectCount !== false;
    if ($('cfgMotion')) $('cfgMotion').checked = state.settings.motion !== false;
    if ($('cfgIntroAnimation')) $('cfgIntroAnimation').checked = state.settings.introAnimation !== false;
    if ($('cfgCardTilt')) $('cfgCardTilt').checked = state.settings.cardTilt !== false;
    if ($('cfgTiltStrength')) $('cfgTiltStrength').value = state.settings.tiltStrength != null ? state.settings.tiltStrength : 7;
    if ($('cfgHoverZoom')) $('cfgHoverZoom').value = state.settings.hoverZoom != null ? state.settings.hoverZoom : 107;
    if ($('cfgTransitionSpeed')) $('cfgTransitionSpeed').value = state.settings.transitionSpeed != null ? state.settings.transitionSpeed : 100;
    if ($('cfgAutoplaySlides')) $('cfgAutoplaySlides').checked = state.settings.autoplaySlides !== false;
    if ($('cfgKioskHoldSeconds')) $('cfgKioskHoldSeconds').value = state.settings.kioskHoldSeconds != null ? state.settings.kioskHoldSeconds : 2;
    if ($('cfgToolRevealSeconds')) $('cfgToolRevealSeconds').value = state.settings.toolRevealSeconds != null ? state.settings.toolRevealSeconds : 15;
    if ($('cfgHideIdleCursor')) $('cfgHideIdleCursor').checked = state.settings.hideIdleCursor !== false;
    if ($('cfgResetSlidesOnIdle')) $('cfgResetSlidesOnIdle').checked = state.settings.resetSlidesOnIdle !== false;
    if ($('cfgDisableSelection')) $('cfgDisableSelection').checked = state.settings.disableSelection !== false;
  }

  function readSettingsForm(){
    if ($('cfgColumns')) state.settings.columns = parseInt($('cfgColumns').value, 10) || 6;
    if ($('cfgRows')) state.settings.rows = parseInt($('cfgRows').value, 10) || 4;
    if ($('cfgIdleSeconds')) state.settings.idleSeconds = parseInt($('cfgIdleSeconds').value, 10) || 0;
    if ($('cfgCardGap')) state.settings.cardGap = Math.min(40, Math.max(6, parseInt($('cfgCardGap').value, 10) || 16));
    if ($('cfgCardRadius')) state.settings.cardRadius = Math.min(40, Math.max(4, parseInt($('cfgCardRadius').value, 10) || 22));
    if ($('cfgCardRowHeight')) state.settings.cardRowHeight = Math.min(220, Math.max(90, parseInt($('cfgCardRowHeight').value, 10) || 130));
    if ($('cfgPagePadding')) state.settings.pagePadding = Math.min(64, Math.max(12, parseInt($('cfgPagePadding').value, 10) || 32));
    if ($('cfgTitleScale')) state.settings.titleScale = Math.min(140, Math.max(80, parseInt($('cfgTitleScale').value, 10) || 100));
    if ($('cfgHeaderGap')) state.settings.headerGap = Math.min(48, Math.max(8, parseInt($('cfgHeaderGap').value, 10) || 20));
    if ($('cfgCardContentPadding')) state.settings.cardContentPadding = Math.min(32, Math.max(12, parseInt($('cfgCardContentPadding').value, 10) || 20));
    if ($('cfgKiosk')) state.settings.kiosk = $('cfgKiosk').checked;
    if ($('cfgShowClock')) state.settings.showClock = $('cfgShowClock').checked;
    if ($('cfgShowAdmin')) state.settings.showAdmin = $('cfgShowAdmin').checked;
    if ($('cfgAdminPasswordRequired')) state.settings.adminPasswordRequired = $('cfgAdminPasswordRequired').checked;
    if ($('cfgShowDescriptions')) state.settings.showDescriptions = $('cfgShowDescriptions').checked;
    if ($('cfgShowCategories')) state.settings.showCategories = $('cfgShowCategories').checked;
    if ($('cfgShowGridDots')) state.settings.showGridDots = $('cfgShowGridDots').checked;
    if ($('cfgClock24Hour')) state.settings.clock24Hour = $('cfgClock24Hour').checked;
    if ($('cfgShowClockIcon')) state.settings.showClockIcon = $('cfgShowClockIcon').checked;
    if ($('cfgShowSlidePager')) state.settings.showSlidePager = $('cfgShowSlidePager').checked;
    if ($('cfgShowProjectCount')) state.settings.showProjectCount = $('cfgShowProjectCount').checked;
    if ($('cfgMotion')) state.settings.motion = $('cfgMotion').checked;
    if ($('cfgIntroAnimation')) state.settings.introAnimation = $('cfgIntroAnimation').checked;
    if ($('cfgCardTilt')) state.settings.cardTilt = $('cfgCardTilt').checked;
    if ($('cfgTiltStrength')) state.settings.tiltStrength = Math.min(14, Math.max(0, parseFloat($('cfgTiltStrength').value) || 0));
    if ($('cfgHoverZoom')) state.settings.hoverZoom = Math.min(115, Math.max(100, parseInt($('cfgHoverZoom').value, 10) || 107));
    if ($('cfgTransitionSpeed')) state.settings.transitionSpeed = Math.min(180, Math.max(50, parseInt($('cfgTransitionSpeed').value, 10) || 100));
    if ($('cfgAutoplaySlides')) state.settings.autoplaySlides = $('cfgAutoplaySlides').checked;
    if ($('cfgKioskHoldSeconds')) state.settings.kioskHoldSeconds = Math.min(5, Math.max(.5, parseFloat($('cfgKioskHoldSeconds').value) || 2));
    if ($('cfgToolRevealSeconds')) state.settings.toolRevealSeconds = Math.min(60, Math.max(5, parseInt($('cfgToolRevealSeconds').value, 10) || 15));
    if ($('cfgHideIdleCursor')) state.settings.hideIdleCursor = $('cfgHideIdleCursor').checked;
    if ($('cfgResetSlidesOnIdle')) state.settings.resetSlidesOnIdle = $('cfgResetSlidesOnIdle').checked;
    if ($('cfgDisableSelection')) state.settings.disableSelection = $('cfgDisableSelection').checked;
  }

  // ---------------------------------------------------------------- Project Editor Modal
  let activeSlideList = [];
  let activeSpecsList = [];
  let activeIcon = 'cube';
  let activeAccent = 'cyan';
  let activeTile = { style:'image', gradient:'ember', frame:true, showTitle:true, showCategory:true, showDescription:true, logoSrc:'' };
  let activeMediaMode = 'multi'; // 'none' | 'single' | 'multi'

  function switchEditorSection(secName){
    state.activeEditorSection = secName;
    document.querySelectorAll('.editor-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.sec === secName);
    });
    document.querySelectorAll('.editor-section').forEach(s => {
      s.classList.toggle('active', s.id === `sec-${secName}`);
      s.setAttribute('aria-hidden', String(s.id !== `sec-${secName}`));
    });
    const pane = document.querySelector('.project-editor-card .form-pane');
    if (pane) pane.scrollTop = 0;
  }

  function closeCustomSelects(except){
    document.querySelectorAll('.custom-select.open').forEach(widget => {
      if (widget === except) return;
      widget.classList.remove('open');
      widget.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }

  function enhanceEditorSelects(){
    document.querySelectorAll('.project-editor-card select.form-select').forEach(select => {
      if (select.dataset.enhanced === 'true') return;
      select.dataset.enhanced = 'true';
      const widget = document.createElement('div');
      widget.className = 'custom-select';
      select.parentNode.insertBefore(widget, select);
      widget.appendChild(select);
      select.classList.add('custom-select-native');

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-select-trigger';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = '<span></span><span class="material-symbols-outlined" aria-hidden="true">expand_more</span>';

      const menu = document.createElement('div');
      menu.className = 'custom-select-menu';
      menu.setAttribute('role', 'listbox');
      [...select.options].forEach(option => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'custom-select-option';
        item.dataset.value = option.value;
        item.setAttribute('role', 'option');
        item.innerHTML = `<span>${esc(option.textContent)}</span><span class="material-symbols-outlined" aria-hidden="true">check</span>`;
        item.addEventListener('click', () => {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles:true }));
          widget.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
          trigger.focus();
        });
        menu.appendChild(item);
      });
      widget.append(trigger, menu);

      const sync = () => {
        const option = select.options[select.selectedIndex];
        trigger.querySelector('span').textContent = option ? option.textContent : '';
        menu.querySelectorAll('.custom-select-option').forEach(item => {
          const selected = item.dataset.value === select.value;
          item.classList.toggle('selected', selected);
          item.setAttribute('aria-selected', String(selected));
        });
      };
      select._syncCustomSelect = sync;
      select.addEventListener('change', sync);
      trigger.addEventListener('click', () => {
        const open = !widget.classList.contains('open');
        closeCustomSelects(widget);
        widget.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', String(open));
        if (open) menu.querySelector('.custom-select-option.selected')?.focus({ preventScroll:true });
      });
      widget.addEventListener('keydown', event => {
        if (event.key === 'Escape'){
          widget.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); trigger.focus();
        }
      });
      sync();
    });
    document.addEventListener('pointerdown', event => {
      if (!event.target.closest('.custom-select')) closeCustomSelects();
    });
  }

  function enhanceEditorNumberInputs(){
    document.querySelectorAll('.project-editor-card input[type="number"]').forEach(input => {
      if (input.dataset.stepperEnhanced === 'true') return;
      input.dataset.stepperEnhanced = 'true';
      const stepper = document.createElement('div');
      stepper.className = 'number-stepper';
      input.parentNode.insertBefore(stepper, input);
      stepper.appendChild(input);
      const makeButton = (direction, icon, label) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `number-stepper-btn ${direction < 0 ? 'down' : 'up'}`;
        button.setAttribute('aria-label', label);
        button.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true">${icon}</span>`;
        button.addEventListener('click', () => {
          const amount = Number(input.step) || 1;
          const min = input.min === '' ? -Infinity : Number(input.min);
          const max = input.max === '' ? Infinity : Number(input.max);
          const next = Math.max(min, Math.min(max, (Number(input.value) || 0) + direction * amount));
          input.value = String(next);
          input.dispatchEvent(new Event('input', { bubbles:true }));
          input.focus({ preventScroll:true });
        });
        return button;
      };
      stepper.append(makeButton(-1, 'remove', 'Decrease value'), makeButton(1, 'add', 'Increase value'));
    });
  }

  function openEditor(project = null){
    state.isNew = !project;
    switchEditorSection('general');
    
    if (state.isNew){
      state.currentEdit = {
        id: `project-${Date.now().toString(36)}`,
        title: 'New Experience',
        cat: 'Archviz Interactive · UE5',
        sub: 'Real-time interactive experience',
        icon: 'cube',
        accent: 'cyan',
        size: [2, 1],
        slides: state.assets.length > 0 ? [{ src: state.assets[0].path, pos: '50% 50%' }] : [],
        fx: 'push',
        interval: 5000,
        dir: 1,
        desc: 'Explore this interactive architectural showcase in real time.',
        specs: [['Engine', 'Unreal Engine 5'], ['Target', 'Main Display']],
        action: { type: 'exe' }
      };
      if ($('modalTag')) $('modalTag').textContent = 'NEW CARD CONFIGURATION';
      if ($('modalHeading')) $('modalHeading').textContent = 'Add New Project Card';
    } else {
      state.currentEdit = JSON.parse(JSON.stringify(project));
      if ($('modalTag')) $('modalTag').textContent = 'EDITING CARD';
      if ($('modalHeading')) $('modalHeading').textContent = `Edit Card: ${project.title}`;
    }

    const p = state.currentEdit;
    if ($('fId')) $('fId').value = p.id || '';
    if ($('fTitle')) $('fTitle').value = p.title || '';
    if ($('fCat')) $('fCat').value = p.cat || '';
    if ($('fSub')) $('fSub').value = p.sub || '';
    if ($('fDesc')) $('fDesc').value = p.desc || '';

    // Icon
    activeIcon = p.icon || 'cube';
    document.querySelectorAll('#iconSelector .icon-opt').forEach(b => {
      const selected = b.dataset.icon === activeIcon;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });

    // Accent
    activeAccent = p.accent || 'cyan';
    document.querySelectorAll('#accentSelector .accent-opt').forEach(b => {
      const selected = b.dataset.accent === activeAccent;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });

    // Size
    const size = p.size || [2, 1];
    if ($('fSizeCols')) $('fSizeCols').value = size[0];
    if ($('fSizeRows')) $('fSizeRows').value = size[1];
    updateSizePresetsUI(size[0], size[1]);

    // Slides
    activeSlideList = (p.slides || []).map(s => typeof s === 'string' ? { src: s, pos: '50% 50%' } : { src: s.src, pos: s.pos || '50% 50%' });
    activeTile = Object.assign({ style:'image', gradient:'ember', frame:true, showTitle:true, showCategory:true, showDescription:true, logoSrc:'' }, p.tile || {});
    if ($('fTileStyle')) $('fTileStyle').value = activeTile.style;
    if ($('fTileGradient')) $('fTileGradient').value = activeTile.gradient;
    if ($('fTileFrame')) $('fTileFrame').checked = activeTile.frame !== false;
    if ($('fTileShowTitle')) $('fTileShowTitle').checked = activeTile.showTitle !== false;
    if ($('fTileShowCategory')) $('fTileShowCategory').checked = activeTile.showCategory !== false;
    if ($('fTileShowDescription')) $('fTileShowDescription').checked = activeTile.showDescription !== false;
    if ($('tileLogoName')) $('tileLogoName').textContent = activeTile.logoSrc ? mediaDisplayName(activeTile.logoSrc) : 'No logo selected';
    ['fTileStyle', 'fTileGradient'].forEach(id => $(id)?._syncCustomSelect?.());
    updateTileEditorPanels();
    
    if (activeSlideList.length === 0){
      activeMediaMode = 'none';
    } else if (activeSlideList.length === 1){
      activeMediaMode = 'single';
    } else {
      activeMediaMode = 'multi';
    }
    updateMediaModeUI(activeMediaMode);

    if ($('fFx')) $('fFx').value = p.fx || 'push';
    if ($('fInterval')) $('fInterval').value = p.interval || 5000;
    if ($('fDir')) $('fDir').value = p.dir || 1;
    ['fFx', 'fDir'].forEach(id => $(id)?._syncCustomSelect?.());
    renderSlideList();

    // Action & Apps
    const act = p.action || { type: 'exe' };
    const appKey = act.app || p.id;
    const appDef = state.apps[appKey] || {};

    let selectedAction = 'exe';
    if (act.type === 'exe') selectedAction = 'exe';
    else if (act.type === 'url' && act.open === 'main') selectedAction = 'url-main';
    else if (act.type === 'url') selectedAction = 'url-iframe';
    else if (act.type === 'detail' && act.app) selectedAction = 'detail-launch';
    else if (act.type === 'detail') selectedAction = 'detail';

    document.querySelectorAll('#actionTypeGrid .action-card').forEach(c => {
      const radio = c.querySelector('input[type="radio"]');
      if (radio.value === selectedAction){
        radio.checked = true;
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    // Populate conditional fields
    if ($('fExePath')) $('fExePath').value = appDef.exe || '';
    if ($('fExeArgs')) $('fExeArgs').value = Array.isArray(appDef.args) ? appDef.args.join(' ') : (appDef.args || '');
    if ($('fStopImage')) $('fStopImage').value = appDef.stopImage || '';
    const advancedLaunch = document.querySelector('.advanced-launch-options');
    if (advancedLaunch) advancedLaunch.open = Boolean(appDef.args?.length || appDef.stopImage);
    if ($('fWindowMode')) $('fWindowMode').value = appDef.windowMode || 'maximized';
    if ($('fResolution')) $('fResolution').value = appDef.resolution || 'native';
    if ($('fResolutionWidth')) $('fResolutionWidth').value = appDef.resolutionWidth || 1920;
    if ($('fResolutionHeight')) $('fResolutionHeight').value = appDef.resolutionHeight || 1080;
    if ($('fDisplayTarget')) $('fDisplayTarget').value = appDef.displayTarget || 'primary';
    if ($('customResolutionGroup')) $('customResolutionGroup').hidden = $('fResolution')?.value !== 'custom';
    ['fWindowMode', 'fResolution', 'fDisplayTarget'].forEach(id => $(id)?._syncCustomSelect?.());
    if ($('fUrl')) $('fUrl').value = act.url || appDef.url || '';
    if ($('fUrlArgs')) $('fUrlArgs').value = Array.isArray(appDef.args) ? appDef.args.join(' ') : (appDef.args || '');
    if ($('pathVerifyStatus')) $('pathVerifyStatus').textContent = '';

    // Specs
    activeSpecsList = Array.isArray(p.specs) ? JSON.parse(JSON.stringify(p.specs)) : [];
    renderSpecsList();

    updateActionPanels(selectedAction);
    updateLivePreview();

    $('editorModal').classList.add('open');
  }

  function closeEditor(){
    $('editorModal').classList.remove('open');
    $('previewThumb')?.querySelectorAll('video').forEach(video => video.pause());
  }

  function updateSizePresetsUI(cols, rows){
    const key = `${cols},${rows}`;
    document.querySelectorAll('.preset-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.size === key);
    });
  }

  function updateMediaModeUI(mode){
    activeMediaMode = mode;
    document.querySelectorAll('#mediaModeSeg .seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    const slidesEditor = $('slidesEditor');
    const carouselCfg = $('carouselCfg');
    
    if (mode === 'none'){
      if (slidesEditor) slidesEditor.style.display = 'none';
      activeSlideList = [];
    } else if (mode === 'single'){
      if (slidesEditor) slidesEditor.style.display = 'block';
      if (carouselCfg) carouselCfg.style.display = 'none';
      if (activeSlideList.length === 0 && state.assets.length > 0){
        activeSlideList = [{ src: state.assets[0].path, pos: '50% 50%' }];
      } else if (activeSlideList.length > 1){
        activeSlideList = [activeSlideList[0]];
      }
    } else {
      if (slidesEditor) slidesEditor.style.display = 'block';
      if (carouselCfg) carouselCfg.style.display = 'block';
      if (activeSlideList.length < 2 && state.assets.length > 1){
        activeSlideList = [
          { src: state.assets[0].path, pos: '50% 50%' },
          { src: state.assets[1].path, pos: '50% 50%' }
        ];
      }
    }
    renderSlideList();
    updateLivePreview();
  }

  function renderSlideList(){
    const list = $('slidesList');
    if (!list) return;
    list.innerHTML = '';
    
    if (activeSlideList.length === 0){
      list.innerHTML = `<p style="font-size:12px; color:var(--muted); text-align:center; padding:12px;">No images added yet. Click <strong>+ Add Image Slide</strong> above.</p>`;
      return;
    }

    activeSlideList.forEach((s, idx) => {
      const row = document.createElement('div');
      row.className = 'slide-item-row';
      const slideMedia = isVideoPath(s.src)
        ? `<video class="slide-thumb-video" src="${esc(s.src)}" muted preload="metadata"></video><span class="slide-video-mark material-symbols-outlined">play_circle</span>`
        : `<span class="slide-thumb-fallback material-symbols-outlined" aria-hidden="true">image</span>`;
      row.innerHTML = `
        <div class="slide-item-thumb">${slideMedia}</div>
        <div class="slide-item-src" title="${esc(s.src)}"><strong>${esc(mediaDisplayName(s.src))}</strong><small>${isVideoPath(s.src) ? 'Video slide' : 'Image slide'}</small></div>
        <input type="text" class="slide-item-pos" value="${esc(s.pos || '50% 50%')}" placeholder="Focal Point" title="Image alignment/crop position">
        <button type="button" class="icon-btn danger btn-del-slide" title="Remove slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      `;
      if (!isVideoPath(s.src)) applyBackgroundWithFallback(row.querySelector('.slide-item-thumb'), s.src, true);

      row.querySelector('.slide-item-pos').addEventListener('input', e => {
        s.pos = e.target.value;
        updateLivePreview();
      });

      row.querySelector('.btn-del-slide').addEventListener('click', () => {
        activeSlideList.splice(idx, 1);
        renderSlideList();
        updateLivePreview();
      });

      list.appendChild(row);
    });
  }

  function renderSpecsList(){
    const list = $('specsList');
    if (!list) return;
    list.innerHTML = '';
    
    if (activeSpecsList.length === 0){
      list.innerHTML = `<p style="font-size:12px; color:var(--muted); padding:6px 0;">No specification rows added.</p>`;
      return;
    }

    activeSpecsList.forEach((spec, idx) => {
      const row = document.createElement('div');
      row.className = 'spec-item-row';
      row.innerHTML = `
        <input type="text" class="form-input spec-key" value="${esc(spec[0] || '')}" placeholder="Label (e.g. Engine)">
        <input type="text" class="form-input spec-val" value="${esc(spec[1] || '')}" placeholder="Value (e.g. Unreal Engine 5)">
        <button type="button" class="icon-btn danger btn-del-spec" title="Remove row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      `;

      row.querySelector('.spec-key').addEventListener('input', e => {
        spec[0] = e.target.value;
      });
      row.querySelector('.spec-val').addEventListener('input', e => {
        spec[1] = e.target.value;
      });
      row.querySelector('.btn-del-spec').addEventListener('click', () => {
        activeSpecsList.splice(idx, 1);
        renderSpecsList();
      });

      list.appendChild(row);
    });
  }

  function updateActionPanels(actionType){
    const exeBox = $('exeConfigBox');
    const urlBox = $('urlConfigBox');
    const urlArgs = $('urlMainArgsGroup');

    if (exeBox) exeBox.style.display = (actionType === 'exe' || actionType === 'detail-launch') ? 'block' : 'none';
    if (urlBox) urlBox.style.display = (actionType === 'url-iframe' || actionType === 'url-main') ? 'block' : 'none';
    if (urlArgs) urlArgs.style.display = (actionType === 'url-main') ? 'block' : 'none';
  }

  // ---------------------------------------------------------------- Live Card Preview
  let previewCarouselTimer = null;
  let previewSlideIndex = 0;

  function showPreviewMedia(thumb, slide){
    thumb.querySelectorAll('video, img, .preview-media-fallback').forEach(node => node.remove());
    thumb.style.backgroundImage = 'none';
    if (isVideoPath(slide?.src)){
      const video = document.createElement('video');
      video.className = 'preview-media-video';
      video.src = slide.src; video.muted = true; video.loop = true; video.autoplay = true; video.playsInline = true;
      thumb.appendChild(video);
    } else {
      const candidates = mediaCandidates(slide?.src, false);
      if (!candidates.length){
        thumb.innerHTML = '<span class="preview-media-fallback material-symbols-outlined" aria-hidden="true">image</span>';
        return;
      }
      const token = (Number(thumb.dataset.previewToken) || 0) + 1;
      thumb.dataset.previewToken = String(token);
      const image = new Image();
      image.className = 'preview-media-image';
      image.alt = '';
      image.style.objectPosition = slide?.pos || '50% 50%';
      let candidateIndex = 0;
      const tryNext = () => {
        if (token !== Number(thumb.dataset.previewToken)) return;
        if (candidateIndex >= candidates.length){
          image.remove();
          thumb.innerHTML = '<span class="preview-media-fallback material-symbols-outlined" aria-hidden="true">broken_image</span>';
          return;
        }
        image.src = candidates[candidateIndex++];
      };
      image.onload = () => {
        if (token !== Number(thumb.dataset.previewToken)) return;
        thumb.querySelector('.preview-media-fallback')?.remove();
        if (!image.isConnected) thumb.appendChild(image);
      };
      image.onerror = tryNext;
      tryNext();
    }
  }

  function updateLivePreview(){
    const title = ($('fTitle') && $('fTitle').value) ? $('fTitle').value : 'Project Title';
    const cat = ($('fCat') && $('fCat').value) ? $('fCat').value : 'Category';
    const sub = ($('fSub') && $('fSub').value) ? $('fSub').value : 'Subtitle description';
    const cols = parseInt($('fSizeCols').value, 10) || 2;
    const rows = parseInt($('fSizeRows').value, 10) || 1;

    if ($('previewTitleText')) $('previewTitleText').textContent = title;
    if ($('previewCatText')) $('previewCatText').textContent = cat;
    if ($('previewSubText')) $('previewSubText').textContent = sub;
    if ($('previewDim')) $('previewDim').textContent = `${cols} × ${rows}`;

    const accentHex = ACCENTS[activeAccent] || ACCENTS.cyan;
    const card = $('cardPreview');
    if (card){
      card.style.setProperty('--glow', accentHex);
      card.dataset.accent = activeAccent;
      card.dataset.gradient = $('fTileGradient')?.value || activeTile.gradient || 'ember';
      card.classList.toggle('tile-gradient', $('fTileStyle')?.value === 'gradient');
      card.classList.toggle('tile-video', $('fTileStyle')?.value === 'video');
      card.classList.toggle('tile-logo', $('fTileStyle')?.value === 'logo');
      card.classList.toggle('no-frame', !$('fTileFrame')?.checked);
      card.classList.toggle('no-title', !$('fTileShowTitle')?.checked);
      card.classList.toggle('no-category', !$('fTileShowCategory')?.checked);
      card.classList.toggle('no-description', !$('fTileShowDescription')?.checked);
      card.dataset.cs = cols;
      card.dataset.rs = rows;

      const baseW = 255;
      const baseH = 210;
      card.style.width = `${Math.min(620, baseW * cols)}px`;
      card.style.height = `${Math.min(520, baseH * rows)}px`;
    }

    if ($('previewIconWrap')) $('previewIconWrap').innerHTML = ICONS[activeIcon] || ICONS.cube;

    // Thumb preview
    const thumb = $('previewThumb');
    if (thumb){
      const style = $('fTileStyle')?.value || 'image';
      if (style === 'gradient'){
        thumb.querySelectorAll('video, img, .preview-media-fallback').forEach(node => node.remove());
        thumb.style.backgroundImage = '';
        if (previewCarouselTimer) clearInterval(previewCarouselTimer);
        previewCarouselTimer = null;
      } else if (style === 'logo'){
        thumb.querySelectorAll('video, img, .preview-media-fallback').forEach(node => node.remove());
        thumb.style.backgroundImage = '';
        if (previewCarouselTimer) clearInterval(previewCarouselTimer);
        previewCarouselTimer = null;
        if (activeTile.logoSrc){
          const logo = document.createElement('img'); logo.className = 'card-logo'; logo.src = activeTile.logoSrc; logo.alt = '';
          thumb.appendChild(logo);
        }
      } else if (style === 'video'){
        const videoSlide = activeSlideList.find(slide => isVideoPath(slide.src));
        showPreviewMedia(thumb, videoSlide || null);
        if (previewCarouselTimer) clearInterval(previewCarouselTimer);
        previewCarouselTimer = null;
      } else if (activeSlideList.length === 0){
        showPreviewMedia(thumb, null);
        if (previewCarouselTimer) clearInterval(previewCarouselTimer);
      } else if (activeSlideList.length === 1){
        showPreviewMedia(thumb, activeSlideList[0]);
        if (previewCarouselTimer) clearInterval(previewCarouselTimer);
      } else {
        if (previewCarouselTimer) clearInterval(previewCarouselTimer);
        previewSlideIndex = 0;
        showPreviewMedia(thumb, activeSlideList[0]);

        const interval = Math.max(1500, parseInt($('fInterval').value, 10) || 3000);
        previewCarouselTimer = setInterval(() => {
          if (activeSlideList.length < 2) return;
          previewSlideIndex = (previewSlideIndex + 1) % activeSlideList.length;
          const cur = activeSlideList[previewSlideIndex];
          showPreviewMedia(thumb, cur);
        }, interval);
      }
    }
  }

  function updateTileEditorPanels(){
    const style = $('fTileStyle')?.value || 'image';
    document.querySelectorAll('.tile-style-panel').forEach(panel => { panel.hidden = panel.dataset.style !== style; });
  }

  // ---------------------------------------------------------------- Asset Picker Modal
  function openAssetPicker(callback, filter = 'all'){
    state.assetPickerCallback = callback;
    const grid = $('assetPickerGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const mediaAssets = state.assets.filter(a => a.kind !== 'folder' && a.mediaType !== 'pdf' && (filter !== 'image' || a.mediaType !== 'video'));
    if (mediaAssets.length === 0){
      grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px; color:var(--muted);">No media found. Upload an image or video above.</p>`;
    } else {
      mediaAssets.forEach(a => {
        const item = document.createElement('div');
        item.className = `picker-item ${a.mediaType === 'video' ? 'is-video' : ''}`;
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div class="picker-media">${a.mediaType === 'video' ? `<video src="${a.path}" muted preload="metadata"></video><span class="material-symbols-outlined">play_circle</span>` : `<img src="${a.thumbnailPath || a.previewPath || a.path}" alt="">`}</div>
          <div style="font-size:12px; margin-top:6px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(a.name)}</div>
        `;
        item.addEventListener('click', () => {
          if (state.assetPickerCallback) state.assetPickerCallback(a.previewPath || a.path);
          closeAssetPicker();
        });
        grid.appendChild(item);
      });
    }

    $('assetPickerModal').classList.add('open');
  }

  function closeAssetPicker(){
    $('assetPickerModal').classList.remove('open');
    state.assetPickerCallback = null;
  }

  // ---------------------------------------------------------------- Apply Editor Form
  function collectProgramConfig(appId){
    const exe = $('fExePath')?.value.trim() || '';
    const rawArgs = $('fExeArgs')?.value.trim() || '';
    const stopImage = $('fStopImage')?.value.trim() || '';
    const existing = state.apps[appId] || {};
    return {
      exe,
      args: rawArgs ? rawArgs.match(/(?:[^\s"]+|"(?:\\.|[^"])*")+/g)?.map(arg => arg.replace(/^"|"$/g, '')) || [] : undefined,
      cwd: existing.cwd,
      stopImage: stopImage || undefined,
      windowMode: $('fWindowMode')?.value || 'maximized',
      resolution: $('fResolution')?.value || 'native',
      resolutionWidth: parseInt($('fResolutionWidth')?.value, 10) || 1920,
      resolutionHeight: parseInt($('fResolutionHeight')?.value, 10) || 1080,
      displayTarget: $('fDisplayTarget')?.value || 'primary'
    };
  }

  function applyEditorForm(){
    const id = ($('fId').value || '').trim().replace(/[^a-zA-Z0-9.\-_]/g, '-').toLowerCase();
    const title = ($('fTitle').value || '').trim();
    if (!id || !title){
      showToast('Card ID and Title are required!', 'error');
      return;
    }

    const cat = $('fCat').value.trim();
    const sub = $('fSub').value.trim();
    const desc = $('fDesc').value.trim();
    const cols = parseInt($('fSizeCols').value, 10) || 2;
    const rows = parseInt($('fSizeRows').value, 10) || 1;

    // Action radio
    const selectedAction = document.querySelector('#actionTypeGrid input[type="radio"]:checked').value;

    const projectData = {
      id,
      title,
      cat,
      sub,
      icon: activeIcon,
      accent: activeAccent,
      size: [cols, rows]
    };
    projectData.tile = {
      ...activeTile,
      style: $('fTileStyle')?.value || 'image',
      gradient: $('fTileGradient')?.value || 'ember',
      frame: $('fTileFrame')?.checked !== false,
      showTitle: $('fTileShowTitle')?.checked !== false,
      showCategory: $('fTileShowCategory')?.checked !== false,
      showDescription: $('fTileShowDescription')?.checked !== false,
      ...(activeTile.logoSrc ? { logoSrc: activeTile.logoSrc } : {})
    };
    if (state.currentEdit?.team) projectData.team = state.currentEdit.team;

    if (activeSlideList.length > 0){
      projectData.slides = activeSlideList;
      if (activeSlideList.length > 1){
        projectData.fx = $('fFx').value;
        projectData.interval = parseInt($('fInterval').value, 10) || 5000;
        const dir = parseInt($('fDir').value, 10) || 1;
        if (dir === -1) projectData.dir = -1;
      }
    }

    if (desc) projectData.desc = desc;

    const cleanedSpecs = activeSpecsList.filter(s => s[0] && s[1]);
    if (cleanedSpecs.length > 0) projectData.specs = cleanedSpecs;

    // Configure Action & apps.json
    if (selectedAction === 'exe'){
      projectData.action = { type: 'exe' };
      const appConfig = collectProgramConfig(id);
      if (appConfig.exe) state.apps[id] = appConfig;
    } else if (selectedAction === 'url-iframe'){
      projectData.action = { type: 'url', url: $('fUrl').value.trim() || 'https://example.com/' };
    } else if (selectedAction === 'url-main'){
      projectData.action = { type: 'url', open: 'main', app: id };
      const targetUrl = $('fUrl').value.trim() || 'https://example.com/';
      const rawArgs = $('fUrlArgs').value.trim();
      state.apps[id] = {
        url: targetUrl,
        args: rawArgs ? rawArgs.split(' ').filter(Boolean) : ['--kiosk', '--window-position=1920,0']
      };
    } else if (selectedAction === 'detail'){
      projectData.action = { type: 'detail' };
    } else if (selectedAction === 'detail-launch'){
      projectData.action = { type: 'detail', app: id };
      const appConfig = collectProgramConfig(id);
      if (appConfig.exe) state.apps[id] = appConfig;
    }

    if (state.isNew){
      state.projects.push(projectData);
      showToast(`Added new card "${title}"`, 'success');
    } else {
      const idx = state.projects.findIndex(x => x.id === state.currentEdit.id);
      if (idx !== -1){
        state.projects[idx] = projectData;
      } else {
        state.projects.push(projectData);
      }
      showToast(`Updated card "${title}"`, 'success');
    }

    closeEditor();
    renderProjectsList();
    updateMetrics();
    updateBadges();
    
    // Auto-save immediately to server
    autoSave(true);
  }

  // ---------------------------------------------------------------- Setup Event Listeners
  function setupEvents(){
    enhanceEditorSelects();
    enhanceEditorNumberInputs();
    // Main Tab buttons
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPane = $(`tab-${btn.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // View switcher (Grid vs List)
    if ($('btnViewGrid')) {
      $('btnViewGrid').addEventListener('click', () => {
        state.viewMode = 'grid';
        $('btnViewGrid').classList.add('active');
        $('btnViewList').classList.remove('active');
        renderProjectsList();
      });
    }

    if ($('btnViewList')) {
      $('btnViewList').addEventListener('click', () => {
        state.viewMode = 'list';
        $('btnViewList').classList.add('active');
        $('btnViewGrid').classList.remove('active');
        renderProjectsList();
      });
    }

    // Editor Section Pills
    document.querySelectorAll('.editor-pill').forEach(pill => {
      pill.addEventListener('click', () => switchEditorSection(pill.dataset.sec));
    });

    // New Project Button
    if ($('btnNewProject')) {
      $('btnNewProject').addEventListener('click', () => openEditor(null));
    }

    // Project Search
    if ($('projectSearch')) {
      $('projectSearch').addEventListener('input', renderProjectsList);
    }

    // Media library file upload
    if ($('assetFileInput')) {
      $('assetFileInput').addEventListener('change', e => {
        handleFilesUpload(e.target.files);
        e.target.value = '';
      });
    }

    if ($('btnSaveMediaConfig')) $('btnSaveMediaConfig').addEventListener('click', saveMediaStorage);
    if ($('btnToggleMediaStorage')) $('btnToggleMediaStorage').addEventListener('click', () => {
      const drawer = $('mediaStorageDrawer');
      const open = !drawer.classList.contains('open');
      drawer.classList.toggle('open', open); drawer.setAttribute('aria-hidden', String(!open));
      $('btnToggleMediaStorage').setAttribute('aria-expanded', String(open));
    });
    if ($('btnCloseMediaStorage')) $('btnCloseMediaStorage').addEventListener('click', () => {
      $('mediaStorageDrawer').classList.remove('open'); $('mediaStorageDrawer').setAttribute('aria-hidden', 'true');
      $('btnToggleMediaStorage').setAttribute('aria-expanded', 'false');
    });
    if ($('btnToggleMediaEdit')) $('btnToggleMediaEdit').addEventListener('click', () => setMediaEditMode(!state.mediaEditMode));
    if ($('btnDoneMediaEdit')) $('btnDoneMediaEdit').addEventListener('click', () => setMediaEditMode(false));
    if ($('btnSelectAllMedia')) $('btnSelectAllMedia').addEventListener('click', () => {
      const items = currentMediaItems();
      state.selectedMedia = state.selectedMedia.size === items.length ? new Set() : new Set(items.map(item => item.relativePath));
      updateMediaSelectionUI();
    });
    if ($('btnMoveSelectedMedia')) $('btnMoveSelectedMedia').addEventListener('click', () => state.selectedMedia.size && openMediaAction('move'));
    if ($('btnDeleteSelectedMedia')) $('btnDeleteSelectedMedia').addEventListener('click', () => state.selectedMedia.size && openMediaAction('delete'));
    if ($('btnMediaComfortable')) $('btnMediaComfortable').addEventListener('click', () => {
      state.mediaViewMode = 'comfortable'; $('btnMediaComfortable').classList.add('active'); $('btnMediaCompact').classList.remove('active'); renderAssets();
    });
    if ($('btnMediaCompact')) $('btnMediaCompact').addEventListener('click', () => {
      state.mediaViewMode = 'compact'; $('btnMediaCompact').classList.add('active'); $('btnMediaComfortable').classList.remove('active'); renderAssets();
    });
    if ($('btnRefreshMedia')) $('btnRefreshMedia').addEventListener('click', () => refreshAssets(false));
    if ($('btnNewMediaFolder')) $('btnNewMediaFolder').addEventListener('click', () => openMediaAction('new-folder'));
    if ($('btnMediaUp')) $('btnMediaUp').addEventListener('click', () => {
      if (!state.currentMediaFolder) return;
      state.currentMediaFolder = parentPath(state.currentMediaFolder);
      state.selectedMedia.clear(); renderAssets();
    });

    if ($('assetsGrid')) $('assetsGrid').addEventListener('contextmenu', e => {
      if (e.target.closest('.asset-card')) return;
      e.preventDefault(); state.mediaContextTarget = null; showMediaContextMenu(e.clientX, e.clientY);
    });
    document.addEventListener('click', e => { if (!e.target.closest('#mediaContextMenu')) hideMediaContextMenu(); });
    if ($('mediaContextMenu')) $('mediaContextMenu').addEventListener('click', e => {
      const button = e.target.closest('[data-media-action]');
      if (!button || button.disabled) return;
      const action = button.dataset.mediaAction;
      hideMediaContextMenu();
      if (action === 'open' && state.mediaContextTarget){
        if (state.mediaContextTarget.kind === 'folder'){
          state.currentMediaFolder = state.mediaContextTarget.relativePath; state.selectedMedia.clear(); renderAssets();
        } else openMediaPreviewAsset(state.mediaContextTarget);
      } else if (action === 'select-all'){
        setMediaEditMode(true); state.selectedMedia = new Set(currentMediaItems().map(item => item.relativePath)); updateMediaSelectionUI();
      } else if (action === 'new-folder') openMediaAction('new-folder');
      else if (action === 'move' && state.selectedMedia.size) openMediaAction('move');
      else if (action === 'delete' && state.selectedMedia.size) openMediaAction('delete');
    });
    if ($('btnCancelMediaAction')) $('btnCancelMediaAction').addEventListener('click', closeMediaAction);
    if ($('btnConfirmMediaAction')) $('btnConfirmMediaAction').addEventListener('click', confirmMediaAction);
    if ($('mediaActionModal')) $('mediaActionModal').addEventListener('click', e => { if (e.target === $('mediaActionModal')) closeMediaAction(); });
    if ($('mediaImportDestination')) $('mediaImportDestination').addEventListener('change', updateMediaImportConflicts);
    if ($('btnCloseMediaImport')) $('btnCloseMediaImport').addEventListener('click', closeMediaImport);
    if ($('btnCancelMediaImport')) $('btnCancelMediaImport').addEventListener('click', closeMediaImport);
    if ($('btnConfirmMediaImport')) $('btnConfirmMediaImport').addEventListener('click', confirmMediaImport);
    if ($('mediaImportModal')) $('mediaImportModal').addEventListener('click', e => { if (e.target === $('mediaImportModal')) closeMediaImport(); });

    // Asset drop zone
    const dropZone = $('assetDropZone');
    if (dropZone) {
      dropZone.addEventListener('click', () => $('assetFileInput').click());
      dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFilesUpload(e.dataTransfer.files);
      });
    }

    // Modal controls
    if ($('btnModalClose')) $('btnModalClose').addEventListener('click', closeEditor);
    if ($('btnCancelModal')) $('btnCancelModal').addEventListener('click', closeEditor);
    if ($('btnApplyModal')) $('btnApplyModal').addEventListener('click', applyEditorForm);

    if ($('btnMediaPreviewClose')) $('btnMediaPreviewClose').addEventListener('click', closeMediaPreview);
    if ($('btnMediaPrev')) $('btnMediaPrev').addEventListener('click', () => stepMediaPreview(-1));
    if ($('btnMediaNext')) $('btnMediaNext').addEventListener('click', () => stepMediaPreview(1));
    if ($('mediaPreviewModal')) $('mediaPreviewModal').addEventListener('click', e => {
      if (e.target === $('mediaPreviewModal')) closeMediaPreview();
    });
    window.addEventListener('keydown', e => {
      if (!$('mediaPreviewModal').classList.contains('open')) return;
      if (e.key === 'Escape') closeMediaPreview();
      if (e.key === 'ArrowLeft') stepMediaPreview(-1);
      if (e.key === 'ArrowRight') stepMediaPreview(1);
    });

    // Modal inputs live preview
    ['fTitle', 'fCat', 'fSub', 'fSizeCols', 'fSizeRows', 'fInterval'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('input', updateLivePreview);
    });

    // Icon options
    document.querySelectorAll('#iconSelector .icon-opt').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#iconSelector .icon-opt').forEach(x => {
          x.classList.remove('active');
          x.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('active');
        b.setAttribute('aria-pressed', 'true');
        activeIcon = b.dataset.icon;
        updateLivePreview();
      });
    });

    // Accent options
    document.querySelectorAll('#accentSelector .accent-opt').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#accentSelector .accent-opt').forEach(x => {
          x.classList.remove('active');
          x.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('active');
        b.setAttribute('aria-pressed', 'true');
        activeAccent = b.dataset.accent;
        updateLivePreview();
      });
    });

    // Size presets
    document.querySelectorAll('.preset-btn').forEach(b => {
      b.addEventListener('click', () => {
        const [c, r] = b.dataset.size.split(',').map(Number);
        if ($('fSizeCols')) $('fSizeCols').value = c;
        if ($('fSizeRows')) $('fSizeRows').value = r;
        updateSizePresetsUI(c, r);
        updateLivePreview();
      });
    });

    document.querySelectorAll('.argument-preset').forEach(button => {
      button.addEventListener('click', () => {
        if (!$('fExeArgs')) return;
        $('fExeArgs').value = button.dataset.args || '';
        document.querySelectorAll('.argument-preset').forEach(item => item.classList.toggle('active', item === button));
        showToast(`Loaded ${button.textContent.trim()} preset`, 'success');
      });
    });

    $('fTileStyle')?.addEventListener('change', () => { updateTileEditorPanels(); updateLivePreview(); });
    $('fTileGradient')?.addEventListener('change', updateLivePreview);
    ['fTileFrame', 'fTileShowTitle', 'fTileShowCategory', 'fTileShowDescription'].forEach(id => $(id)?.addEventListener('change', updateLivePreview));
    $('btnPickTileLogo')?.addEventListener('click', () => openAssetPicker(src => {
      activeTile.logoSrc = src;
      if ($('tileLogoName')) $('tileLogoName').textContent = mediaDisplayName(src);
      updateLivePreview();
    }, 'image'));

    const chooseExecutable = async () => {
      const statusEl = $('pathVerifyStatus');
      statusEl.className = 'path-status';
      statusEl.textContent = 'Choose an .exe from this PC…';
      try {
        const result = await api('/api/pick-exe', 'POST', {});
        if (!result.path) { statusEl.textContent = 'No program selected.'; return; }
        $('fExePath').value = result.path;
        statusEl.className = 'path-status ok';
        statusEl.textContent = '✓ Program selected. Window options will be applied at launch.';
      } catch (e){
        statusEl.className = 'path-status error';
        statusEl.textContent = e.message || 'Could not open the program picker.';
      }
    };
    $('btnBrowseExe')?.addEventListener('click', chooseExecutable);
    $('exeDropzone')?.addEventListener('click', event => {
      if (event.target.closest('button')) return;
      chooseExecutable();
    });
    $('exeDropzone')?.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' '){ event.preventDefault(); chooseExecutable(); }
    });
    ['dragenter', 'dragover'].forEach(type => $('exeDropzone')?.addEventListener(type, event => {
      event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; $('exeDropzone').classList.add('drag-over');
    }));
    ['dragleave', 'dragend', 'drop'].forEach(type => $('exeDropzone')?.addEventListener(type, event => {
      event.preventDefault(); $('exeDropzone').classList.remove('drag-over');
    }));
    $('exeDropzone')?.addEventListener('drop', event => {
      const file = event.dataTransfer.files?.[0];
      const statusEl = $('pathVerifyStatus');
      if (!file || !/\.exe$/i.test(file.name)){
        statusEl.className = 'path-status error'; statusEl.textContent = 'Drop a Windows .exe file.'; return;
      }
      // Standard browsers intentionally redact dropped file paths. Electron-like
      // shells expose file.path; otherwise the native picker is the safe fallback.
      if (file.path){
        $('fExePath').value = file.path;
        statusEl.className = 'path-status ok'; statusEl.textContent = `✓ ${file.name} selected.`;
      } else {
        statusEl.className = 'path-status error';
        statusEl.textContent = 'This browser hides dropped file paths. Use “Browse this PC” to select it safely.';
      }
    });
    $('fResolution')?.addEventListener('change', () => {
      $('customResolutionGroup').hidden = $('fResolution').value !== 'custom';
    });

    // Media Mode Segments
    document.querySelectorAll('#mediaModeSeg .seg-btn').forEach(b => {
      b.addEventListener('click', () => updateMediaModeUI(b.dataset.mode));
    });

    // Add Slide button
    if ($('btnAddSlide')) {
      $('btnAddSlide').addEventListener('click', () => {
        openAssetPicker(src => {
          activeSlideList.push({ src, pos: '50% 50%' });
          renderSlideList();
          updateLivePreview();
        });
      });
    }

    // Add Spec button
    if ($('btnAddSpec')) {
      $('btnAddSpec').addEventListener('click', () => {
        activeSpecsList.push(['', '']);
        renderSpecsList();
      });
    }

    // Action radio change
    document.querySelectorAll('#actionTypeGrid input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', e => {
        document.querySelectorAll('#actionTypeGrid .action-card').forEach(c => c.classList.remove('active'));
        e.target.closest('.action-card').classList.add('active');
        updateActionPanels(e.target.value);
      });
    });

    // Path verification button
    if ($('btnVerifyPath')) {
      $('btnVerifyPath').addEventListener('click', async () => {
        const p = $('fExePath').value.trim();
        const statusEl = $('pathVerifyStatus');
        if (!p){
          statusEl.className = 'path-status error';
          statusEl.textContent = 'Please enter an executable path first.';
          return;
        }
        try {
          const res = await api('/api/test-path', 'POST', { path: p });
          if (res.exists){
            statusEl.className = 'path-status ok';
            statusEl.textContent = '✓ Executable file found on this PC.';
          } else {
            statusEl.className = 'path-status error';
            statusEl.textContent = '✗ File not found at this location.';
          }
        } catch (e){
          statusEl.className = 'path-status error';
          statusEl.textContent = 'Error checking path: ' + e.message;
        }
      });
    }

    // Test Launch & Stop
    if ($('btnTestLaunch')) {
      $('btnTestLaunch').addEventListener('click', async () => {
        const id = $('fId').value.trim();
        if (!id){
          showToast('Card ID is required to test launch', 'error');
          return;
        }
        const appConfig = collectProgramConfig(id);
        if (!appConfig.exe){ showToast('Choose an executable first', 'error'); return; }
        state.apps[id] = appConfig;
        
        try {
          await api('/api/config', 'POST', { settings: state.settings, projects: state.projects, apps: state.apps });
          await api(`/api/launch/${id}`, 'POST');
          showToast(`Launched ${id}!`, 'success');
        } catch (e){
          showToast('Launch error: ' + e.message, 'error');
        }
      });
    }

    if ($('btnTestStop')) {
      $('btnTestStop').addEventListener('click', async () => {
        try {
          await api('/api/close', 'POST');
          showToast('Stopped active app', 'info');
        } catch (e){
          showToast('Error stopping: ' + e.message, 'error');
        }
      });
    }

    // Asset Picker Modal Close & Upload
    if ($('btnAssetPickerClose')) $('btnAssetPickerClose').addEventListener('click', closeAssetPicker);
    if ($('pickerUploadInput')) {
      $('pickerUploadInput').addEventListener('change', e => {
        const files = e.target.files;
        if (files && files.length > 0){
          const callback = state.assetPickerCallback;
          closeAssetPicker();
          handleFilesUpload(files, paths => { if (callback && paths[0]) callback(paths[0]); });
        }
        e.target.value = '';
      });
    }

    // Settings input change — auto-save on change
    ['cfgColumns', 'cfgRows', 'cfgCardGap', 'cfgCardRadius', 'cfgCardRowHeight', 'cfgPagePadding', 'cfgTitleScale',
      'cfgHeaderGap', 'cfgCardContentPadding',
      'cfgShowClock', 'cfgShowAdmin', 'cfgAdminPasswordRequired', 'cfgShowDescriptions',
      'cfgShowCategories', 'cfgShowGridDots', 'cfgClock24Hour', 'cfgShowClockIcon', 'cfgShowSlidePager', 'cfgShowProjectCount',
      'cfgMotion', 'cfgIntroAnimation', 'cfgCardTilt', 'cfgTiltStrength', 'cfgHoverZoom', 'cfgTransitionSpeed',
      'cfgAutoplaySlides', 'cfgIdleSeconds', 'cfgKiosk',
      'cfgKioskHoldSeconds', 'cfgToolRevealSeconds', 'cfgHideIdleCursor', 'cfgResetSlidesOnIdle', 'cfgDisableSelection'].forEach(id => {
      const el = $(id);
      if (el) {
        el.addEventListener('input', () => {
          if (id === 'cfgAdminPasswordRequired'){
            try { sessionStorage.removeItem('vastuchitra-admin-unlocked'); } catch {}
          }
          readSettingsForm();
          clearTimeout(autoSaveTimeout);
          autoSaveTimeout = setTimeout(() => autoSave(false), 220);
        });
      }
    });
  }

  // ---------------------------------------------------------------- Local admin lock & init
  let adminInitialized = false;
  function startAdmin(){
    if (adminInitialized) return;
    adminInitialized = true;
    setupEvents();
    loadConfig();
    if (hostedShowcase){
      const note = document.createElement('p');
      note.className = 'hosted-admin-note';
      note.textContent = 'Web editor: changes save in this browser. Use the local PC Admin for shared configuration, uploads, and application controls.';
      document.querySelector('.admin-main').prepend(note);
      return;
    }
    const mediaEvents = new EventSource('/api/events');
    let mediaRefreshTimer = 0;
    mediaEvents.addEventListener('assets-updated', () => {
      clearTimeout(mediaRefreshTimer);
      mediaRefreshTimer = setTimeout(() => refreshAssets(true), 220);
    });
  }

  async function setupAdminLock(){
    const lock = $('adminLock');
    const form = $('adminLoginForm');
    const input = $('adminPassword');
    const error = $('adminLockError');
    const toggle = $('toggleAdminPassword');
    document.body.classList.add('admin-locked');
    let passwordRequired = true;
    try {
      const config = hostedShowcase ? window.VASTUCHITRA : await api('/api/config');
      passwordRequired = config.settings?.adminPasswordRequired !== false;
    } catch {
      // Keep the password prompt when the saved setting cannot be read.
    }
    let unlocked = false;
    try { unlocked = sessionStorage.getItem('vastuchitra-admin-unlocked') === 'yes'; } catch {}

    if (!passwordRequired || unlocked){
      lock.classList.add('unlocked');
      document.body.classList.remove('admin-locked');
      startAdmin();
      return;
    }

    document.body.classList.add('admin-locked');
    toggle.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      toggle.querySelector('.material-symbols-outlined').textContent = showing ? 'visibility' : 'visibility_off';
      toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      input.focus();
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (input.value !== '0575'){
        error.textContent = 'Incorrect password. Please try again.';
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        input.select();
        return;
      }
      try { sessionStorage.setItem('vastuchitra-admin-unlocked', 'yes'); } catch {}
      error.textContent = '';
      lock.classList.add('unlocked');
      document.body.classList.remove('admin-locked');
      setTimeout(() => lock.remove(), 360);
      startAdmin();
    });
  }

  window.addEventListener('DOMContentLoaded', setupAdminLock);

})();
