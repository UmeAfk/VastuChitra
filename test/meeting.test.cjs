'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const code = fs.readFileSync(path.join(__dirname, '../js/meeting.js'), 'utf8');
function load(search, meeting, hostname = 'localhost', protocol = 'http:', savedConfig = null) {
  const original = { settings: { columns: 4 }, projects: [{ id: 'saved' }] };
  const sandbox = {
    URLSearchParams, location: { search, hostname, protocol }, window: { VASTUCHITRA: original },
    localStorage: { getItem: () => JSON.stringify(savedConfig) },
    document: { documentElement: { dataset: { meeting } }, body: { classList: { add() {} } },
      createElement: () => ({}), querySelector: () => ({ appendChild() {} }) }
  };
  vm.runInNewContext(code, sandbox);
  return { config: sandbox.window.VASTUCHITRA, original };
}
test('normal launcher keeps its saved catalogue', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    const { config, original } = load('', undefined, host);
    assert.equal(config, original);
  }
});
test('remote index pages automatically use bundled images without PC helper calls', () => {
  for (const host of ['vastuchitraa.vercel.app', 'vastuchitra-meeting.vercel.app', 'showcase.example.com']) {
    const { config } = load('', undefined, host, 'https:');
    assert.equal(config.settings.meetingPreview, true);
    assert.equal(config.settings.showAdmin, true);
    assert.equal(config.settings.showTools, true);
    assert.equal(config.projects.length, 18);
    assert.ok(config.projects.flatMap(p => p.slides).every(s => s.src.startsWith('public/demo/')));
  }
});
test('web Admin edits reload without hiding the header controls', () => {
  const saved = { settings: { showAdmin:false, showTools:false }, projects:[{ id:'edited', title:'Updated studio title' }] };
  const { config } = load('', undefined, 'vastuchitraa.vercel.app', 'https:', saved);
  assert.equal(config.projects[0].title, 'Updated studio title');
  assert.equal(config.settings.meetingPreview, true);
  assert.equal(config.settings.showAdmin, true);
  assert.equal(config.settings.showTools, true);
});
test('local and hosted meeting modes use the full image collection and safe detail actions', () => {
  for (const [search, flag] of [['?demo=1', undefined], ['', 'true']]) {
    const { config, original } = load(search, flag);
    assert.equal(config.settings.meetingPreview, true);
    assert.equal(original.projects[0].id, 'saved');
    assert.equal(config.projects.length, 18);
    assert.equal(new Set(config.projects.map(p => p.id)).size, 18);
    const sources = new Set(config.projects.flatMap(p => p.slides.map(s => s.src)));
    assert.equal(sources.size, 18);
    for (const source of sources) assert.ok(fs.existsSync(path.join(__dirname, '..', source)), source);
    assert.ok(config.projects.every(p => p.action.type === 'detail'));
    assert.ok(config.projects.some(p => p.team));
    const minimal = config.projects.filter(p => p.tile?.showTitle === false && p.tile?.showCategory === false && p.tile?.showDescription === false);
    assert.equal(minimal.length, 8);
    assert.equal(config.projects.reduce((area, p) => area + p.size[0] * p.size[1], 0), 40);
    assert.ok(config.projects.every(p => !p.tile?.color || /^#[0-9a-f]{6}$/i.test(p.tile.color)));
  }
});
