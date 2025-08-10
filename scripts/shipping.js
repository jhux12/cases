// scripts/shipping.js
let shipmentSelection = [];

function initAddressAutocomplete() {
  const addressInput = document.getElementById('ship-address');
  if (!addressInput || !window.google || !google.maps?.places) return;

  // Google sometimes toggles readOnly on mobile, which hides the keyboard.
  // Force the field to stay editable whenever it gains focus or receives input.
  const keepEditable = () => { addressInput.readOnly = false; };
  addressInput.addEventListener('focus', keepEditable);
  addressInput.addEventListener('keydown', keepEditable);

  const autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ['address'],
    fields: ['address_components']
  });
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place || !place.address_components) return;
    let street = '', city = '', zip = '';
    place.address_components.forEach(component => {
      const types = component.types;
      if (types.includes('street_number')) street = component.long_name + ' ' + street;
      if (types.includes('route')) street += component.long_name;
      if (types.includes('locality')) city = component.long_name;
      if (types.includes('postal_town') && !city) city = component.long_name;
      if (types.includes('postal_code')) zip = component.long_name;
    });
    if (street) addressInput.value = street;
    const cityInput = document.getElementById('ship-city');
    if (cityInput && city) cityInput.value = city;
    const zipInput = document.getElementById('ship-zip');
    if (zipInput && zip) zipInput.value = zip;
    setTimeout(() => {
      addressInput.focus();
      const len = addressInput.value.length;
      addressInput.setSelectionRange(len, len);
    }, 0);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const stored = localStorage.getItem('shipItems');
  if (!stored) return window.location.href = 'inventory.html';
  shipmentSelection = JSON.parse(stored);
  const cost = shipmentSelection.length <= 5 ? shipmentSelection.length * 500 : 2500;
  document.getElementById('shipment-cost').innerText = `Shipping ${shipmentSelection.length} item(s) will cost ${cost} coins.`;

  firebase.auth().onAuthStateChanged(user => {
    if (!user) return window.location.href = 'auth.html';
    firebase.database().ref('users/' + user.uid).once('value').then(snapshot => {
      const data = snapshot.val() || {};
      const uname = data.username || user.displayName || user.email;
      const usernameInput = document.getElementById('ship-username');
      if (usernameInput) usernameInput.value = uname;
    });
  });

  initAddressAutocomplete();
  document.getElementById('ship-address')?.focus();
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

  userRef.once('value').then(snap => {
    const balance = snap.val()?.balance || 0;
    if (balance < cost) return alert('Insufficient balance.');

    userRef.update({ balance: balance - cost });

    shipmentSelection.forEach(item => {
      if (!item.id) return;
      firebase.database().ref('shipments').push({
        userId: user.uid,
        itemId: item.id,
        name: item.name,
        image: item.image,
        shippingInfo: { name, address, address2, city, zip, phone },
        status: 'Requested',
        timestamp: Date.now()
      });
      firebase.database().ref(`users/${user.uid}/inventory/${item.id}`).update({ requested: true });
    });

    localStorage.removeItem('shipItems');
    window.location.href = 'inventory.html';
  });
}

function cancelShipping() {
  localStorage.removeItem('shipItems');
  window.location.href = 'inventory.html';
}
