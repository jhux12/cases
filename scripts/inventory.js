// scripts/inventory.js

let shipmentSelection = [];
const selectedItems = new Set();
let currentItems = [];

document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) return (window.location.href = "auth.html");

    const db = firebase.database();
    const userRef = db.ref('users/' + user.uid);

    userRef.once('value').then(snapshot => {
      const data = snapshot.val();
      const balanceEl = document.getElementById('balance-amount');
      if (balanceEl) balanceEl.innerText = Number(data.balance || 0).toLocaleString();
      document.getElementById('username-display').innerText = user.displayName || user.email;
    });

    const inventoryRef = db.ref('users/' + user.uid + '/inventory');
    inventoryRef.once('value').then(snap => {
      if (!snap.exists()) {
        document.getElementById('inventory-container').innerHTML = "<p>You have no items yet.</p>";
        return;
      }

      currentItems = [];
      snap.forEach(child => {
        const item = child.val();
        item.key = child.key;
        item.id = child.key;
        if (!item.requested) currentItems.push(item);
      });

      sortItems('rarity');
      renderItems(currentItems);

      const topThree = [...currentItems].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 3);
      renderShowcase(topThree);
    });

    const ordersRef = db.ref('shipments').orderByChild('userId').equalTo(user.uid);
    ordersRef.once('value').then(snap => {
      const container = document.getElementById('orders-container');
      container.innerHTML = '';
      snap.forEach(order => {
        const data = order.val();
        container.innerHTML += `
          <div class="item-card rounded-lg p-4 text-center">
            <img src="${data.image}" class="mx-auto mb-3 h-24 object-contain rounded shadow" />
            <h2 class="font-bold text-lg text-pink-300">${data.name}</h2>
            <p class="text-sm text-gray-400 mb-2">Status: ${data.status}</p>
            <p class="text-sm text-gray-400">Shipping Info: ${data.shippingInfo?.name}</p>
          </div>`;
      });
    });

    document.getElementById('logout-button')?.addEventListener('click', () => {
      firebase.auth().signOut().then(() => location.href = "index.html");
    });

    document.getElementById('select-all-checkbox')?.addEventListener('change', function () {
      if (this.checked) {
        currentItems.forEach(item => {
          if (!item.shipped && !item.requested) selectedItems.add(item.key);
        });
      } else {
        selectedItems.clear();
      }
      updateTotalValue();
      renderItems(currentItems);
    });

    document.getElementById('sort-select')?.addEventListener('change', function () {
      sortItems(this.value);
    });
  });
});

function sortItems(by) {
  const order = ['common', 'uncommon', 'rare', 'ultra rare', 'legendary'];
  const sorted = [...currentItems];
  if (by === 'value') sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
  else if (by === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
  else sorted.sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
  renderItems(sorted);
}

function updateTotalValue() {
  let total = 0;
  selectedItems.forEach(key => {
    const item = currentItems.find(i => i.key === key);
    if (item) total += Math.floor((item.value || 0) * 0.8);
  });
  document.getElementById('selected-total').innerText = `Total: ${total} coins`;
}

function toggleItem(key) {
  if (selectedItems.has(key)) selectedItems.delete(key);
  else selectedItems.add(key);
  updateTotalValue();
}

function renderItems(items) {
  const container = document.getElementById('inventory-container');
  container.innerHTML = '';

  items.forEach(item => {
    const refund = Math.floor((item.value || 0) * 0.8);
    const checked = selectedItems.has(item.key) ? 'checked' : '';
    container.innerHTML += `
      <div class="item-card rounded-lg p-4 text-center">
        <input type="checkbox" onchange="toggleItem('${item.key}')" ${checked} class="mb-2" ${item.shipped || item.requested ? 'disabled' : ''} />
        <img src="${item.image}" class="mx-auto mb-3 h-24 object-contain rounded shadow" />
        <h2 class="font-bold text-lg text-pink-300">${item.name}</h2>
        <p class="text-sm text-gray-400 mb-2">Rarity: ${item.rarity}</p>
        <p class="text-sm text-gray-400">Value: ${item.value || 0} coins</p>
        <div class="flex justify-center gap-2">
          <button onclick="sellBack('${item.key}', ${item.value || 0})" ${item.shipped || item.requested ? 'disabled class="px-4 py-2 bg-gray-600 cursor-not-allowed rounded-full flex items-center space-x-1"' : 'class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full flex items-center space-x-1"'}>
            <span>Sell for ${refund}</span>
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" width="16" height="16" />
          </button>
          <button onclick="shipItem('${item.key}')" ${item.shipped || item.requested ? 'disabled class="px-4 py-2 bg-gray-600 cursor-not-allowed rounded-full"' : 'class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full"'}>Ship</button>
        </div>
      </div>`;
  });
}

function renderShowcase(items) {
  const container = document.getElementById('showcase-container');
  if (!container) return;
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-400 col-span-full">No pulls to showcase yet.</p>';
    return;
  }

  items.forEach(item => {
    container.innerHTML += `
      <div class="item-card rounded-lg p-6 text-center transform hover:scale-105 transition">
        <img src="${item.image}" class="mx-auto mb-4 h-32 object-contain rounded shadow-lg" />
        <h2 class="font-bold text-xl text-pink-400">${item.name}</h2>
        <p class="text-sm text-gray-300 mt-1">Value: ${item.value || 0} coins</p>
      </div>`;
  });
}

