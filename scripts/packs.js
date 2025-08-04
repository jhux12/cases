import { setupFilters } from './filters.js';

let allCases = [];

function getPepperHTML(spiceLevel) {
  const map = {
    easy: { color: "text-green-400", label: "Easy 🌶️" },
    medium: { color: "text-orange-400", label: "Medium 🌶️🌶️" },
    hard: { color: "text-red-500", label: "Hard 🌶️🌶️🌶️" }
  };

  if (!map[spiceLevel]) return "";

  const { color, label } = map[spiceLevel];

  return `
    <div class="absolute top-2 right-2 ${color} text-xs font-bold bg-black/60 px-2 py-1 rounded-full z-20">
      ${label}
    </div>
  `;
}

function renderCases(caseList) {
  const casesContainer = document.getElementById("cases-container");
  casesContainer.innerHTML = "";

  const freeCases = caseList.filter(c => c.isFree);
  const paidCases = caseList.filter(c => !c.isFree);
  const orderedCases = [...freeCases, ...paidCases];

  orderedCases.forEach(c => {
    const tagHTML = c.tag
      ? `<div class="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full font-bold z-20">${c.tag}</div>`
      : "";

    const pepperHTML = getPepperHTML(c.spiceLevel);
    const price = parseFloat(c.price) || 0;
    const priceLabel = c.isFree ? "Free" : price.toLocaleString();
    const priceIcon = c.isFree
      ? ""
      : '<img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" alt="Coin" class="w-4 h-4">';

    const prizes = Object.values(c.prizes || {});
    const topPrize = prizes.sort((a, b) => (b.value || 0) - (a.value || 0))[0];
    const packImg = c.image;
    const topPrizeImg = topPrize?.image || packImg;

    const imgId = `img-${c.id}`;

    casesContainer.innerHTML += `
      <div class="relative p-4 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition">
        ${tagHTML}
        ${pepperHTML}
        <img src="${packImg}" id="${imgId}" class="case-card-img mb-2 transition-all duration-300">
        <h3 class="mt-2 font-semibold text-white">${c.name}</h3>
        <a href="case.html?id=${c.id}" class="mt-2 w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-md flex justify-center items-center gap-2 text-white font-semibold hover:opacity-90 transition">
          <span>Open for</span>
          ${priceIcon}
          <span>${priceLabel}</span>
        </a>
      </div>`;

    // Add hover effect after rendering
    setTimeout(() => {
      const imgEl = document.getElementById(imgId);
      if (imgEl && topPrizeImg !== packImg) {
        imgEl.addEventListener("mouseenter", () => {
          imgEl.src = topPrizeImg;
        });
        imgEl.addEventListener("mouseleave", () => {
          imgEl.src = packImg;
        });
      }
    }, 0);
  });
}

function loadCases() {
  firebase.auth().onAuthStateChanged(user => {
    const dbRef = firebase.database().ref("cases");
    const freeRef = user
      ? firebase.database().ref(`users/${user.uid}/freeCaseOpened`).once("value")
      : Promise.resolve({ val: () => true });

    Promise.all([dbRef.once("value"), freeRef]).then(([snapshot, freeSnap]) => {
      const data = snapshot.val() || {};
      const hasOpenedFree = user ? !!freeSnap.val() : true;
      allCases = [];

      for (const [id, caseData] of Object.entries(data)) {
        if (caseData.isFree && (hasOpenedFree || !user)) continue;
        allCases.push({
          id,
          ...caseData
        });
      }

      renderCases(allCases); // default render

      const getUserBalance = () => {
        return parseFloat(document.getElementById("balance-amount")?.innerText.replace(/,/g, "")) || 0;
      };

      setupFilters(allCases, renderCases, getUserBalance);
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadCases();
});
