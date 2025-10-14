// utils/selectorManager.js
// Manages selector configurations with automatic updates

const CONFIG_URL = 'https://raw.githubusercontent.com/geegeek/chatgpt-md-sidepanel/main/config/selectors.json';
const LOCAL_STORAGE_KEY = 'selector_config';
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Loads selector configuration from storage or remote
 * @returns {Promise<Object>} Selector configuration
 */
export async function loadSelectorConfig() {
  try {
    // Try to get from local storage first
    const stored = await browser.storage.local.get(LOCAL_STORAGE_KEY);
    
    if (stored[LOCAL_STORAGE_KEY]) {
      console.log('[SelectorManager] Using cached config');
      
      // Check if we should update
      const lastUpdate = stored[LOCAL_STORAGE_KEY].last_fetched || 0;
      const shouldUpdate = Date.now() - lastUpdate > UPDATE_CHECK_INTERVAL;
      
      if (shouldUpdate) {
        // Update in background without blocking
        updateConfigInBackground();
      }
      
      return stored[LOCAL_STORAGE_KEY].config;
    }
    
    // No local config, fetch from remote
    console.log('[SelectorManager] No cached config, fetching remote');
    return await fetchRemoteConfig();
    
  } catch (error) {
    console.error('[SelectorManager] Error loading config:', error);
    // Fallback to bundled config
    return await loadBundledConfig();
  }
}

/**
 * Fetches configuration from remote URL
 * @returns {Promise<Object>} Selector configuration
 */
async function fetchRemoteConfig() {
  try {
    const response = await fetch(CONFIG_URL, {
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const config = await response.json();
    
    // Save to local storage with timestamp
    await browser.storage.local.set({
      [LOCAL_STORAGE_KEY]: {
        config: config,
        last_fetched: Date.now()
      }
    });
    
    console.log('[SelectorManager] Remote config fetched and cached');
    return config;
    
  } catch (error) {
    console.error('[SelectorManager] Failed to fetch remote config:', error);
    return await loadBundledConfig();
  }
}

/**
 * Updates config in background without blocking
 */
function updateConfigInBackground() {
  fetchRemoteConfig().catch(err => {
    console.warn('[SelectorManager] Background update failed:', err);
  });
}

/**
 * Loads bundled fallback configuration
 * @returns {Promise<Object>} Bundled selector configuration
 */
async function loadBundledConfig() {
  console.log('[SelectorManager] Using bundled fallback config');
  
  // Import the bundled config file
  const response = await fetch(browser.runtime.getURL('config/selectors.json'));
  return await response.json();
}

/**
 * Gets selectors for a specific platform
 * @param {string} platform - Platform name ('chatgpt', 'perplexity', 'claude')
 * @returns {Promise<Object>} Platform-specific selectors
 */
export async function getSelectorsForPlatform(platform) {
  const config = await loadSelectorConfig();
  
  if (!config.platforms || !config.platforms[platform]) {
    throw new Error(`No selectors found for platform: ${platform}`);
  }
  
  return config.platforms[platform];
}

/**
 * Forces an immediate config update
 * @returns {Promise<Object>} Updated configuration
 */
export async function forceUpdateConfig() {
  console.log('[SelectorManager] Forcing config update');
  return await fetchRemoteConfig();
}