function sellBack(key, value) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const refund = Math.floor(value * 0.8);
  const userRef = firebase.database().ref('users/' + user.uid);
  const itemRef = firebase.database().ref(`users/${user.uid}/inventory/${key}`);

  userRef.once('value').then(snap => {
    const balance = snap.val().balance || 0;
    userRef.update({ balance: balance + refund }).then(() => {
      itemRef.remove().then(() => {
  const sellQuestRef = firebase.database().ref(`users/${user.uid}/quests/sell-card`);
  sellQuestRef.transaction(current => {
    if (!current) {
      return { progress: 1, completed: false, claimed: false };
    }

    const progress = typeof current.progress === 'number' ? current.progress : 0;
    const updated = progress + 1;

    return {
      ...current,
      progress: updated,
      completed: current.completed || updated >= 1
    };
  }, (error, committed, snapshot) => {
    if (error) {
      console.error("Quest update failed:", error);
    } else if (committed) {
      console.log("Sell quest progress updated:", snapshot.val());
    }
    window.location.reload(); // only after transaction completes
  });
});


    });
  });
}

function sellSelected() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  let total = 0;
  selectedItems.forEach(key => {
    const item = currentItems.find(i => i.key === key);
    if (item) total += Math.floor((item.value || 0) * 0.8);
  });

  const userRef = firebase.database().ref('users/' + user.uid);
  userRef.once('value').then(snap => {
    const balance = snap.val().balance || 0;
    userRef.update({ balance: balance + total });

    selectedItems.forEach(key => {
      firebase.database().ref(`users/${user.uid}/inventory/${key}`).remove();
    });

    alert(`Sold selected items for ${total} coins.`);
    window.location.reload();
  });
}

function shipSelected() {
  shipmentSelection = [];
  selectedItems.forEach(key => {
    const item = currentItems.find(i => i.key === key);
    if (item) shipmentSelection.push(item);
  });

  if (shipmentSelection.length === 0) return alert("Select items to ship.");

  const cost = shipmentSelection.length <= 5 ? shipmentSelection.length * 500 : 2500;
  document.getElementById('shipment-cost').innerText = `Shipping ${shipmentSelection.length} item(s) will cost ${cost} coins.`;
  document.getElementById('shipment-popup').classList.remove('hidden');
}

function shipItem(key) {
  const item = currentItems.find(i => i.key === key);
  if (!item || item.shipped || item.requested) return;
  shipmentSelection = [item];
  const cost = 500;
  document.getElementById('shipment-cost').innerText = `Shipping 1 item will cost ${cost} coins.`;
  document.getElementById('shipment-popup').classList.remove('hidden');
}

function closeShipmentPopup() {
  document.getElementById('shipment-popup').classList.add('hidden');
}

function submitShipmentRequest() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const name = document.getElementById('ship-name').value.trim();
  const address = document.getElementById('ship-address').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const zip = document.getElementById('ship-zip').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();

  if (!name || !address || !city || !zip) return alert("Please fill out all fields.");

  const cost = shipmentSelection.length <= 5 ? shipmentSelection.length * 500 : 2500;
  const userRef = firebase.database().ref('users/' + user.uid);

  userRef.once('value').then(snap => {
    const balance = snap.val().balance || 0;
    if (balance < cost) return alert("Insufficient balance.");

    userRef.update({ balance: balance - cost });

    shipmentSelection.forEach(item => {
      if (!item.id) return;
      firebase.database().ref('shipments').push({
        userId: user.uid,
        itemId: item.id,
        name: item.name,
        image: item.image,
        shippingInfo: { name, address, city, zip, phone },
        status: 'Requested',
        timestamp: Date.now()
      });
      firebase.database().ref(`users/${user.uid}/inventory/${item.id}`).update({ requested: true });
    });

    closeShipmentPopup();
    window.location.reload();
  });
}
