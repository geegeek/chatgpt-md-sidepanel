// ChatGPT site extractor implementing the shared contract.
import { serializeToMarkdown } from '../utils/markdownFlavours.js';

const messageSelectors = [
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

const containerCandidates = [
  '[data-message-author-role]',
  '[data-testid^="conversation-turn"]',
  'article[data-testid^="message"]',
  'div[data-message-id]',
  '[role="listitem"] article',
  'article'
];

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

function collectCandidate(node) {
  if (!(node instanceof Element)) {
    return null;
  }
  for (const selector of containerCandidates) {
    const candidate = node.closest(selector);
    if (candidate) {
      return candidate;
    }
  }
  return node;
}

function normaliseRole(value) {
  if (!value) {
    return null;
  }
  const lower = value.toLowerCase();
  if (lower.includes('assistant')) return 'assistant';
  if (lower.includes('user')) return 'user';
  if (lower.includes('system')) return 'system';
  return null;
}

const chatgptExtractor = {
  messageSelectors,

  getMessageNodes(doc = document) {
    const root = doc || document;
    if (!root) {
      return [];
    }

    const collected = [];
    const seen = new Set();

    for (const selector of messageSelectors) {
      const nodes = root.querySelectorAll(selector);
      for (const node of nodes) {
        const candidate = collectCandidate(node);
        if (!candidate || seen.has(candidate)) {
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
  },

  getRole(node) {
    if (!node || !(node instanceof Element)) {
      return null;
    }

    const dataRole = node.getAttribute('data-message-author-role') || node.getAttribute('data-author-role') || node.dataset?.role;
    const direct = normaliseRole(dataRole);
    if (direct) {
      return direct;
    }

    const testId = node.getAttribute('data-testid');
    if (testId) {
      const match = testId.match(/conversation-turn-?(assistant|user|system)/i) ||
        testId.match(/(assistant|user|system)-message/i);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    const ariaLabel = node.getAttribute('aria-label') || node.getAttribute('aria-labelledby');
    const ariaRole = normaliseRole(ariaLabel);
    if (ariaRole) {
      return ariaRole;
    }

    const badge = node.querySelector('[data-testid="conversation-turn-badge"], [data-testid="author-role"], [aria-label*="assistant" i], [aria-label*="user" i], [aria-label*="system" i]');
    if (badge) {
      const text = badge.getAttribute('aria-label') || badge.textContent || '';
      const badgeRole = normaliseRole(text);
      if (badgeRole) {
        return badgeRole;
      }
    }

    return null;
  },

  getMarkdownContainer(node) {
    if (!node || !(node instanceof Element)) {
      return null;
    }

    const selectors = [
      '[data-testid="markdown"]',
      '[data-testid="conversation-message-viewport"]',
      '[data-testid="conversation-content"]',
      '[data-message-author-role] [data-message-author-role]',
      '[data-role="message-content"]',
      '[role="presentation"] [data-testid="markdown"]',
      '[data-testid="assistant-response"]',
      '[data-message-author-role]'
    ];

    for (const selector of selectors) {
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
  },

  serialize(_doc, items, flavour) {
    const payload = (items || []).map(entry => ({
      node: entry.node,
      role: entry.role || 'assistant',
      container: entry.container || chatgptExtractor.getMarkdownContainer(entry.node) || entry.node
    }));
    return serializeToMarkdown({ nodes: payload, flavour });
  }
};

export default chatgptExtractor;
