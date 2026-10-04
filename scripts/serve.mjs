import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const portFlag = process.argv.indexOf('--port');
const port = Number(portFlag >= 0 ? process.argv[portFlag + 1] : process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid server port');
const files = new Set(['index.html', 'app.js', 'styles.css', 'converter.js', 'favicon.svg', 'hero.svg']);
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = url.pathname === '/' || url.pathname === '/unicodex' ? 'index.html' : url.pathname.replace(/^\//, '');
  if (!files.has(file)) { res.writeHead(404); res.end('Not found'); return; }
  try { const data = await readFile(path.join(root, file)); res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' }); res.end(data); }
  catch { res.writeHead(500); res.end('Could not load file'); }
}).listen(port, '0.0.0.0', () => console.log(`Unicodex ready on port ${port}`));
