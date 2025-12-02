document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  if (!document.querySelector('link[href="styles/main.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/main.css';
    document.head.appendChild(link);
  }

  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fa);
  }

  header.innerHTML = `
    <nav class="navbar fixed top-0 left-0 right-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-8">
            <a href="index.html" class="brand">
              <span class="orb"><i class="fa-solid fa-sparkles"></i></span>
              <span class="text-xl">packly.gg</span>
            </a>
            <div class="hidden md:flex nav-links gap-2">
              <a data-nav="index.html" href="index.html"><i class="fas fa-box-open mr-2"></i>Open Packs</a>
              <a data-nav="box-battles.html" href="box-battles.html"><i class="fas fa-sword mr-1"></i><i class="fas fa-shield-alt mr-2"></i>Battles</a>
              <a data-nav="leaderboard.html" href="leaderboard.html"><i class="fas fa-trophy mr-2"></i>Leaderboard</a>
              <a data-nav="marketplace.html" href="marketplace.html"><i class="fas fa-store mr-2"></i>Marketplace</a>
              <a data-nav="rewards.html" href="rewards.html"><i class="fas fa-gift mr-2"></i>Rewards</a>
            </div>
          </div>
          <div class="hidden md:flex items-center gap-3">
            <button class="theme-toggle" type="button" aria-label="Toggle dark mode">
              <i class="fas fa-moon"></i>
            </button>
            <div id="auth-buttons" class="flex items-center gap-3">
              <a id="signin-desktop" href="auth.html" class="cta ghost text-sm">Sign In</a>
              <a id="register-desktop" href="auth.html#register" class="cta primary text-sm">Register</a>
            </div>
            <div id="user-area" class="hidden md:hidden items-center gap-3">
              <div id="user-balance" class="hidden balance-chip">
                <div class="balance-icon flex items-center justify-center">
                  <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" class="w-5 h-5 object-contain" alt="Gems" />
                </div>
                <div class="flex flex-col leading-tight">
                  <span id="balance-amount" class="balance-amount text-base">0</span>
                  <span class="balance-label text-xs">gems</span>
                </div>
                <button id="topup-button" class="topup-chip ml-1 hidden">+</button>
              </div>
              <div class="relative flex-shrink-0">
                <button id="dropdown-toggle" class="cta ghost text-sm">
                  <span id="username-display">User</span>
                  <i class="fa-solid fa-chevron-down ml-2 text-xs"></i>
                </button>
                <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white/95 text-gray-900 ring-1 ring-black ring-opacity-5">
                  <div class="py-2">
                    <a href="inventory.html" class="user-nav-link block px-4 py-2 text-sm hover:bg-gray-100">Inventory</a>
                    <a href="profile.html" class="user-nav-link block px-4 py-2 text-sm hover:bg-gray-100">Profile</a>
                    <a href="how-it-works.html" class="block px-4 py-2 text-sm hover:bg-gray-100">How It Works</a>
                    <a id="logout-desktop" href="#" class="hidden block px-4 py-2 text-sm text-red-500 hover:bg-gray-100">Logout</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center md:hidden gap-2">
            <button class="theme-toggle" type="button" aria-label="Toggle dark mode">
              <i class="fas fa-moon"></i>
            </button>
            <div id="user-balance-mobile-header" class="hidden balance-chip mr-1">
              <div class="balance-icon flex items-center justify-center">
                <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" class="w-5 h-5 object-contain" alt="Gems" />
              </div>
              <div class="flex flex-col leading-tight">
                <span id="balance-amount-mobile" class="balance-amount text-base">0</span>
                <span class="balance-label text-xs">gems</span>
              </div>
              <button id="topup-button-mobile-header" class="topup-chip hidden">+</button>
            </div>
            <button id="menu-toggle" type="button" class="cta ghost text-sm px-3 py-2" aria-expanded="false">
              <span class="sr-only">Open main menu</span>
              <i class="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </div>
      <div id="mobile-dropdown" class="md:hidden hidden bg-black/60 backdrop-blur border-t border-white/5">
        <div class="pt-2 pb-3 space-y-1 px-4">
          <a data-nav="index.html" href="index.html" class="block px-3 py-2 rounded-lg hover:bg-white/10"><i class="fas fa-box-open mr-2"></i>Open Packs</a>
          <a data-nav="box-battles.html" href="box-battles.html" class="block px-3 py-2 rounded-lg hover:bg-white/10"><i class="fas fa-sword mr-1"></i><i class="fas fa-shield-alt mr-2"></i>Battles</a>
          <a data-nav="leaderboard.html" href="leaderboard.html" class="block px-3 py-2 rounded-lg hover:bg-white/10"><i class="fas fa-trophy mr-2"></i>Leaderboard</a>
          <a data-nav="marketplace.html" href="marketplace.html" class="block px-3 py-2 rounded-lg hover:bg-white/10"><i class="fas fa-store mr-2"></i>Marketplace</a>
          <a data-nav="rewards.html" href="rewards.html" class="block px-3 py-2 rounded-lg hover:bg-white/10"><i class="fas fa-gift mr-2"></i>Rewards</a>
        </div>
        <div class="pt-4 pb-3 border-t border-white/10 px-4 space-y-2">
          <div id="user-balance-mobile-drawer" class="hidden balance-chip justify-between px-3 py-2 text-sm text-white">
            <div class="flex items-center gap-3">
              <div class="balance-icon flex items-center justify-center">
                <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" class="w-5 h-5 object-contain" alt="Gems" />
              </div>
              <div class="flex flex-col leading-tight">
                <span id="balance-amount-mobile-dropdown" class="balance-amount text-sm">0</span>
                <span class="balance-label text-xs">gems</span>
              </div>
            </div>
            <button id="topup-button-mobile-drawer" class="topup-chip hidden">+</button>
          </div>
          <div class="space-y-1">
            <a id="mobile-inventory-link" href="inventory.html" class="hidden block px-3 py-2 rounded-lg hover:bg-white/10">Inventory</a>
            <a id="mobile-profile-link" href="profile.html" class="hidden block px-3 py-2 rounded-lg hover:bg-white/10">Profile</a>
            <a href="how-it-works.html" class="block px-3 py-2 rounded-lg hover:bg-white/10">How It Works</a>
            <a id="mobile-auth-button" href="auth.html" class="block px-3 py-2 rounded-lg hover:bg-white/10">Sign In</a>
            <a id="mobile-register-button" href="auth.html#register" class="block px-3 py-2 rounded-lg hover:bg-white/10">Register</a>
          </div>
        </div>
      </div>
    </nav>
  `;

  const current = window.location.pathname.split('/').pop() || 'index.html';
  header.querySelectorAll('a[data-nav]').forEach(link => {
    if (link.getAttribute('data-nav') === current) {
      link.classList.add('active');
    }
  });

  const themeButtons = header.querySelectorAll('.theme-toggle');
  const storedTheme = localStorage.getItem('packly-theme');

  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
    localStorage.setItem('packly-theme', isDark ? 'dark' : 'light');

    themeButtons.forEach((btn) => {
      const icon = btn.querySelector('i');
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      if (icon) {
        icon.classList.toggle('fa-moon', !isDark);
        icon.classList.toggle('fa-sun', isDark);
      }
    });
  };

  applyTheme(storedTheme || 'light');

  themeButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(nextTheme);
    })
  );
});
