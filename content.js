// content.js - Gestione UI della tendina laterale

(function() {
  'use strict';

  // Flag per evitare doppia inizializzazione
  if (window.__CTMDP_READY__) {
    console.log('ChatGPT → Markdown: già inizializzato');
    return;
  }
  window.__CTMDP_READY__ = true;

  const PANEL_ID = 'chatgpt-markdown-sidepanel';
  let panelElement = null;
  let textareaElement = null;
  let copyButton = null;
  let exporterModulePromise = null;

  function loadExporterModule() {
    if (!exporterModulePromise) {
      exporterModulePromise = import(browser.runtime.getURL('utils/exporter.js'));
    }
    return exporterModulePromise;
  }

  // Listener per messaggi dal background
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleSidePanel') {
      togglePanel();
      sendResponse({ success: true });
    }
    return true;
  });

  /**
   * Toggle del pannello: crea/apri/rigenera
   */
  function togglePanel() {
    if (!panelElement) {
      createPanel();
      openPanel();
      generateMarkdown();
    } else {
      if (isPanelOpen()) {
        // Se già aperto, rigenera
        generateMarkdown();
      } else {
        // Se chiuso, apri e rigenera
        openPanel();
        generateMarkdown();
      }
    }
  }

  /**
   * Crea la struttura DOM del pannello
   */
  function createPanel() {
    // Container principale
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: min(48vw, 720px);
      height: 100vh;
      background: #ffffff;
      border-left: 1px solid #d1d5db;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Previeni la propagazione dei click all'interno del pannello
    panel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px 20px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Markdown Export';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    // Bottone Aggiorna
    const refreshButton = createButton('Aggiorna', '#3b82f6');
    refreshButton.addEventListener('click', generateMarkdown);

    // Bottone Copia
    copyButton = createButton('Copia', '#10b981');
    copyButton.addEventListener('click', copyToClipboard);

    // Bottone Chiudi
    const closeButton = createButton('Chiudi', '#ef4444');
    closeButton.addEventListener('click', closePanel);

    buttonContainer.appendChild(refreshButton);
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    // Textarea per il contenuto
    const textarea = document.createElement('textarea');
    textarea.readOnly = true;
    textarea.style.cssText = `
      flex: 1;
      width: 100%;
      padding: 20px;
      border: none;
      resize: none;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
      outline: none;
    `;
    textarea.placeholder = 'Il Markdown apparirà qui...';

    // Footer con link al blog
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 12px 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      flex-shrink: 0;
      font-size: 13px;
      color: #6b7280;
    `;

    const footerText = document.createElement('span');
    footerText.textContent = 'Ti è piaciuta questa estensione? ';
    footerText.style.cssText = `
      color: #6b7280;
    `;

    const blogLink = document.createElement('a');
    blogLink.href = 'https://5m1.ovh';
    blogLink.target = '_blank';
    blogLink.rel = 'noopener noreferrer';
    blogLink.textContent = 'Visita il mio blog';
    blogLink.style.cssText = `
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    `;
    blogLink.addEventListener('mouseenter', () => {
      blogLink.style.color = '#2563eb';
      blogLink.style.textDecoration = 'underline';
    });
    blogLink.addEventListener('mouseleave', () => {
      blogLink.style.color = '#3b82f6';
      blogLink.style.textDecoration = 'none';
    });

    const heartIcon = document.createElement('span');
    heartIcon.textContent = ' ❤️';
    heartIcon.style.cssText = `
      color: #ef4444;
    `;

    footer.appendChild(footerText);
    footer.appendChild(blogLink);
    footer.appendChild(heartIcon);

    panel.appendChild(header);
    panel.appendChild(textarea);
    panel.appendChild(footer);

    document.body.appendChild(panel);

    panelElement = panel;
    textareaElement = textarea;

    // Aggiungi listener per chiusura al click fuori dal pannello
    setupClickOutsideListener();
  }

  /**
   * Setup del listener per chiudere il pannello cliccando fuori
   */
  function setupClickOutsideListener() {
    const clickOutsideHandler = (e) => {
      // Verifica se il pannello è aperto
      if (!isPanelOpen()) {
        return;
      }

      // Se il click è fuori dal pannello, chiudi
      if (panelElement && !panelElement.contains(e.target)) {
        closePanel();
      }
    };

    // Usa capture phase per intercettare prima
    document.addEventListener('click', clickOutsideHandler, true);

    // Salva il riferimento per poterlo rimuovere se necessario
    panelElement._clickOutsideHandler = clickOutsideHandler;
  }

  /**
   * Crea un bottone stilizzato
   */
  function createButton(text, bgColor) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      padding: 8px 16px;
      background: ${bgColor};
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    `;
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '0.9';
    });
    button.addEventListener('mouseleave', () => {
      button.style.opacity = '1';
    });
    return button;
  }

  /**
   * Apre il pannello con animazione
   */
  function openPanel() {
    if (panelElement) {
      panelElement.style.transform = 'translateX(0)';
    }
  }

  /**
   * Chiude il pannello con animazione
   */
  function closePanel() {
    if (panelElement) {
      panelElement.style.transform = 'translateX(100%)';
    }
  }

  /**
   * Verifica se il pannello è aperto
   */
  function isPanelOpen() {
    if (!panelElement) return false;
    return panelElement.style.transform === 'translateX(0px)' || 
           panelElement.style.transform === 'translateX(0)';
  }

  /**
   * Genera il Markdown della conversazione
   */
  async function generateMarkdown() {
    if (!textareaElement) return;

    // Mostra messaggio di caricamento
    textareaElement.value = 'Generazione Markdown in corso...\n\nEstrazione della conversazione...';

    try {
      // Attendi un attimo per far vedere il messaggio
      await new Promise(resolve => setTimeout(resolve, 100));

      const { exportConversation } = await loadExporterModule();
      if (typeof exportConversation !== 'function') {
        throw new Error('Funzione di estrazione non disponibile');
      }

      const markdown = await exportConversation();

      if (!markdown || markdown.trim().length === 0) {
        throw new Error('Nessun contenuto estratto. Assicurati di essere su una conversazione ChatGPT attiva.');
      }

      textareaElement.value = markdown;
      
    } catch (error) {
      console.error('Errore durante la generazione del Markdown:', error);
      textareaElement.value = `❌ Errore durante l'export:\n\n${error.message}\n\nVerifica di essere su una conversazione ChatGPT attiva e riprova.`;
    }
  }

  /**
   * Copia il contenuto negli appunti
   */
  async function copyToClipboard() {
    if (!textareaElement || !copyButton) return;

    const content = textareaElement.value;
    
    if (!content || content.includes('Errore durante l\'export')) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      
      // Feedback visivo
      const originalText = copyButton.textContent;
      copyButton.textContent = '✓ Copiato!';
      copyButton.style.background = '#059669';
      
      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.background = '#10b981';
      }, 1500);
      
    } catch (error) {
      console.error('Errore durante la copia:', error);
      copyButton.textContent = '✗ Errore';
      copyButton.style.background = '#dc2626';
      
      setTimeout(() => {
        copyButton.textContent = 'Copia';
        copyButton.style.background = '#10b981';
      }, 1500);
    }
  }

  console.log('ChatGPT → Markdown: Content script caricato');
})();
