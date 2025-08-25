document.addEventListener('DOMContentLoaded', () => {
  const ULTRA_RARITIES = ['ultra rare', 'secret rare', 'rainbow rare', 'legendary'];
  const fs = firebase.firestore();

  const dropsData = { liked: [], new: [], rare: [] };
  const FALLBACK_DROPS = [
    {
      title: 'Signed Rookie Card',
      pack: 'Legends Rising',
      cardImg: 'https://picsum.photos/seed/card1/200/300',
      packImg: 'https://picsum.photos/seed/pack1/200/300',
      packLink: 'pack-opener/?pack=Legends%20Rising',
    },
    {
      title: 'Holographic Dragon',
      pack: 'Mystic Monsters',
      cardImg: 'https://picsum.photos/seed/card2/200/300',
      packImg: 'https://picsum.photos/seed/pack2/200/300',
      packLink: 'pack-opener/?pack=Mystic%20Monsters',
    },
    {
      title: 'Rare Gemstone',
      pack: 'Treasure Trove',
      cardImg: 'https://picsum.photos/seed/card3/200/300',
      packImg: 'https://picsum.photos/seed/pack3/200/300',
      packLink: 'pack-opener/?pack=Treasure%20Trove',
    },
    {
      title: 'Prototype Sneaker',
      pack: 'Street Heat',
      cardImg: 'https://picsum.photos/seed/card4/200/300',
      packImg: 'https://picsum.photos/seed/pack4/200/300',
      packLink: 'pack-opener/?pack=Street%20Heat',
    },
    {
      title: 'Limited Art Print',
      pack: 'Gallery Picks',
      cardImg: 'https://picsum.photos/seed/card5/200/300',
      packImg: 'https://picsum.photos/seed/pack5/200/300',
      packLink: 'pack-opener/?pack=Gallery%20Picks',
    },
    {
      title: 'Autographed Jersey',
      pack: 'Hall of Fame',
      cardImg: 'https://picsum.photos/seed/card6/200/300',
      packImg: 'https://picsum.photos/seed/pack6/200/300',
      packLink: 'pack-opener/?pack=Hall%20of%20Fame',
    },
    {
      title: 'Vintage Comic',
      pack: 'Retro Classics',
      cardImg: 'https://picsum.photos/seed/card7/200/300',
      packImg: 'https://picsum.photos/seed/pack7/200/300',
      packLink: 'pack-opener/?pack=Retro%20Classics',
    },
    {
      title: 'Mythic Creature Figurine',
      pack: 'Arcane Vault',
      cardImg: 'https://picsum.photos/seed/card8/200/300',
      packImg: 'https://picsum.photos/seed/pack8/200/300',
      packLink: 'pack-opener/?pack=Arcane%20Vault',
    },
    {
      title: 'Crystal Relic',
      pack: 'Hidden Realms',
      cardImg: 'https://picsum.photos/seed/card9/200/300',
      packImg: 'https://picsum.photos/seed/pack9/200/300',
      packLink: 'pack-opener/?pack=Hidden%20Realms',
    },
    {
      title: 'Golden Ticket',
      pack: 'Factory Floor',
      cardImg: 'https://picsum.photos/seed/card10/200/300',
      packImg: 'https://picsum.photos/seed/pack10/200/300',
      packLink: 'pack-opener/?pack=Factory%20Floor',
    },
    {
      title: 'Fossil Fragment',
      pack: 'Jurassic Finds',
      cardImg: 'https://picsum.photos/seed/card11/200/300',
      packImg: 'https://picsum.photos/seed/pack11/200/300',
      packLink: 'pack-opener/?pack=Jurassic%20Finds',
    },
    {
      title: 'Celestial Map',
      pack: 'Star Seekers',
      cardImg: 'https://picsum.photos/seed/card12/200/300',
      packImg: 'https://picsum.photos/seed/pack12/200/300',
      packLink: 'pack-opener/?pack=Star%20Seekers',
    },
  ];

  function useFallback() {
    const shuffled = [...FALLBACK_DROPS].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, 10);
    dropsData.liked = sample;
    dropsData.new = sample;
    dropsData.rare = sample;
    render();
  }
  const container = document.getElementById('drops-container');
  const prevBtn = document.getElementById('drops-prev');
  const nextBtn = document.getElementById('drops-next');
  const tabs = document.querySelectorAll('.filter-tab');

  let currentFilter = 'liked';

  function render() {
    const items = dropsData[currentFilter] || [];
    const display = items.slice(0, 10);
    if (!display.length) {
      useFallback();
      return;
    }
    container.innerHTML = display
      .map(
        (item) => `
      <div class="drop-card bg-white rounded-lg overflow-hidden shadow-lg min-w-full sm:min-w-[300px]">
        <div class="flex p-4 items-center">
          <img class="w-24 h-32 object-contain" src="${item.cardImg}" alt="${item.title}">
          <img class="w-32 h-44 object-contain ml-2" src="${item.packImg}" alt="${item.pack}">
        </div>
        <div class="p-4 border-t border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">${item.title}</h3>
          <p class="mt-1 text-sm text-gray-500">From: ${item.pack}</p>
          <a href="${item.packLink}" class="mt-3 inline-block text-indigo-600 font-semibold hover:underline">Open Now</a>
        </div>
      </div>
    `
      )
      .join('');
    container.scrollLeft = 0;
  }

  function shift(dir) {
    const width = container.clientWidth;
    container.scrollBy({ left: dir * width, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => shift(-1));
  nextBtn.addEventListener('click', () => shift(1));

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      render();
    });
  });

  function subscribe() {
    fs.collection('pulls')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(
        (snap) => {
          const items = [];
          snap.forEach((doc) => {
            const data = doc.data() || {};
            const rarity = (data.rarity || data.rarityLabel || '').toLowerCase();
            if (!ULTRA_RARITIES.includes(rarity)) return;
            const packName = data.pack || data.packName || '';
            items.push({
              title: data.title || data.cardName || '',
              pack: packName,
              cardImg: data.cardImg || data.cardImage || data.image || '',
              packImg: data.packImg || data.packImage || data.caseImage || '',
              packLink:
                data.packLink || `pack-opener/?pack=${encodeURIComponent(packName)}`,
            });
          });
          if (items.length) {
            dropsData.liked = items;
            dropsData.new = items;
            dropsData.rare = items;
            render();
          } else {
            useFallback();
          }
        },
        (err) => {
          console.error('Best drops listener failed', err);
          useFallback();
        }
      );
  }

  useFallback();
  subscribe();
});

