// TODO: remove after migration - legacy re-export for ChatGPT extractor helpers.
import chatgptExtractor from '../extractors/chatgpt.js';

export const messageSelectors = chatgptExtractor.messageSelectors;
export const getMessageNodes = chatgptExtractor.getMessageNodes;
export const getRole = chatgptExtractor.getRole;
export const getMarkdownContainer = chatgptExtractor.getMarkdownContainer;

export default chatgptExtractor;
