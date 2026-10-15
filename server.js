#!/usr/bin/env node
// ================================================================
// Vastuchitra PC helper
//
//  • serves the launcher (index.html, css/, js/, assets/) on http://localhost:4000
//  • starts / stops the programs listed in apps.json when a card asks for them
//
// Install dependencies once with npm install, then run node server.js.
//
// Safety: it listens on this PC only, and the page can only send an ID.
// It never receives a file path — every program it can start is written in apps.json.
// ================================================================
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const sharp = require('sharp');
const { spawn, exec } = require('child_process');

const vm = require('vm');
const { parseRange } = require('./js/http-range.cjs');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = '127.0.0.1';
const ROOT = __dirname;
const IS_WIN = process.platform === 'win32';
const liveClients = new Set();
const MEDIA_CONFIG_FILE = path.join(ROOT, 'media-config.json');
const DEFAULT_MEDIA_CONFIG = { rootPath: 'assets', mirrorPath: '', collisionPolicy: 'rename' };
const MEDIA_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.tif', '.tiff', '.pdf',
  '.mp4', '.webm', '.mov', '.m4v', '.mkv', '.avi', '.ogv'
]);
let mediaWatcher = null;
let mediaWatchTimer = null;
let mirrorTimer = null;
let previewQueue = Promise.resolve();

function broadcastLiveUpdate(type, payload = {}){
  const packet = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  liveClients.forEach(res => {
    try { res.write(packet); } catch { liveClients.delete(res); }
  });
}

function loadMediaConfig(){
  try {
    return Object.assign({}, DEFAULT_MEDIA_CONFIG, JSON.parse(fs.readFileSync(MEDIA_CONFIG_FILE, 'utf8')));
  } catch { return Object.assign({}, DEFAULT_MEDIA_CONFIG); }
}

function saveMediaConfig(config){
  const next = {
    rootPath: String(config.rootPath || 'assets').trim() || 'assets',
    mirrorPath: String(config.mirrorPath || '').trim(),
    collisionPolicy: ['rename', 'replace', 'skip'].includes(config.collisionPolicy) ? config.collisionPolicy : 'rename'
  };
  fs.writeFileSync(MEDIA_CONFIG_FILE, JSON.stringify(next, null, 2) + '\n', 'utf8');
  ensureMediaRoot(next);
  startMediaWatcher();
  return next;
}

function resolveConfiguredPath(value){
  return path.resolve(path.isAbsolute(value || '') ? value : path.join(ROOT, value || 'assets'));
}

function getMediaRoot(){ return resolveConfiguredPath(loadMediaConfig().rootPath); }

function ensureMediaRoot(config = loadMediaConfig()){
  const root = resolveConfiguredPath(config.rootPath);
  fs.mkdirSync(root, { recursive: true });
  if (config.mirrorPath) fs.mkdirSync(resolveConfiguredPath(config.mirrorPath), { recursive: true });
  return root;
}

function safeRelative(value = ''){
  const normalized = String(value).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!normalized || normalized === '.') return '';
  if (normalized.split('/').some(part => !part || part === '.' || part === '..')) throw httpError(400, 'Invalid media path');
  return normalized;
}

function mediaPath(relative = ''){
  const root = ensureMediaRoot();
  const rel = safeRelative(relative);
  const target = path.resolve(root, rel);
  if (target !== root && !target.startsWith(root + path.sep)) throw httpError(403, 'Media path is outside the configured library');
  return target;
}

function uniqueTarget(folder, filename){
  const ext = path.extname(filename);
  const stem = path.basename(filename, ext);
  let candidate = path.join(folder, filename);
  let index = 1;
  while (fs.existsSync(candidate)) candidate = path.join(folder, `${stem}_${index++}${ext}`);
  return candidate;
}

