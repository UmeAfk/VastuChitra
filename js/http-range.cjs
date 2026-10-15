'use strict';

// null means ignore the header; false means a valid but unsatisfiable range.
function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match || (!match[1] && !match[2])) return null;
  if (size === 0) return false;
  const first = Number(match[1]);
  const last = Number(match[2]);
  if ((match[1] && !Number.isSafeInteger(first)) || (match[2] && !Number.isSafeInteger(last))) return false;
  if (!match[1]) {
    if (last === 0) return false;
    return { start: Math.max(0, size - last), end: size - 1 };
  }
  const end = match[2] ? Math.min(last, size - 1) : size - 1;
  if (first >= size || first > end) return false;
  return { start: first, end };
}

module.exports = { parseRange };
