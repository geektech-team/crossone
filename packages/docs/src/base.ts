let docBasePath = '';

export function normalizeDocBasePath(base: string): string {
  const trimmed = base.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
}

export function setDocBasePath(base: string): void {
  docBasePath = normalizeDocBasePath(base);
}

export function getDocBasePath(): string {
  return docBasePath;
}

/** Directory URLs work both on GitHub Pages and on the local static preview. */
export function withDocBasePath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  const directoryPath = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
  return `${docBasePath}${directoryPath}${suffix}`;
}

/** SSR receives the same pathname as the browser, including the deployment prefix. */
export function deriveDocBase(pathname: string, routes: readonly string[]): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return '';
  const candidates = routes
    .filter((route) => route !== '/')
    .map((route) => route.replace(/\/+$/, ''))
    .sort((a, b) => b.length - a.length);
  for (const route of candidates) {
    if (path === route) return '';
    if (path.endsWith(route)) return normalizeDocBasePath(path.slice(0, -route.length));
  }
  return normalizeDocBasePath(path);
}
