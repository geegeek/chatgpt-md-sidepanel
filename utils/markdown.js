// utils/markdown.js - Helper per formattazione Markdown

window.__MarkdownUtils = {
  
  /**
   * Escape caratteri speciali per Markdown
   */
  escapeMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/!/g, '\\!')
      .replace(/\|/g, '\\|')
      .replace(/>/g, '\\>');
  },

  /**
   * Escape backtick in codice inline
   */
  escapeInlineCode(code) {
    if (!code) return '';
    const backtickCount = (code.match(/`/g) || []).length;
    if (backtickCount === 0) {
      return `\`${code}\``;
    }
    // Usa doppi o tripli backtick se necessario
    const fence = '`'.repeat(backtickCount + 1);
    return `${fence}${code}${fence}`;
  },

  /**
   * Crea un blocco di codice con fence
   */
  codeBlock(code, language = '') {
    if (!code) return '';
    const fence = '```';
    return `${fence}${language}\n${code}\n${fence}`;
  },

  /**
   * Crea un'intestazione Markdown
   */
  heading(level, text) {
    if (!text) return '';
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    return `${hashes} ${text}`;
  },

  /**
   * Crea un link Markdown
   */
  link(text, url, title = '') {
    if (!url) return text || '';
    if (!text) text = url;
    if (title) {
      return `[${text}](${url} "${title}")`;
    }
    return `[${text}](${url})`;
  },

  /**
   * Crea un'immagine Markdown
   */
  image(alt, src, title = '') {
    if (!src) return '';
    if (title) {
      return `![${alt || ''}](${src} "${title}")`;
    }
    return `![${alt || ''}](${src})`;
  },

  /**
   * Linea orizzontale
   */
  hr() {
    return '---';
  },

  /**
   * Converti tabella HTML in Markdown (GFM)
   */
  tableToMarkdown(table) {
    if (!table) return '';

    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    let markdown = '';
    let headers = [];
    let isFirstRow = true;

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const cellTexts = cells.map(cell => {
        return this.normalizeWhitespace(cell.textContent || '')
          .replace(/\|/g, '\\|')
          .replace(/\n/g, ' ')
          .trim();
      });

      if (isFirstRow) {
        // Prima riga come header
        headers = cellTexts;
        markdown += '| ' + headers.join(' | ') + ' |\n';
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        isFirstRow = false;
      } else {
        // Righe dati
        markdown += '| ' + cellTexts.join(' | ') + ' |\n';
      }
    });

    return markdown;
  },

  /**
   * Normalizza spazi bianchi
   */
  normalizeWhitespace(text) {
    if (!text) return '';
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, '    ')
      .replace(/ +/g, ' ');
  },

  /**
   * Collassa righe vuote multiple
   */
  collapseEmptyLines(text) {
    if (!text) return '';
    return text.replace(/\n{3,}/g, '\n\n');
  }
};