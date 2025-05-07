function loadRecentWins() {
  const recentWinsCarousel = document.getElementById('recent-wins-carousel');

  // Use the compat global Firebase API
  firebase.database().ref('cases').once('value').then(snapshot => {
    if (!recentWinsCarousel) return;

    recentWinsCarousel.innerHTML = '';
    const prizes = [];

    snapshot.forEach(caseSnap => {
      const caseData = caseSnap.val();
      const casePrizes = Object.values(caseData.prizes || {});
      casePrizes.forEach(prize => {
        const rarity = (prize.rarity || '').toLowerCase();
        if (rarity === 'ultra rare' || rarity === 'legendary') {
          prizes.push(prize);
        }
      });
    });

    const shuffled = prizes.sort(() => 0.5 - Math.random()).slice(0, 10);
    shuffled.forEach(prize => {
      recentWinsCarousel.innerHTML += `
        <div class="w-[140px] sm:w-[160px] bg-gray-800 rounded-xl shadow-md snap-start transform hover:scale-105 transition-transform duration-300 flex-shrink-0">
          <div class="w-full h-[110px] overflow-hidden rounded-t-xl">
            <img src="${prize.image}" class="w-full h-full object-contain" />
          </div>
          <div class="p-2 text-center">
            <span class="text-white text-sm font-medium truncate block">${prize.name}</span>
            <span class="text-xs uppercase font-bold ${
              prize.rarity === 'legendary' ? 'text-yellow-400' :
              prize.rarity === 'ultra rare' ? 'text-purple-400' :
              'text-gray-400'
            }">${prize.rarity}</span>
          </div>
        </div>
      `;
    });
  });
}
