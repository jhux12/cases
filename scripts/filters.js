// scripts/filters.js

export function setupFilters(cases, renderFn, getUserBalanceFn) {
  const searchInput = document.getElementById("search-box");
  const minInput = document.getElementById("min-price");
  const maxInput = document.getElementById("max-price");
  const affordableCheckbox = document.getElementById("affordable-only");
  const sortSelect = document.getElementById("sort-select");
  const clearButton = document.getElementById("clear-filters");

  // Apply styles to filter elements
  const inputs = [searchInput, minInput, maxInput, sortSelect];
  inputs.forEach(input => {
    if (!input) return;
    input.style.border = "1px solid #4b5563";
    input.style.backgroundColor = "#1f2937";
    input.style.color = "#ffffff";
    input.style.padding = "0.5rem";
    input.style.borderRadius = "0.5rem";
    input.style.transition = "all 0.3s ease";
    input.style.minWidth = "60px";
    input.style.flex = "1 1 auto";

    input.addEventListener("focus", () => {
      input.style.boxShadow = "0 0 8px #facc15"; // yellow glow
    });
    input.addEventListener("blur", () => {
      input.style.boxShadow = "none";
    });
  });

  if (clearButton) {
    clearButton.style.color = "#f87171";
    clearButton.style.fontWeight = "bold";
    clearButton.style.transition = "color 0.3s ease";
    clearButton.addEventListener("mouseenter", () => {
      clearButton.style.color = "#fecaca";
    });
    clearButton.addEventListener("mouseleave", () => {
      clearButton.style.color = "#f87171";
    });
  }

  // Make filter container responsive
  const filterContainer = searchInput?.closest(".flex.flex-wrap");
  if (filterContainer) {
    filterContainer.style.display = "flex";
    filterContainer.style.flexWrap = "wrap";
    filterContainer.style.gap = "0.75rem";
    filterContainer.style.alignItems = "center";
    filterContainer.style.justifyContent = "flex-start";
  }

  function getRarityValue(rarity) {
    const order = {
      "common": 1,
      "uncommon": 2,
      "rare": 3,
      "ultra rare": 4,
      "legendary": 5
    };
    return order[rarity?.toLowerCase()] || 0;
  }

  function applyFilters() {
    let filtered = [...cases];

    const search = searchInput?.value.toLowerCase() || "";
    const min = parseFloat(minInput?.value) || 0;
    const max = parseFloat(maxInput?.value) || Infinity;
    const affordableOnly = affordableCheckbox?.checked || false;
    const sort = sortSelect?.value;
    const userBalance = getUserBalanceFn();

    filtered = filtered.filter(pack => {
      const matchesSearch = pack.name.toLowerCase().includes(search);
      const inPriceRange = pack.price >= min && pack.price <= max;
      const canAfford = !affordableOnly || pack.price <= userBalance;
      return matchesSearch && inPriceRange && canAfford;
    });

    if (sort === "asc") filtered.sort((a, b) => a.price - b.price);
    if (sort === "desc") filtered.sort((a, b) => b.price - a.price);
    if (sort === "rarity") filtered.sort((a, b) => getRarityValue(b.rarity) - getRarityValue(a.rarity));

    renderFn(filtered);
  }

  [searchInput, minInput, maxInput, affordableCheckbox, sortSelect].forEach(el => {
    el?.addEventListener("input", applyFilters);
    el?.addEventListener("change", applyFilters);
  });

  clearButton?.addEventListener("click", () => {
    searchInput.value = "";
    minInput.value = "";
    maxInput.value = "";
    affordableCheckbox.checked = false;
    sortSelect.value = "default";
    applyFilters();
  });

  applyFilters();
}

