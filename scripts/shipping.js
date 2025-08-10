// scripts/shipping.js
let shipmentSelection = [];

let currentAddressSuggestions = [];

function initAddressAutocomplete() {
  const addressInput = document.getElementById('ship-address');
  const datalist = document.getElementById('address-suggestions');
  if (!addressInput || !datalist) return;

  addressInput.addEventListener('input', function () {
    const query = addressInput.value.trim();
    if (query.length < 3) {
      datalist.innerHTML = '';
      currentAddressSuggestions = [];
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        currentAddressSuggestions = data;
        datalist.innerHTML = '';
        data.forEach(place => {
          const option = document.createElement('option');
          option.value = place.display_name;
          datalist.appendChild(option);
        });
      })
      .catch(() => {});
  });

  addressInput.addEventListener('change', function () {
    const match = currentAddressSuggestions.find(p => p.display_name === addressInput.value);
    if (match && match.address) {
      const cityInput = document.getElementById('ship-city');
      const zipInput = document.getElementById('ship-zip');
      const addr = match.address;
      if (cityInput) cityInput.value = addr.city || addr.town || addr.village || '';
      if (zipInput) zipInput.value = addr.postcode || '';

      setTimeout(function () {
        addressInput.focus();
        const len = addressInput.value.length;
        addressInput.setSelectionRange(len, len);
      }, 0);
    }
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
