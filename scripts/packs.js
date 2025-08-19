import { setupFilters } from './filters.js';

let allCases = [];
const ROW_LIMIT = 3;
let casesPerPage = 0;
let displayLimit = 0;
let currentCases = [];
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
    const tagHTML = c.tag ? `<div class="pack-tag">${c.tag}</div>` : "";
    const pepperHTML = getPepperHTML(c.spiceLevel);

    const price = parseFloat(c.price) || 0;
    const priceLabel = c.isFree ? "Free" : price.toLocaleString();
    const priceIcon = c.isFree ? "" : '<img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" alt="Coin" class="w-4 h-4 inline-block">';

    const prizes = Object.values(c.prizes || {});
    const topPrize = prizes.sort((a, b) => (b.value || 0) - (a.value || 0))[0];
    const packImg = c.image;
    const topPrizeImg = topPrize?.image || packImg;

    const imgId = `img-${c.id}`;

    const openLink = `case.html?id=${c.id}`;

    const cardHtml = `
      <div class="relative p-3 sm:p-4 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition">
        ${tagHTML}
        ${pepperHTML}
        <img src="${packImg}" id="${imgId}" class="case-card-img mb-2 transition-all duration-300">
        <h3 class="mt-2 font-semibold text-white text-sm sm:text-base">${c.name}</h3>
        <a href="${openLink}" class="open-button glow-button text-xs sm:text-sm whitespace-nowrap">
    Open for ${priceLabel}
    ${priceIcon}
  </a>
        </div>`;
    casesContainer.innerHTML += cardHtml;
    if (casesCarousel && isMobile) {
      casesCarousel.innerHTML += `<div class="w-64 flex-shrink-0">${cardHtml}</div>`;
    }

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
