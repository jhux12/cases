// wins.js

function displayLiveWins(prizes) {
  const carousel = document.getElementById("recent-wins-carousel");
  const marquee = document.getElementById("recent-wins-marquee");

  // Clear existing
  carousel.innerHTML = '';
  marquee.innerHTML = '';

  // Randomly shuffle the list
  const shuffled = prizes.sort(() => 0.5 - Math.random());

  // Pick the first 6
  const selected = shuffled.slice(0, 6);

  selected.forEach(prize => {
    // Add to carousel
    const winCard = `
      <div class="min-w-[150px] bg-gray-900 p-2 rounded-lg shadow text-center">
        <img src="${prize.image}" class="w-20 h-20 object-contain mx-auto rounded mb-1" />
        <div class="text-sm text-white font-semibold">${prize.name}</div>
      </div>
    `;
    carousel.insertAdjacentHTML("beforeend", winCard);

    // Add to marquee
    const marqueeItem = `
      <div class="flex items-center space-x-2 text-white">
        <img src="${prize.image}" class="w-6 h-6 object-contain rounded" />
        <span>${prize.name}</span>
      </div>
    `;
    marquee.insertAdjacentHTML("beforeend", marqueeItem);
  });

  // Start scroll
  startAutoScrollCarousel("recent-wins-carousel", 0.5);
}

function fetchHighTierPrizes() {
  const dbRef = firebase.database().ref("cases");

  dbRef.once("value").then(snapshot => {
    const casesData = snapshot.val();
    if (!casesData) return;

    const allPrizes = [];

    Object.values(casesData).forEach(caseData => {
      const prizes = Object.values(caseData.prizes || {});
      prizes.forEach(prize => {
        const rarity = prize.rarity?.toLowerCase();
        if (rarity === "ultra rare" || rarity === "legendary") {
          allPrizes.push(prize);
        }
      });
    });

    displayLiveWins(allPrizes);
  });
}

// Call on DOM load
document.addEventListener("DOMContentLoaded", fetchHighTierPrizes);

