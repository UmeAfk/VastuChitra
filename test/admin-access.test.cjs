'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
const setup = source.slice(source.indexOf('  async function setupAdminLock(){'), source.indexOf("  window.addEventListener('DOMContentLoaded', setupAdminLock)"));

async function openAdmin(settings, hostedShowcase = false, fail = false) {
  const classes = new Set();
  const handlers = {};
  let starts = 0;
  const elements = Object.fromEntries(['adminLock', 'adminLoginForm', 'adminPassword', 'adminLockError', 'toggleAdminPassword'].map(id => [id, {
    classList: { add() {}, remove() {} },
    addEventListener: (event, callback) => { handlers[`${id}:${event}`] = callback; },
    remove() {}, select() {}, focus() {}, value: ''
  }]));
  const context = {
    hostedShowcase, window: { VASTUCHITRA: { settings } },
    api: async () => { if (fail) throw Error('Offline'); return { settings }; },
    $: id => elements[id],
    document: { body: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } } },
    sessionStorage: { getItem: () => null, setItem() {} },
    startAdmin: () => starts++, setTimeout: fn => fn()
  };
  vm.createContext(context);
  await vm.runInContext(`${setup}\nsetupAdminLock();`, context);
  return { classes, handlers, elements, starts: () => starts };
}

test('password requirement defaults on and retains the 0575 login', async () => {
  const page = await openAdmin({});
  assert.equal(page.starts(), 0);
  assert.ok(page.classes.has('admin-locked'));
  page.elements.adminPassword.value = 'wrong';
  page.handlers['adminLoginForm:submit']({ preventDefault() {} });
  assert.equal(page.starts(), 0);
  page.elements.adminPassword.value = '0575';
  page.handlers['adminLoginForm:submit']({ preventDefault() {} });
  assert.equal(page.starts(), 1);
  assert.equal(page.classes.has('admin-locked'), false);
});
test('disabled password requirement opens local and hosted Admin directly', async () => {
  for (const hosted of [false, true]) {
    const page = await openAdmin({ adminPasswordRequired: false }, hosted);
    assert.equal(page.starts(), 1);
    assert.equal(page.classes.has('admin-locked'), false);
    assert.equal(page.handlers['adminLoginForm:submit'], undefined);
  }
});
test('re-enabled protection and failed configuration reads keep the password prompt', async () => {
  for (const [settings, fail] of [[{ adminPasswordRequired:true }, false], [{ adminPasswordRequired:false }, true]]) {
    const page = await openAdmin(settings, false, fail);
    assert.equal(page.starts(), 0);
    assert.ok(page.classes.has('admin-locked'));
  }
});
