// scripts/shipping.js
let shipmentSelection = [];

function initAddressAutocomplete(attempt = 0) {
  const addressInput = document.getElementById('ship-address');
  if (!addressInput) return;

  if (!window.google || !google.maps || !google.maps.places) {
    // If the Google script hasn't loaded yet, retry a few times.
    if (attempt < 10) setTimeout(() => initAddressAutocomplete(attempt + 1), 500);
    return;
  }

  // Google sometimes toggles readOnly on mobile, which hides the keyboard.
  // Force the field to stay editable whenever it gains focus or receives input.
  const keepEditable = function () { addressInput.readOnly = false; };
  addressInput.addEventListener('focus', keepEditable);
  addressInput.addEventListener('keydown', keepEditable);
  addressInput.addEventListener('input', keepEditable);

  const autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ['address'],
    fields: ['address_components']
  });

  autocomplete.addListener('place_changed', function () {
    const place = autocomplete.getPlace();
    if (!place || !place.address_components) return;

    let street = '', city = '', zip = '';
    place.address_components.forEach(function (component) {
      const types = component.types;
      if (types.indexOf('street_number') !== -1) street = component.long_name + ' ' + street;
      if (types.indexOf('route') !== -1) street += component.long_name;
      if (types.indexOf('locality') !== -1) city = component.long_name;
      if (types.indexOf('postal_town') !== -1 && !city) city = component.long_name;
      if (types.indexOf('postal_code') !== -1) zip = component.long_name;
    });

    if (street) addressInput.value = street;
    const cityInput = document.getElementById('ship-city');
    if (city && cityInput) cityInput.value = city;
    const zipInput = document.getElementById('ship-zip');
    if (zip && zipInput) zipInput.value = zip;

    setTimeout(function () {
      addressInput.focus();
      var len = addressInput.value.length;
      addressInput.setSelectionRange(len, len);
    }, 0);
  });
}

document.addEventListener('DOMContentLoaded', function () {
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

  initAddressAutocomplete();
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

  if (!name || !address || !city || !zip) return alert('Please fill out all fields.');

  const cost = shipmentSelection.length <= 5 ? shipmentSelection.length * 500 : 2500;
  const userRef = firebase.database().ref('users/' + user.uid);

  userRef.once('value').then(function (snap) {
    const balance = (snap.val() && snap.val().balance) || 0;
    if (balance < cost) return alert('Insufficient balance.');

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
