import { Component, type VNode } from 'transone';
import type { DocBlock, InlineNode } from '../content/types';
import { withDocBasePath } from '../base';

export function articleHeadings(blocks: DocBlock[]): Array<{ id: string; text: string; level: number }> {
  return blocks.flatMap((block, index) =>
    block.type === 'heading' && !(index === 0 && block.level === 1)
      ? [{ id: `section-${index + 1}`, text: block.text, level: block.level }]
      : []
  );
}

function anchor(href: string, children: Array<VNode | string>, className?: string): VNode {
  const external = /^https?:\/\//.test(href);
  return {
    tag: 'a',
    props: {
      href: withDocBasePath(href),
      className,
      ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    },
    children,
  };
}

function inline(nodes: InlineNode[]): Array<VNode | string> {
  return nodes.map((node) => {
    if (typeof node === 'string') return node;
    if (node.kind === 'link') return anchor(node.href, [node.text]);
    return { tag: node.kind === 'code' ? 'code' : 'strong', children: [node.text] };
  });
}

function table(headers: string[], rows: Array<Array<VNode | string>>, caption?: string): VNode {
  return {
    tag: 'div', props: { className: 'doc-table-wrap' }, children: [{
      tag: 'table', children: [
        ...(caption ? [{ tag: 'caption', children: [caption] } as VNode] : []),
        { tag: 'thead', children: [{ tag: 'tr', children: headers.map((text) => ({ tag: 'th', props: { scope: 'col' }, children: [text] })) }] },
        { tag: 'tbody', children: rows.map((row) => ({ tag: 'tr', children: row.map((cell) => ({ tag: 'td', children: [cell] })) })) },
      ],
    }],
  };
}

function renderBlock(block: DocBlock, index: number): VNode {
  switch (block.type) {
    case 'heading':
      return {
        tag: block.level === 3 ? 'h3' : 'h2',
        props: { id: `section-${index + 1}` },
        children: [anchor(`#section-${index + 1}`, [block.text], 'doc-heading-link')],
      };
    case 'paragraph':
      return { tag: 'p', children: inline(block.content) };
    case 'code':
      return {
        tag: 'div', props: { className: 'doc-code' }, children: [
          { tag: 'div', props: { className: 'doc-code-lang' }, children: [block.lang] },
          { tag: 'pre', children: [{ tag: 'code', children: [block.code] }] },
        ],
      };
    case 'list':
      return {
        tag: block.ordered ? 'ol' : 'ul',
        children: block.items.map((item, itemIndex) => ({ tag: 'li', children: Array.isArray(item) ? inline(item) : [renderBlock(item, itemIndex)] })),
      };
    case 'table':
      return table(block.headers, block.rows);
    case 'api-table':
      return table(['名称', '类型', '说明'], block.rows.map((row) => [
        { tag: 'code', children: [row.name] }, { tag: 'code', children: [row.type] }, row.description,
      ]), block.caption);
    case 'callout':
      return {
        tag: 'aside', props: { className: `doc-callout doc-callout-${block.variant}` }, children: [
          ...(block.title ? [{ tag: 'strong', children: [block.title] } as VNode] : []),
          { tag: 'p', children: inline(block.content) },
        ],
      };
    case 'hero':
      return {
        tag: 'section', props: { className: 'doc-hero' }, children: [
          { tag: 'span', props: { className: 'doc-eyebrow' }, children: [block.badge] },
          { tag: 'h1', children: [block.title] },
          { tag: 'p', props: { className: 'doc-hero-subtitle' }, children: [block.subtitle] },
          { tag: 'div', props: { className: 'doc-hero-actions' }, children: block.actions.map((action) => anchor(action.href, [action.label, ' →'], action.primary ? 'doc-button doc-button-primary' : 'doc-button')) },
        ],
      };
    case 'link-grid':
      return {
        tag: 'div', props: { className: 'doc-card-grid' },
        children: block.items.map((item) => anchor(item.href, [
          { tag: 'div', props: { className: 'doc-card-heading' }, children: [{ tag: 'h3', children: [item.title] }, { tag: 'span', props: { 'aria-hidden': 'true' }, children: ['↗'] }] },
          { tag: 'p', children: [item.description] },
        ], 'doc-card')),
      };
    case 'feature-grid':
      return {
        tag: 'div', props: { className: 'doc-feature-grid' },
        children: block.items.map((item, itemIndex) => ({ tag: 'section', props: { className: 'doc-feature' }, children: [
          { tag: 'span', props: { className: 'doc-feature-number' }, children: [String(itemIndex + 1).padStart(2, '0')] },
          { tag: 'h3', children: [item.title] },
          { tag: 'p', children: [item.description] },
        ] })),
      };
  }
}

export class DocArticle extends Component<{ blocks: DocBlock[] }, object> {
  protected initState(): object { return {}; }
  protected initStyles(): void {}
  protected render(): VNode {
    return {
      tag: 'div', props: { className: 'doc-prose' },
      children: this.props.blocks.flatMap((block, index) => index === 0 && block.type === 'heading' && block.level === 1 ? [] : [renderBlock(block, index)]),
    };
  }
}
