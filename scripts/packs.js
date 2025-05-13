import { setupFilters } from './filters.js';

let allCases = [];

function renderCases(caseList) {
  const casesContainer = document.getElementById("cases-container");
  casesContainer.innerHTML = "";

  caseList.forEach(c => {
    const tagHTML = c.tag
      ? `<div class="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full font-bold z-10">${c.tag}</div>`
      : "";

    const price = parseFloat(c.price) || 0;

    const prizes = Object.values(c.prizes || {});
    const topPrize = prizes.sort((a, b) => (b.value || 0) - (a.value || 0))[0];

    casesContainer.innerHTML += `
      <div class="relative p-4 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition group overflow-hidden">
        ${tagHTML}
        <img src="${c.image}" class="case-card-img mb-2 w-full object-cover rounded">
        <h3 class="mt-2 font-semibold text-white">${c.name}</h3>
        <button class="mt-2 w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded open-case glow-button enhanced-glow flex justify-center items-center gap-2 text-white font-semibold" data-id="${c.id}">
          Open for ${price.toLocaleString()}
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" alt="Coin" class="w-4 h-4 inline-block">
        </button>

        ${
          topPrize
            ? `<div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-4">
                <img src="${topPrize.image}" alt="${topPrize.name}" class="w-16 h-16 object-contain mb-2 rounded">
                <p class="text-white font-semibold">${topPrize.name}</p>
                <p class="text-yellow-400 font-bold">$${topPrize.value?.toFixed(2)}</p>
              </div>`
            : ""
        }
      </div>`;
  });

  // Re-attach event listeners
  document.querySelectorAll(".open-case").forEach(btn => {
    btn.onclick = openCasePopup;
  });
}

function loadCases() {
  const dbRef = firebase.database().ref("cases");

  dbRef.once("value").then(snapshot => {
    const data = snapshot.val();
    allCases = [];

    for (const [id, caseData] of Object.entries(data)) {
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
}

window.addEventListener("DOMContentLoaded", () => {
  loadCases();

  // Toggle filter panel for mobile
  const filterToggle = document.getElementById("filter-toggle");
  const filterPanel = document.getElementById("filter-panel");

  if (filterToggle && filterPanel) {
    let isVisible = false;
    filterPanel.style.display = "none";

    filterToggle.addEventListener("click", () => {
      isVisible = !isVisible;
      filterPanel.style.display = isVisible ? "flex" : "none";
      filterToggle.textContent = isVisible ? "Hide Filters" : "Show Filters";
    });
  }
});
