// scripts/shipping.js
let shipmentSelection = [];

function loadGoogleMaps(apiKey) {
  return new Promise(resolve => {
    if (!apiKey) {
      console.warn('Google Maps API key missing');
      return resolve();
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta&callback=initAddressAutocomplete`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

async function initAddressAutocomplete() {
  const addressInput = document.getElementById('ship-address');
  if (!addressInput || !window.google) return;

  const { Autocomplete } = await google.maps.importLibrary('places');
  const autocomplete = new Autocomplete(addressInput, {
    fields: ['address_components'],
    types: ['address'],
    componentRestrictions: { country: 'us' }
  });

  addressInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.address_components) return;

    let street = '';
    let city = '';
    let zip = '';

    place.address_components.forEach(comp => {
      const types = comp.types;
      if (types.includes('street_number')) street = comp.long_name + ' ' + street;
      else if (types.includes('route')) street += comp.long_name;
      else if (types.includes('locality')) city = comp.long_name;
      else if (types.includes('postal_code')) zip = comp.long_name;
    });

    addressInput.value = street.trim();
    const cityInput = document.getElementById('ship-city');
    const zipInput = document.getElementById('ship-zip');
    if (cityInput) cityInput.value = city;
    if (zipInput) zipInput.value = zip;

    setTimeout(() => {
      addressInput.focus();
      const len = addressInput.value.length;
      addressInput.setSelectionRange(len, len);
    }, 0);
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  const stored = localStorage.getItem('shipItems');
  if (!stored) return window.location.href = 'inventory.html';
  shipmentSelection = JSON.parse(stored);
  const cost = shipmentSelection.length <= 5 ? shipmentSelection.length * 500 : 2500;
  document.getElementById('shipment-cost').innerText = `Shipping ${shipmentSelection.length} item(s) will cost ${cost} coins.`;

  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) return window.location.href = 'auth.html';
    firebase.database().ref('users/' + user.uid).once('value').then(function (snapshot) {
      const data = snapshot.val() || {};
      const uname = data.username || user.displayName || user.email;
      const usernameInput = document.getElementById('ship-username');
      if (usernameInput) usernameInput.value = uname;
    });
  });

  await loadGoogleMaps(window.GOOGLE_MAPS_API_KEY);
  const addressField = document.getElementById('ship-address');
  if (addressField) addressField.focus();
});

function submitShipmentRequest() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const name = document.getElementById('ship-name').value.trim();
  const address = document.getElementById('ship-address').value.trim();
  const address2 = document.getElementById('ship-address2').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const zip = document.getElementById('ship-zip').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();

  if (!name || !address || !city || !zip) return showToast('Please fill out all fields.', 'error');

  const cost = shipmentSelection.length <= 5 ? shipmentSelection.length * 500 : 2500;
  const userRef = firebase.database().ref('users/' + user.uid);

  userRef.once('value').then(function (snap) {
    const balance = (snap.val() && snap.val().balance) || 0;
    if (balance < cost) return showToast('Insufficient balance.', 'error');

    userRef.update({ balance: balance - cost });

    shipmentSelection.forEach(function (item) {
      if (!item.id) return;
      firebase.database().ref('shipments').push({
        userId: user.uid,
        itemId: item.id,
        name: item.name,
        image: item.image,
        shippingInfo: { name: name, address: address, address2: address2, city: city, zip: zip, phone: phone },
        status: 'Requested',
        timestamp: Date.now()
      });
      firebase.database().ref('users/' + user.uid + '/inventory/' + item.id).update({ requested: true });
    });

    localStorage.removeItem('shipItems');
    window.location.href = 'inventory.html';
  });
}

function cancelShipping() {
  localStorage.removeItem('shipItems');
  window.location.href = 'inventory.html';
}
