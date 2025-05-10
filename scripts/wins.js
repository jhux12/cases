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

    // Determine glow style based on rarity
    let glowClass = "";
    const rarity = prize.rarity?.toLowerCase();

    switch (rarity) {
      case "legendary":
        glowClass = "shadow-[0_0_20px_4px_rgba(255,215,0,0.5)] border-yellow-400";
        break;
      case "ultra rare":
        glowClass = "shadow-[0_0_16px_3px_rgba(186,85,211,0.5)] border-purple-500";
        break;
      case "rare":
        glowClass = "shadow-[0_0_12px_2px_rgba(30,144,255,0.5)] border-blue-500";
        break;
      case "uncommon":
        glowClass = "shadow-[0_0_8px_1px_rgba(50,205,50,0.4)] border-green-500";
        break;
      default:
        glowClass = "shadow-[0_0_6px_1px_rgba(255,255,255,0.1)] border-gray-700";
    }

    card.className = `
      min-w-[160px] bg-[#12121b] p-3 rounded-xl border ${glowClass}
      text-center flex-shrink-0 mx-2 transform transition duration-200 hover:scale-105
    `;

    card.innerHTML = `
      <img src="${prize.image}" class="w-full max-w-[120px] h-auto object-contain mx-auto rounded-md shadow-md mb-2" />
      <div class="text-sm text-white text-center leading-tight">${prize.name}</div>
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
