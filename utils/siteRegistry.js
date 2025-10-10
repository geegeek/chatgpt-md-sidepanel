// Registry of supported sites and extractor resolution.
import chatgptExtractor from '../extractors/chatgpt.js';
import claudeExtractor from '../extractors/claude.js';
import geminiExtractor from '../extractors/gemini.js';
import perplexityExtractor from '../extractors/perplexity.js';

export const SUPPORTED_SITES = {
  chatgpt: { hosts: ['chat.openai.com', 'chatgpt.com'] },
  claude: { hosts: ['claude.ai'] },
  gemini: { hosts: ['gemini.google.com'] },
  perplexity: { hosts: ['www.perplexity.ai', 'perplexity.ai'] }
};

const extractorMap = {
  chatgpt: chatgptExtractor,
  claude: claudeExtractor,
  gemini: geminiExtractor,
  perplexity: perplexityExtractor
};

export function detectSite(urlString = (typeof location !== 'undefined' ? location.href : '')) {
  if (!urlString) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch (_error) {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  for (const [key, value] of Object.entries(SUPPORTED_SITES)) {
    const hosts = value?.hosts || [];
    if (hosts.some(candidate => candidate.toLowerCase() === host)) {
      return key;
    }
  }

  return null;
}

export function getExtractor(siteKey) {
  if (!siteKey) {
    return null;
  }
  return extractorMap[siteKey] || null;
}
