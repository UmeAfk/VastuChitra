'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseRange } = require('../js/http-range.cjs');

test('explicit and open-ended byte ranges', () => {
  assert.deepEqual(parseRange('bytes=2-5', 10), { start: 2, end: 5 });
  assert.deepEqual(parseRange('bytes=2-', 10), { start: 2, end: 9 });
  assert.deepEqual(parseRange('bytes=2-99', 10), { start: 2, end: 9 });
});
test('suffix ranges return the final bytes', () => {
  assert.deepEqual(parseRange('bytes=-3', 10), { start: 7, end: 9 });
  assert.deepEqual(parseRange('bytes=-99', 10), { start: 0, end: 9 });
});
test('unsatisfiable ranges are rejected', () => {
  for (const header of ['bytes=-0', 'bytes=10-', 'bytes=5-2', 'bytes=9007199254740992-']) {
    assert.equal(parseRange(header, 10), false);
  }
  assert.equal(parseRange('bytes=0-', 0), false);
});
test('malformed and unsupported ranges are ignored', () => {
  for (const header of [undefined, 'bytes=-', 'bytes=abc', 'bytes=0-1,3-4', 'items=0-1']) {
    assert.equal(parseRange(header, 10), null);
  }
});