function copyDirectory(source, target){
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })){
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function syncMirror(){
  const config = loadMediaConfig();
  if (!config.mirrorPath) return;
  const source = ensureMediaRoot(config);
  const target = resolveConfiguredPath(config.mirrorPath);
  if (source === target || target.startsWith(source + path.sep)) return;
  try { copyDirectory(source, target); }
  catch (error){ console.error('  ! Media mirror:', error.message); }
}

function notifyMediaChanged(){
  clearTimeout(mediaWatchTimer);
  mediaWatchTimer = setTimeout(() => broadcastLiveUpdate('assets-updated', { changedAt: Date.now() }), 180);
  clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(syncMirror, 500);
}

function startMediaWatcher(){
  if (mediaWatcher){ try { mediaWatcher.close(); } catch {} mediaWatcher = null; }
  const root = ensureMediaRoot();
  try { mediaWatcher = fs.watch(root, { recursive: true }, notifyMediaChanged); }
  catch (error){ console.error('  ! Media folder watcher:', error.message); }
}

// ---------------------------------------------------------------- apps.json & projects.js
function loadApps(){
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'apps.json'), 'utf8')); }   // re-read every time: edit it without restarting
  catch (e){ console.error('  ! apps.json:', e.message); return {}; }
}

function saveApps(data){
  const filePath = path.join(ROOT, 'apps.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function loadProjectsConfig(){
  try {
    const code = fs.readFileSync(path.join(ROOT, 'js', 'projects.js'), 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.window.VASTUCHITRA || { settings: {}, projects: [] };
  } catch (e){
    console.error('  ! js/projects.js load error:', e.message);
    return { settings: { columns: 6, rows: 4, idleSeconds: 120, kiosk: false }, projects: [] };
  }
}

function saveProjectsConfig(config){
  const settings = Object.assign({ columns: 6, rows: 4, idleSeconds: 120, kiosk: false }, config.settings);
  const projects = Array.isArray(config.projects) ? config.projects : [];

  const fileContent = `// ================================================================
// Vastuchitra — content & behaviour.
// Generated via Vastuchitra Admin Panel
// ================================================================
window.VASTUCHITRA = {

  settings: ${JSON.stringify(settings, null, 4)},

  projects: ${JSON.stringify(projects, null, 4)}
};
`;
  fs.writeFileSync(path.join(ROOT, 'js', 'projects.js'), fileContent, 'utf8');
}

function getAssetsList(){
  const root = ensureMediaRoot();
  const items = [];
  const walk = (dir, relative = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })){
      if (entry.name.startsWith('.')) continue;
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()){
        items.push({ name: entry.name, relativePath: rel, kind: 'folder', path: `/media/${rel.split('/').map(encodeURIComponent).join('/')}` });
        walk(absolute, rel);
      } else if (entry.isFile() && MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase())){
        const st = fs.statSync(absolute);
        const ext = path.extname(entry.name).toLowerCase();
        const isVideo = ['.mp4','.webm','.mov','.m4v','.mkv','.avi','.ogv'].includes(ext);
        const isPdf = ext === '.pdf';
        const isTiff = ext === '.tif' || ext === '.tiff';
        const item = {
          name: entry.name, relativePath: rel, kind: 'file', mediaType: isVideo ? 'video' : isPdf ? 'pdf' : 'image',
          sizeBytes: st.size, modifiedAt: st.mtimeMs, path: `/media/${rel.split('/').map(encodeURIComponent).join('/')}`
        };
        if (isTiff){
          item.originalFormat = 'tiff';
          item.thumbnailPath = `/api/media-preview?path=${encodeURIComponent(rel)}&mode=thumb`;
          item.previewPath = `/api/media-preview?path=${encodeURIComponent(rel)}&mode=full`;
        }
        items.push(item);
      }
    }
  };
  walk(root);
  return items.sort((a, b) => a.kind === b.kind ? a.relativePath.localeCompare(b.relativePath) : a.kind === 'folder' ? -1 : 1);
}

