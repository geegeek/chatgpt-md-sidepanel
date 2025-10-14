// utils/exporter.js
// Coordinates the export of the conversation to Markdown

import { getAllMessages, detectPlatform } from './extractors.js';
import { flavours } from './markdownFlavours.js';

/**
 * Exports the entire conversation in Markdown format
 * @returns {Promise<string>} The generated Markdown
 */
export async function exportConversation() {
  console.log('[Exporter] Starting conversation export');
  
  // Detect platform
  const platform = detectPlatform();
  const platformName = {
    'chatgpt': 'ChatGPT',
    'perplexity': 'Perplexity',
    'claude': 'Claude'
  }[platform] || 'AI Chat';
  
  console.log('[Exporter] Platform:', platformName);
  
  // Extract messages
  const messages = getAllMessages();
  
  if (!messages || messages.length === 0) {
    throw new Error('No messages found in the conversation');
  }
  
  console.log(`[Exporter] Found ${messages.length} messages`);
  
  // Read Markdown flavour preference
  const flavourKey = await getMarkdownFlavour();
  const serializer = flavours[flavourKey] || flavours.base;
  
  console.log('[Exporter] Markdown flavour:', flavourKey);
  
  // Generate document header
  let markdown = `# ${platformName} Conversation\n\n`;
  markdown += `**Exported on:** ${new Date().toLocaleString('en-US')}\n`;
  markdown += `**URL:** ${window.location.href}\n`;
  markdown += `**Platform:** ${platformName}\n\n`;
  markdown += `---\n\n`;
  
  // Serialize each message
  messages.forEach((msg, index) => {
    const roleLabel = msg.role === 'user' 
      ? '👤 User' 
      : `🤖 ${platformName}`;
    
    markdown += `## ${roleLabel}\n\n`;
    markdown += serializer.serialize(msg.content);
    markdown += '\n\n';
    markdown += `---\n\n`;
  });
  
  console.log(`[Exporter] Export completed, length: ${markdown.length} characters`);
  
  return markdown;
}

/**
 * Reads the saved Markdown flavour preference
 * @returns {Promise<string>} The selected flavour (default: 'base')
 */
async function getMarkdownFlavour() {
  try {
    const result = await browser.storage.sync.get('markdownFlavour');
    return result.markdownFlavour || 'base';
  } catch (e) {
    console.warn('[Exporter] Unable to read flavour preference, using base', e);
    return 'base';
  }
}
