// utils/extractors.js
// Platform detection and message extraction router with async support

import { getChatGPTMessages } from './extractors/chatgpt.js';
import { getPerplexityMessages } from './extractors/perplexity.js';
import { getClaudeMessages } from './extractors/claude.js';

/**
 * Detects the current platform
 */
export function detectPlatform() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) {
    return 'chatgpt';
  } else if (hostname.includes('perplexity.ai')) {
    return 'perplexity';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  }
  
  return 'unknown';
}

/**
 * Extracts all messages from the conversation
 * Now supports async extractors for remote config
 */
export async function getAllMessages() {
  const platform = detectPlatform();
  console.log('[Extractors] Platform:', platform);
  
  switch(platform) {
    case 'chatgpt':
      return await getChatGPTMessages();
    case 'perplexity':
      return await getPerplexityMessages();
    case 'claude':
      return await getClaudeMessages();
    default:
      console.warn('[Extractors] Unknown platform, trying ChatGPT');
      return await getChatGPTMessages();
  }
}