function ensureTiffPreview(relativePath, mode = 'thumb'){
  const task = async () => {
    const rel = safeRelative(relativePath);
    const source = mediaPath(rel);
    const ext = path.extname(source).toLowerCase();
    if (!['.tif', '.tiff'].includes(ext)) throw httpError(400, 'Preview conversion is only available for TIF/TIFF files.');
    const sourceStat = fs.statSync(source);
    const libraryKey = crypto.createHash('sha1').update(getMediaRoot().toLowerCase()).digest('hex').slice(0,12);
    const cacheRoot = path.join(os.tmpdir(), 'vastuchitra-media-previews', libraryKey);
    fs.mkdirSync(cacheRoot, { recursive:true });
    const fingerprint = crypto.createHash('sha1').update(rel.toLowerCase()).digest('hex');
    const target = path.join(cacheRoot, `${fingerprint}-${mode === 'full' ? 'full' : 'thumb'}.png`);
    if (fs.existsSync(target) && fs.statSync(target).mtimeMs >= sourceStat.mtimeMs) return target;
    const temp = `${target}.upload-${process.pid}-${Date.now()}`;
    try {
      // Large architectural TIFFs commonly contain strips/tiles above libvips'
      // conservative default allocation guard. `unlimited` only relaxes that
      // decoder guard for this local, user-selected media library; previews are
      // still serialized by previewQueue so multiple huge files cannot fan out.
      let pipeline = sharp(source, { page:0, limitInputPixels:false, sequentialRead:true, unlimited:true }).keepMetadata();
      if (mode !== 'full') pipeline = pipeline.resize({ width:1280, height:960, fit:'inside', withoutEnlargement:true });
      await pipeline.png({ compressionLevel:9, bitdepth:mode === 'full' ? 16 : 8 }).toFile(temp);
      if (fs.existsSync(target)) fs.unlinkSync(target);
      fs.renameSync(temp, target);
    } catch (error){
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
      throw error;
    }
    return target;
  };
  const result = previewQueue.then(task, task);
  previewQueue = result.catch(() => {});
  return result;
}

// ---------------------------------------------------------------- running program
// current = { id, pid, exited, startedAt, stopImage }
let current = null;
const GRACE_MS = 15000;      // packaged Unreal builds start a small launcher that hands over to the real .exe and quits

const run = cmd => new Promise(resolve => exec(cmd, { windowsHide: true }, () => resolve()));
const safeImage = s => /^[\w.\- ]+$/.test(s);

function imageRunning(image){
  return new Promise(resolve => {
    if (!safeImage(image)) return resolve(false);
    const cmd = IS_WIN ? `tasklist /FI "IMAGENAME eq ${image}" /NH` : `pgrep -x "${image}"`;
    exec(cmd, { windowsHide: true }, (err, out) => {
      resolve(IS_WIN ? (!err && out.toLowerCase().includes(image.toLowerCase())) : !err);
    });
  });
}

async function status(){
  const c = current;
  if (!c) return { running: null };
  let alive = !c.exited;
  if (!alive && c.stopImage){
    alive = (Date.now() - c.startedAt < GRACE_MS) || await imageRunning(c.stopImage);
  }
  if (!alive){ if (current === c) current = null; return { running: null }; }
  return { running: c.id, since: c.startedAt };
}

async function stopCurrent(){
  const c = current; current = null;
  if (!c) return;
  const jobs = [];
  if (IS_WIN){
    if (c.pid && !c.exited) jobs.push(run(`taskkill /PID ${c.pid} /T /F`));
    if (c.stopImage && safeImage(c.stopImage)) jobs.push(run(`taskkill /IM "${c.stopImage}" /T /F`));
  } else {
    try { process.kill(-c.pid, 'SIGTERM'); } catch {}
    if (c.stopImage && safeImage(c.stopImage)) jobs.push(run(`pkill -x "${c.stopImage}"`));
  }
  await Promise.all(jobs);
}

function httpError(code, message){ return Object.assign(new Error(message), { code }); }

