(() => {
  const firestore = firebase.firestore();

  const listEl = document.getElementById('vending-list');
  const emptyEl = document.getElementById('vending-empty');
  const syncEl = document.getElementById('vending-sync');

  const defaults = { common: 40, rare: 30, epic: 20, legendary: 10 };

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '—';
    return `${Number(price).toLocaleString()} 💎`;
  };

  const rarityWidth = (value) => `${Math.max(0, Number(value) || 0)}%`;

  const renderCard = (machine) => {
    const rarities = { ...defaults, ...(machine.rarities || {}) };

    const card = document.createElement('article');
    card.className = 'rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-sm overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.5)] hover:border-cyan-300/40 transition';
    card.innerHTML = `
      <div class="relative rounded-b-3xl overflow-hidden">
        <img src="${machine.image || 'https://placehold.co/480x320/0f172a/94a3b8?text=Vending'}" alt="${machine.name || 'Vending machine'}" class="w-full aspect-[4/3] object-cover" />
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/60 via-transparent"></div>
        <div class="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold">${machine.tag || 'Featured'}</div>
      </div>
      <div class="p-4 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[10px] uppercase tracking-[0.3em] text-slate-500">Vending</p>
            <h3 class="text-xl font-semibold text-white">${machine.name || 'Vending Machine'}</h3>
            <p class="text-sm text-slate-300/90 leading-relaxed">${machine.description || 'Admin curated drops with clean odds and fast opening.'}</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold whitespace-nowrap">${formatPrice(machine.price)}</span>
        </div>
        <div class="h-3 rounded-full overflow-hidden bg-white/5 border border-white/10 flex" aria-hidden="true">
          <div class="bg-cyan-400/80" style="width:${rarityWidth(rarities.common)}"></div>
          <div class="bg-indigo-400/80" style="width:${rarityWidth(rarities.rare)}"></div>
          <div class="bg-purple-500/80" style="width:${rarityWidth(rarities.epic)}"></div>
          <div class="bg-amber-400/90" style="width:${rarityWidth(rarities.legendary)}"></div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-300/90">
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-cyan-400"></span>Common - ${rarityWidth(rarities.common)}</div>
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-indigo-400"></span>Rare - ${rarityWidth(rarities.rare)}</div>
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-purple-500"></span>Epic - ${rarityWidth(rarities.epic)}</div>
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-400"></span>Legendary - ${rarityWidth(rarities.legendary)}</div>
        </div>
        <a href="vending-open.html?id=${machine.id}" class="block w-full text-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-900 font-semibold py-3 shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5 transition" aria-label="Open ${machine.name || 'vending machine'}">
          Open machine
        </a>
      </div>
    `;
    return card;
  };

  const renderMachines = (machines) => {
    listEl.innerHTML = '';
    if (!machines.length) {
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');
    machines.forEach((machine) => listEl.appendChild(renderCard(machine)));
  };

  const subscribeMachines = () => {
    syncEl.textContent = 'Syncing…';
    firestore
      .collection('vendingMachines')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const machines = [];
          snapshot.forEach((doc) => machines.push({ id: doc.id, ...(doc.data() || {}) }));
          renderMachines(machines);
          syncEl.textContent = `Live · ${new Date().toLocaleTimeString()}`;
        },
        () => {
          syncEl.textContent = 'Unable to load vending machines';
          emptyEl.classList.remove('hidden');
        }
      );
  };

  document.addEventListener('DOMContentLoaded', subscribeMachines);
})();
