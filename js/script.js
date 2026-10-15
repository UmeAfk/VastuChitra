// ================================================================
// Vastuchitra launcher — engine
//  1. setup, clock, icons
//  2. cards (built from js/projects.js)
//  3. modular layout — live reorder + continuous stretch, FLIP-animated
//  4. card tilt + glow (spring-smoothed)
//  5. swipe carousels
//  6. launch system — programs, websites, details, "playing now"
//  7. kiosk extras — idle reset, hidden admin tools
//  8. one-time intro ripple
// ================================================================
(() => {
'use strict';

// ---------------------------------------------------------------- 1. setup
const CONFIG = window.VASTUCHITRA || { settings: {}, projects: [] };
const CFG = Object.assign({
  columns: 6, rows: 4, idleSeconds: 120, kiosk: false,
  cardGap: 16, cardRadius: 22, showClock: true, showAdmin: true,
  cardRowHeight: 130, pagePadding: 32, titleScale: 100, showBrandSubtitle: true, showDescriptions: true,
  showCategories: true, showGridDots: true, clock24Hour: false,
  showClockIcon: true, showSlidePager: true, motion: true, cardTilt: true,
  autoplaySlides: true, kioskHoldSeconds: 2, toolRevealSeconds: 15,
  showProjectCount: true, hideIdleCursor: true, resetSlidesOnIdle: true, disableSelection: true,
  headerGap: 20, cardContentPadding: 20, introAnimation: true,
  tiltStrength: 7, hoverZoom: 107, transitionSpeed: 100
}, CONFIG.settings);
const PROJECTS = CONFIG.projects || [];
const KIOSK = !!CFG.kiosk || /[?&]kiosk(=|&|$)/.test(location.search);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || CFG.motion === false;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const cssUrl = u => `url("${String(u).replace(/"/g, '%22')}")`;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|avi|ogv)(?:[?#].*)?$/i;
const isVideoSrc = src => VIDEO_EXT.test(String(src || ''));
const EASE = 'cubic-bezier(.16,.84,.24,1)';
const ACCENT = { cyan:'#d7a34a', violet:'#68b89c', amber:'#e57c48', rose:'#d95f70', ocean:'#4d8fe8', orchid:'#a879e8', aqua:'#38c9c5', lime:'#9acb5a', cobalt:'#356de8', indigo:'#5c5bd6', plum:'#8247ad', magenta:'#d4479c', coral:'#f06f65', tangerine:'#ed8a2f', gold:'#c69b42', mint:'#70cdb1', emerald:'#168c68', glacier:'#7fc9df', slate:'#708394', pearl:'#c9c4b7' };
const root = document.documentElement;
const speedFactor = 100 / clamp(parseInt(CFG.transitionSpeed) || 100, 50, 180);

root.style.setProperty('--cols', CFG.columns);
root.style.setProperty('--cell-gap', `${clamp(parseInt(CFG.cardGap) || 16, 6, 40)}px`);
root.style.setProperty('--radius-lg', `${clamp(parseInt(CFG.cardRadius) || 22, 4, 40)}px`);
root.style.setProperty('--cell-row', `${clamp(parseInt(CFG.cardRowHeight) || 130, 90, 220)}px`);
root.style.setProperty('--page-padding', `${clamp(parseInt(CFG.pagePadding) || 32, 12, 64)}px`);
root.style.setProperty('--title-scale', `${clamp(parseInt(CFG.titleScale) || 100, 80, 140) / 100}`);
root.style.setProperty('--header-gap', `${clamp(parseInt(CFG.headerGap) || 20, 8, 48)}px`);
root.style.setProperty('--card-content-padding', `${clamp(parseInt(CFG.cardContentPadding) || 20, 12, 32)}px`);
root.style.setProperty('--hover-zoom', `${clamp(parseInt(CFG.hoverZoom) || 107, 100, 115) / 100}`);
root.style.setProperty('--motion-speed', speedFactor);
root.style.setProperty('--hold-duration', `${clamp(parseFloat(CFG.kioskHoldSeconds) || 2, .5, 5)}s`);
document.body.classList.toggle('kiosk', KIOSK);
document.body.classList.toggle('hide-clock', CFG.showClock === false);
document.body.classList.toggle('hide-admin', CFG.showAdmin === false);
document.body.classList.toggle('hide-brand-sub', CFG.showBrandSubtitle === false);
document.body.classList.toggle('hide-card-sub', CFG.showDescriptions === false);
document.body.classList.toggle('hide-card-cat', CFG.showCategories === false);
document.body.classList.toggle('hide-grid-dots', CFG.showGridDots === false);
document.body.classList.toggle('hide-clock-icon', CFG.showClockIcon === false);
document.body.classList.toggle('hide-slide-pager', CFG.showSlidePager === false);
document.body.classList.toggle('reduce-effects', CFG.motion === false);
document.body.classList.toggle('hide-project-count', CFG.showProjectCount === false);
document.body.classList.toggle('disable-selection', CFG.disableSelection !== false);
if (KIOSK) document.addEventListener('contextmenu', e => e.preventDefault());

const projectCountValue = $('projectCountValue');
if (projectCountValue) projectCountValue.textContent = PROJECTS.length;

// clock — only touches the DOM when the minute changes
const clockEl = $('clock');
let clockText = '';
function tick(){
  const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: CFG.clock24Hour ? false : undefined });
  if (t !== clockText){ clockText = t; clockEl.textContent = t; }
}
tick(); setInterval(tick, 1000);

// category icons
const ICONS = {
  cube:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5"/></svg>`,
  orbit:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="12" rx="9" ry="4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>`,
  ar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>`,
  vr:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="8" width="19" height="9" rx="4"/><circle cx="8" cy="12.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="16" cy="12.5" r="1.4" fill="currentColor" stroke="none"/></svg>`,
  projector:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="8" width="12" height="8" rx="2"/><circle cx="8.5" cy="12" r="2.2"/><path d="M15.5 10l6-2.5v9l-6-2.5z"/></svg>`,
  reel:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none"/></svg>`,
  frames:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="8" width="14" height="12" rx="2.5"/><path d="M4 16V6.5A2.5 2.5 0 0 1 6.5 4H16"/></svg>`,
  building:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21V5l8-3v19M4 9h8M8 13h4M8 17h4M12 21V9l8 3v9"/><path d="M16 15h.01M16 18h.01"/></svg>`,
  home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/></svg>`,
  landscape:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 18 5-5 3.5 3.5 2.5-2.5L20 19"/></svg>`,
  lighting:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.9.8-1.5 1.7-1.5 2.5h-4c0-.8-.6-1.7-1.5-2.5z"/></svg>`,
  model:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3"/><path d="m8 10 4-2 4 2v4l-4 2-4-2zM8 10l4 2 4-2M12 12v4"/></svg>`,
  blueprint:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V4h16v16zM8 8h3v3H8zM14 8h2M14 11h2M8 15h8M8 18h5"/></svg>`,
  garden:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21V9M12 14c-5 0-7-3-7-7 4 0 7 2 7 7zM12 11c0-5 3-8 7-8 0 4-2 8-7 8zM5 21h14"/></svg>`,
  hospitality:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 20V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14M3 14h18M6 10h4v4H6zM14 10h4M14 13h4M7 20v-3M17 20v-3"/></svg>`,
  museum:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m3 9 9-6 9 6M4 10h16M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18M7 19v2M17 19v2"/></svg>`,
  retail:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10v11h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 21v-6h6v6"/></svg>`,
  wellness:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-8-4.5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6.5-8 11-8 11zM12 8v8M8.5 12h7"/></svg>`,
  cinema:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v4M12 4v4M17 4v4M7 20v-4M12 20v-4M17 20v-4M10 10l5 3-5 3z"/></svg>`,
  map:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/><circle cx="12" cy="11" r="1.5"/></svg>`
};
const GRIP = `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="3" r="1.3"/><circle cx="11" cy="3" r="1.3"/><circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/><circle cx="5" cy="13" r="1.3"/><circle cx="11" cy="13" r="1.3"/></svg>`;
const CORNER = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M13 3 3 13"/><path d="M13 8 8 13"/></svg>`;
const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>`;

// ---------------------------------------------------------------- 2. cards
const grid = $('grid');
const shell = $('shell');
const byId = new Map();
let editing = false;

function normSlides(p){
  return (p.slides || []).map(s => typeof s === 'string' ? { src: s } : s).filter(s => s && s.src);
}

function buildCard(p){
  const accent = ACCENT[p.accent] ? p.accent : 'cyan';
  const size = p.size || [2, 1];
  const tile = p.tile || {};
  const tileStyle = ['image', 'gradient', 'video', 'logo'].includes(tile.style) ? tile.style : 'image';
  const gradient = ['ember', 'ocean', 'forest', 'orchid', 'sand', 'aurora'].includes(tile.gradient) ? tile.gradient : 'ember';
  const card = document.createElement('div');
  card.className = `card tile-${tileStyle}${tile.frame === false ? ' no-frame' : ''}${tile.showTitle === false ? ' no-title' : ''}${tile.showCategory === false ? ' no-category' : ''}${tile.showDescription === false ? ' no-description' : ''}`;
  card.dataset.id = p.id;
  card.dataset.accent = accent;
  card.dataset.gradient = gradient;
  if (/^#[0-9a-f]{6}$/i.test(tile.color || '')){
    card.classList.add('tile-solid');
    card.style.setProperty('--tile-color', tile.color);
  }
  if (tile.showTitle === false && tile.showCategory === false && tile.showDescription === false) card.classList.add('tile-minimal');
  card.dataset.cs = clamp(parseInt(size[0]) || 2, 1, CFG.columns);
  card.dataset.rs = clamp(parseInt(size[1]) || 1, 1, CFG.rows);
  card.style.setProperty('--glow', ACCENT[accent]);
  card.innerHTML = `
    <div class="thumb"></div>
    <div class="scrim"></div>
    <div class="arrow">${ARROW}</div>
    <div class="handle-drag">${GRIP}</div>
    <div class="handle-resize" title="Drag to resize">${CORNER}</div>
    <div class="content">
      <span class="tag">${ICONS[p.icon] || ''}${esc(p.cat)}</span>
      <h3>${esc(p.title)}</h3>
      <p class="sub">${esc(p.sub)}</p>
    </div>`;

  // images: every card gets .slide layers; 2+ become a carousel below
  const thumb = card.querySelector('.thumb');
  const list = normSlides(p);
  if (tileStyle === 'logo' && tile.logoIcon && ICONS[tile.logoIcon]){
    const mark = document.createElement('div');
    mark.className = 'tile-symbol';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = ICONS[tile.logoIcon];
    thumb.appendChild(mark);
  }
  if (tileStyle === 'logo' && tile.logoSrc){
    const logo = document.createElement('img');
    logo.className = 'card-logo'; logo.src = tile.logoSrc; logo.alt = `${p.title} logo`; logo.loading = 'lazy';
    logo.addEventListener('error', () => logo.remove(), { once:true });
    thumb.appendChild(logo);
  }
  if (tileStyle === 'video'){
    const source = list.find(s => isVideoSrc(s.src));
    if (source){
      const video = document.createElement('video');
      video.className = 'tile-video'; video.src = source.src; video.muted = true; video.loop = true;
      video.playsInline = true; video.preload = 'metadata'; video.setAttribute('aria-hidden', 'true');
      video.addEventListener('error', () => card.classList.add('tile-video-missing'), { once:true });
      thumb.appendChild(video); card._tileVideo = video;
    } else card.classList.add('tile-video-missing');
  }
  const imageList = tileStyle === 'image' ? list.filter(s => !isVideoSrc(s.src)) : [];
  const st = imageList.map(() => ({ ready: false, failed: false }));
  const slides = imageList.map((s, k) => {
    const slide = document.createElement('div'); slide.className = 'slide';
    const img = document.createElement('div');   img.className = 'img';
    img.style.backgroundImage = cssUrl(s.src);
    if (s.pos) img.style.backgroundPosition = s.pos;
    slide.appendChild(img); thumb.appendChild(slide);

    // preload + decode so a swipe never lands on a half-loaded image;
    // a missing file just leaves the coloured placeholder showing
    const pre = new Image(); pre.src = s.src;
    (pre.decode ? pre.decode() : Promise.resolve()).then(() => { st[k].ready = true; }, () => { st[k].failed = true; });
    return slide;
  });
  if (slides[0]) slides[0].classList.add('is-on');
  card._slides = slides; card._st = st; card._list = imageList;
  return card;
}

const seenIds = new Set();
PROJECTS.forEach(p => {
  if (!p.id || seenIds.has(p.id)){ console.warn('[Vastuchitra] every project needs a unique id:', p.id); return; }
  seenIds.add(p.id);
  byId.set(p.id, p);
  grid.appendChild(buildCard(p));
});
const allCards = () => [...grid.querySelectorAll('.card')];
allCards().forEach((c, i) => { c.dataset.origIndex = i; });
const videoCards = allCards().filter(card => card._tileVideo);
const tileVideoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const video = entry.target._tileVideo;
    if (!video) return;
    video._inView = entry.isIntersecting;
    if (entry.isIntersecting && document.visibilityState === 'visible') video.play().catch(() => {});
    else video.pause();
  });
}, { root: grid, threshold: .12 }) : null;
videoCards.forEach(card => tileVideoObserver ? tileVideoObserver.observe(card) : card._tileVideo.play().catch(() => {}));
document.addEventListener('visibilitychange', () => videoCards.forEach(card => {
  if (document.visibilityState === 'hidden') card._tileVideo.pause();
  else if (tileVideoObserver && card._tileVideo._inView) card._tileVideo.play().catch(() => {});
  else if (!tileVideoObserver){
    const rect = card.getBoundingClientRect(), gridRect = grid.getBoundingClientRect();
    if (rect.bottom > gridRect.top && rect.top < gridRect.bottom) card._tileVideo.play().catch(() => {});
  }
}));

// ---------------------------------------------------------------- 3. layout
const LAYOUT_KEY = CFG.meetingPreview ? 'vastuchitra-meeting-layout-v2' : 'vastuchitra-layout-v3';
const CS_MIN = 1, CS_MAX = CFG.columns, RS_MIN = 1, RS_MAX = CFG.rows;
const gapPx = () => parseFloat(getComputedStyle(grid).rowGap) || 16;

// size one row unit so `rows` stacked rows fill the available height
function fitRowHeight(){
  const padB = parseFloat(getComputedStyle(grid).paddingBottom) || 0;
  const h = (grid.clientHeight - padB - gapPx() * (CFG.rows - 1)) / CFG.rows;
  const configuredMinimum = clamp(parseInt(CFG.cardRowHeight) || 130, 90, 220);
  root.style.setProperty('--cell-row', Math.max(configuredMinimum, Math.floor(h)) + 'px');
}
fitRowHeight();
window.addEventListener('resize', fitRowHeight);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitRowHeight);

const sizeOf = card => ({
  cs: parseInt(card.style.getPropertyValue('--cs')) || 2,
  rs: parseInt(card.style.getPropertyValue('--rs')) || 2
});
function setSize(card, cs, rs){
  card.style.setProperty('--cs', cs); card.style.setProperty('--rs', rs);
  card.classList.toggle('is-lg', cs * rs >= 6);
  card.classList.toggle('is-sm', cs * rs <= 1);
}
function applyDefaultSizes(){
  allCards().forEach(c => setSize(c, clamp(+c.dataset.cs, CS_MIN, CS_MAX), clamp(+c.dataset.rs, RS_MIN, RS_MAX)));
}
function pulse(card){
  card.classList.remove('just-moved'); void card.offsetWidth; card.classList.add('just-moved');
  setTimeout(() => card.classList.remove('just-moved'), 750);
}

function saveLayout(){
  const order = allCards().map(c => c.dataset.id);
  const sizes = {};
  allCards().forEach(c => { sizes[c.dataset.id] = sizeOf(c); });
  const catalogOrder = PROJECTS.map(project => project.id);
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ order, sizes, catalogOrder })); } catch {}
}
function loadLayout(){
  try { const raw = localStorage.getItem(LAYOUT_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function initLayout(){
  applyDefaultSizes();
  const saved = loadLayout();
  if (!saved || !Array.isArray(saved.order)) return;
  const catalogOrder = PROJECTS.map(project => project.id);
  const catalogMatches = Array.isArray(saved.catalogOrder) && saved.catalogOrder.join('|') === catalogOrder.join('|');
  const byCard = new Map(allCards().map(c => [c.dataset.id, c]));
  const ordered = catalogMatches ? saved.order.map(id => byCard.get(id)).filter(Boolean) : [];
  const rest = allCards().filter(c => !ordered.includes(c));        // cards added since the layout was saved
  [...ordered, ...rest].forEach(c => grid.appendChild(c));
  allCards().forEach(c => {
    const s = saved.sizes && saved.sizes[c.dataset.id];
    if (s) setSize(c, clamp(s.cs, CS_MIN, CS_MAX), clamp(s.rs, RS_MIN, RS_MAX));
  });
}
initLayout();

// ---- FLIP: every card glides from where it was to where the grid puts it.
// Web Animations API → nothing is left in inline styles, an interrupted glide
// carries on from where the card visually is, and it runs on the compositor.
const FLIP_MS = 560 * speedFactor;
const isSlot = n => n.classList && (n.classList.contains('card') || n.classList.contains('card-placeholder'));
const cancelFlip = el => el.getAnimations().forEach(a => { if (a.id === 'flip') a.cancel(); });

function flipFromRect(el, before){
  cancelFlip(el);                                     // measure the real slot, not a mid-glide one
  const after = el.getBoundingClientRect();
  const dx = before.left - after.left, dy = before.top - after.top;
  if (Math.abs(dx) < .5 && Math.abs(dy) < .5) return;
  el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0,0)' }],
             { duration: FLIP_MS, easing: EASE }).id = 'flip';
}
function withFlip(mutate){
  const items = [...grid.children].filter(n => isSlot(n) && !n.classList.contains('is-floating'));
  const before = new Map(items.map(n => [n, n.getBoundingClientRect()]));
  mutate();
  [...grid.children].filter(n => isSlot(n) && !n.classList.contains('is-floating'))
    .forEach(n => { const b = before.get(n); if (b) flipFromRect(n, b); });
}

function resetLayout(){
  try { localStorage.removeItem(LAYOUT_KEY); } catch {}
  const cards = allCards();
  withFlip(() => {
    [...cards].sort((a, b) => a.dataset.origIndex - b.dataset.origIndex).forEach(c => grid.appendChild(c));
    applyDefaultSizes();
  });
  cards.forEach(pulse);
}

// ---- lifting a card out of the grid (shared by move + stretch)
// A dashed placeholder takes its slot straight away, so neighbours flow around
// the *destination* while the card itself follows the finger freely.
function floatCard(card){
  killTilt(card);
  const rect = card.getBoundingClientRect();
  const s = sizeOf(card);
  const ph = document.createElement('div');
  ph.className = 'card-placeholder';
  ph.style.setProperty('--cs', s.cs); ph.style.setProperty('--rs', s.rs);
  ph.style.setProperty('--glow', card.style.getPropertyValue('--glow'));
  card.before(ph);
  card.classList.add('is-floating');
  setBox(card, rect.left, rect.top, rect.width, rect.height);
  grid.classList.add('is-editing-active');
  return { rect, ph };
}
function setBox(card, l, t, w, h){
  const st = card.style;
  st.left = l + 'px'; st.top = t + 'px'; st.width = w + 'px'; st.height = h + 'px';
}

// ---- landing: the card glides from wherever it is into the placeholder's slot,
// then swaps back into the grid on the same frame — no jump.
function settle(card, ph){
  cancelFlip(ph);
  const to = ph.getBoundingClientRect();
  const st = card.style;
  const from = { left: parseFloat(st.left), top: parseFloat(st.top), width: parseFloat(st.width), height: parseFloat(st.height) };
  let done = false, anim = null;
  const fin = () => {
    if (done) return; done = true;
    card.classList.remove('is-floating', 'is-dragging', 'is-resizing');
    st.left = st.top = st.width = st.height = '';
    ph.before(card);                                    // the card takes the placeholder's place in the grid order —
    ph.remove();                                        // this is the moment a rearrange becomes real
    if (anim) anim.cancel();                            // release the held end-state (fill: forwards) so the grid owns the layout again
    grid.classList.remove('is-editing-active');
    pulse(card); saveLayout();
  };
  card.classList.remove('is-dragging', 'is-resizing');           // scale/rotate ease back to rest while gliding
  if (reduceMotion) return fin();
  const px = v => v + 'px';
  anim = card.animate(
    [{ left: px(from.left), top: px(from.top), width: px(from.width), height: px(from.height) },
     { left: px(to.left),   top: px(to.top),   width: px(to.width),   height: px(to.height) }],
    { duration: 460, easing: EASE, fill: 'forwards' });
  anim.onfinish = fin; anim.oncancel = fin;
}

// ---- gestures (edit mode): press-and-move anywhere on a card to move it,
// drag the corner handle to stretch it
function beginGesture(card, e, kind){
  e.preventDefault();
  const id = e.pointerId, sx = e.clientX, sy = e.clientY;
  let started = false, gesture = null;

  const start = ev => { started = true; gesture = kind === 'resize' ? startResize(card, sx, sy, ev) : startDrag(card, sx, sy, ev); };
  const move = ev => {
    if (ev.pointerId !== id) return;
    if (!started){
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;   // a tap must not start a drag
      start(ev);
    }
    gesture.move(ev);
  };
  const up = ev => {
    if (ev.pointerId !== id) return;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    if (started) gesture.end();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  if (kind === 'resize') start(e);
}

// -- move: the card follows the pointer with time-based easing; the placeholder
//    hops between slots as you pass over other cards and everything glides.
function startDrag(card, sx, sy, e0){
  const { rect, ph } = floatCard(card);
  card.classList.add('is-dragging');
  const offX = sx - rect.left, offY = sy - rect.top;
  let px = e0.clientX, py = e0.clientY;                      // latest pointer
  let x = rect.left, y = rect.top;                           // eased card position
  let last = performance.now(), lastSwap = 0, lastOver = null, swapX = px, swapY = py, raf = 0;

  function autoScroll(dt){
    const gr = grid.getBoundingClientRect(), edge = 72;
    if (py < gr.top + edge)         grid.scrollTop -= ((gr.top + edge - py) / edge) * 16 * (dt / 16);
    else if (py > gr.bottom - edge) grid.scrollTop += ((py - (gr.bottom - edge)) / edge) * 16 * (dt / 16);
  }
  function reorder(now){
    if (now - lastSwap < 150) return;
    const over = document.elementsFromPoint(px, py).find(n => n !== card && n.classList && n.classList.contains('card'));
    if (!over){ lastOver = null; return; }
    if (over === lastOver) return;                            // just swapped with it — wait until you leave it
    if (Math.hypot(px - swapX, py - swapY) < 10) return;      // and don't cascade while the finger is still
    const r = over.getBoundingClientRect();
    const ix = r.width * .2, iy = r.height * .2;              // only the middle of a card counts — no flicker on edges
    if (px < r.left + ix || px > r.right - ix || py < r.top + iy || py > r.bottom - iy) return;
    const after = !!(ph.compareDocumentPosition(over) & Node.DOCUMENT_POSITION_FOLLOWING);
    withFlip(() => { after ? over.after(ph) : over.before(ph); });
    lastSwap = now; lastOver = over; swapX = px; swapY = py;
  }
  function frame(now){
    const dt = Math.min(48, now - last); last = now;
    const k = 1 - Math.exp(-30 * dt / 1000);
    x += (px - offX - x) * k; y += (py - offY - y) * k;
    card.style.left = x + 'px'; card.style.top = y + 'px';
    autoScroll(dt); reorder(now);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    move(ev){ px = ev.clientX; py = ev.clientY; },
    end(){ cancelAnimationFrame(raf); settle(card, ph); }
  };
}

// -- stretch: the card grows continuously under your finger; a dashed placeholder
//    snaps to the nearest grid size and neighbours glide to make room.
const sizeBadge = document.createElement('div');
sizeBadge.className = 'size-badge';
document.body.appendChild(sizeBadge);

function startResize(card, sx, sy, e0){
  const { rect, ph } = floatCard(card);
  card.classList.add('is-resizing');
  const gr = grid.getBoundingClientRect(), gap = gapPx();
  const colUnit = (gr.width + gap) / CFG.columns;
  const rowUnit = (parseFloat(getComputedStyle(root).getPropertyValue('--cell-row')) || 130) + gap;
  const minW = colUnit - gap, minH = rowUnit - gap;
  const maxW = colUnit * CS_MAX - gap, maxH = rowUnit * RS_MAX - gap;
  let { cs, rs } = sizeOf(card);
  let px = e0.clientX, py = e0.clientY;
  let w = rect.width, h = rect.height, last = performance.now(), raf = 0;

  sizeBadge.style.setProperty('--glow', card.style.getPropertyValue('--glow'));
  sizeBadge.textContent = `${cs} × ${rs}`;
  requestAnimationFrame(() => sizeBadge.classList.add('show'));

  function frame(now){
    const dt = Math.min(48, now - last); last = now;
    const k = 1 - Math.exp(-26 * dt / 1000);
    const tw = clamp(rect.width  + (px - sx), minW, maxW);     // where the finger says the card should be
    const th = clamp(rect.height + (py - sy), minH, maxH);
    w += (tw - w) * k; h += (th - h) * k;                      // the card eases toward it — a continuous stretch
    // keep it on screen: growing past the right/bottom edge pushes it back instead of clipping
    const left = Math.max(gr.left, Math.min(rect.left, gr.right - w));
    const top  = Math.max(gr.top,  Math.min(rect.top, window.innerHeight - 12 - h));
    setBox(card, left, top, w, h);

    const ncs = clamp(Math.round((tw + gap) / colUnit), CS_MIN, CS_MAX);
    const nrs = clamp(Math.round((th + gap) / rowUnit), RS_MIN, RS_MAX);
    if (ncs !== cs || nrs !== rs){
      cs = ncs; rs = nrs;
      withFlip(() => { ph.style.setProperty('--cs', cs); ph.style.setProperty('--rs', rs); });
      setSize(card, cs, rs);
      sizeBadge.textContent = `${cs} × ${rs}`;
    }
    sizeBadge.style.left = (px + 34) + 'px';
    sizeBadge.style.top  = (py + 6) + 'px';
    raf = requestAnimationFrame(frame);
  }
  sizeBadge.style.left = (px + 34) + 'px'; sizeBadge.style.top = (py + 6) + 'px';
  raf = requestAnimationFrame(frame);

  return {
    move(ev){ px = ev.clientX; py = ev.clientY; },
    end(){ cancelAnimationFrame(raf); sizeBadge.classList.remove('show'); settle(card, ph); }
  };
}

// ---- edit mode toggle
const editToggle = $('editToggle');
function setEditing(on){
  editing = on;
  shell.classList.toggle('editing', on);
  editToggle.classList.toggle('active', on);
  editToggle.setAttribute('aria-pressed', String(on));
  editToggle.setAttribute('aria-label', on ? 'Finish customizing launcher' : 'Customize launcher layout');
  if (on) allCards().forEach(killTilt);
}
editToggle.addEventListener('click', () => {
  setEditing(!editing);
  if (!editing) setToolsVisible(true);
});

// ---------------------------------------------------------------- 4. tilt + glow
// The pointer only sets a target; one rAF loop eases each hovered card toward it
// (and back to rest on leave), so movement never jitters. Mouse only.
const tiltCards = new Set();
let tiltRaf = 0, tiltLast = 0;

function tiltFrame(now){
  const dt = Math.min(48, now - tiltLast); tiltLast = now;
  const k = 1 - Math.exp(-9 * dt / 1000), kg = 1 - Math.exp(-14 * dt / 1000);
  tiltCards.forEach(card => {
    const s = card._tilt;
    s.x += (s.tx - s.x) * k;   s.y += (s.ty - s.y) * k;
    s.gx += (s.tx - s.gx) * kg; s.gy += (s.ty - s.gy) * kg;
    const strength = clamp(parseFloat(CFG.tiltStrength) || 0, 0, 14);
    card.style.transform = `perspective(900px) rotateY(${s.x * strength}deg) rotateX(${-s.y * strength}deg) translateZ(6px)`;
    card.style.setProperty('--mx', ((s.gx + .5) * 100) + '%');
    card.style.setProperty('--my', ((s.gy + .5) * 100) + '%');
    if (!s.hover && Math.abs(s.x) < .002 && Math.abs(s.y) < .002){
      card.style.transform = '';
      card.classList.remove('is-tilting');
      tiltCards.delete(card);
    }
  });
  tiltRaf = tiltCards.size ? requestAnimationFrame(tiltFrame) : 0;
}
function wakeTilt(card){
  card.classList.add('is-tilting'); tiltCards.add(card);
  if (!tiltRaf){ tiltLast = performance.now(); tiltRaf = requestAnimationFrame(tiltFrame); }
}
function killTilt(card){
  const s = card._tilt; if (!s) return;
  s.hover = false; s.x = s.y = s.tx = s.ty = 0;
  card.style.transform = ''; card.classList.remove('is-tilting'); tiltCards.delete(card);
}

allCards().forEach(card => {
  card._tilt = { x:0, y:0, tx:0, ty:0, gx:0, gy:-.5, hover:false };

  card.addEventListener('pointerenter', e => {
    if (editing || e.pointerType !== 'mouse' || reduceMotion || CFG.cardTilt === false) return;
    const s = card._tilt; s.hover = true; s.gx = 0; s.gy = -.5;
    wakeTilt(card);
  });
  card.addEventListener('pointermove', e => {
    if (editing || e.pointerType !== 'mouse' || reduceMotion || CFG.cardTilt === false || !card._tilt.hover) return;
    const r = card.getBoundingClientRect();
    card._tilt.tx = (e.clientX - r.left) / r.width - .5;
    card._tilt.ty = (e.clientY - r.top) / r.height - .5;
  });
  card.addEventListener('pointerleave', () => {
    const s = card._tilt; s.hover = false; s.tx = s.ty = 0;
    if (tiltCards.has(card)) wakeTilt(card);
  });

  // finger-down feedback
  const unpress = () => card.classList.remove('is-pressed');
  card.addEventListener('pointerdown', e => {
    if (editing || e.target.closest('.pager')) return;
    card.classList.add('is-pressed');
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => card.addEventListener(t, unpress));

  // edit mode: press anywhere to move, corner to stretch
  card.addEventListener('pointerdown', e => {
    if (!editing || (e.pointerType === 'mouse' && e.button !== 0) || card.classList.contains('is-floating')) return;
    beginGesture(card, e, e.target.closest('.handle-resize') ? 'resize' : 'drag');
  });

  // cards are focusable buttons
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  const p = byId.get(card.dataset.id);
  card.setAttribute('aria-label', p.title + ' — ' + p.cat);
  card.addEventListener('keydown', e => {
    if (editing) return;
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); activate(card); }
    else if (card._slider && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')){
      e.preventDefault(); card._slider.step(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  card.addEventListener('click', e => { if (!editing) activate(card, e); });
});

// ---------------------------------------------------------------- 5. swipe carousels
// Every transition is ONE number, t (0 → 1), plus a direction d (+1 next / −1
// previous). FX turns (t, d) into transforms for the outgoing and incoming slide.
// Autoplay tweens t; dragging sets t straight from your finger; letting go tweens
// the rest of the way (or back) — so swipe, autoplay and release all look identical.
const easeInOutQuart = u => u < .5 ? 8*u*u*u*u : 1 - Math.pow(-2*u + 2, 4) / 2;
const easeOutCubic   = u => 1 - Math.pow(1 - u, 3);

function put(slide, transform, innerTransform, opacity, clip){
  slide.style.transform = transform;
  slide.style.opacity = opacity;
  slide.style.clipPath = clip || '';
  slide.firstElementChild.style.transform = innerTransform;
}
function resetSlide(slide){
  slide.style.transform = ''; slide.style.opacity = ''; slide.style.clipPath = ''; slide.style.zIndex = '';
  slide.style.filter = '';
  slide.firstElementChild.style.transform = '';
}

const PAR = .065;   // parallax strength
const FX = {
  push(cur, nxt, t, d){
    const inn = (1 - t) * 100 * d, out = -t * 32 * d;
    put(nxt, `translate3d(${inn}%,0,0)`, `translate3d(${-inn * PAR}%,0,0)`, 1);
    put(cur, `translate3d(${out}%,0,0)`, `translate3d(${-out * PAR}%,0,0)`, 1 - t * .4);
  },
  lift(cur, nxt, t, d){
    const inn = (1 - t) * 100 * d, out = -t * 32 * d;
    put(nxt, `translate3d(0,${inn}%,0)`, `translate3d(0,${-inn * PAR}%,0)`, 1);
    put(cur, `translate3d(0,${out}%,0)`, `translate3d(0,${-out * PAR}%,0)`, 1 - t * .4);
  },
  wipe(cur, nxt, t, d){
    const S = 16, L = (1 - t) * (100 + S);
    const clip = d > 0
      ? `polygon(${L}% 0, 100% 0, 100% 100%, ${L - S}% 100%)`
      : `polygon(0 0, ${100 - L}% 0, ${100 - L + S}% 100%, 0 100%)`;
    put(nxt, 'none', `translate3d(${d * (1 - t) * 5}%,0,0) scale(${1 + (1 - t) * .08})`, 1, clip);
    put(cur, 'none', `translate3d(${-d * t * 4}%,0,0) scale(${1 + t * .05})`, 1);
  },
  fade(cur, nxt, t){
    put(nxt, 'none', `scale(${1.12 - .12 * t})`, t);
    put(cur, 'none', `scale(${1 + .05 * t})`, 1);
  },
  zoom(cur, nxt, t){
    put(nxt, `scale(${0.85 + 0.15 * t})`, 'none', t);
    put(cur, `scale(${1 + 0.18 * t})`, 'none', 1 - t);
  },
  kenburns(cur, nxt, t, d){
    const p = (1 - t) * 4 * d;
    put(nxt, 'none', `scale(${1.08 + 0.1 * (1 - t)}) translate3d(${p}%,0,0)`, t);
    put(cur, 'none', `scale(${1.18 - 0.05 * t}) translate3d(${-p}%,0,0)`, 1 - t);
  },
  slideup(cur, nxt, t){
    put(nxt, `translate3d(0,${(1 - t) * 100}%,0)`, 'none', 1);
    put(cur, `translate3d(0,${-t * 30}%,0)`, 'none', 1 - t * 0.4);
  },
  slidedown(cur, nxt, t){
    put(nxt, `translate3d(0,${-(1 - t) * 100}%,0)`, 'none', 1);
    put(cur, `translate3d(0,${t * 30}%,0)`, 'none', 1 - t * 0.4);
  },
  blur(cur, nxt, t){
    put(nxt, 'none', `scale(${1.05 - 0.05 * t})`, t);
    nxt.style.filter = `blur(${(1 - t) * 8}px)`;
    put(cur, 'none', `scale(${1 + 0.05 * t})`, 1 - t);
    cur.style.filter = `blur(${t * 8}px)`;
  }
};
const FX_MS = { push:1100, lift:1100, wipe:1000, fade:1300, zoom:1200, kenburns:1600, slideup:1100, slidedown:1100, blur:1200 };
// which finger-axis drives each fx: 'x' effects respond to left/right drag, 'y' effects
// (the vertical ones) respond to up/down drag instead — so a manual swipe always matches
// the card's own animation instead of defaulting to a left-right push.
const FX_AXIS = { push:'x', wipe:'x', kenburns:'x', fade:'x', zoom:'x', blur:'x', lift:'y', slideup:'y', slidedown:'y' };

class Slider {
  constructor(card, order){
    const p = byId.get(card.dataset.id);
    this.card = card;
    this.slides = card._slides;
    this.st = card._st;                                     // per-image { ready, failed }
    this.n = this.slides.length;
    this.fx = FX[p.fx] ? p.fx : 'push';
    this.axis = FX_AXIS[this.fx] || 'x';                    // 'x' or 'y' — which drag direction this card's fx uses
    this.dir = p.dir === -1 ? -1 : 1;
    this.interval = parseInt(p.interval) || 4800;
    this.dur = reduceMotion ? 350 : FX_MS[this.fx] * speedFactor;
    this.auto = !reduceMotion && CFG.autoplaySlides !== false;
    this.idx = 0;
    this.p = (order * .31) % .7;                            // stagger so cards never flip in unison
    this.visible = true; this.held = false; this.tr = null; this.drag = null; this.swiped = false;

    card.classList.add('has-slides');
    if (this.axis === 'y') card.classList.add('axis-y');   // native touch panning must run the other way (see CSS)

    this.pager = document.createElement('div');
    this.pager.className = 'pager';
    this.dots = this.slides.map((_, k) => {
      const i = document.createElement('i');
      i.addEventListener('click', e => { e.stopPropagation(); this.goTo(k); });
      i.addEventListener('pointerdown', e => e.stopPropagation());
      this.pager.appendChild(i);
      return i;
    });
    card.appendChild(this.pager);
    this.markDot(0);
    this.bindGesture();
    card._slider = this;
  }

  // next slide in direction d that can actually be shown → index, -1 none usable, -2 still loading
  pick(d){
    for (let i = 1; i < this.n; i++){
      const k = (((this.idx + d * i) % this.n) + this.n) % this.n;
      const s = this.st[k];
      if (s.failed) continue;
      return s.ready ? k : -2;
    }
    return -1;
  }

  markDot(k){ this.dots.forEach((d, i) => { d.classList.toggle('on', i === k); d.style.setProperty('--p', 0); }); }

  paint(tr, t){
    FX[tr.fx](tr.cur, tr.nxt, t, tr.d);
    tr.nxt.style.zIndex = 2; tr.cur.style.zIndex = 1;
  }

  // tween t from → to. to === 1 commits the new slide, to === 0 snaps back
  transition(nxtIdx, d, fx, from, to, dur, ease){
    this.finish();
    const tr = this.tr = { cur: this.slides[this.idx], nxt: this.slides[nxtIdx], nxtIdx, d, fx, to, raf: 0 };
    tr.nxt.classList.add('is-on');
    if (to >= 1) this.markDot(nxtIdx);
    this.paint(tr, from);                                   // paint before the first frame → no flash of the raw slide
    const t0 = performance.now();
    const step = now => {
      const u = clamp((now - t0) / dur, 0, 1);
      this.paint(tr, from + (to - from) * ease(u));
      if (u < 1) tr.raf = requestAnimationFrame(step); else this.end(tr);
    };
    tr.raf = requestAnimationFrame(step);
  }
  end(tr){
    if (this.tr !== tr) return;
    this.tr = null;
    resetSlide(tr.cur); resetSlide(tr.nxt);
    if (tr.to >= 1){ tr.cur.classList.remove('is-on'); this.idx = tr.nxtIdx; }
    else tr.nxt.classList.remove('is-on');
  }
  finish(){
    const tr = this.tr; if (!tr) return;
    cancelAnimationFrame(tr.raf); this.end(tr);
  }

  step(d){
    if (this.drag) return;
    const k = this.pick(d);
    if (k === -1){ this.auto = false; return; }             // nothing else to show
    if (k === -2){ this.p = .85; return; }                  // still decoding → try again shortly
    this.p = 0;
    this.transition(k, d, this.fx, 0, 1, this.dur, easeInOutQuart);
  }
  goTo(k){
    if (k === this.idx || this.drag || this.st[k].failed || !this.st[k].ready) return;
    this.p = 0;
    this.transition(k, k > this.idx ? 1 : -1, this.fx, 0, 1, this.dur, easeInOutQuart);
  }

  reset(){
    this.finish(); this.p = 0;
    if (this.idx === 0) { this.markDot(0); return; }
    this.slides.forEach((slide, index) => {
      resetSlide(slide);
      slide.classList.toggle('is-on', index === 0);
    });
    this.idx = 0; this.markDot(0);
  }

  update(dt, paused){
    if (!this.auto || paused || !this.visible || this.held || this.tr || this.drag) return;
    this.p += dt / this.interval;
    if (this.p >= 1){ this.step(this.dir); return; }
    this.dots[this.idx].style.setProperty('--p', this.p.toFixed(3));
  }

  // ----- finger / mouse swipe -----
  // Which screen axis counts as "the swipe" depends on this card's fx (see FX_AXIS):
  // horizontal effects (push, wipe, fade…) swipe left/right; vertical ones (lift,
  // slideup, slidedown) swipe up/down instead. `along` is movement on that axis,
  // `cross` is movement on the other one (used only to bail out to native scrolling).
  bindGesture(){
    const card = this.card;
    const axis = this.axis;
    let id = null, sx = 0, sy = 0, mode = null, lastPos = 0, lastT = 0, v = 0;

    card.addEventListener('pointerdown', e => {
      if (editing || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (e.target.closest('.pager, .handle-drag, .handle-resize')) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY;
      lastPos = axis === 'y' ? e.clientY : e.clientX;
      lastT = performance.now(); v = 0;
      mode = 'pending'; this.held = true;
      this.finish();
    });
    card.addEventListener('pointermove', e => {
      if (e.pointerId !== id || !mode) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const along = axis === 'y' ? dy : dx, cross = axis === 'y' ? dx : dy;
      if (mode === 'pending'){
        if (Math.abs(along) > 8 && Math.abs(along) > Math.abs(cross) * 1.2){
          mode = 'swipe';
          try { card.setPointerCapture(id); } catch {}
          card.classList.add('is-swiping'); card.classList.remove('is-pressed');
          this.drag = { d: 0, t: 0, tr: null };
        } else if (Math.abs(cross) > 10){ mode = null; this.held = false; return; }   // the other axis — not ours
        else return;
      }
      const now = performance.now();
      const pos = axis === 'y' ? e.clientY : e.clientX;
      if (now > lastT) v = .8 * v + .2 * ((pos - lastPos) / (now - lastT));     // smoothed px/ms
      lastPos = pos; lastT = now;
      this.dragMove(along);
    });
    const end = e => {
      if (e.pointerId !== id) return;
      const was = mode;
      id = null; mode = null; this.held = false;
      card.classList.remove('is-swiping');
      if (was === 'swipe'){
        this.dragEnd(e.type === 'pointercancel' ? 0 : v);
        this.swiped = true;                                 // swallow the click that follows a swipe
        setTimeout(() => { this.swiped = false; }, 120);
      }
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
    card.addEventListener('click', e => { if (this.swiped){ e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }
  dragMove(along){
    const dr = this.drag; if (!dr) return;
    const d = along < 0 ? 1 : -1;
    if (d !== dr.d){                                        // changed direction → swap which neighbour is peeking
      if (dr.tr){ resetSlide(dr.tr.nxt); dr.tr.nxt.classList.remove('is-on'); dr.tr = null; }
      dr.d = d; dr.t = 0;
      const k = this.pick(d);
      if (k >= 0){
        dr.tr = { cur: this.slides[this.idx], nxt: this.slides[k], nxtIdx: k, d, fx: this.fx, to: 1 };
        dr.tr.nxt.classList.add('is-on');
      }
    }
    if (!dr.tr) return;
    const extent = this.axis === 'y' ? this.card.clientHeight : this.card.clientWidth;
    dr.t = clamp(Math.abs(along) / extent, 0, 1);
    this.paint(dr.tr, dr.t);
  }
  dragEnd(v){
    const dr = this.drag; this.drag = null;
    if (!dr || !dr.tr) return;
    const flick = -v * dr.d > .45;                          // fast flick in the swipe direction
    const commit = dr.t > .25 || flick;
    const dur = commit ? 260 + (1 - dr.t) * 460 : 240 + dr.t * 320;
    this.p = 0;
    this.transition(dr.tr.nxtIdx, dr.d, this.fx, dr.t, commit ? 1 : 0, dur, easeOutCubic);
  }
}

const sliders = allCards().filter(c => c._slides.length > 1).map((c, i) => new Slider(c, i));

// only animate what is actually on screen
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.target._slider) en.target._slider.visible = en.isIntersecting; });
  }, { root: grid, threshold: .15 });
  sliders.forEach(s => io.observe(s.card));
}

const overlay = $('overlay');
let sliderLast = performance.now();
function sliderLoop(now){
  const dt = Math.min(64, now - sliderLast); sliderLast = now;
  const paused = editing || document.hidden || overlay.classList.contains('show');
  sliders.forEach(s => s.update(dt, paused));
  requestAnimationFrame(sliderLoop);
}
requestAnimationFrame(sliderLoop);

// ---------------------------------------------------------------- 6. launch system
const ovBg = $('ovBg'), closeBtn = $('closeBtn');
const panel = $('launchPanel'), ovTitle = $('ovTitle'), ovSub = $('ovSub'), barwrap = $('barwrap');
const btnStop = $('btnStop'), btnRetry = $('btnRetry'), btnBack = $('btnBack');
const nowPlaying = $('nowPlaying'), npTitle = $('npTitle');

let launchToken = 0, cleanupTimer = 0, lastFocus = null, currentP = null;

const appKey = p => (p.action && p.action.app) || p.id;
const accentOf = p => ACCENT[p.accent] || ACCENT.cyan;

// ---- talking to the PC helper (server.js) — programs can't be started by a web page alone
const HELPER = !CFG.meetingPreview && /^https?:$/.test(location.protocol);
async function api(path, method = 'GET'){
  if (!HELPER) throw new Error('no-helper');
  const res = await fetch(path, { method, headers: { 'X-Requested-With': 'vastuchitra' }, cache: 'no-store' });
  let data = {}; try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || 'Something went wrong (' + res.status + ').');
  return data;
}
function friendlyError(err){
  if (err.message === 'no-helper') return 'Open the launcher at http://localhost:4000 so it can start programs on this PC.';
  if (err instanceof TypeError)   return 'The PC helper isn’t running. Start it with start-kiosk.bat, then try again.';
  return err.message;
}

// ---- "playing now" — kept in sync with the helper, so the Stop button survives leaving the launch screen
let running = null;
function setRunning(key){
  if (key === running) return;
  const was = running; running = key;
  const p = PROJECTS.find(x => appKey(x) === key);
  npTitle.textContent = p ? p.title : (key || '—');
  nowPlaying.classList.toggle('show', !!key);
  // the program closed on its own while its screen is open → glide back to the launcher
  if (!key && was && overlay.classList.contains('show') && overlay.dataset.view === 'launch' && panel.dataset.state === 'running') closeOverlay();
}
async function pollState(){
  if (document.hidden) return;
  try { const s = await api('/api/state'); setRunning(s.running || null); } catch {}
}
if (HELPER){ pollState(); setInterval(pollState, 3000); }
$('npStop').addEventListener('click', async () => {
  try { await api('/api/close', 'POST'); setRunning(null); } catch {}
});

// ---- overlay open / close
function currentImage(card){
  const s = card._slider ? card._slider.slides[card._slider.idx] : card._slides[0];
  return s ? getComputedStyle(s.firstElementChild).backgroundImage : 'none';
}
function openOverlay(card, ev, p){
  clearTimeout(cleanupTimer);
  const r = card.getBoundingClientRect();
  const ox = ev && ev.clientX ? ev.clientX : r.left + r.width / 2;
  const oy = ev && ev.clientY ? ev.clientY : r.top + r.height / 2;
  overlay.style.setProperty('--ox', ox + 'px');
  overlay.style.setProperty('--oy', oy + 'px');
  overlay.style.setProperty('--accent', accentOf(p));
  ovBg.style.backgroundImage = currentImage(card);
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  lastFocus = card;
  closeBtn.focus({ preventScroll: true });
}
function closeOverlay(){
  launchToken++;                                            // any in-flight launch stops touching the screen
  detailHero?.querySelectorAll('video').forEach(video => video.pause());
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  clearTimeout(cleanupTimer);
  cleanupTimer = setTimeout(cleanupOverlay, 900);           // after the circle has closed back into the card
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}
function cleanupOverlay(){
  if (overlay.classList.contains('show')) return;
  viewerIframe.src = 'about:blank';                         // stops any sound / video from the site
  viewerFrame.classList.remove('loaded');
  overlay.dataset.view = 'launch';
}
closeBtn.addEventListener('click', closeOverlay);
btnBack.addEventListener('click', closeOverlay);
window.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('show')) closeOverlay(); });
const showView = v => { overlay.dataset.view = v; };

// ---- launch view (programs + "open on main display")
function setProg(v, ms, ease){
  barwrap.style.setProperty('--prog-ms', ms + 'ms');
  barwrap.style.setProperty('--prog-ease', ease || 'ease-out');
  barwrap.style.setProperty('--prog', v);
}
function setLaunchState(state, title, sub){
  panel.dataset.state = state;
  ovTitle.textContent = title; ovSub.textContent = sub;
  btnStop.hidden  = state !== 'running';
  btnBack.hidden  = state === 'working';
  btnRetry.hidden = state !== 'error';
}

async function runLaunch(p){
  const token = ++launchToken;
  currentP = p;
  const isSite = p.action && p.action.type === 'url';
  showView('launch');
  setLaunchState('working', 'Launching ' + p.title, p.cat);
  setProg(0, 0); void barwrap.offsetWidth;
  setProg(.9, 7000, 'cubic-bezier(.1,.8,.25,1)');            // fast start, slow finish — honest about not knowing how long

  const minWait = new Promise(r => setTimeout(r, 1100));      // long enough to read, short enough to feel instant
  try {
    await Promise.all([api('/api/launch/' + encodeURIComponent(appKey(p)), 'POST'), minWait]);
    setRunning(appKey(p));
    if (token !== launchToken) return;
    setProg(1, 320, 'ease-out');
    setLaunchState('running', p.title, isSite ? 'Open on Main Display' : 'Playing on Main Display');
  } catch (err){
    await minWait;
    if (token !== launchToken) return;
    setLaunchState('error', 'Couldn’t start ' + p.title, friendlyError(err));
  }
}
btnRetry.addEventListener('click', () => { if (currentP) runLaunch(currentP); });
btnStop.addEventListener('click', async () => {
  btnStop.disabled = true;
  try { await api('/api/close', 'POST'); setRunning(null); closeOverlay(); }
  catch (err){ setLaunchState('error', 'Couldn’t stop ' + (currentP ? currentP.title : 'the program'), friendlyError(err)); }
  btnStop.disabled = false;
});

// ---- details view
const detailHero = $('detailHero'), detailThumbs = $('detailThumbs');
const btnDetailLaunch = $('btnDetailLaunch');

function selectDetailMedia(index){
  detailHero.querySelectorAll('.layer').forEach((layer, i) => {
    const active = i === index;
    layer.classList.toggle('on', active);
    if (layer.tagName === 'VIDEO' && !active) layer.pause();
  });
  detailThumbs.querySelectorAll('button').forEach((thumb, i) => thumb.classList.toggle('on', i === index));
}

function openDetail(p){
  const list = normSlides(p);
  $('detailTag').innerHTML = (ICONS[p.icon] || '') + esc(p.cat);
  $('detailTitle').textContent = p.title;
  $('detailDesc').textContent = p.desc || p.sub || '';
  $('detailSpecs').innerHTML = (p.specs || []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  document.querySelector('.detail-team')?.remove();
  let team = null;
  if (p.team){
    team = document.createElement('div');
    team.className = 'detail-team';
    team.setAttribute('aria-label', 'Studio team structure');
    const branch = node => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = node.name;
      item.appendChild(label);
      if (Array.isArray(node.children) && node.children.length){
        const children = document.createElement('ul');
        node.children.forEach(child => children.appendChild(branch(child)));
        item.appendChild(children);
      }
      return item;
    };
    const tree = document.createElement('ul');
    tree.appendChild(branch(p.team));
    team.appendChild(tree);
  }

  detailHero.dataset.accent = ACCENT[p.accent] ? p.accent : 'cyan';   // coloured placeholder art when there is no photo
  detailHero.innerHTML = '';
  if (team) detailHero.appendChild(team);
  else if (!list.length){
    const logo = document.createElement('img');
    logo.src = p.tile?.logoSrc || 'public/logo-ui.png';
    logo.alt = p.title;
    logo.className = 'detail-wordmark';
    detailHero.appendChild(logo);
  }
  list.forEach((s, i) => {
    const layer = document.createElement(isVideoSrc(s.src) ? 'video' : 'div');
    layer.className = 'layer' + (i === 0 ? ' on' : '');
    if (layer.tagName === 'VIDEO'){
      layer.src = s.src; layer.controls = true; layer.playsInline = true; layer.preload = 'metadata';
      layer.setAttribute('aria-label', `${p.title} video ${i + 1}`);
    } else {
      layer.style.backgroundImage = cssUrl(s.src);
      if (s.pos) layer.style.backgroundPosition = s.pos;
    }
    detailHero.appendChild(layer);
  });
  detailThumbs.innerHTML = '';
  if (list.length > 1){
    list.forEach((s, i) => {
      const b = document.createElement('button');
      const video = isVideoSrc(s.src);
      b.type = 'button'; b.setAttribute('aria-label', (video ? 'Video ' : 'Image ') + (i + 1));
      if (video) { b.classList.add('video-thumb'); b.innerHTML = '<span aria-hidden="true">▶</span><small>VIDEO</small>'; }
      else b.style.backgroundImage = cssUrl(s.src);
      if (i === 0) b.classList.add('on');
      b.addEventListener('click', () => selectDetailMedia(i));
      detailThumbs.appendChild(b);
    });
  }
  btnDetailLaunch.hidden = !(p.action && p.action.app);
  showView('detail');
}
btnDetailLaunch.addEventListener('click', () => { if (currentP) runLaunch(currentP); });

// ---- website view
const viewerFrame = $('viewerFrame'), viewerIframe = $('viewerIframe'), btnViewerMain = $('btnViewerMain');
viewerIframe.addEventListener('load', () => { if (viewerIframe.getAttribute('src') !== 'about:blank') viewerFrame.classList.add('loaded'); });

function openViewer(p){
  $('viewerTitle').textContent = p.title;
  btnViewerMain.hidden = !(p.action && p.action.app);
  viewerFrame.classList.remove('loaded');
  showView('viewer');
  // start loading once the circle has mostly opened, so the page load can't stutter the reveal
  const token = launchToken;
  setTimeout(() => { if (token === launchToken && overlay.classList.contains('show')) viewerIframe.src = p.action.url; }, reduceMotion ? 0 : 500);
}
btnViewerMain.addEventListener('click', () => { if (currentP) runLaunch(currentP); });

// ---- what a tap on a card does
function activate(card, ev){
  const p = byId.get(card.dataset.id); if (!p) return;
  const a = p.action || { type: 'detail' };
  currentP = p;
  openOverlay(card, ev, p);
  if (a.type === 'exe' || (a.type === 'url' && a.open === 'main')) runLaunch(p);
  else if (a.type === 'url') openViewer(p);
  else openDetail(p);
}

// ---------------------------------------------------------------- 7. kiosk extras
// idle: nobody touched the screen → close details / websites, leave edit mode.
// (A program that is playing stays up — that's the point of the visit.)
let idleTimer = 0;
function onIdle(){
  if (editing) setEditing(false);
  const showing = overlay.classList.contains('show');
  const playing = overlay.dataset.view === 'launch' && panel.dataset.state === 'running';
  if (showing && !playing) closeOverlay();
  if (CFG.resetSlidesOnIdle !== false) sliders.forEach(slider => slider.reset());
}
function poke(){
  clearTimeout(idleTimer);
  if (CFG.idleSeconds > 0) idleTimer = setTimeout(onIdle, CFG.idleSeconds * 1000);
}
['pointerdown', 'pointermove', 'keydown', 'wheel'].forEach(t => window.addEventListener(t, poke, { passive: true }));
poke();

let cursorHideTimer = 0;
function wakePointer(){
  if (CFG.hideIdleCursor === false) return;
  document.body.classList.remove('cursor-hidden');
  clearTimeout(cursorHideTimer);
  cursorHideTimer = setTimeout(() => document.body.classList.add('cursor-hidden'), 3000);
}
if (CFG.hideIdleCursor !== false){
  window.addEventListener('pointermove', wakePointer, { passive:true });
  window.addEventListener('pointerdown', wakePointer, { passive:true });
  wakePointer();
}

// keyboard shortcut: Ctrl+Shift+A opens Admin Panel
window.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a'){
    e.preventDefault();
    window.location.href = 'admin.html';
  }
});

// Hold the logo to show or hide the icon-only maintenance controls.
const brand = $('brand');
let holdT = 0, toolHideT = 0;
function setToolsVisible(visible, autoHide = true){
  const tools = $('tools');
  if (!visible && tools.contains(document.activeElement)) brand.focus({ preventScroll:true });
  document.body.classList.toggle('tools-open', visible);
  brand.setAttribute('aria-pressed', String(visible));
  tools.setAttribute('aria-hidden', String(!visible));
  tools.inert = !visible;
  clearTimeout(toolHideT);
  if (visible && autoHide){
    toolHideT = setTimeout(() => {
      if (!editing) setToolsVisible(false, false);
    }, clamp(parseInt(CFG.toolRevealSeconds, 10) || 15, 5, 60) * 1000);
  }
}
function toggleTools(){
  const visible = !document.body.classList.contains('tools-open');
  if (!visible && editing) setEditing(false);
  setToolsVisible(visible);
}
function beginBrandHold(){
  clearTimeout(holdT);
  brand.classList.add('is-holding');
  holdT = setTimeout(() => {
    brand.classList.remove('is-holding');
    toggleTools();
  }, clamp(parseFloat(CFG.kioskHoldSeconds) || 2, .5, 5) * 1000);
}
function cancelBrandHold(){
  clearTimeout(holdT);
  brand.classList.remove('is-holding');
}
brand.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  beginBrandHold();
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => brand.addEventListener(t, cancelBrandHold));
brand.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && !event.repeat){ event.preventDefault(); beginBrandHold(); }
});
brand.addEventListener('keyup', event => {
  if (event.key === 'Enter' || event.key === ' '){ event.preventDefault(); cancelBrandHold(); }
});

// Server-sent updates make admin changes appear without a manual refresh.
if (HELPER && window.EventSource){
  const liveUpdates = new EventSource('/api/events');
  let liveReloadT = 0;
  liveUpdates.addEventListener('config-updated', () => {
    clearTimeout(liveReloadT);
    liveReloadT = setTimeout(() => location.reload(), 120);
  });
}

// ---------------------------------------------------------------- 8. intro ripple
(function intro(){
  if (reduceMotion || CFG.introAnimation === false || !allCards().length){ document.body.classList.remove('is-intro'); return; }
  const gr = grid.getBoundingClientRect();
  let maxDelay = 0;
  allCards().forEach(c => {
    const r = c.getBoundingClientRect();
    const fx = (r.left - gr.left) / gr.width, fy = (r.top - gr.top) / gr.height;
    const delay = Math.round(120 + (fx * .55 + fy * .45) * 640);
    c.style.setProperty('--intro-delay', delay + 'ms');
    maxDelay = Math.max(maxDelay, delay);
  });
  setTimeout(() => document.body.classList.remove('is-intro'), maxDelay + 1900);
})();

})();
