#!/usr/bin/env node
/**
 * build-influencers.js
 * Scans the ziad/ folder for images and generates influencers.js.
 * Optionally reads ziad/info.json to override name, followers, url, platform, role_ar, role_en.
 * Run: node scripts/build-influencers.js  (from the project root)
 *
 * WARN: Only include people who gave their permission.
 */

const fs   = require('fs');
const path = require('path');

const PHOTO_DIR  = path.join(__dirname, '..', 'ziad');
const OUT_FILE   = path.join(__dirname, '..', 'influencers.js');
const INFO_FILE  = path.join(PHOTO_DIR, 'info.json');
const SIZE_LIMIT = 150 * 1024; // 150 KB
const EXTS       = /\.(jpe?g|png|webp)$/i;

// ── helpers ────────────────────────────────────────────────────────────────

function toTitleCase(str) {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function slugToHandle(filename) {
  // Remove extension, keep the raw filename as handle prefix
  const base = filename.replace(EXTS, '');
  return '@' + base;
}

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// ── main ──────────────────────────────────────────────────────────────────

if (!fs.existsSync(PHOTO_DIR)) {
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
  console.log('Created ziad/ folder. Drop photos in it and re-run.');
}

const overrides = fs.existsSync(INFO_FILE)
  ? JSON.parse(fs.readFileSync(INFO_FILE, 'utf8'))
  : {};

const files = fs.readdirSync(PHOTO_DIR)
  .filter(f => EXTS.test(f) && f !== 'info.json')
  .sort(naturalSort);

const bigFiles = [];

if (files.length === 0) {
  console.log('No images found in ziad/. Not overwriting influencers.js.');
  process.exit(0);
}

const entries = files.map(filename => {
  const fullPath = path.join(PHOTO_DIR, filename);
  const stat = fs.statSync(fullPath);

  if (stat.size > SIZE_LIMIT) {
    bigFiles.push({ filename, sizeKB: (stat.size / 1024).toFixed(1) });
  }

  const base = filename.replace(EXTS, '');
  const ov   = overrides[filename] || overrides[base] || {};

  const encodedPath = 'ziad/' + encodeURIComponent(filename);

  return {
    name:      ov.name      || toTitleCase(base),
    handle:    ov.handle    || slugToHandle(filename),
    platform:  ov.platform  || 'instagram',
    photo:     encodedPath,
    followers: ov.followers || '',
    url:       ov.url       || '',
    role_ar:   ov.role_ar   || '',
    role_en:   ov.role_en   || '',
    hidden:    ov.hidden    || false,
  };
});

const json = JSON.stringify(entries, null, 2)
  .replace(/"([^"]+)":/g, '"$1":'); // keep keys quoted (valid JS)

const output = `// Generated from the ziad folder. Run the build script after adding photos. Only include people who gave permission.
const INFLUENCERS = ${json};
`;

fs.writeFileSync(OUT_FILE, output, 'utf8');

console.log(`✅  influencers.js written — ${entries.length} photo(s).`);

if (bigFiles.length > 0) {
  console.warn('\n⚠️  Photos over 150 KB (consider optimising before upload):');
  bigFiles.forEach(f => console.warn(`   ${f.filename}  (${f.sizeKB} KB)`));
}
