// utils/extractors.js - Estrazione contenuto ChatGPT

window.__extractChatGPTToMarkdown = function() {
  const utils = window.__MarkdownUtils;
  
  if (!utils) {
    throw new Error('Markdown utils non disponibili');
  }

  /**
   * Genera header del documento
   */
  function generateHeader() {
    const title = document.title || 'ChatGPT Conversation';
    const url = window.location.href;
    const timestamp = new Date().toISOString();

    let header = '';
    header += `# ${title}\n\n`;
    header += `**Source:** ${url}  \n`;
    header += `**Exported:** ${timestamp}\n\n`;
    header += utils.hr() + '\n\n';

    return header;
  }

  /**
   * Estrai ruolo del messaggio
   */
  function extractRole(element) {
    const roleAttr = element.getAttribute('data-message-author-role');
    if (roleAttr) {
      return roleAttr.toLowerCase();
    }

    // Fallback: se contiene .markdown probabilmente è assistant
    if (element.querySelector('.markdown')) {
      return 'assistant';
    }

    return 'user';
  }

  /**
   * Processa un nodo di testo con formattazione inline
   */
  function processInlineFormatting(node, inCodeBlock = false) {
    if (!node) return '';

    // Testo semplice
    if (node.nodeType === Node.TEXT_NODE) {
      const text = utils.normalizeWhitespace(node.textContent);
      return inCodeBlock ? text : text;
    }

    // Elemento HTML
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes)
        .map(child => processInlineFormatting(child, inCodeBlock))
        .join('');

      switch (tag) {
        case 'br':
          return '\n';
        
        case 'strong':
        case 'b':
          if (node.querySelector('em, i')) {
            return `***${children}***`;
          }
          return `**${children}**`;
        
        case 'em':
        case 'i':
          if (node.querySelector('strong, b')) {
            return `***${children}***`;
          }
          return `*${children}*`;
        
        case 's':
        case 'del':
        case 'strike':
          return `~~${children}~~`;
        
        case 'code':
          // Solo se non siamo già in un blocco di codice
          if (!node.closest('pre')) {
            return utils.escapeInlineCode(node.textContent);
          }
          return node.textContent;
        
        case 'a': {
          const href = node.getAttribute('href') || '';
          const title = node.getAttribute('title') || '';
          const text = children || href;
          return utils.link(text, href, title);
        }
        
        case 'img': {
          const src = node.getAttribute('src') || '';
          const alt = node.getAttribute('alt') || '';
          const title = node.getAttribute('title') || '';
          return utils.image(alt, src, title);
        }
        
        // Tag HTML inline che lasciamo così
        case 'u':
        case 'sup':
        case 'sub':
        case 'kbd':
          return `<${tag}>${children}</${tag}>`;
        
        default:
          return children;
      }
    }

    return '';
  }

  /**
   * Processa un elemento blocco (paragrafo, lista, tabella, etc.)
   */
  function processBlockElement(element) {
    if (!element) return '';

    const tag = element.tagName.toLowerCase();
    let result = '';

    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const level = parseInt(tag[1]);
        const text = processInlineFormatting(element);
        result = utils.heading(level, text) + '\n\n';
        break;
      }

      case 'p': {
        const text = processInlineFormatting(element);
        if (text.trim()) {
          result = text + '\n\n';
        }
        break;
      }

      case 'pre': {
        const codeElement = element.querySelector('code');
        if (codeElement) {
          let language = '';
          const classes = codeElement.className.split(' ');
          for (const cls of classes) {
            if (cls.startsWith('language-')) {
              language = cls.replace('language-', '');
              break;
            }
            if (cls.startsWith('lang-')) {
              language = cls.replace('lang-', '');
              break;
            }
          }

          // Estrai il codice rimuovendo eventuali numeri di riga
          let code = codeElement.textContent || '';
          
          // Rimuovi common code block prefixes
          code = code.replace(/^\s*[\d]+\s+/gm, '');

          result = utils.codeBlock(code, language) + '\n\n';
        } else {
          result = utils.codeBlock(element.textContent || '') + '\n\n';
        }
        break;
      }

      case 'blockquote': {
        const lines = processInlineFormatting(element).split('\n');
        result = lines.map(line => `> ${line}`).join('\n') + '\n\n';
        break;
      }

      case 'ul': {
        const items = Array.from(element.children);
        items.forEach(item => {
          if (item.tagName.toLowerCase() === 'li') {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
              const checked = checkbox.checked ? 'x' : ' ';
              result += `- [${checked}] ${processInlineFormatting(item)}\n`;
            } else {
              result += `- ${processInlineFormatting(item)}\n`;
            }
          }
        });
        result += '\n';
        break;
      }

      case 'ol': {
        const items = Array.from(element.children);
        const start = parseInt(element.getAttribute('start') || '1');
        items.forEach((item, index) => {
          if (item.tagName.toLowerCase() === 'li') {
            result += `${start + index}. ${processInlineFormatting(item)}\n`;
          }
        });
        result += '\n';
        break;
      }

      case 'table': {
        result = utils.tableToMarkdown(element) + '\n\n';
        break;
      }

      case 'hr': {
        result = utils.hr() + '\n\n';
        break;
      }

      case 'details': {
        // Mantieni HTML nativo per details/summary
        result = element.outerHTML + '\n\n';
        break;
      }

      case 'div':
      case 'section':
      case 'article': {
        // Processa ricorsivamente i figli
        Array.from(element.children).forEach(child => {
          result += processBlockElement(child);
        });
        break;
      }

      default: {
        // Fallback: estrai testo con formattazione inline
        const text = processInlineFormatting(element);
        if (text.trim()) {
          result = text + '\n\n';
        }
      }
    }

    return result;
  }

  /**
   * Estrai contenuto di un singolo messaggio
   */
  function extractMessageContent(messageElement) {
    let content = '';

    // Cerca il contenitore del messaggio effettivo
    const contentContainers = [
      messageElement.querySelector('.markdown'),
      messageElement.querySelector('[data-message-content]'),
      messageElement.querySelector('.message-content'),
      messageElement
    ].filter(Boolean);

    const container = contentContainers[0];
    if (!container) return '';

    // Processa tutti gli elementi blocco
    const blockElements = Array.from(container.children);
    
    if (blockElements.length === 0) {
      // Fallback: nessun figlio, usa il testo diretto
      content = processInlineFormatting(container);
    } else {
      blockElements.forEach(element => {
        content += processBlockElement(element);
      });
    }

    return content.trim();
  }

  /**
   * Funzione principale di estrazione
   */
  function extract() {
    let markdown = '';

    // Header del documento
    markdown += generateHeader();

    // Selettori per i messaggi
    const messageSelectors = [
      '[data-message-author-role]',
      '[data-testid^="conversation-turn"]',
      '.group.w-full',
      'article[class*="message"]'
    ];

    let messages = [];
    for (const selector of messageSelectors) {
      messages = Array.from(document.querySelectorAll(selector));
      if (messages.length > 0) break;
    }

    if (messages.length === 0) {
      throw new Error('Nessun messaggio trovato nella pagina');
    }

    // Processa ogni messaggio
    messages.forEach((msg, index) => {
      const role = extractRole(msg);
      const roleLabel = role === 'assistant' ? 'Assistant' : 'User';
      
      // Header del messaggio
      markdown += utils.heading(3, `${index + 1}. ${roleLabel}`) + '\n\n';

      // Contenuto
      const content = extractMessageContent(msg);
      if (content) {
        markdown += content + '\n\n';
      }

      // Separatore tra messaggi
      markdown += utils.hr() + '\n\n';
    });

    // Pulizia finale
    markdown = utils.collapseEmptyLines(markdown);

    return markdown;
  }

  // Esegui l'estrazione
  return extract();
};