// scripts/inventory.js

const selectedItems = new Set();
let currentItems = [];
let popupRotX = 0;
let popupRotY = 0;
let currentRotX = 0;
let currentRotY = 0;
let targetRotX = 0;
let targetRotY = 0;
const MAX_ROT = 30;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
let isDragging = false;
let startX = 0;
let startY = 0;

document.addEventListener('DOMContentLoaded', () => {
  const itemPopup = document.getElementById('item-popup');
  const popupRotator = document.getElementById('popup-rotator');
  const holoOverlay = document.getElementById('holo-overlay');
  document.getElementById('close-item-popup')?.addEventListener('click', closeItemPopup);
  itemPopup?.addEventListener('click', e => { if (e.target === itemPopup) closeItemPopup(); });

  popupRotator?.addEventListener('pointerdown', e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    popupRotator.setPointerCapture(e.pointerId);
    popupRotator.classList.add('grabbing');
    targetRotX = popupRotX;
    targetRotY = popupRotY;
    e.preventDefault();
  });

  popupRotator?.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    targetRotY = clamp(popupRotY + dx / 3, -MAX_ROT, MAX_ROT);
    targetRotX = clamp(popupRotX - dy / 3, -MAX_ROT, MAX_ROT);
    e.preventDefault();
  });

  const endDrag = e => {
    if (!isDragging) return;
    popupRotY = targetRotY;
    popupRotX = targetRotX;
    isDragging = false;
    popupRotator.classList.remove('grabbing');
    e.preventDefault();
  };
  popupRotator?.addEventListener('pointerup', endDrag);
  popupRotator?.addEventListener('pointerleave', endDrag);

  const animate = () => {
    currentRotX += (targetRotX - currentRotX) * 0.1;
    currentRotY += (targetRotY - currentRotY) * 0.1;
    popupRotator.style.transform = `rotateY(${currentRotY}deg) rotateX(${currentRotX}deg)`;
    holoOverlay?.style.setProperty('--x', `${50 + currentRotY / 2}%`);
    holoOverlay?.style.setProperty('--y', `${50 + currentRotX / 2}%`);
    requestAnimationFrame(animate);
  };
  if (popupRotator) requestAnimationFrame(animate);

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
          <div class="item-card rounded-2xl p-6 text-center h-full">
            <img src="${data.image}" class="mx-auto mb-4 h-24 object-contain rounded shadow-lg" />
            <h2 class="item-name font-semibold text-lg text-gray-800">${data.name}</h2>
            <p class="text-sm text-gray-600 mb-1 capitalize">Status: ${data.status}</p>
            <p class="text-sm text-gray-600 mt-auto">Shipping Info: ${data.shippingInfo?.name || ''}</p>
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
    const rarityClassMap = { 'common': 'common', 'uncommon': 'uncommon', 'rare': 'rare', 'ultra rare': 'ultra', 'legendary': 'legendary' };
    const rarityClass = rarityClassMap[item.rarity] || 'common';
    container.innerHTML += `
      <div class="item-card rounded-2xl p-6 text-center h-full">
        <input type="checkbox" onchange="toggleItem('${item.key}')" ${checked} class="mb-3 accent-indigo-600" ${item.shipped || item.requested ? 'disabled' : ''} />
        <img src="${item.image}" onclick="showItemPopup('${encodeURIComponent(item.image)}')" class="mx-auto mb-4 h-32 object-contain rounded shadow-lg cursor-pointer transition-transform duration-300 hover:rotate-2 hover:scale-110" />
        <h2 class="item-name font-semibold text-gray-800 text-lg">${item.name}</h2>
        <span class="pill ${rarityClass}">${item.rarity}</span>
        <p class="text-sm text-gray-600 mb-3 flex items-center justify-center gap-1">
          <span>Value: ${item.value || 0}</span>
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" width="16" height="16" class="coin-icon" />
        </p>
        <div class="flex gap-2 mt-auto">
          <button onclick="sellBack('${item.key}', ${item.value || 0})" ${item.shipped || item.requested ? 'disabled class="flex-1 px-3 py-1.5 text-sm bg-gray-300 text-gray-500 cursor-not-allowed rounded-full flex items-center justify-center gap-1"' : 'class="flex-1 px-3 py-1.5 text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-600 rounded-full flex items-center justify-center gap-1 whitespace-nowrap"'}>
            <span>Sell for ${refund}</span>
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" width="14" height="14" class="coin-icon" />
          </button>
          <button onclick="shipItem('${item.key}')" ${item.shipped || item.requested ? 'disabled class="flex-1 px-3 py-1.5 text-sm bg-gray-300 text-gray-500 cursor-not-allowed rounded-full whitespace-nowrap"' : 'class="flex-1 px-3 py-1.5 text-sm text-white bg-gradient-to-r from-green-400 to-teal-500 hover:from-teal-500 hover:to-green-400 rounded-full whitespace-nowrap"'}>Ship</button>
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
  const rotator = document.getElementById('popup-rotator');
  const holo = document.getElementById('holo-overlay');
  if (!img || !rotator) return;
  img.src = src;
  popupRotX = 0;
  popupRotY = 0;
  currentRotX = 0;
  currentRotY = 0;
  targetRotX = 0;
  targetRotY = 0;
  rotator.style.transform = 'rotateY(0deg) rotateX(0deg)';
  holo?.style.setProperty('--x', '50%');
  holo?.style.setProperty('--y', '50%');
  rotator.classList.remove('grabbing');
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
