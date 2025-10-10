/**
 * @typedef {Object} SiteExtractor
 * @prop {(doc: Document) => boolean} [canExtract]
 * @prop {(doc: Document) => Element[]} getMessageNodes
 * @prop {(node: Element) => ('assistant'|'user'|'system'|null)} getRole
 * @prop {(node: Element) => Element|null} getMarkdownContainer
 * @prop {(doc: Document, items: Array<{node: Element, role?: string|null, container?: Element|null}>, flavour: string) => string} serialize
 */
