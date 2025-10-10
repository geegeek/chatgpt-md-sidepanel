// utils/extractors.js - Funzioni di estrazione robuste per ChatGPT

/**
 * Selettori ordinati per individuare i nodi messaggio nella conversazione.
 * La lista è mantenuta in ordine di priorità (dal più specifico al più generico).
 */
export const messageSelectors = [
  '[data-message-author-role]',
  '[data-testid^="conversation-turn"]',
  '[data-testid="conversation-message"]',
  '[data-testid="conversation-turn-main"] article',
  'article[data-testid^="message"]',
  'div[data-message-id]',
  '[role="listitem"] [data-message-author-role]',
  '[role="listitem"] article',
  '.group.w-full',
  'article[class*="message"]'
];

/**
 * Determina se un elemento è visibile all'interno del documento.
 */
function isVisible(element) {
  if (!element || !(element instanceof Element)) {
    return false;
  }
  if (element.offsetParent === null && element.getClientRects().length === 0) {
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (!style || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
  }
  return true;
}

/**
 * Restituisce un array ordinato di nodi messaggio presenti nel documento.
 */
export function getMessageNodes(root = document) {
  if (!root) {
    return [];
  }

  const collected = [];
  const seen = new Set();

  for (const selector of messageSelectors) {
    const nodes = root.querySelectorAll(selector);
    for (const node of nodes) {
      if (!(node instanceof Element)) {
        continue;
      }
      const container = node.closest('[data-message-author-role], article, [data-testid^="conversation-turn"], div[data-message-id]');
      const candidate = container || node;
      if (seen.has(candidate)) {
        continue;
      }
      if (!isVisible(candidate)) {
        continue;
      }
      seen.add(candidate);
      collected.push(candidate);
    }
  }

  collected.sort((a, b) => {
    if (a === b) return 0;
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    }
    return 0;
  });

  return collected;
}

/**
 * Prova a determinare il ruolo del messaggio (assistant, user o system).
 */
export function getRole(node) {
  if (!node || !(node instanceof Element)) {
    return undefined;
  }

  const directRole = node.getAttribute('data-message-author-role') || node.dataset?.role;
  if (directRole) {
    return directRole.toLowerCase();
  }

  const testId = node.getAttribute('data-testid');
  if (testId) {
    const match = testId.match(/conversation-turn-?(assistant|user|system)/i) ||
                  testId.match(/(assistant|user|system)-message/i);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  const labelledBy = node.getAttribute('aria-label') || node.getAttribute('aria-labelledby');
  if (labelledBy) {
    const label = labelledBy.toLowerCase();
    if (label.includes('assistant')) return 'assistant';
    if (label.includes('user')) return 'user';
    if (label.includes('system')) return 'system';
  }

  const authorBadge = node.querySelector('[data-testid="conversation-turn-badge"], [data-testid="author-role"], [aria-label*="assistant" i], [aria-label*="user" i]');
  if (authorBadge) {
    const text = (authorBadge.getAttribute('aria-label') || authorBadge.textContent || '').toLowerCase();
    if (text.includes('assistant')) return 'assistant';
    if (text.includes('user')) return 'user';
    if (text.includes('system')) return 'system';
  }

  return undefined;
}

/**
 * Restituisce il nodo che contiene il contenuto markdown del messaggio.
 */
export function getMarkdownContainer(node) {
  if (!node || !(node instanceof Element)) {
    return null;
  }

  const containerSelectors = [
    '[data-testid="markdown"]',
    '[data-testid="conversation-message-viewport"]',
    '[data-testid="conversation-content"]',
    '[data-message-author-role] [data-message-author-role]',
    '[data-role="message-content"]',
    '[role="presentation"] [data-testid="markdown"]',
    '[data-testid="assistant-response"]',
    '.markdown'
  ];

  for (const selector of containerSelectors) {
    if (node.matches(selector)) {
      return node;
    }
    const found = node.querySelector(selector);
    if (found) {
      return found;
    }
  }

  const fallback = node.querySelector('pre, code, table, p, li, h1, h2, h3, h4, h5, h6, blockquote');
  return fallback || node;
}
