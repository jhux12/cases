// scripts/filters.js

export function setupFilters(cases, renderFn, getUserBalanceFn) {
  let currentCases = cases;
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
    input.style.border = "1px solid #d1d5db";
    input.style.backgroundColor = "#ffffff";
    input.style.color = "#374151";
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
    clearButton.style.backgroundColor = "#e5e7eb";
    clearButton.style.color = "#374151";
    clearButton.style.fontWeight = "500";
    clearButton.style.border = "1px solid #d1d5db";
    clearButton.style.borderRadius = "0.375rem";
    clearButton.style.transition = "background-color 0.3s ease";
    clearButton.addEventListener("mouseenter", () => {
      clearButton.style.backgroundColor = "#d1d5db";
    });
    clearButton.addEventListener("mouseleave", () => {
      clearButton.style.backgroundColor = "#e5e7eb";
    });
  }

  function applyFilters() {
    let filtered = [...currentCases];

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

  return {
    updateCases(newCases) {
      currentCases = newCases;
      applyFilters();
    }
  };
}

