import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { normalizeDocBasePath } from '../src/base';

const outDir = resolve(import.meta.dir, '..', 'dist');
if (!existsSync(join(outDir, 'index.html'))) {
  console.error('未找到文档构建产物。请先运行 bun run docs:build。');
  process.exit(1);
}
const root = realpathSync(outDir);
const builtBase = readFileSync(join(root, 'index.html'), 'utf8').match(/data-doc-base="([^"]+)"/)?.[1] ?? '';
const base = normalizeDocBasePath(process.env.DOCS_BASE ?? builtBase);
const server = Bun.serve({
  hostname: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 52314),
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    let pathname: string;
    try { pathname = decodeURIComponent(new URL(request.url).pathname); }
    catch { return new Response('Bad Request', { status: 400 }); }
    if (pathname.includes('\0') || pathname.includes('\\')) return new Response('Bad Request', { status: 400 });
    if (base && pathname === '/') return new Response(null, { status: 302, headers: { Location: `${base}/` } });
    if (base && pathname !== base && !pathname.startsWith(`${base}/`)) return new Response('Not Found', { status: 404 });
    const relative = pathname.slice(base.length).replace(/^\/+/, '');
    let target = resolve(root, relative || 'index.html');
    if (target !== root && !target.startsWith(`${root}${sep}`)) return new Response('Forbidden', { status: 403 });
    if (!existsSync(target)) return new Response('Not Found', { status: 404 });
    if (statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target) || !statSync(target).isFile()) return new Response('Not Found', { status: 404 });
    const realTarget = realpathSync(target);
    if (!realTarget.startsWith(`${root}${sep}`)) return new Response('Forbidden', { status: 403 });
    const file = Bun.file(realTarget);
    return new Response(request.method === 'HEAD' ? null : file, { headers: { 'Content-Type': file.type } });
  },
});
console.log(`CrossOne docs preview: http://${server.hostname}:${server.port}${base}/`);
