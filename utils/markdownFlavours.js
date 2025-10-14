// utils/markdownFlavours.js
// Defines different Markdown serialization flavours

/**
 * Base Markdown serializer
 */
const baseFlavour = {
  serialize(content) {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
};

/**
 * GitHub Flavoured Markdown serializer
 */
const gfmFlavour = {
  serialize(content) {
    let md = content
      .replace(/\r\n/g, '\n')
      .trim();
    
    // Support for math formulas $...$
    md = md.replace(/\$([^$]+)\$/g, '`$$$1$$`');
    
    return md;
  }
};

/**
 * Obsidian serializer
 */
const obsidianFlavour = {
  serialize(content) {
    // Obsidian prefers to preserve newlines
    return content
      .replace(/\r\n/g, '\n')
      .trim();
  }
};

/**
 * Map of available flavours
 */
export const flavours = {
  base: baseFlavour,
  gfm: gfmFlavour,
  obsidian: obsidianFlavour
};