function findBrowser(){
  if (!IS_WIN) return 'google-chrome';
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const local = process.env['LOCALAPPDATA'] || '';
  return [
    path.join(pf, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(pf86, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(local, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(pf86, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(pf, 'Microsoft\\Edge\\Application\\msedge.exe')
  ].find(p => fs.existsSync(p)) || 'chrome.exe';
}

async function launch(id){
  const def = loadApps()[id];
  if (!def) throw httpError(404, `“${id}” isn’t listed in apps.json.`);

  let file, args, cwd;
  if (def.exe){
    file = def.exe; args = def.args || []; cwd = def.cwd || (path.isAbsolute(file) ? path.dirname(file) : undefined);
  } else if (def.url){
    // a website on the main display: its own browser profile, so we can close exactly this window later
    file = def.browser || findBrowser();
    args = ['--user-data-dir=' + path.join(os.tmpdir(), 'vastuchitra-' + id), '--no-first-run', '--new-window', ...(def.args || []), def.url];
  } else {
    throw httpError(400, `“${id}” in apps.json needs either "exe" or "url".`);
  }
  if (path.isAbsolute(file) && !fs.existsSync(file)) throw httpError(404, `Program not found: ${file}`);

  await stopCurrent();                                       // one thing on the main display at a time

  const child = spawn(file, args, { cwd, detached: true, stdio: 'ignore', windowsHide: false });
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', e => reject(httpError(500, `Couldn’t start it (${e.code || e.message}).`)));
  });
  child.unref();

  const c = current = { id, pid: child.pid, exited: false, startedAt: Date.now(), stopImage: def.stopImage || null };
  child.once('exit', () => { c.exited = true; if (!c.stopImage && current === c) current = null; });
  // GUI apps (notably Unreal projects) can take several seconds to create their
  // window. Bring that window forward only after it exists, so the launcher
  // doesn't remain on top or steal focus back during startup.
  if (IS_WIN) focusLaunchedWindow(child.pid, def);
  console.log(`  ▶ started ${id}`);
  return { running: id };
}

function focusLaunchedWindow(pid, options = {}){
  const helper = path.join(ROOT, 'focus-launched-window.ps1');
  if (!fs.existsSync(helper)) return;
  const focus = spawn('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', helper,
    '-ProcessId', String(pid),
    '-WindowMode', ['maximized', 'normal', 'minimized'].includes(options.windowMode) ? options.windowMode : 'maximized',
    '-Resolution', typeof options.resolution === 'string' ? options.resolution : 'native',
    '-ResolutionWidth', String(Number(options.resolutionWidth) || 1920),
    '-ResolutionHeight', String(Number(options.resolutionHeight) || 1080),
    '-DisplayTarget', options.displayTarget === 'secondary' ? 'secondary' : 'primary'
  ], { detached: true, stdio: 'ignore', windowsHide: true });
  focus.once('error', err => console.warn(`  ! couldn’t activate launched window: ${err.message}`));
  focus.unref();
}

// ---------------------------------------------------------------- http
const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.avif':'image/avif', '.gif':'image/gif', '.svg':'image/svg+xml', '.tif':'image/tiff', '.tiff':'image/tiff',
  '.pdf':'application/pdf',
  '.mp4':'video/mp4', '.webm':'video/webm', '.mov':'video/quicktime', '.m4v':'video/x-m4v', '.mkv':'video/x-matroska', '.avi':'video/x-msvideo', '.ogv':'video/ogg',
  '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf', '.ico':'image/x-icon'
};
const PUBLIC_TOP = new Set(['index.html', 'meeting.html', 'admin.html', 'css', 'js', 'assets', 'public']);

