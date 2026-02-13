// Set the Google Maps API key from runtime configuration
(function configureGoogleMaps(global) {
  const key = global.APP_CONFIG?.googleMaps?.apiKey;
  if (typeof key === 'string' && key.trim()) {
    global.GOOGLE_MAPS_API_KEY = key.trim();
  } else {
    global.GOOGLE_MAPS_API_KEY = '';
    console.warn('[maps-api-key] Google Maps API key not provided; autocomplete disabled.');
  }
})(window);
