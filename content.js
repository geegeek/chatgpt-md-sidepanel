// content.js
// Creates and manages the side panel for Markdown export

(async function() {
  console.log('[Content] Script initialized');

  // Dynamically import utilities
  const { exportConversation } = await import(browser.runtime.getURL('utils/exporter.js'));
  const { detectPlatform } = await import(browser.runtime.getURL('utils/extractors.js'));

  // Detect platform and set color
  const platform = detectPlatform();
  console.log('[Content] Detected platform:', platform);
  
  const platformConfig = {
    'chatgpt': { name: 'ChatGPT', color: '#10a37f' },
    'perplexity': { name: 'Perplexity', color: '#20808d' },
    'claude': { name: 'Claude', color: '#cc785c' }
  };
  
  const config = platformConfig[platform] || { name: 'AI Chat', color: '#10a37f' };
  const platformColor = config.color;
  const platformName = config.name;

  // Variable to track the panel
  let sidePanel = null;

  /**
   * Creates the HTML side panel
   */
  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'chatgpt-md-sidepanel';
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: white;
      border-left: 3px solid ${platformColor};
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      z-index: 999999;
      display: none;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    panel.innerHTML = `
      <div style="padding: 20px; background: ${platformColor}; color: white; position: relative;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 600;">
          ${platformName} → Markdown
        </h2>
        <button id="close-panel" style="
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 24px;
          height: 24px;
        ">×</button>
      </div>

      <div style="padding: 20px; flex: 1; overflow-y: auto; background: #f9f9f9;">
        <pre id="markdown-content" style="
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 12px;
          line-height: 1.5;
          margin: 0;
          background: white;
          padding: 15px;
          border-radius: 5px;
          border: 1px solid #e0e0e0;
        "></pre>
      </div>

      <div style="
        padding: 20px;
        border-top: 1px solid #ddd;
        display: flex;
        gap: 10px;
        background: white;
      ">
        <button id="refresh-md" style="
          flex: 1;
          padding: 12px;
          background: ${platformColor};
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: opacity 0.2s;
        ">🔄 Refresh</button>
        
        <button id="copy-md" style="
          flex: 1;
          padding: 12px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: opacity 0.2s;
        ">📋 Copy</button>
      </div>
    `;

    document.body.appendChild(panel);
    console.log('[Content] Panel created and added to DOM');
    return panel;
  }

  /**
   * Shows or hides the panel
   */
  function togglePanel() {
    if (!sidePanel) {
      sidePanel = createPanel();
      attachEventListeners();
    }

    const isVisible = sidePanel.style.display === 'flex';
    
    if (isVisible) {
      sidePanel.style.display = 'none';
      console.log('[Content] Panel hidden');
    } else {
      sidePanel.style.display = 'flex';
      console.log('[Content] Panel shown');
      refreshMarkdown();
    }
  }

  /**
   * Updates the Markdown content
   */
  async function refreshMarkdown() {
    const contentElement = document.getElementById('markdown-content');
    if (!contentElement) return;

    contentElement.textContent = 'Loading...';
    console.log('[Content] Markdown export in progress...');

    try {
      const markdown = await exportConversation();
      contentElement.textContent = markdown;
      console.log('[Content] Export completed, characters:', markdown.length);
    } catch (error) {
      console.error('[Content] Error during export:', error);
      contentElement.textContent = `❌ Error: ${error.message}`;
    }
  }

  /**
   * Copies Markdown to clipboard
   */
  async function copyToClipboard() {
    const contentElement = document.getElementById('markdown-content');
    const copyButton = document.getElementById('copy-md');
    
    if (!contentElement || !copyButton) return;

    const originalText = copyButton.textContent;

    try {
      await navigator.clipboard.writeText(contentElement.textContent);
      copyButton.textContent = '✅ Copied!';
      copyButton.style.background = '#2196F3';
      console.log('[Content] Markdown copied to clipboard');

      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.background = '#4CAF50';
      }, 2000);
    } catch (error) {
      console.error('[Content] Copy error:', error);
      copyButton.textContent = '❌ Error';
      copyButton.style.background = '#f44336';

      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.background = '#4CAF50';
      }, 2000);
    }
  }

  /**
   * Closes the panel
   */
  function closePanel() {
    if (sidePanel) {
      sidePanel.style.display = 'none';
      console.log('[Content] Panel closed');
    }
  }

  /**
   * Attaches listeners to button events
   */
  function attachEventListeners() {
    const refreshBtn = document.getElementById('refresh-md');
    const copyBtn = document.getElementById('copy-md');
    const closeBtn = document.getElementById('close-panel');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', refreshMarkdown);
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', copyToClipboard);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closePanel);
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (sidePanel && sidePanel.style.display === 'flex') {
        if (!sidePanel.contains(e.target)) {
          closePanel();
        }
      }
    });

    // Hover effect on buttons
    [refreshBtn, copyBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('mouseenter', () => {
          btn.style.opacity = '0.9';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.opacity = '1';
        });
      }
    });

    console.log('[Content] Event listeners attached');
  }

  /**
   * Listener for messages from background script
   */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Content] Message received:', message);

    if (message.action === 'toggle') {
      togglePanel();
      sendResponse({ success: true });
    }
  });

  console.log('[Content] Message listener active');

  // Expose global function for debugging
  window.__exportConversation = exportConversation;
  console.log('[Content] Function __exportConversation exposed for debugging');
})();
