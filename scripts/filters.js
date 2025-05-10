// scripts/filters.js

export function setupFilters(cases, renderFn, getUserBalanceFn) {
  const searchInput = document.getElementById("search-box");
  const minInput = document.getElementById("min-price");
  const maxInput = document.getElementById("max-price");
  const affordableCheckbox = document.getElementById("affordable-only");
  const sortSelect = document.getElementById("sort-select");
  const clearButton = document.getElementById("clear-filters");

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

    // Filter
    filtered = filtered.filter(pack => {
      const matchesSearch = pack.name.toLowerCase().includes(search);
      const inPriceRange = pack.price >= min && pack.price <= max;
      const canAfford = !affordableOnly || pack.price <= userBalance;
      return matchesSearch && inPriceRange && canAfford;
    });

    // Sort
    if (sort === "asc") filtered.sort((a, b) => a.price - b.price);
    if (sort === "desc") filtered.sort((a, b) => b.price - a.price);
    if (sort === "rarity") filtered.sort((a, b) => getRarityValue(b.rarity) - getRarityValue(a.rarity));

    renderFn(filtered);
  }

  // Listeners
  [searchInput, minInput, maxInput, affordableCheckbox, sortSelect].forEach(el => {
    el?.addEventListener("input", applyFilters);
    el?.addEventListener("change", applyFilters);
  });

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      minInput.value = "";
      maxInput.value = "";
      affordableCheckbox.checked = false;
      sortSelect.value = "default";
      applyFilters();
    });
  }

  applyFilters(); // Initial render
}
