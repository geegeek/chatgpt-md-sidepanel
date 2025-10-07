// background.js - Service Worker per gestire il clic sull'icona

browser.action.onClicked.addListener(async (tab) => {
  try {
    // Verifica che siamo su ChatGPT
    if (!tab.url.includes('chat.openai.com') && !tab.url.includes('chatgpt.com')) {
      console.log('Non siamo su ChatGPT, ignoro il clic');
      return;
    }

    // Invia messaggio al content script per toggle del pannello
    await browser.tabs.sendMessage(tab.id, {
      action: 'toggleSidePanel'
    });
    
  } catch (error) {
    console.error('Errore nel background script:', error);
    
    // Se il content script non risponde, potrebbe non essere ancora caricato
    // Ricarica il tab (fallback)
    if (error.message.includes('Receiving end does not exist')) {
      console.log('Content script non trovato, ricarico la pagina...');
      await browser.tabs.reload(tab.id);
    }
  }
});

console.log('ChatGPT → Markdown: Background service worker attivo');