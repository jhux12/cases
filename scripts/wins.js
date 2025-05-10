// wins.js

function displayLiveWins(prizes) {
  const carousel = document.getElementById("recent-wins-carousel");
  if (!carousel) return;

  carousel.innerHTML = '';

  // Shuffle and clone prizes to simulate looping
  const shuffled = [...prizes].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 10); // Limit number

  // Add 2x copies for smooth looping illusion
  const loopPrizes = [...selected, ...selected];

  loopPrizes.forEach(prize => {
    const card = document.createElement("div");
    card.className = "min-w-[150px] bg-gray-900 p-2 rounded-lg shadow text-center flex-shrink-0 mx-1";
    card.innerHTML = `
      <img src="${prize.image}" class="w-20 h-20 object-contain mx-auto rounded mb-1" />
      <div class="text-sm text-white font-semibold">${prize.name}</div>
    `;
    carousel.appendChild(card);
  });

  startInfiniteCarouselScroll("recent-wins-carousel", 0.3);
}

function fetchHighTierPrizes() {
  const dbRef = firebase.database().ref("cases");
  dbRef.once("value").then(snapshot => {
    const cases = snapshot.val();
    if (!cases) return;

    const highTier = [];

    Object.values(cases).forEach(caseData => {
      const prizes = Object.values(caseData.prizes || {});
      prizes.forEach(prize => {
        const rarity = prize.rarity?.toLowerCase();
        if (rarity === "ultra rare" || rarity === "legendary") {
          highTier.push(prize);
        }
      });
    });

    displayLiveWins(highTier);
  });
}

function startInfiniteCarouselScroll(containerId, speed = 0.3) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let scrollAmount = 0;

  function scrollStep() {
    scrollAmount += speed;
    if (scrollAmount >= container.scrollWidth / 2) {
      scrollAmount = 0;
    }
    container.scrollLeft = scrollAmount;
    requestAnimationFrame(scrollStep);
  }

  requestAnimationFrame(scrollStep);
}

document.addEventListener("DOMContentLoaded", fetchHighTierPrizes);
