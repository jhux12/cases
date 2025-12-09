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

  const featureRows = prizes
    .map(
      prize => `
        <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div class="h-12 w-12 rounded-full overflow-hidden ring-2 ring-white/70 ring-offset-2 ring-offset-slate-900/60">
            <img src="${prize.image || fallbackImg}" alt="${prize.name || "Pack prize"}" class="h-full w-full object-cover">
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-white truncate">${prize.name || "Top prize"}</p>
            <p class="text-xs text-slate-300 truncate">${prize.value || ""}</p>
          </div>
        </div>`
    )
    .join("");

  return `
    <div class="pack-top-prizes space-y-3">
      <div class="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-300">
        <span class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>Top prizes</span>
        <span class="text-slate-400">${prizes.length} featured</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${featureRows}</div>
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
  let cls = "bg-indigo-500/15 text-indigo-100 border border-indigo-300/30";
  if (lower.includes('hot')) {
    cls = "bg-red-500/15 text-red-100 border border-red-300/30";
  } else if (lower.includes('new')) {
    cls = "bg-blue-500/15 text-blue-100 border border-blue-300/30";
  }
  return `<span class="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur ${cls} z-30 shadow-sm">${tag}</span>`;
}
function calculateCasesPerPage() {
  const container = document.getElementById("cases-container");
  if (!container) return ROW_LIMIT * 5;
  const columns = getComputedStyle(container).gridTemplateColumns.split(" ").filter(Boolean).length;
  return columns * ROW_LIMIT;
}

function buildPackCard({
  c,
  tagHTML,
  pepperHTML,
  showcaseGallery,
  priceMarkup,
  packImg,
  openLink,
  imgId,
  isCarousel
}) {
  const containerClasses = [
    "pack-card relative overflow-hidden rounded-2xl border border-white/10",
    "bg-slate-900/70 shadow-[0_25px_65px_rgba(15,23,42,0.45)]",
    isCarousel ? "w-72 flex-shrink-0" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const imageHeight = isCarousel ? "h-56" : "h-64";

  return `
    <article class="${containerClasses}">
      <div class="absolute inset-0 bg-gradient-to-b from-white/5 via-white/0 to-white/10"></div>
      <div class="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_15%,rgba(79,70,229,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.28),transparent_35%)]"></div>
      ${tagHTML}
      <div class="relative flex flex-col gap-5 p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-slate-400">Pack</p>
            <h3 class="mt-1 text-xl font-semibold text-white">${c.name}</h3>
          </div>
          <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white shadow-inner ring-1 ring-white/20 backdrop-blur">
            ${c.isFree ? '<i class="fa-solid fa-gift text-emerald-300"></i>' : ''}
            ${c.isFree ? '<span>Free</span>' : priceMarkup}
          </div>
        </div>
        <div class="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-slate-800/80 via-slate-900/60 to-slate-950/80 shadow-inner">
          <div class="absolute -inset-10 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(16,185,129,0.25),transparent_40%)]"></div>
          <img src="${packImg}" id="${imgId}" alt="${c.name} pack" class="case-card-img relative z-10 w-full ${imageHeight} object-contain drop-shadow-2xl">
          ${pepperHTML}
        </div>
        ${showcaseGallery}
        <a href="${openLink}" class="open-button glow-button text-sm whitespace-nowrap">
          <span>Open for</span>
          <span class="inline-flex items-center gap-2">${priceMarkup}</span>
        </a>
      </div>
    </article>`;
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
      : '<img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" alt="Gems" class="h-4 w-4 gem-icon">';
    const priceMarkup = c.isFree
      ? '<span class="text-white">Free</span>'
      : `<span>${priceLabel}</span>${priceIcon}`;

    const prizes = Object.values(c.prizes || {});
    const topPrizes = getTopPrizes(prizes, 2);
    const topPrize = topPrizes[0];
    const packImg = c.image;
    const topPrizeImg = topPrize?.image || packImg;
    const showcaseGallery = buildShowcaseGallery(topPrizes, packImg);

    const imgIdDesktop = `img-${c.id}`;
    const imgIdMobile = `img-${c.id}-m`;

    const openLink = `case.html?id=${c.id}`;

    const gridCard = buildPackCard({
      c,
      tagHTML,
      pepperHTML,
      showcaseGallery,
      priceMarkup,
      packImg,
      openLink,
      imgId: imgIdDesktop,
      isCarousel: false
    });
    casesContainer.innerHTML += gridCard;
    if (casesCarousel && isMobile) {
      const carouselCard = buildPackCard({
        c,
        tagHTML,
        pepperHTML,
        showcaseGallery,
        priceMarkup,
        packImg,
        openLink,
        imgId: imgIdMobile,
        isCarousel: true
      });
      casesCarousel.innerHTML += carouselCard;
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
