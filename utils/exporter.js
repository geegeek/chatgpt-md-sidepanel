// utils/exporter.js - Coordinamento export conversazioni in Markdown

import { getMessageNodes, getRole, getMarkdownContainer } from './extractors.js';
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
export async function exportConversation(opts = {}) {
  const { flavour } = opts || {};
  const storedFlavour = await getStoredFlavour();
  const effectiveFlavour = flavour || storedFlavour || DEFAULT_FLAVOUR;

  const nodes = getMessageNodes(document);
  const items = nodes.map(node => ({
    role: getRole(node) || 'assistant',
    container: getMarkdownContainer(node),
    node
  }));

  return serializeToMarkdown({ nodes: items, flavour: effectiveFlavour });
}

if (typeof window !== 'undefined') {
  window.__exportConversation = exportConversation;
}
