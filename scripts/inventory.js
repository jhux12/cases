// scripts/inventory.js

const selectedItems = new Set();
let currentItems = [];
let currentSort = 'rarity';
const filters = {
  search: '',
  rarity: 'all',
  status: 'all'
};

const VOUCHER_NAME_PATTERN = /voucher/i;

function getSellRefund(prize = {}) {
  const effectiveValue = getEffectiveValue(prize);
  if (!Number.isFinite(effectiveValue) || effectiveValue <= 0) return 0;
  if (isVoucherItem(prize)) return Math.round(effectiveValue);
  return Math.floor(effectiveValue * 0.8);
}

function getVoucherAmount(prize = {}) {
  const candidates = [prize.voucherAmount, prize.redeemValue, prize.redeemAmount];
  for (const value of candidates) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) return Math.round(amount);
  }
  return 0;
}

function isVoucherItem(prize = {}) {
  if (prize.isVoucher === true) return true;
  const type = typeof prize.type === 'string' ? prize.type.toLowerCase() : '';
  if (type === 'voucher') return true;
  if (getVoucherAmount(prize) > 0) return true;
  if (Array.isArray(prize.tags) && prize.tags.some(tag => typeof tag === 'string' && tag.toLowerCase() === 'voucher')) return true;
  if (typeof prize.name === 'string' && VOUCHER_NAME_PATTERN.test(prize.name)) return true;
  return false;
}

function getEffectiveValue(prize = {}) {
  const baseValue = Number(prize.value) || 0;
  const voucherAmount = getVoucherAmount(prize);
  if (isVoucherItem(prize) && voucherAmount > 0) return voucherAmount;
  return baseValue;
}
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
    if (holoOverlay) holoOverlay.style.opacity = '1';
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
    popupRotY = 0;
    popupRotX = 0;
    targetRotX = 0;
    targetRotY = 0;
    isDragging = false;
    popupRotator.classList.remove('grabbing');
    if (holoOverlay) holoOverlay.style.opacity = '0';
    e.preventDefault();
  };
  popupRotator?.addEventListener('pointerup', endDrag);
  popupRotator?.addEventListener('pointerleave', endDrag);

  const animate = () => {
    currentRotX += (targetRotX - currentRotX) * 0.1;
    currentRotY += (targetRotY - currentRotY) * 0.1;
    popupRotator.style.transform = `rotateY(${currentRotY}deg) rotateX(${currentRotX}deg)`;
    if (holoOverlay) {
      holoOverlay.style.setProperty('--x', `${50 + currentRotY / 2}%`);
      holoOverlay.style.setProperty('--y', `${50 + currentRotX / 2}%`);
      holoOverlay.style.backgroundPosition = `${50 - currentRotY}% ${50 + currentRotX}%`;
      holoOverlay.style.filter = `hue-rotate(${currentRotY * 2}deg) saturate(1.5) brightness(1.1)`;
    }
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
        currentItems.push(item);
      });

      sortItems('rarity');
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
      refreshInventoryView();
    });

    document.getElementById('sort-select')?.addEventListener('change', function () {
      sortItems(this.value);
    });

    document.getElementById('search-input')?.addEventListener('input', function () {
      filters.search = this.value;
      refreshInventoryView();
    });

    document.getElementById('rarity-filter')?.addEventListener('change', function () {
      filters.rarity = this.value;
      refreshInventoryView();
    });

    document.getElementById('status-filter')?.addEventListener('change', function () {
      filters.status = this.value;
      refreshInventoryView();
    });
  });
});

function normalizeRarity(rarity = '') {
  return rarity.toLowerCase();
}

function sortItems(by) {
  currentSort = by;
  refreshInventoryView();
}

function sortList(items) {
  const order = ['common', 'uncommon', 'rare', 'ultra rare', 'legendary'];
  const sorted = [...items];
  if (currentSort === 'value') sorted.sort((a, b) => (getEffectiveValue(b) || 0) - (getEffectiveValue(a) || 0));
  else if (currentSort === 'name') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  else sorted.sort((a, b) => {
    const rankA = order.indexOf(normalizeRarity(a.rarity));
    const rankB = order.indexOf(normalizeRarity(b.rarity));
    const safeA = rankA === -1 ? order.length : rankA;
    const safeB = rankB === -1 ? order.length : rankB;
    return safeA - safeB;
  });
  return sorted;
}

