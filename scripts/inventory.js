// scripts/inventory.js

const selectedItems = new Set();
let currentItems = [];

document.addEventListener('DOMContentLoaded', () => {
  const itemPopup = document.getElementById('item-popup');
  document.getElementById('close-item-popup')?.addEventListener('click', closeItemPopup);
  itemPopup?.addEventListener('click', e => { if (e.target === itemPopup) closeItemPopup(); });

  const inventoryTab = document.getElementById('inventory-tab');
  const ordersTab = document.getElementById('orders-tab');
  const inventorySection = document.getElementById('inventory-section');
  const ordersSection = document.getElementById('orders-section');

  inventoryTab?.addEventListener('click', () => {
    inventoryTab.classList.add('bg-gradient-to-r','from-fuchsia-500','via-pink-500','to-amber-400');
    inventoryTab.classList.remove('bg-white/20');
    ordersTab.classList.remove('bg-gradient-to-r','from-fuchsia-500','via-pink-500','to-amber-400');
    ordersTab.classList.add('bg-white/20');
    ordersSection.classList.add('hidden');
    inventorySection.classList.remove('hidden');
  });

  ordersTab?.addEventListener('click', () => {
    ordersTab.classList.add('bg-gradient-to-r','from-fuchsia-500','via-pink-500','to-amber-400');
    ordersTab.classList.remove('bg-white/20');
    inventoryTab.classList.remove('bg-gradient-to-r','from-fuchsia-500','via-pink-500','to-amber-400');
    inventoryTab.classList.add('bg-white/20');
    inventorySection.classList.add('hidden');
    ordersSection.classList.remove('hidden');
  });

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

    // Load badges from Firestore
    firebase.firestore().collection('leaderboard').doc(user.uid).get().then(doc => {
      const badgeData = doc.data() || {};
      const badges = badgeData.badges || [];
      const container = document.getElementById('badge-container');
      if (!container) return;
      if (badges.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400">No badges yet.</p>';
      } else {
        container.innerHTML = badges
          .map(b => `<span class="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">${b}</span>`)
          .join(' ');
      }
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
    });

    const ordersRef = db.ref('shipments').orderByChild('userId').equalTo(user.uid);
    ordersRef.once('value').then(snap => {
      const container = document.getElementById('orders-container');
      container.innerHTML = '';
      snap.forEach(order => {
        const data = order.val();
        container.innerHTML += `
          <div class="item-card rounded-2xl p-6 text-center">
            <img src="${data.image}" class="mx-auto mb-4 h-24 object-contain rounded shadow-lg" />
            <h2 class="font-bold text-xl text-yellow-300">${data.name}</h2>
            <p class="text-sm text-pink-200 mb-1">Status: ${data.status}</p>
            <p class="text-sm text-pink-200">Shipping Info: ${data.shippingInfo?.name}</p>
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
      <div class="item-card rounded-2xl p-6 text-center">
        <input type="checkbox" onchange="toggleItem('${item.key}')" ${checked} class="mb-3 accent-pink-500" ${item.shipped || item.requested ? 'disabled' : ''} />
        <img src="${item.image}" onclick="showItemPopup('${encodeURIComponent(item.image)}')" class="mx-auto mb-4 h-28 object-contain rounded shadow-lg cursor-pointer transition-transform duration-300 hover:rotate-2 hover:scale-110" />
        <h2 class="font-bold text-xl text-yellow-300">${item.name}</h2>
        <p class="text-sm text-pink-200 mb-1">Rarity: ${item.rarity}</p>
        <p class="text-sm text-pink-200 mb-3">Value: ${item.value || 0} coins</p>
        <div class="flex justify-center gap-3">
          <button onclick="sellBack('${item.key}', ${item.value || 0})" ${item.shipped || item.requested ? 'disabled class="px-4 py-2 bg-gray-600 cursor-not-allowed rounded-full flex items-center space-x-1"' : 'class="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-pink-600 hover:to-red-500 rounded-full flex items-center space-x-1"'}>
            <span>Sell for ${refund}</span>
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" width="16" height="16" />
          </button>
          <button onclick="shipItem('${item.key}')" ${item.shipped || item.requested ? 'disabled class="px-4 py-2 bg-gray-600 cursor-not-allowed rounded-full"' : 'class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-500 rounded-full"'}>Ship</button>
        </div>
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
    const balanceBefore = snap.val().balance || 0;
    const balanceAfter = balanceBefore + refund;
    userRef.update({ balance: balanceAfter }).then(() => {
      itemRef.once('value').then(itemSnap => {
        const itemData = itemSnap.val();
        if (itemData) {
          const historyRef = firebase.database().ref(`users/${user.uid}/unboxHistory/${key}`);
          historyRef.once('value').then(histSnap => {
            const updateData = {
              sold: true,
              saleBalanceBefore: balanceBefore,
              saleBalanceAfter: balanceAfter,
              soldTimestamp: Date.now()
            };
            if (histSnap.exists()) historyRef.update(updateData);
            else {
              const { key: _k, id: _i, ...base } = itemData;
              historyRef.set({ ...base, ...updateData });
            }
          });
        }
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
    let currentBalance = snap.val().balance || 0;

    selectedItems.forEach(key => {
      const item = currentItems.find(i => i.key === key);
      if (item) {
        const refund = Math.floor((item.value || 0) * 0.8);
        const before = currentBalance;
        currentBalance += refund;
        const historyRef = firebase.database().ref(`users/${user.uid}/unboxHistory/${key}`);
        historyRef.once('value').then(histSnap => {
          const updateData = {
            sold: true,
            saleBalanceBefore: before,
            saleBalanceAfter: currentBalance,
            soldTimestamp: Date.now()
          };
          if (histSnap.exists()) historyRef.update(updateData);
          else {
            const { key: _k, id: _i, ...base } = item;
            historyRef.set({ ...base, ...updateData });
          }
        });
        firebase.database().ref(`users/${user.uid}/inventory/${key}`).remove();

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
        });
      }
    });

    userRef.update({ balance: currentBalance }).then(() => {
      alert(`Sold selected items for ${total} coins.`);
      window.location.reload();
    });
  });
}

function shipSelected() {
  const shipmentSelection = [];
  selectedItems.forEach(key => {
    const item = currentItems.find(i => i.key === key);
    if (item) shipmentSelection.push({ id: item.id, name: item.name, image: item.image });
  });

  if (shipmentSelection.length === 0) return alert("Select items to ship.");

  localStorage.setItem('shipItems', JSON.stringify(shipmentSelection));
  window.location.href = 'shipping.html';
}

function shipItem(key) {
  const item = currentItems.find(i => i.key === key);
  if (!item || item.shipped || item.requested) return;
  const shipmentSelection = [{ id: item.id, name: item.name, image: item.image }];
  localStorage.setItem('shipItems', JSON.stringify(shipmentSelection));
  window.location.href = 'shipping.html';
}

function showItemPopup(encodedSrc) {
  const src = decodeURIComponent(encodedSrc);
  const img = document.getElementById('popup-item-image');
  if (!img) return;
  img.src = src;
  const popup = document.getElementById('item-popup');
  const card = popup?.querySelector('.popup-card');
  popup?.classList.remove('hidden');
  if (card) {
    card.classList.remove('animate');
    void card.offsetWidth;
    card.classList.add('animate');
  }
}

function closeItemPopup() {
  document.getElementById('item-popup')?.classList.add('hidden');
}
