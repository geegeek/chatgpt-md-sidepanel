// utils/markdownFlavours.js - Serializzazione Markdown configurabile

/** Valore di default per il flavour Markdown. */
export const DEFAULT_FLAVOUR = 'base';

/**
 * Opzioni disponibili per i diversi flavour Markdown supportati.
 * Le opzioni sono volutamente minimali per consentire un export prevedibile.
 */
export const flavours = {
  base: {
    fence: '```',
    inlineCode: '`',
    tables: false,
    math: 'none',
    normalizeWhitespace: true,
    collapseNewlines: true
  },
  gfm: {
    fence: '```',
    inlineCode: '`',
    tables: true,
    math: 'dollar',
    normalizeWhitespace: true,
    collapseNewlines: true
  },
  obsidian: {
    fence: '```',
    inlineCode: '`',
    tables: true,
    math: 'dollar',
    normalizeWhitespace: false,
    collapseNewlines: false
  }
};

/**
 * Capitalizza il nome ruolo per utilizzarlo come intestazione.
 */
function formatRole(role) {
  if (!role) return 'Message';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Normalizza il testo a seconda delle opzioni del flavour.
 */
function normalizeText(text, options) {
  if (!text) return '';
  let output = text.replace(/\u00a0/g, ' ');
  if (options.normalizeWhitespace) {
    output = output.replace(/[\t\f\r]/g, ' ');
    output = output.replace(/\s+/g, ' ');
  }
  return output;
}

/**
 * Converte un elemento <table> in Markdown GFM.
 */
function tableToMarkdown(table, options) {
  if (!options.tables) {
    return normalizeText(table.textContent || '', options);
  }

  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) {
    return '';
  }

  const lines = [];
  const headerCells = Array.from(rows[0].querySelectorAll('th, td'));
  const header = headerCells.map(cell => normalizeText(cell.textContent || '', options).trim());
  if (header.length) {
    lines.push(`| ${header.join(' | ')} |`);
    lines.push(`| ${header.map(() => '---').join(' | ')} |`);
  }

  const dataRows = rows.slice(header.length ? 1 : 0);
  for (const row of dataRows) {
    const cells = Array.from(row.querySelectorAll('th, td'));
    const values = cells.map(cell => normalizeText(cell.textContent || '', options).trim());
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Estrae il contenuto LaTeX da un nodo KaTeX/MJX.
 */
function extractLatex(node) {
  const annotation = node.querySelector('annotation');
  if (annotation) {
    return annotation.textContent || '';
  }
  const mathml = node.querySelector('math');
  if (mathml) {
    const tex = mathml.getAttribute('alttext') || mathml.textContent;
    return tex || '';
  }
  return node.textContent || '';
}

/**
 * Converte un elemento matematico in Markdown.
 */
function mathToMarkdown(element, options) {
  const latex = extractLatex(element).trim();
  if (!latex) {
    return '';
  }

  if (options.math === 'dollar') {
    const isBlock = element.matches('.katex-display, mjx-container[display="true"], [data-testid="math-block"], div[data-testid="math"]');
    if (isBlock) {
      return `\n$$${latex}$$\n`;
    }
    return `$${latex}$`;
  }

  return latex;
}

/**
 * Serializza ricorsivamente un nodo DOM in Markdown.
 */
function serializeNode(node, options, context = {}) {
  if (!node) return '';

  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeText(node.textContent || '', options);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node;
  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case 'br':
      return '\n';
    case 'p':
    case 'div':
    case 'section':
    case 'article': {
      const content = serializeChildren(element, options, context).trim();
      return content ? `${content}\n\n` : '';
    }
    case 'span': {
      if (options.math !== 'none' && (element.matches('span.katex, span[data-testid^="math"], mjx-container, math'))) {
        return mathToMarkdown(element, options);
      }
      return serializeChildren(element, options, context);
    }
    case 'strong':
    case 'b':
      return `**${serializeChildren(element, options, context).trim()}**`;
    case 'em':
    case 'i':
      return `*${serializeChildren(element, options, context).trim()}*`;
    case 'code':
      if (context.inCodeBlock) {
        return element.textContent || '';
      }
      {
        const text = element.textContent || '';
        const marker = options.inlineCode || '`';
        const needsEscape = text.includes(marker);
        const fence = needsEscape ? marker.repeat(2) : marker;
        return `${fence}${text}${fence}`;
      }
    case 'pre': {
      const codeElement = element.querySelector('code') || element;
      const language = Array.from(codeElement.classList || [])
        .map(cls => cls.replace('language-', ''))
        .find(cls => cls && cls !== 'hljs');
      const raw = codeElement.textContent || '';
      const fence = options.fence;
      const langSuffix = language ? language : '';
      return `\n${fence}${langSuffix}\n${raw}\n${fence}\n\n`;
    }
    case 'ul':
    case 'ol':
      return serializeList(element, options, tag === 'ol', context);
    case 'li': {
      const prefix = context.ordered ? `${context.index + 1}. ` : '- ';
      const nestedContext = {
        ...context,
        index: 0
      };
      const content = serializeChildren(element, options, nestedContext).trim();
      const indent = '  '.repeat(context.depth || 0);
      return `${indent}${prefix}${content}\n`;
    }
    case 'blockquote': {
      const content = serializeChildren(element, options, context)
        .split('\n')
        .map(line => line ? `> ${line}` : '>')
        .join('\n');
      return `${content}\n\n`;
    }
    case 'table':
      return `${tableToMarkdown(element, options)}\n\n`;
    case 'thead':
    case 'tbody':
    case 'tfoot':
    case 'tr':
    case 'th':
    case 'td':
      return serializeChildren(element, options, context);
    case 'a': {
      const href = element.getAttribute('href') || '';
      const title = element.getAttribute('title');
      const text = serializeChildren(element, options, context).trim() || href;
      const titleSuffix = title ? ` "${title}"` : '';
      return href ? `[${text}](${href}${titleSuffix})` : text;
    }
    case 'img': {
      const alt = element.getAttribute('alt') || '';
      const src = element.getAttribute('src') || '';
      if (!src) return '';
      const title = element.getAttribute('title');
      const titleSuffix = title ? ` "${title}"` : '';
      return `![${alt}](${src}${titleSuffix})`;
    }
    case 'hr':
      return '\n---\n\n';
    default:
      if (options.math !== 'none' && element.matches('mjx-container, math')) {
        return mathToMarkdown(element, options);
      }
      return serializeChildren(element, options, context);
  }
}

/**
 * Serializza tutti i figli di un elemento.
 */
function serializeChildren(element, options, context) {
  const parts = [];
  for (const child of Array.from(element.childNodes)) {
    parts.push(serializeNode(child, options, context));
  }
  return parts.join('');
}

/**
 * Serializza una lista ordinata o non ordinata.
 */
function serializeList(list, options, ordered, context) {
  const items = [];
  let index = 0;
  for (const child of Array.from(list.children)) {
    if (child.tagName && child.tagName.toLowerCase() === 'li') {
      const itemContext = {
        ...context,
        ordered,
        index,
        depth: (context.depth || 0) + 1
      };
      items.push(serializeNode(child, options, itemContext));
      index += 1;
    }
  }
  if (!items.length) {
    return '';
  }
  return `${items.join('')}${context.depth ? '' : '\n'}`;
}

/**
 * Serializza i nodi dei messaggi in una stringa Markdown.
 */
export function serializeToMarkdown({ nodes = [], flavour = DEFAULT_FLAVOUR } = {}) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return '';
  }

  const baseOptions = flavours[DEFAULT_FLAVOUR];
  const selected = flavours[flavour] || baseOptions;
  const options = { ...baseOptions, ...selected };

  const messageBlocks = [];
  for (const entry of nodes) {
    if (!entry) continue;
    const role = formatRole(entry.role || 'assistant');
    const container = entry.container instanceof Element ? entry.container : entry.node;
    const content = container ? serializeChildren(container, options, {}) : '';
    const trimmed = options.collapseNewlines ? content.replace(/\n{3,}/g, '\n\n').trim() : content.trim();
    const block = trimmed ? `### ${role}\n\n${trimmed}` : `### ${role}`;
    messageBlocks.push(block.trim());
  }

  const joined = messageBlocks.join('\n\n');
  return options.collapseNewlines ? joined.replace(/\n{3,}/g, '\n\n').trim() : joined.trim();
}

/*
// Quick sanity tests (manual execution)
// const empty = serializeToMarkdown({ nodes: [] });
// console.assert(empty === '', 'Empty conversation should be empty');
// const container = document.createElement('div');
// container.innerHTML = '<pre><code class="language-js">console.log(42);</code></pre>';
// const code = serializeToMarkdown({ nodes: [{ role: 'assistant', container }] });
// console.assert(code.includes('```js') && code.includes('console.log(42);'), 'Code fence expected');
// const table = document.createElement('div');
// table.innerHTML = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>';
// const tableMd = serializeToMarkdown({ nodes: [{ role: 'assistant', container: table }], flavour: 'gfm' });
// console.assert(tableMd.includes('| A | B |'), 'Table should be converted when tables enabled');
// const math = document.createElement('div');
// math.innerHTML = '<span class="katex"><annotation encoding="application/x-tex">a^2+b^2=c^2</annotation></span>';
// const mathMd = serializeToMarkdown({ nodes: [{ role: 'assistant', container: math }], flavour: 'gfm' });
// console.assert(mathMd.includes('$a^2+b^2=c^2$'), 'Math should preserve $...$ when flavour math is dollar');
*/