function json(res, code, body){
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function parseJsonBody(req){
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err){
        reject(httpError(400, 'Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res){
  let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return json(res, 400, { error: 'Bad request' }); }
  if (p === '/') p = '/index.html';
  if (p === '/media' || p.startsWith('/media/')){
    let file;
    try { file = mediaPath(p.replace(/^\/media\/?/, '')); }
    catch (error){ return json(res, error.code || 400, { error: error.message }); }
    return fs.stat(file, (err, st) => {
      if (err || !st.isFile()) return json(res, 404, { error: 'Media not found' });
      const ext = path.extname(file).toLowerCase();
      const range = parseRange(req.headers.range, st.size);
      if (range === false){
          res.writeHead(416, { 'Content-Range':`bytes */${st.size}` }); return res.end();
      }
      if (range){
        const { start, end } = range;
        res.writeHead(206, { 'Content-Type':MIME[ext] || 'application/octet-stream', 'Content-Length':end-start+1, 'Content-Range':`bytes ${start}-${end}/${st.size}`, 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache' });
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    });
  }
  const rel = path.normalize(p).replace(/^([/\\])+/, '');
  const topSegment = rel.split(/[\\/]/)[0];
  if (!PUBLIC_TOP.has(topSegment)) return json(res, 404, { error: 'Not found' });
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, rel)) return json(res, 403, { error: 'Forbidden' });

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return json(res, 404, { error: 'Not found' });
    const ext = path.extname(file).toLowerCase();
    const isText = ['.html', '.css', '.js', '.json'].includes(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': isText ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(file).pipe(res);
  });
}

function streamUpload(req, res){
  const config = loadMediaConfig();
  let rawName;
  try { rawName = decodeURIComponent(String(req.headers['x-file-name'] || '')); }
  catch { return json(res, 400, { error: 'Invalid upload filename encoding' }); }
  const filename = path.basename(rawName).replace(/[^a-zA-Z0-9(). _\-]/g, '_');
  const ext = path.extname(filename).toLowerCase();
  if (!filename || !MEDIA_EXTENSIONS.has(ext)) return json(res, 400, { error: 'Choose a supported image, video, or PDF file.' });
  let relativeFolder = '';
  try { relativeFolder = safeRelative(decodeURIComponent(String(req.headers['x-media-folder'] || ''))); }
  catch (error){ return json(res, error.code || 400, { error: error.message }); }
  const folder = mediaPath(relativeFolder);
  fs.mkdirSync(folder, { recursive: true });
  const requested = path.join(folder, filename);
  const policy = ['rename', 'replace', 'skip'].includes(String(req.headers['x-collision-policy'])) ? String(req.headers['x-collision-policy']) : config.collisionPolicy;
  if (policy === 'skip' && fs.existsSync(requested)) return json(res, 200, { success:true, skipped:true, filename, path:`/media/${relativeFolder ? relativeFolder + '/' : ''}${filename}` });
  const target = policy === 'rename' ? uniqueTarget(folder, filename) : requested;
  const temp = `${target}.upload-${process.pid}-${Date.now()}`;
  const out = fs.createWriteStream(temp, { flags:'wx' });
  let bytes = 0;
  let settled = false;
  const fail = error => {
    if (settled) return;
    settled = true;
    try { out.destroy(); } catch {}
    try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch {}
    json(res, 500, { error:`Upload could not be saved: ${error.message}` });
  };
  req.on('data', chunk => { bytes += chunk.length; });
  req.on('aborted', () => fail(new Error('Connection interrupted')));
  req.on('error', fail);
  out.on('error', fail);
  out.on('finish', () => {
    if (settled) return;
    try {
      if (policy === 'replace' && fs.existsSync(target)) fs.unlinkSync(target);
      fs.renameSync(temp, target);
      settled = true;
      const rel = path.relative(getMediaRoot(), target).split(path.sep).join('/');
      notifyMediaChanged();
      console.log(`  ★ Media uploaded: ${rel} (${bytes} bytes)`);
      const isVideo = ['.mp4','.webm','.mov','.m4v','.mkv','.avi','.ogv'].includes(ext);
      const isPdf = ext === '.pdf';
      const result = { success:true, filename:path.basename(target), relativePath:rel, path:`/media/${rel.split('/').map(encodeURIComponent).join('/')}`, sizeBytes:bytes, mediaType:isVideo ? 'video' : isPdf ? 'pdf' : 'image' };
      if (ext === '.tif' || ext === '.tiff'){
        result.thumbnailPath = `/api/media-preview?path=${encodeURIComponent(rel)}&mode=thumb`;
        result.previewPath = `/api/media-preview?path=${encodeURIComponent(rel)}&mode=full`;
        ensureTiffPreview(rel, 'thumb').then(() => broadcastLiveUpdate('assets-updated', { changedAt:Date.now(), previewReady:true })).catch(error => console.error('  ! TIF preview:', error.message));
      }
      json(res, 200, result);
    } catch (error){ fail(error); }
  });
  req.pipe(out);
}

const server = http.createServer(async (req, res) => {
  // only ever answer requests addressed to this PC (blocks DNS-rebinding tricks)
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) return json(res, 403, { error: 'Forbidden' });

  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')){
    try {
      if (req.method === 'GET' && url.pathname === '/api/events'){
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive'
        });
        res.write('retry: 1200\n\n');
        liveClients.add(res);
        const heartbeat = setInterval(() => {
          try { res.write(': keep-alive\n\n'); } catch { clearInterval(heartbeat); liveClients.delete(res); }
        }, 20000);
        req.on('close', () => { clearInterval(heartbeat); liveClients.delete(res); });
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/state') return json(res, 200, await status());
      
      // Admin API: fetch full configuration
      if (req.method === 'GET' && url.pathname === '/api/config'){
        const pcfg = loadProjectsConfig();
        const apps = loadApps();
        const assets = getAssetsList();
        return json(res, 200, {
          settings: pcfg.settings || {},
          projects: pcfg.projects || [],
          apps,
          assets,
          mediaConfig: loadMediaConfig()
        });
      }

      // Admin API: list assets
      if (req.method === 'GET' && url.pathname === '/api/assets'){
        return json(res, 200, { assets: getAssetsList(), mediaConfig: loadMediaConfig() });
      }

      if (req.method === 'GET' && url.pathname === '/api/media-preview'){
        const mode = url.searchParams.get('mode') === 'full' ? 'full' : 'thumb';
        const file = await ensureTiffPreview(url.searchParams.get('path') || '', mode);
        const st = fs.statSync(file);
        res.writeHead(200, { 'Content-Type':'image/png', 'Content-Length':st.size, 'Cache-Control':'private, max-age=86400' });
        return fs.createReadStream(file).pipe(res);
      }

      if (req.method === 'GET' && url.pathname === '/api/media-config') return json(res, 200, loadMediaConfig());

      // anything that changes state must carry our header — a random website in the browser can't add it
      if (req.method !== 'POST' || req.headers['x-requested-with'] !== 'vastuchitra') return json(res, 403, { error: 'Forbidden' });

      if (url.pathname === '/api/upload-media') return streamUpload(req, res);

      if (url.pathname === '/api/media-config'){
        const payload = await parseJsonBody(req);
        const config = saveMediaConfig(payload);
        broadcastLiveUpdate('assets-updated', { changedAt:Date.now(), storageChanged:true });
        return json(res, 200, { success:true, mediaConfig:config, assets:getAssetsList() });
      }

      if (url.pathname === '/api/media/create-folder'){
        const payload = await parseJsonBody(req);
        const parent = safeRelative(payload.parent || '');
        const name = String(payload.name || '').trim().replace(/[<>:"/\\|?*]/g, '_').replace(/^\.+|\.+$/g, '');
        if (!name) throw httpError(400, 'Enter a folder name.');
        const target = mediaPath(parent ? `${parent}/${name}` : name);
        if (fs.existsSync(target)) throw httpError(409, 'A folder with that name already exists.');
        fs.mkdirSync(target, { recursive:true });
        notifyMediaChanged();
        return json(res, 200, { success:true });
      }

      if (url.pathname === '/api/media/delete'){
        const payload = await parseJsonBody(req);
        const paths = Array.isArray(payload.paths) ? payload.paths.map(safeRelative) : [];
        for (const rel of paths.sort((a,b) => b.length - a.length)){
          const target = mediaPath(rel);
          if (target === getMediaRoot()) continue;
          if (fs.existsSync(target)) fs.rmSync(target, { recursive:true, force:true });
        }
        notifyMediaChanged();
        return json(res, 200, { success:true, deleted:paths.length });
      }

      if (url.pathname === '/api/media/move'){
        const payload = await parseJsonBody(req);
        const paths = Array.isArray(payload.paths) ? payload.paths.map(safeRelative) : [];
        const destination = safeRelative(payload.destination || '');
        const destinationDir = mediaPath(destination);
        fs.mkdirSync(destinationDir, { recursive:true });
        const policy = ['rename','replace','skip'].includes(payload.collisionPolicy) ? payload.collisionPolicy : loadMediaConfig().collisionPolicy;
        let moved = 0, skipped = 0;
        for (const rel of paths){
          const source = mediaPath(rel);
          if (!fs.existsSync(source) || source === destinationDir || destinationDir.startsWith(source + path.sep)){ skipped++; continue; }
          let target = path.join(destinationDir, path.basename(source));
          if (fs.existsSync(target)){
            if (policy === 'skip'){ skipped++; continue; }
            if (policy === 'rename') target = uniqueTarget(destinationDir, path.basename(source));
            else fs.rmSync(target, { recursive:true, force:true });
          }
          fs.renameSync(source, target); moved++;
        }
        notifyMediaChanged();
        return json(res, 200, { success:true, moved, skipped });
      }

      // Admin API: save full configuration
      if (url.pathname === '/api/config'){
        const payload = await parseJsonBody(req);
        if (payload.settings && payload.projects){
          saveProjectsConfig({ settings: payload.settings, projects: payload.projects });
        }
        if (payload.apps && typeof payload.apps === 'object'){
          saveApps(payload.apps);
        }
        console.log('  ★ Configuration saved via Admin Panel');
        broadcastLiveUpdate('config-updated', { savedAt: Date.now() });
        return json(res, 200, { success: true, message: 'Configuration saved successfully' });
      }

      // Legacy single-item delete.
      if (url.pathname === '/api/delete-asset'){
        const payload = await parseJsonBody(req);
        const filename = safeRelative(String(payload.relativePath || payload.filename || ''));
        const targetPath = mediaPath(filename);
        if (fs.existsSync(targetPath)){
          fs.rmSync(targetPath, { recursive:true, force:true });
          console.log(`  ★ Asset deleted: ${filename}`);
        }
        notifyMediaChanged();
        return json(res, 200, { success: true });
      }

      // Admin API: check if exe/path exists on disk
      if (url.pathname === '/api/test-path'){
        const payload = await parseJsonBody(req);
        const testPath = String(payload.path || '').trim();
        const exists = testPath ? fs.existsSync(testPath) : false;
        return json(res, 200, { path: testPath, exists });
      }

      // The browser intentionally cannot expose a dropped file's full local
      // path. Use a native picker so selected executables can be launched
      // directly without copying large applications into the project folder.
      if (url.pathname === '/api/pick-exe'){
        await parseJsonBody(req);
        if (!IS_WIN) return json(res, 501, { error: 'The local executable picker is available on Windows only.' });
        const pickerScript = [
          'Add-Type -AssemblyName System.Windows.Forms',
          '$dialog = New-Object System.Windows.Forms.OpenFileDialog',
          "$dialog.Filter = 'Applications (*.exe)|*.exe'",
          "$dialog.Title = 'Choose a launcher program'",
          'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Write($dialog.FileName) }'
        ].join('; ');
        const selectedPath = await new Promise((resolve, reject) => {
          const picker = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-STA', '-Command', pickerScript], { windowsHide: true });
          let output = '';
          let error = '';
          picker.stdout.setEncoding('utf8');
          picker.stderr.setEncoding('utf8');
          picker.stdout.on('data', chunk => { output += chunk; });
          picker.stderr.on('data', chunk => { error += chunk; });
          picker.once('error', reject);
          picker.once('close', code => code === 0 ? resolve(output.trim()) : reject(new Error(error.trim() || 'Could not open the executable picker.')));
        });
        return json(res, 200, { path: selectedPath || null });
      }

      const m = url.pathname.match(/^\/api\/launch\/([\w.\-]+)$/);
      if (m) return json(res, 200, await launch(m[1]));
      if (url.pathname === '/api/close'){ await stopCurrent(); console.log('  ■ stopped'); return json(res, 200, { running: null }); }
      return json(res, 404, { error: 'Unknown request' });
    } catch (e){
      console.error('  ! ' + e.message);
      return json(res, e.code >= 400 && e.code < 600 ? e.code : 500, { error: e.message });
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
  serveStatic(req, res);
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`\n  Port ${PORT} is already in use — the helper is probably already running.\n`);
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  startMediaWatcher();
  console.log(`\n  Vastuchitra helper is running\n  → http://localhost:${PORT}\n`);
});