function filterItems(items) {
  const search = filters.search.trim().toLowerCase();
  return items.filter(item => {
    if (search) {
      const haystack = `${item.name || ''} ${item.set || ''} ${item.collection || ''}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.rarity !== 'all' && normalizeRarity(item.rarity) !== filters.rarity) return false;

    const isVoucher = isVoucherItem(item);
    if (filters.status === 'ready' && (item.shipped || item.requested || isVoucher)) return false;
    if (filters.status === 'shipped' && !item.shipped) return false;
    if (filters.status === 'requested' && !item.requested) return false;
    if (filters.status === 'voucher' && !isVoucher) return false;

    return true;
  });
}

function refreshInventoryView() {
  const filtered = filterItems(currentItems);
  const sorted = sortList(filtered);
  renderItems(sorted);
  updateInventoryStats();
}

function updateInventoryStats() {
  const total = currentItems.length;
  const ready = currentItems.filter(item => !item.shipped && !item.requested && !isVoucherItem(item)).length;
  const vouchers = currentItems.filter(isVoucherItem).length;
  const totalValue = currentItems.reduce((sum, item) => sum + getEffectiveValue(item), 0);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('stat-total-items', total);
  setText('stat-ready', ready);
  setText('stat-vouchers', vouchers);
  const valueEl = document.getElementById('stat-value');
  if (valueEl) valueEl.firstChild.nodeValue = `${totalValue} `;
}

function updateTotalValue() {
  let total = 0;
  selectedItems.forEach(key => {
    const item = currentItems.find(i => i.key === key);
    if (item) total += getSellRefund(item);
  });
  document.getElementById('selected-total').innerText = `Total: ${total} gems`;
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
    const voucherAmount = getVoucherAmount(item);
    const isVoucher = isVoucherItem(item);
    const baseValue = Number(item.value) || 0;
    const effectiveValue = isVoucher && voucherAmount > 0 ? voucherAmount : baseValue;
    const refund = getSellRefund(item);
    const checked = selectedItems.has(item.key) ? 'checked' : '';
    const disabled = item.shipped || item.requested;
    const selectLabelClass = `select-toggle ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`;
    const statusBadge = item.shipped
      ? '<span class="status-badge shipped">Shipped</span>'
      : item.requested
        ? '<span class="status-badge requested">Shipment Requested</span>'
        : '';
    const rarityKey = (item.rarity || '').toLowerCase();
    const rarityClassMap = {
      'common': 'common',
      'uncommon': 'uncommon',
      'rare': 'rare',
      'super rare': 'rare',
      'ultra rare': 'ultra',
      'ultra': 'ultra',
      'legendary': 'legendary',
      'mythic': 'legendary'
    };
    const rarityBadge = item.rarity
      ? `<span class="pill ${rarityClassMap[rarityKey] || 'common'}">${item.rarity}</span>`
      : '';
    const valueBadge = `<span class="value-chip">Value ${effectiveValue} <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" width="14" height="14" class="gem-icon" alt="Gems" /></span>`;
    const shipMarkup = (() => {
      if (isVoucher && !disabled) {
        return '<span class="muted-chip">Voucher — Redeem Only</span>';
      }
      if (disabled) {
        return `<button class="action-button ship-button" disabled>Ship</button>`;
      }
      return `<button onclick="shipItem('${item.key}')" class="action-button ship-button">Ship</button>`;
    })();
    container.innerHTML += `
      <article class="item-card">
        <div class="flex items-start justify-between gap-3">
          <label class="${selectLabelClass}">
            <input type="checkbox" onchange="toggleItem('${item.key}')" ${checked} class="accent-indigo-600" ${disabled ? 'disabled' : ''} />
            <span>Select</span>
          </label>
          ${statusBadge}
        </div>
        <div class="item-thumbnail" onclick="showItemPopup('${encodeURIComponent(item.image)}','${encodeURIComponent(item.name)}','${encodeURIComponent(item.rarity)}', ${effectiveValue}, ${isVoucher}, ${voucherAmount})">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="item-name">${item.name}</h2>
          <div class="flex flex-wrap items-center gap-2">
            ${rarityBadge}
            ${valueBadge}
          </div>
        </div>
        <div class="item-actions">
          <button onclick="sellBack('${item.key}')" class="action-button sell-button" ${disabled ? 'disabled' : ''}>
            <span>Sell for ${refund}</span>
            <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" width="14" height="14" class="gem-icon" alt="Gems" />
          </button>
          ${shipMarkup}
        </div>
      </article>`;
  });
}

function sellBack(key) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const userRef = firebase.database().ref('users/' + user.uid);
  const itemRef = firebase.database().ref(`users/${user.uid}/inventory/${key}`);

  Promise.all([userRef.once('value'), itemRef.once('value')]).then(([userSnap, itemSnap]) => {
    const itemData = itemSnap.val();
    if (!itemData) return;

    const refund = getSellRefund(itemData);
    const balanceBefore = Number(userSnap.val()?.balance || 0);
    const balanceAfter = balanceBefore + refund;

    userRef.update({ balance: balanceAfter }).then(() => {
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
    if (item) total += getSellRefund(item);
  });

  const userRef = firebase.database().ref('users/' + user.uid);
  userRef.once('value').then(snap => {
    let currentBalance = Number(snap.val().balance || 0);

    selectedItems.forEach(key => {
      const item = currentItems.find(i => i.key === key);
      if (item) {
        const refund = getSellRefund(item);
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
      alert(`Sold selected items for ${total} gems.`);
      window.location.reload();
    });
  });
}

function shipSelected() {
  const shipmentSelection = [];
  let blockedVoucher = false;
  selectedItems.forEach(key => {
    const item = currentItems.find(i => i.key === key);
    if (!item || item.shipped || item.requested) return;
    if (isVoucherItem(item)) {
      blockedVoucher = true;
      return;
    }
    shipmentSelection.push({ id: item.id, name: item.name, image: item.image });
  });

  if (shipmentSelection.length === 0) {
    alert(blockedVoucher ? 'Voucher prizes cannot be shipped.' : 'Select items to ship.');
    if (blockedVoucher) {
      selectedItems.forEach(key => {
        const item = currentItems.find(i => i.key === key);
        if (item && isVoucherItem(item)) selectedItems.delete(key);
      });
      updateTotalValue();
      refreshInventoryView();
    }
    return;
  }

  if (blockedVoucher) {
    alert('Voucher prizes were removed from your shipment selection because they cannot be shipped.');
    selectedItems.forEach(key => {
      const item = currentItems.find(i => i.key === key);
      if (item && isVoucherItem(item)) selectedItems.delete(key);
    });
    updateTotalValue();
    refreshInventoryView();
  }

  localStorage.setItem('shipItems', JSON.stringify(shipmentSelection));
  window.location.href = 'shipping.html';
}

function shipItem(key) {
  const item = currentItems.find(i => i.key === key);
  if (!item || item.shipped || item.requested) return;
  if (isVoucherItem(item)) {
    alert('Voucher prizes cannot be shipped.');
    return;
  }
  const shipmentSelection = [{ id: item.id, name: item.name, image: item.image }];
  localStorage.setItem('shipItems', JSON.stringify(shipmentSelection));
  window.location.href = 'shipping.html';
}

function showItemPopup(encodedSrc, encodedName, encodedRarity, value, isVoucher = false, voucherAmount = 0) {
  const src = decodeURIComponent(encodedSrc);
  const name = decodeURIComponent(encodedName || '');
  const rarity = decodeURIComponent(encodedRarity || '');
  const img = document.getElementById('popup-item-image');
  const rotator = document.getElementById('popup-rotator');
  const holo = document.getElementById('holo-overlay');
  if (!img || !rotator) return;
  img.src = src;
  const nameEl = document.getElementById('popup-item-name');
  if (nameEl) nameEl.textContent = name;
  const rarityEl = document.getElementById('popup-item-rarity');
  if (rarityEl) {
    const rarityClassMap = { 'common': 'common', 'uncommon': 'uncommon', 'rare': 'rare', 'ultra rare': 'ultra', 'legendary': 'legendary' };
    rarityEl.className = `pill ${rarityClassMap[rarity] || 'common'}`;
    rarityEl.textContent = rarity;
  }
  const valueEl = document.getElementById('popup-item-value');
  const displayValue = isVoucher && voucherAmount > 0 ? voucherAmount : value;
  if (valueEl) valueEl.textContent = displayValue || 0;
  popupRotX = 0;
  popupRotY = 0;
  currentRotX = 0;
  currentRotY = 0;
  targetRotX = 0;
  targetRotY = 0;
  rotator.style.transform = 'rotateY(0deg) rotateX(0deg)';
  if (holo) {
    holo.style.setProperty('--x', '50%');
    holo.style.setProperty('--y', '50%');
    holo.style.backgroundPosition = '50% 50%';
    holo.style.filter = 'hue-rotate(0deg) saturate(1.5) brightness(1.1)';
    holo.style.opacity = '0';
  }
  rotator.classList.remove('grabbing');
  const popup = document.getElementById('item-popup');
  const card = popup?.querySelector('.popup-card');
  popup?.classList.remove('hidden');
  const existingNote = popup?.querySelector('#popup-voucher-note');
  if (existingNote) existingNote.remove();
  if (popup && isVoucher) {
    const info = popup.querySelector('.popup-info');
    if (info) {
      const note = document.createElement('p');
      note.id = 'popup-voucher-note';
      note.className = 'mt-2 text-xs font-semibold text-amber-600';
      note.textContent = 'Voucher prize — redeem for gems only. Shipping unavailable.';
      info.appendChild(note);
    }
  }
  if (card) {
    card.classList.remove('animate');
    void card.offsetWidth;
    card.classList.add('animate');
  }
}

function closeItemPopup() {
  document.getElementById('item-popup')?.classList.add('hidden');
}
