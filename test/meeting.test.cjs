'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const code = fs.readFileSync(path.join(__dirname, '../js/meeting.js'), 'utf8');
const media = fs.readFileSync(path.join(__dirname, '../js/portable-media.js'), 'utf8');
const client = fs.readFileSync(path.join(__dirname, '../js/client.js'), 'utf8');
function load(search, meeting, hostname = 'localhost', protocol = 'http:', savedConfig = null) {
  const original = { settings: { columns: 4 }, projects: [{ id: 'saved' }] };
  const sandbox = {
    URLSearchParams, location: { search, hostname, protocol }, window: { VASTUCHITRA: original },
    localStorage: { getItem: () => JSON.stringify(savedConfig) },
    document: { documentElement: { dataset: { meeting } }, body: { classList: { add() {} } },
      createElement: () => ({}), querySelector: () => ({ appendChild() {} }) }
  };
  vm.runInNewContext(media + '\n' + client + '\n' + code, sandbox);
  return { config: sandbox.window.VASTUCHITRA, original };
}
test('normal launcher starts with the showcase and keeps its saved PC projects', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    const { config, original } = load('', undefined, host);
    assert.equal(config.projects[0].id, 'meeting-selected');
    assert.equal(config.projects.length, 19);
    assert.equal(config.projects.at(-1), original.projects[0]);
    assert.equal(config.settings.meetingPreview, undefined);
  }
});
test('remote index pages automatically use bundled images without PC helper calls', () => {
  for (const host of ['vastuchitraa.vercel.app', 'vastuchitra-meeting.vercel.app', 'showcase.example.com']) {
    const { config } = load('', undefined, host, 'https:');
    assert.equal(config.settings.meetingPreview, true);
    assert.equal(config.settings.showAdmin, true);
    assert.equal(config.settings.showTools, false);
    assert.equal(config.projects.length, 34);
    assert.ok(config.projects.every(p => p.slides.length && p.slides.every(s => s.src.startsWith('/public/'))));
  }
});
test('web Admin edits preserve logo-hold access to the header controls', () => {
  const saved = { settings: { showAdmin:false, showTools:true }, projects:[{ id:'edited', title:'Updated studio title' }] };
  const { config } = load('', undefined, 'vastuchitraa.vercel.app', 'https:', saved);
  assert.equal(config.projects[0].title, 'Updated studio title');
  assert.equal(config.settings.meetingPreview, true);
  assert.equal(config.settings.showAdmin, true);
  assert.equal(config.settings.showTools, false);
});

test('legacy Personal mode migrates to Heritage without losing temple projects', () => {
  const temples = [{ id:'temple-kept', title:'Saved temple' }];
  const saved = { settings:{ presentationMode:'personal' }, projects:[], heritageProjects:temples };
  const { config } = load('', undefined, 'showcase.example.com', 'https:', saved);
  assert.equal(config.settings.presentationMode, 'heritage');
  assert.equal(config.heritageProjects[0].id, 'temple-kept');
  assert.equal(config.personalProjects.length, 22);
  assert.ok(config.personalProjects.every(p => p.id.startsWith('sadhna-')));
});

test('new Personal collection and intentionally empty collections survive reloads', () => {
  for (const projects of [[], [{ id:'my-work', title:'My work' }]]){
    const saved = { settings:{ presentationMode:'personal', catalogModesVersion:1, clientCatalogVersion:1, clientExperienceVersion:1 }, projects:[], personalProjects:projects };
    const { config } = load('', undefined, 'showcase.example.com', 'https:', saved);
    assert.equal(config.settings.presentationMode, 'personal');
    assert.deepEqual(JSON.parse(JSON.stringify(config.personalProjects)), projects);
  }
});

test('Client covers all requested experiences and keeps custom cards during starter migration', () => {
  const custom = {id:'client-custom',title:'Saved client work',slides:[]};
  const saved = {settings:{presentationMode:'personal',catalogModesVersion:1},projects:[],personalProjects:[custom]};
  const {config} = load('',undefined,'showcase.example.com','https:',saved);
  for (const kind of ['overview','rera','renders','film','ar','vr','projection','balcony','documents','360','people','camera','tools','partners','green','balcony-simulator','design-intent','mep']){
    assert.ok(config.personalProjects.some(p => p.clientKind === kind),kind);
  }
  assert.ok(config.personalProjects.some(p => p.id === custom.id));
  assert.equal(config.settings.clientCatalogVersion,1);
  assert.equal(new Set(config.personalProjects.map(p => p.id)).size,config.personalProjects.length);
  assert.ok(config.personalProjects.filter(p=>p.clientKind === 'colour').every(p=>p.action.type === 'none' && p.tile.showTitle === false));
  for (const slide of config.personalProjects.flatMap(p=>p.slides || [])){
    assert.ok(fs.existsSync(path.join(__dirname,'..',slide.src)));
  }
});

