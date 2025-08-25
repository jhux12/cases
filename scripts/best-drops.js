document.addEventListener('DOMContentLoaded', () => {
  const dropsData = {
    liked: [
      {
        title: "Pikachu VMAX (Secret)",
        pack: "Pika Pika",
        cardImg: "https://tcgplayer-cdn.tcgplayer.com/product/284302_in_1000x1000.jpg",
        packImg: "https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FUntitled%20design%20(27).png?alt=media&token=27661ed2-182e-49d5-a635-f07d19410001"
      },
      {
        title: "Pikachu (Secret) SM",
        pack: "Pika Pika",
        cardImg: "https://tcgplayer-cdn.tcgplayer.com/product/201352_in_1000x1000.jpg",
        packImg: "https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FUntitled%20design%20(27).png?alt=media&token=27661ed2-182e-49d5-a635-f07d19410001"
      },
      {
        title: "N's Reshiram",
        pack: "Twin Dragons",
        cardImg: "https://boxed.gg/_next/image?url=https%3A%2F%2Fproduct-images.tcgplayer.com%2F623594.jpg&w=640&q=75",
        packImg: "https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FChatGPT_Image_Aug_10__2025__11_20_09_PM-removebg-preview.png?alt=media&token=34a17fd5-2a05-4c2c-899c-c4ac0484a152"
      }
    ],
    new: [],
    rare: []
  };

  // For demo purposes, reuse liked data for other filters if empty
  dropsData.new = dropsData.liked;
  dropsData.rare = dropsData.liked;

  const container = document.getElementById('drops-container');
  const prevBtn = document.getElementById('drops-prev');
  const nextBtn = document.getElementById('drops-next');
  const tabs = document.querySelectorAll('.filter-tab');

  let currentFilter = 'liked';

  function render() {
    const items = dropsData[currentFilter] || [];
    container.innerHTML = items.map(item => `
      <div class="drop-card bg-white rounded-lg overflow-hidden shadow-lg min-w-full sm:min-w-[300px]">
        <div class="flex p-4 items-center">
          <img class="w-24 h-32 object-contain" src="${item.cardImg}" alt="${item.title}">
          <img class="w-32 h-44 object-contain ml-2" src="${item.packImg}" alt="${item.pack}">
        </div>
        <div class="p-4 border-t border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">${item.title}</h3>
          <p class="mt-1 text-sm text-gray-500">From: ${item.pack}</p>
        </div>
      </div>
    `).join('');
    container.scrollLeft = 0;
  }

  function shift(dir) {
    const width = container.clientWidth;
    container.scrollBy({ left: dir * width, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => shift(-1));
  nextBtn.addEventListener('click', () => shift(1));

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      render();
    });
  });

  render();
});

