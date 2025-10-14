// browser-polyfill.js
// Minimal Promise-based polyfill to expose a `browser` API on Chrome

(function() {
  if (typeof globalThis.browser !== 'undefined') {
    return;
  }

  const chromeAPI = globalThis.chrome;
  if (typeof chromeAPI === 'undefined') {
    return;
  }

  const promisify = (fn, thisArg) => {
    if (typeof fn !== 'function') {
      return undefined;
    }

    return (...args) => {
      return new Promise((resolve, reject) => {
        try {
          fn.call(thisArg, ...args, (result) => {
            const error = chromeAPI.runtime?.lastError;
            if (error) {
              reject(new Error(error.message));
            } else {
              resolve(result);
            }
          });
        } catch (err) {
          reject(err);
        }
      });
    };
  };

  const storageSync = chromeAPI.storage?.sync;
  const storageLocal = chromeAPI.storage?.local;

  const browserAPI = {
    ...chromeAPI,
    runtime: {
      ...chromeAPI.runtime,
      sendMessage: promisify(chromeAPI.runtime?.sendMessage, chromeAPI.runtime),
      getURL: chromeAPI.runtime?.getURL?.bind(chromeAPI.runtime)
    },
    tabs: {
      ...chromeAPI.tabs,
      sendMessage: promisify(chromeAPI.tabs?.sendMessage, chromeAPI.tabs),
      reload: promisify(chromeAPI.tabs?.reload, chromeAPI.tabs)
    },
    storage: {
      ...chromeAPI.storage,
      sync: {
        ...storageSync,
        get: promisify(storageSync?.get, storageSync),
        set: promisify(storageSync?.set, storageSync),
        remove: promisify(storageSync?.remove, storageSync)
      },
      local: {
        ...storageLocal,
        get: promisify(storageLocal?.get, storageLocal),
        set: promisify(storageLocal?.set, storageLocal),
        remove: promisify(storageLocal?.remove, storageLocal)
      }
    },
    browserAction: chromeAPI.action || chromeAPI.browserAction
  };

  globalThis.browser = browserAPI;
})();
