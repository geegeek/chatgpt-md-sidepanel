// utils/extractors/perplexity.js
// Perplexity-specific message extractor

/**
 * Selectors for Perplexity messages
 */
const selectors = {
  container: 'main, div[class*="Thread"]',
  userQuery: 'div[class*="UserQuery"], div.col-span-10, div[class*="QueryText"]',
  answer: 'div[class*="prose"], div[class*="Answer"], div[class*="ResponseText"]',
  messageBlock: 'div[class*="mb-md"], div[class*="MessagePair"]'
};

/**
 * Extracts messages from Perplexity
 * @returns {Array<{role: string, content: string}>} Array of messages
 */
export function getPerplexityMessages() {
  const messages = [];
  const container = document.querySelector(selectors.container) || document.body;
  
  // Strategy 1: look for message blocks
  const messageBlocks = container.querySelectorAll(selectors.messageBlock);
  
  if (messageBlocks.length > 0) {
    console.log(`[Perplexity] Found ${messageBlocks.length} message blocks`);
    
    messageBlocks.forEach(block => {
      // User query
      const userQuery = block.querySelector(selectors.userQuery);
      if (userQuery) {
        messages.push({
          role: 'user',
          content: userQuery.textContent.trim()
        });
      }
      
      // Perplexity answer
      const answer = block.querySelector(selectors.answer);
      if (answer) {
        messages.push({
          role: 'assistant',
          content: extractContent(answer)
        });
      }
    });
  } else {
    // Strategy 2: look for separate queries and answers
    console.log('[Perplexity] Trying alternative strategy');
    
    const queries = container.querySelectorAll(selectors.userQuery);
    const answers = container.querySelectorAll(selectors.answer);
    
    queries.forEach(query => {
      messages.push({
        role: 'user',
        content: query.textContent.trim()
      });
    });
    
    answers.forEach(answer => {
      messages.push({
        role: 'assistant',
        content: extractContent(answer)
      });
    });
  }
  
  console.log(`[Perplexity] Extracted ${messages.length} messages`);
  return messages;
}

/**
 * Extracts content from a Perplexity answer element
 * @param {HTMLElement} element - The answer element
 * @returns {string} The extracted content
 */
function extractContent(element) {
  if (!element) return '';
  
  // Look for markdown container
  const markdownContainer = element.querySelector('.prose, [class*="markdown"]');
  const targetElement = markdownContainer || element;
  
  // Extract text content
  let content = targetElement.textContent || '';
  
  // Normalize spaces and newlines
  content = content.trim();
  content = content.replace(/\n{3,}/g, '\n\n');
  
  return content;
}
