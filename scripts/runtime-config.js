(function initializeRuntimeConfig(global) {
  if (global.APP_CONFIG && typeof global.APP_CONFIG === 'object') {
    const { firebase, googleMaps, stripe } = global.APP_CONFIG;
    global.APP_CONFIG = {
      firebase: firebase ? { ...firebase } : undefined,
      googleMaps: googleMaps ? { ...googleMaps } : undefined,
      stripe: stripe ? { ...stripe } : undefined
    };
    return;
  }

  global.APP_CONFIG = {};
  console.warn('[config] No runtime app configuration found. Ensure config/app-config.js is served with production secrets.');
})(window);
