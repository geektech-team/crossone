import { Component, createComponent, type VNode } from 'transone';
import { findPage, pagesOfSection, SECTION_ORDER, SECTION_PATHS, SECTION_TITLES } from '../content';
import type { DocPage } from '../content/types';
import { withDocBasePath } from '../base';
import { DocArticle, articleHeadings } from './DocArticle';

const repository = 'https://github.com/geektech-team/crossone';

function link(path: string, text: string, className?: string, active = false): VNode {
  return { tag: 'a', props: { href: withDocBasePath(path), className, ...(active ? { 'aria-current': 'page' } : {}) }, children: [text] };
}

export class DocsPage extends Component<{ path: string }, object> {
  protected initState(): object { return {}; }
  protected initStyles(): void {}

  protected render(): VNode {
    const page = findPage(this.props.path);
    return {
      tag: 'div', children: [
        link('#content', '跳到正文', 'doc-skip-link'),
        this.header(page),
        this.mobileNavigation(page),
        page ? this.body(page) : {
          tag: 'main', props: { id: 'content', className: 'doc-not-found' },
          children: [{ tag: 'h1', children: ['页面未找到'] }, { tag: 'p', children: ['请从文档首页继续阅读。'] }, link('/', '返回首页', 'doc-button doc-button-primary')],
        },
        { tag: 'footer', props: { className: 'doc-footer' }, children: [
          { tag: 'span', children: ['CrossOne · 从需求到多端应用'] },
          { tag: 'div', children: [link('/project', '项目说明'), link(`${repository}/tree/main/packages/docs/src/content`, '文档源码'), link(repository, 'GitHub ↗')] },
        ] },
      ],
    };
  }

  private sectionLinks(page?: DocPage, className = 'doc-top-link'): VNode[] {
    return SECTION_ORDER.map((section) => link(SECTION_PATHS[section], SECTION_TITLES[section], `${className}${page?.section === section ? ' active' : ''}`, page?.path === SECTION_PATHS[section]));
  }

  private header(page?: DocPage): VNode {
    return {
      tag: 'header', props: { className: 'doc-header' }, children: [{
        tag: 'div', props: { className: 'doc-header-inner' }, children: [
          { tag: 'a', props: { href: withDocBasePath('/'), className: 'doc-brand', 'aria-label': 'CrossOne 文档首页' }, children: [
            { tag: 'span', props: { className: 'doc-brand-mark', 'aria-hidden': 'true' }, children: ['C1'] },
            { tag: 'span', children: ['CrossOne'] },
            { tag: 'span', props: { className: 'doc-brand-label' }, children: ['文档'] },
          ] },
          { tag: 'nav', props: { className: 'doc-top-nav', 'aria-label': '文档分区' }, children: this.sectionLinks(page) },
          link(repository, 'GitHub ↗', 'doc-github'),
        ],
      }],
    };
  }

  private mobileNavigation(page?: DocPage): VNode {
    return {
      tag: 'details', props: { className: 'doc-mobile-nav' }, children: [
        { tag: 'summary', children: ['文档导航', ' ☰'] },
        { tag: 'nav', props: { 'aria-label': '移动文档导航' }, children: [
          ...this.sectionLinks(page, 'doc-mobile-link'),
          ...(page && page.section !== 'home' ? pagesOfSection(page.section).map((item) => link(item.path, item.title, `doc-mobile-link doc-mobile-child${item.path === page.path ? ' active' : ''}`, item.path === page.path)) : []),
        ] },
      ],
    };
  }

  private body(page: DocPage): VNode {
    const article = createComponent(DocArticle, { blocks: page.body }) as VNode;
    if (page.section === 'home') return { tag: 'main', props: { id: 'content', className: 'doc-home' }, children: [article] };
    const headings = articleHeadings(page.body);
    const sectionPages = pagesOfSection(page.section);
    const currentIndex = sectionPages.findIndex((item) => item.path === page.path);
    const previous = sectionPages[currentIndex - 1];
    const next = sectionPages[currentIndex + 1];
    const hasHero = page.body.some((block) => block.type === 'hero');
    return {
      tag: 'div', props: { className: 'doc-layout' }, children: [
        { tag: 'aside', props: { className: 'doc-sidebar' }, children: [
          { tag: 'div', props: { className: 'doc-sidebar-label' }, children: [SECTION_TITLES[page.section]] },
          { tag: 'nav', props: { 'aria-label': '当前分区' }, children: sectionPages.map((item) => link(item.path, item.title, `doc-side-link${item.path === page.path ? ' active' : ''}`, item.path === page.path)) },
        ] },
        { tag: 'main', props: { id: 'content', className: 'doc-content' }, children: [
          { tag: 'div', props: { className: 'doc-breadcrumb' }, children: [link('/', '文档'), ' / ', link(SECTION_PATHS[page.section], SECTION_TITLES[page.section])] },
          ...(!hasHero ? [
            { tag: 'h1', props: { className: 'doc-title' }, children: [page.title] },
            { tag: 'p', props: { className: 'doc-description' }, children: [page.description] },
          ] as VNode[] : []),
          article,
          { tag: 'nav', props: { className: 'doc-pagination', 'aria-label': '前后文档' }, children: [
            previous ? link(previous.path, `← ${previous.title}`, 'doc-page-previous') : { tag: 'span' },
            next ? link(next.path, `${next.title} →`, 'doc-page-next') : { tag: 'span' },
          ] },
        ] },
        { tag: 'aside', props: { className: 'doc-toc' }, children: headings.length ? [
          { tag: 'div', props: { className: 'doc-sidebar-label' }, children: ['本页内容'] },
          { tag: 'nav', props: { 'aria-label': '页内目录' }, children: headings.map((heading) => link(`#${heading.id}`, heading.text, `doc-toc-link${heading.level === 3 ? ' doc-toc-nested' : ''}`)) },
        ] : [] },
      ],
    };
  }
}
