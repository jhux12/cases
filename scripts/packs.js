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

    casesContainer.innerHTML += `
      <div class="relative p-4 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition">
        ${tagHTML}
        <img src="${c.image}" class="case-card-img mb-2">
        <h3 class="mt-2 font-semibold text-white">${c.name}</h3>
        <button class="mt-2 w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded open-case glow-button enhanced-glow flex justify-center items-center gap-2 text-white font-semibold" data-id="${c.id}">
          Open for ${price.toLocaleString()}
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" alt="Coin" class="w-4 h-4 inline-block">
        </button>
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

    filterAndRenderCases();
  });
}

function filterAndRenderCases() {
  const search = document.getElementById("search-box").value.toLowerCase();
  const minPrice = parseFloat(document.getElementById("min-price").value) || 0;
  const maxPrice = parseFloat(document.getElementById("max-price").value) || Infinity;
  const affordableOnly = document.getElementById("affordable-only").checked;

  const balance = parseFloat(document.getElementById("balance-amount")?.innerText.replace(/,/g, "")) || 0;
  const sort = document.getElementById("sort-select").value;

  let filtered = allCases.filter(c => {
    const nameMatch = c.name.toLowerCase().includes(search);
    const priceMatch = c.price >= minPrice && c.price <= maxPrice;
    const affordabilityMatch = !affordableOnly || c.price <= balance;
    return nameMatch && priceMatch && affordabilityMatch;
  });

  if (sort === "asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  renderCases(filtered);
}

function setupFilters() {
  document.getElementById("search-box").addEventListener("input", filterAndRenderCases);
  document.getElementById("min-price").addEventListener("input", filterAndRenderCases);
  document.getElementById("max-price").addEventListener("input", filterAndRenderCases);
  document.getElementById("affordable-only").addEventListener("change", filterAndRenderCases);
  document.getElementById("sort-select").addEventListener("change", filterAndRenderCases);

  document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("search-box").value = "";
    document.getElementById("min-price").value = "";
    document.getElementById("max-price").value = "";
    document.getElementById("affordable-only").checked = false;
    document.getElementById("sort-select").value = "default";
    filterAndRenderCases();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadCases();
  setupFilters();
});
