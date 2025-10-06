import { setupFilters } from './filters.js';

let allCases = [];
const ROW_LIMIT = 3;
let casesPerPage = 0;
let displayLimit = 0;
let currentCases = [];

function parsePrizeValue(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const numeric = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

function getTopPrizes(prizes, limit = 2) {
  return [...prizes]
    .map(prize => ({ ...prize, numericValue: parsePrizeValue(prize.value) }))
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
    .slice(0, limit);
}

function buildShowcaseGallery(prizes, fallbackImg) {
  if (!prizes.length) return "";
  const swatches = prizes
    .map(
      (prize, idx) => `
        <div class="relative h-16 w-16 rounded-full ring-2 ring-white/80 shadow-lg overflow-hidden bg-white ${idx !== 0 ? '-ml-3' : ''}">
          <img src="${prize.image || fallbackImg}" alt="${prize.name || "Pack prize"}" class="h-full w-full object-cover">
        </div>`
    )
    .join("");

  return `
    <div class="mt-3 flex items-center justify-center">
      <div class="flex items-center -space-x-4">${swatches}</div>
    </div>`;
}
function getPepperHTML(spiceLevel) {
  const map = {
    easy: { class: "spice-label spice-easy" },
    medium: { class: "spice-label spice-medium" },
    hard: { class: "spice-label spice-hard" }
  };

  if (!map[spiceLevel]) return "";

  const { class: cls } = map[spiceLevel];
  return `<div class="${cls}" aria-label="${spiceLevel} pepper"><i class="fa-solid fa-pepper-hot"></i></div>`;
}

function getTagHTML(tag) {
  if (!tag) return "";
  const lower = tag.toLowerCase();
  let cls = "bg-indigo-100 text-indigo-800";
  if (lower.includes('hot')) {
    cls = "bg-red-100 text-red-800";
  } else if (lower.includes('new')) {
    cls = "bg-blue-100 text-blue-800";
  }
  return `<span class="absolute top-2 left-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} z-30">${tag}</span>`;
}
function calculateCasesPerPage() {
  const container = document.getElementById("cases-container");
  if (!container) return ROW_LIMIT * 5;
  const columns = getComputedStyle(container).gridTemplateColumns.split(" ").filter(Boolean).length;
  return columns * ROW_LIMIT;
}

function renderCases(caseList, reset = true) {
  const casesContainer = document.getElementById("cases-container");
  const casesCarousel = document.getElementById("cases-carousel");
  const isMobile = window.matchMedia('(max-width: 639px)').matches;
  casesContainer.innerHTML = "";
  if (casesCarousel) {
    casesCarousel.innerHTML = "";
    if (!isMobile) casesCarousel.classList.add('hidden');
    else casesCarousel.classList.remove('hidden');
  }

  const freeCases = caseList.filter(c => c.isFree);
  const paidCases = caseList.filter(c => !c.isFree);
  const orderedCases = [...freeCases, ...paidCases];

  if (reset) {
    currentCases = orderedCases;
    casesPerPage = calculateCasesPerPage();
    displayLimit = casesPerPage;
  }

  const toRender = currentCases.slice(0, displayLimit);

  toRender.forEach(c => {
    const tagHTML = getTagHTML(c.tag);
    const pepperHTML = getPepperHTML(c.spiceLevel);

    const price = parseFloat(c.price) || 0;
    const priceLabel = c.isFree ? "Free" : price.toLocaleString();
    const priceIcon = c.isFree
      ? ""
      : '<img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" alt="Coins" class="h-4 w-4 ml-1 coin-icon">';

    const prizes = Object.values(c.prizes || {});
    const topPrizes = getTopPrizes(prizes, 2);
    const topPrize = topPrizes[0];
    const packImg = c.image;
    const topPrizeImg = topPrize?.image || packImg;
    const showcaseGallery = buildShowcaseGallery(topPrizes, packImg);

    const imgIdDesktop = `img-${c.id}`;
    const imgIdMobile = `img-${c.id}-m`;

    const openLink = `case.html?id=${c.id}`;

    casesContainer.innerHTML += `
      <div class="bg-white rounded-xl overflow-hidden shadow-md pack-card">
        <div class="relative flex items-center justify-center pt-12 pb-6 bg-gradient-to-b from-slate-900/5 to-white">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-200/30 via-transparent to-purple-200/30 pointer-events-none"></div>
          <img src="${packImg}" id="${imgIdDesktop}" class="case-card-img relative z-20 w-full h-64 object-contain p-6 transition-all duration-300">
          ${tagHTML}
          ${pepperHTML}
        </div>
        <div class="p-4">
          <h3 class="text-lg font-medium text-gray-900">${c.name}</h3>
          ${showcaseGallery}
          <div class="mt-4">
            <a href="${openLink}" class="open-button glow-button text-sm whitespace-nowrap">
              Open for ${priceLabel} ${priceIcon}
            </a>
          </div>
        </div>
      </div>`;
    if (casesCarousel && isMobile) {
      casesCarousel.innerHTML += `
        <div class="bg-white rounded-xl overflow-hidden shadow-md pack-card w-64 flex-shrink-0">
          <div class="relative flex items-center justify-center pt-12 pb-6 bg-gradient-to-b from-slate-900/5 to-white">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-200/30 via-transparent to-purple-200/30 pointer-events-none"></div>
            <img src="${packImg}" id="${imgIdMobile}" class="case-card-img relative z-20 w-full h-64 object-contain p-6 transition-all duration-300">
            ${tagHTML}
            ${pepperHTML}
          </div>
          <div class="p-4">
            <h3 class="text-lg font-medium text-gray-900">${c.name}</h3>
            ${showcaseGallery}
            <div class="mt-4">
              <a href="${openLink}" class="open-button glow-button text-sm whitespace-nowrap">
                Open for ${priceLabel} ${priceIcon}
              </a>
            </div>
          </div>
        </div>`;
    }

    // Add hover effect after rendering
    setTimeout(() => {
      const imgElDesktop = document.getElementById(imgIdDesktop);
      if (imgElDesktop && topPrizeImg !== packImg) {
        imgElDesktop.addEventListener("mouseenter", () => {
          imgElDesktop.src = topPrizeImg;
        });
        imgElDesktop.addEventListener("mouseleave", () => {
          imgElDesktop.src = packImg;
        });
      }
      const imgElMobile = document.getElementById(imgIdMobile);
      if (imgElMobile && topPrizeImg !== packImg) {
        imgElMobile.addEventListener("mouseenter", () => {
          imgElMobile.src = topPrizeImg;
        });
        imgElMobile.addEventListener("mouseleave", () => {
          imgElMobile.src = packImg;
        });
      }
    }, 0);
  });

  // Re-attach event listeners
  document.querySelectorAll(".open-case").forEach(btn => {
    btn.onclick = openCasePopup;
  });

  const seeMoreBtn = document.getElementById('see-more-cases');
  if (currentCases.length > displayLimit) {
    seeMoreBtn.classList.remove('hidden');
  } else {
    seeMoreBtn.classList.add('hidden');
  }
}

function setupCategoryTabs(filterControls) {
  const tabs = document.querySelectorAll('.category-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const category = tab.dataset.category;
      let filtered = [...allCases];
      if (category === 'new') {
        filtered = allCases.filter(c => c.categories?.new);
      } else if (category === 'featured') {
        filtered = allCases.filter(c => c.categories?.featured);
      } else if (category === 'starter') {
        filtered = allCases.filter(c => c.categories?.starter);
      } else if (category === 'other') {
        filtered = allCases.filter(c => !(c.categories?.new || c.categories?.featured || c.categories?.starter));
      }
      filterControls.updateCases(filtered);
    });
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

      const filterControls = setupFilters(allCases, renderCases, getUserBalance);
      setupCategoryTabs(filterControls);
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const seeMoreBtn = document.getElementById('see-more-cases');
  seeMoreBtn?.addEventListener('click', () => {
    casesPerPage = calculateCasesPerPage();
    displayLimit += casesPerPage;
    renderCases(currentCases, false);
  });
  loadCases();
});
