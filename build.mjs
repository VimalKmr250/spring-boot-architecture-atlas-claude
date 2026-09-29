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
//
// Cross-references: <a data-deck="key" data-sec="..." data-slide="..."> names a
// slide by its section and/or title (the first match wins), never by number, so
// inserting slides never breaks a link. The build writes its href="#slug/N" and
// fails if any link names a slide that does not exist.
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

const attr = (tag, name) => (new RegExp(`\\s${name}="([^"]*)"`).exec(tag) || [])[1];

// Decks are declared in the template as <main class="stage" data-deck="key" data-slug="slug">.
function resolveCrossRefs(page) {
  const decks = {};
  for (const [, open, body] of page.matchAll(/<main\b([^>]*)>([\s\S]*?)<\/main>/g)) {
    const key = attr(open, 'data-deck');
    if (!key) continue;
    decks[key] = {
      slug: attr(open, 'data-slug'),
      slides: [...body.matchAll(/<section class="slide"([^>]*)>/g)]
        .map(([, a]) => ({ sec: attr(a, 'data-sec'), title: attr(a, 'data-title') })),
    };
  }
  const broken = [];
  const out = page.replace(/<a\b([^>]*\sdata-deck="[^"]*"[^>]*)>/g, (link, attrs) => {
    const deck = decks[attr(attrs, 'data-deck')];
    const sec = attr(attrs, 'data-sec'), title = attr(attrs, 'data-slide');
    const i = deck ? deck.slides.findIndex(s => (!sec || s.sec === sec) && (!title || s.title === title)) : -1;
    if (i < 0) { broken.push(link); return link; }
    return `<a${attrs} href="#${deck.slug}/${i + 1}">`;
  });
  if (broken.length) {
    console.error(`${broken.length} cross-reference(s) name no slide:\n  ${broken.join('\n  ')}`);
    process.exit(1);
  }
  return out;
}

const html = resolveCrossRefs(read('template.html').replace(/^<!-- @include (.+?) -->\n/gm, (_, p) => expand(p)));
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
