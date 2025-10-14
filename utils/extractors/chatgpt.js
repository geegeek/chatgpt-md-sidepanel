// utils/extractors/chatgpt.js
// ChatGPT-specific message extractor with dynamic selectors

import { getSelectorsForPlatform } from '../selectorManager.js';

let cachedSelectors = null;

/**
 * Gets selectors with caching
 */
async function getSelectors() {
  if (!cachedSelectors) {
    cachedSelectors = await getSelectorsForPlatform('chatgpt');
  }
  return cachedSelectors;
}

/**
 * Extracts messages from ChatGPT
 * @returns {Promise<Array<{role: string, content: string}>>} Array of messages
 */
export async function getChatGPTMessages() {
  const selectors = await getSelectors();
  const messageSelectors = selectors.message_selectors;
  
  for (const selector of messageSelectors) {
    const messages = document.querySelectorAll(selector);
    
    if (messages.length > 0) {
      console.log(`[ChatGPT] Found ${messages.length} messages with selector: ${selector}`);
      
      return Array.from(messages).map(msg => {
        const role = detectRole(msg, selectors);
        const content = extractContent(msg, selectors);
        return { role, content };
      });
    }
  }
  
  console.warn('[ChatGPT] No messages found with any selector');
  return [];
}

/**
 * Detects the message role using dynamic selectors
 */
function detectRole(messageElement, selectors) {
  const roleConfig = selectors.role_detection;
  
  // Check data attribute
  if (roleConfig.data_attribute) {
    const roleAttr = messageElement.getAttribute(roleConfig.data_attribute);
    if (roleAttr) return roleAttr;
  }
  
  // Check user indicators
  for (const indicator of roleConfig.user_indicators) {
    if (messageElement.querySelector(indicator)) return 'user';
  }
  
  // Check assistant indicators
  for (const indicator of roleConfig.assistant_indicators) {
    if (messageElement.querySelector(indicator)) return 'assistant';
  }
  
  return 'unknown';
}

/**
 * Extracts content using dynamic selectors
 */
function extractContent(messageElement, selectors) {
  // Try each content container selector
  for (const selector of selectors.content_container) {
    const container = messageElement.querySelector(selector);
    if (container) {
      let content = container.textContent || '';
      content = content.trim();
      content = content.replace(/\n{3,}/g, '\n\n');
      return content;
    }
  }
  
  // Fallback to element text
  let content = messageElement.textContent || '';
  return content.trim().replace(/\n{3,}/g, '\n\n');
}
