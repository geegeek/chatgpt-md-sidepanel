// utils/exporter.js - Coordinamento export conversazioni in Markdown

import { detectSite, getExtractor } from './siteRegistry.js';
import { serializeToMarkdown, DEFAULT_FLAVOUR } from './markdownFlavours.js';

/**
 * Recupera la preferenza di flavour salvata in storage sincronizzato.
 */
async function getStoredFlavour() {
  try {
    const result = await browser.storage.sync.get('markdownFlavour');
    if (result && typeof result.markdownFlavour === 'string') {
      return result.markdownFlavour;
    }
  } catch (error) {
    console.warn('Impossibile leggere markdownFlavour da storage:', error);
  }
  return DEFAULT_FLAVOUR;
}

/**
 * Esporta la conversazione corrente in formato Markdown.
 */
export async function exportConversationForActiveSite({ flavour } = {}) {
  const siteKey = detectSite(location.href);
  if (!siteKey) {
    throw new Error('Unsupported site');
  }

  const extractor = getExtractor(siteKey);
  if (!extractor) {
    throw new Error(`Extractor missing for ${siteKey}`);
  }

  const nodes = extractor.getMessageNodes(document);
  const items = nodes.map(node => ({
    node,
    role: (typeof extractor.getRole === 'function' ? extractor.getRole(node) : null) || 'assistant',
    container: typeof extractor.getMarkdownContainer === 'function' ? extractor.getMarkdownContainer(node) : null
  }));

  const storedFlavour = await getStoredFlavour();
  const effectiveFlavour = flavour || storedFlavour || DEFAULT_FLAVOUR;

  const siteSerialize = typeof extractor.serialize === 'function'
    ? extractor.serialize.bind(extractor)
    : (_doc, payload, flav) => serializeToMarkdown({ nodes: payload, flavour: flav });

  return siteSerialize(document, items, effectiveFlavour);
}

export async function exportConversation(opts = {}) {
  return exportConversationForActiveSite(opts);
}

if (typeof window !== 'undefined') {
  window.__exportConversation = exportConversation;
}
