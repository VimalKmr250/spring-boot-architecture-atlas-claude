// Builds the single-page index.html from the fragments in src/.
//
//   node build.mjs          write index.html
//   node build.mjs --check  exit 1 if index.html is out of date with src/
//
// src/template.html holds the page shell. A line of the form
//   <!-- @include path/or/prefix*suffix -->
// is replaced by the contents of that file (or of every match, in filename
// order), relative to src/. Slides are numbered NN-title.html so the number
// sets their order in the deck. index.html is committed because GitHub Pages
// serves it as-is: edit src/, then rebuild.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, 'src');
const read = rel => fs.readFileSync(path.join(src, rel), 'utf8');

function expand(pattern) {
  if (!pattern.includes('*')) return read(pattern);
  const dir = path.posix.dirname(pattern);
  const [prefix, suffix] = path.posix.basename(pattern).split('*');
  const names = fs.readdirSync(path.join(src, dir))
    .filter(n => n.startsWith(prefix) && n.endsWith(suffix))
    .sort();
  if (!names.length) throw new Error(`no files match ${pattern}`);
  return names.map(n => read(path.posix.join(dir, n))).join('');
}

const html = read('template.html').replace(/^<!-- @include (.+?) -->\n/gm, (_, p) => expand(p));
const target = path.join(root, 'index.html');

if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8') !== html) {
    console.error('index.html is out of date - run: node build.mjs');
    process.exit(1);
  }
  console.log('index.html is up to date');
} else {
  fs.writeFileSync(target, html);
  console.log(`wrote index.html (${(html.length / 1024).toFixed(0)} KB)`);
}
