import { cp, mkdir, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'app.js', 'styles.css', 'converter.js', 'favicon.svg', 'hero.svg']) await cp(new URL(name, root), new URL(name, out));
console.log('Built standalone static app in dist/');
