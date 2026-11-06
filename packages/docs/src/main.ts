import { Component, createApp, createComponent, renderHtmlDocument, type AppDocumentRenderOptions, type VNode } from 'transone';
import { docRoutes, findPage, normalizeDocPath } from './content';
import { deriveDocBase, setDocBasePath } from './base';
import { DocsPage } from './components/DocsPage';
import { docsStyles } from './styles';

const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
const base = deriveDocBase(pathname, docRoutes);
setDocBasePath(base);
const currentDocPath = normalizeDocPath(base ? pathname.slice(base.length) || '/' : pathname);
const page = findPage(currentDocPath);
const title = page && page.path !== '/' ? `${page.title} · CrossOne 文档` : 'CrossOne 文档';
const description = page?.description ?? '面向 AI 开发的 Bun 与 TypeScript 全栈应用框架。';

class DocsApp extends Component<Record<string, never>, object> {
  protected initState(): object { return {}; }
  protected initStyles(): void {}
  protected render(): VNode { return createComponent(DocsPage, { path: currentDocPath }) as VNode; }
}

const oneApp = createApp({ root: DocsApp, document: { lang: 'zh-CN', title, description } });
if (typeof document !== 'undefined') document.getElementById('app')?.replaceChildren();
oneApp.mount();

/** CLI static rendering contract; every route contains its complete article HTML. */
export const app = {
  renderHtmlDocument(options: AppDocumentRenderOptions): string {
    return renderHtmlDocument({
      lang: 'zh-CN', title, description,
      htmlAttributes: base ? { 'data-doc-base': base } : {},
      body: { tag: 'div', props: { id: 'app' }, children: [{ component: DocsApp }] },
      styles: docsStyles,
      scripts: options.scripts,
    });
  },
};