test('Client exhibition composition has no overlapping tiles or empty cells', () => {
  const {config} = load('',undefined,'showcase.example.com','https:');
  const occupied = new Set();
  for (const project of config.personalProjects){
    const {col,row} = project.canvasPosition;
    const [width,height] = project.size;
    assert.ok(col + width <= 8);
    for (let y=row;y<row+height;y++) for (let x=col;x<col+width;x++){
      const key = `${x},${y}`;
      assert.equal(occupied.has(key),false,project.id);
      occupied.add(key);
    }
  }
  assert.equal(occupied.size,80);
});

test('Client redesign preserves custom titles and sizes', () => {
  const saved = {settings:{presentationMode:'personal',catalogModesVersion:1,clientCatalogVersion:1},projects:[],personalProjects:[{id:'sadhna-ar',title:'Custom AR title',size:[3,2],clientKind:'ar'}]};
  const {config} = load('',undefined,'showcase.example.com','https:',saved);
  assert.equal(config.personalProjects[0].title,'Custom AR title');
  assert.deepEqual(JSON.parse(JSON.stringify(config.personalProjects[0].size)),[3,2]);
  assert.equal(config.settings.clientDesignVersion,2);
});

test('experience updates rename only stock titles and append the new cards once',()=>{
  const saved={settings:{presentationMode:'personal',catalogModesVersion:1,clientCatalogVersion:1,clientDesignVersion:2},projects:[],personalProjects:[{id:'sadhna-360',title:'Interactive 360°',size:[2,1]},{id:'sadhna-vr',title:'Our custom VR room',size:[3,2]}]};
  const first=load('',undefined,'showcase.example.com','https:',saved).config;
  assert.equal(first.personalProjects.find(p=>p.id==='sadhna-360').title,'Every Angle');
  assert.equal(first.personalProjects.find(p=>p.id==='sadhna-vr').title,'Our custom VR room');
  assert.equal(first.personalProjects.length,6);
  const second=load('',undefined,'showcase.example.com','https:',JSON.parse(JSON.stringify(first))).config;
  assert.equal(second.personalProjects.length,6);
  assert.equal(new Set(second.personalProjects.map(p=>p.id)).size,6);
});
test('local and hosted meeting modes use the full image collection and safe detail actions', () => {
  for (const [search, flag] of [['?demo=1', undefined], ['', 'true']]) {
    const { config, original } = load(search, flag);
    assert.equal(config.settings.meetingPreview, true);
    assert.equal(original.projects[0].id, 'saved');
    assert.equal(config.projects.length, 34);
    assert.equal(new Set(config.projects.map(p => p.id)).size, 34);
    const sources = new Set(config.projects.flatMap(p => p.slides.map(s => s.src)));
    assert.ok(sources.size >= 50);
    for (const source of sources) assert.ok(fs.existsSync(path.join(__dirname, '..', source)), source);
    assert.ok(config.projects.every(p => p.action.type === 'detail'));
    assert.ok(config.projects.some(p => p.team));
    const minimal = config.projects.filter(p => p.tile?.showTitle === false && p.tile?.showCategory === false && p.tile?.showDescription === false);
    assert.equal(minimal.length, 8);
    assert.equal(config.projects.slice(0,18).reduce((area, p) => area + p.size[0] * p.size[1], 0), 40);
    assert.ok(config.projects.every(p => !p.tile?.color || /^#[0-9a-f]{6}$/i.test(p.tile.color)));
  }
});
test('all heritage photographs have bundled lightweight previews', () => {
  const sandbox = { window:{}, encodeURIComponent };
  vm.runInNewContext(media + '\n' + fs.readFileSync(path.join(__dirname, '../js/heritage.js'), 'utf8'), sandbox);
  for (const project of sandbox.window.VASTUCHITRA_HERITAGE){
    assert.ok(project.slides.length);
    for (const {src} of project.slides){
      assert.ok(fs.existsSync(path.join(__dirname, '..', decodeURIComponent(src))), src);
      const preview = sandbox.window.VASTUCHITRA_PREVIEWS[src];
      assert.ok(preview && fs.existsSync(path.join(__dirname, '..', preview)), src);
    }
  }
});
