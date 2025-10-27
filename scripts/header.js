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
    <nav class="navbar fixed w-full z-50 py-3 px-4 flex items-center justify-between bg-gray-900 border-b border-gray-800" style="min-height: 72px;">
      <div class="flex items-center gap-4">
        <a href="index.html">
          <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Untitled%20design%20(28).png?alt=media&token=61fab7cf-c6e5-4598-8865-bd95007d6961" class="h-10 sm:h-12" alt="Packly.gg logo" />
        </a>
      </div>
      <div class="hidden sm:flex items-center gap-4 relative">
        <a data-nav="index.html" href="index.html" class="flex items-center gap-1 text-blue-400 font-semibold hover:text-blue-300 transition">
          <i class="fas fa-box-open"></i> Open Packs
        </a>
        <a data-nav="box-battles.html" href="box-battles.html" class="flex items-center gap-1 text-purple-400 font-semibold hover:text-purple-300 transition">
          <i class="fas fa-sword"></i><i class="fas fa-shield-alt ml-1 mr-1"></i> Battles
        </a>
        <a data-nav="leaderboard.html" href="leaderboard.html" class="flex items-center gap-1 text-sky-400 font-semibold hover:text-sky-300 transition">
          <i class="fas fa-trophy"></i> Leaderboard
        </a>
        <a data-nav="marketplace.html" href="marketplace.html" class="flex items-center gap-1 text-pink-400 font-semibold hover:text-pink-300 transition">
          <i class="fas fa-store"></i> Marketplace
        </a>
        <a data-nav="rewards.html" href="rewards.html" class="flex items-center gap-1 text-yellow-400 font-semibold hover:text-yellow-300 transition">
          <i class="fas fa-gift"></i> Rewards
        </a>
        <div id="auth-buttons" class="flex items-center gap-2">
          <a id="signin-desktop" href="auth.html" class="px-3 py-1.5 rounded-full text-sm font-semibold text-emerald-300 border border-emerald-500/60 hover:text-emerald-200 hover:border-emerald-400/70 transition">Sign In</a>
          <a id="register-desktop" href="auth.html#register" class="px-3 py-1.5 rounded-full text-sm font-semibold text-blue-200 border border-blue-500/60 hover:text-blue-100 hover:border-blue-400/70 transition">Register</a>
        </div>
        <div id="user-area" class="hidden sm:flex items-center gap-3">
          <div id="user-balance" class="hidden balance-chip flex items-center gap-2 text-white px-3 py-1.5 rounded-full text-sm">
            <div class="balance-icon flex items-center justify-center w-8 h-8 rounded-full">
              <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-5 h-5 object-contain" alt="Coins" />
            </div>
            <div class="flex flex-col leading-tight">
              <span id="balance-amount" class="balance-amount text-base">0</span>
              <span class="balance-label">coins</span>
            </div>
            <button id="topup-button" class="topup-chip ml-2 hidden">+</button>
          </div>
          <div class="relative">
            <button id="dropdown-toggle" class="flex items-center space-x-2 text-white focus:outline-none">
              <i class="fas fa-user-circle text-xl"></i>
              <span id="username-display">User</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg hidden z-50">
              <a href="inventory.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700">Inventory</a>
              <a href="profile.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700">Profile</a>
              <a href="how-it-works.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700">How It Works</a>
              <a id="logout-desktop" href="#" class="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hidden">Logout</a>
            </div>
          </div>
        </div>
      </div>
      <div class="sm:hidden flex items-center gap-2">
        <div id="user-balance-mobile-header" class="hidden balance-chip flex items-center gap-2 text-white px-3 py-1.5 rounded-full text-sm">
          <div class="balance-icon flex items-center justify-center w-8 h-8 rounded-full">
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-5 h-5 object-contain" alt="Coins" />
          </div>
          <div class="flex flex-col leading-tight">
            <span id="balance-amount-mobile" class="balance-amount text-base">0</span>
            <span class="balance-label">coins</span>
          </div>
          <button id="topup-button-mobile-header" class="topup-chip text-lg hidden">+</button>
        </div>
        <button id="menu-toggle" class="text-white text-2xl">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </nav>
    <div id="mobile-dropdown" class="hidden mt-2 bg-gray-800 border border-gray-700 rounded-lg w-48 py-2 fixed right-4 top-[72px] z-[9999] shadow-lg sm:hidden">
      <div id="user-balance-mobile-drawer" class="hidden balance-chip flex items-center justify-between px-4 py-2 text-sm text-white border-b border-gray-700 w-full">
        <div class="flex items-center gap-2">
          <div class="balance-icon flex items-center justify-center w-8 h-8 rounded-full">
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-5 h-5 object-contain" alt="Coins" />
          </div>
          <div class="flex flex-col leading-tight">
            <span id="balance-amount-mobile-dropdown" class="balance-amount text-sm">0</span>
            <span class="balance-label">coins</span>
          </div>
        </div>
        <button id="topup-button-mobile-drawer" class="topup-chip text-lg hidden">+</button>
      </div>
      <a id="inventory-link" href="inventory.html" class="block px-4 py-2 hover:bg-gray-700 text-white text-sm hidden">Inventory</a>
      <a data-nav="index.html" href="index.html" class="block px-4 py-2 hover:bg-gray-700 text-blue-400 text-sm">
        <i class="fas fa-box-open mr-2"></i> Open Packs
      </a>
      <a data-nav="box-battles.html" href="box-battles.html" class="block px-4 py-2 hover:bg-gray-700 text-purple-400 text-sm">
        <i class="fas fa-sword mr-1"></i><i class="fas fa-shield-alt mr-2"></i> Battles
      </a>
      <a data-nav="leaderboard.html" href="leaderboard.html" class="block px-4 py-2 hover:bg-gray-700 text-sky-400 text-sm">
        <i class="fas fa-trophy mr-2"></i> Leaderboard
      </a>
      <a data-nav="marketplace.html" href="marketplace.html" class="block px-4 py-2 hover:bg-gray-700 text-pink-400 text-sm">
        <i class="fas fa-store mr-2"></i> Marketplace
      </a>
      <a data-nav="rewards.html" href="rewards.html" class="block px-4 py-2 hover:bg-gray-700 text-yellow-400 text-sm">
        <i class="fas fa-gift mr-2"></i> Rewards
      </a>
      <a href="profile.html" class="block px-4 py-2 hover:bg-gray-700 text-white text-sm">Profile</a>
      <a href="how-it-works.html" class="block px-4 py-2 hover:bg-gray-700 text-white text-sm">How It Works</a>
      <a id="mobile-auth-button" href="auth.html" class="block px-4 py-2 hover:bg-gray-700 text-red-400 text-sm">Sign In</a>
      <a id="mobile-register-button" href="auth.html#register" class="block px-4 py-2 hover:bg-gray-700 text-blue-300 text-sm">Register</a>
    </div>
  `;

  const current = window.location.pathname.split('/').pop() || 'index.html';
  header.querySelectorAll('a[data-nav]').forEach((link) => {
    if (link.getAttribute('data-nav') === current) {
      if (link.closest('#mobile-dropdown')) {
        link.classList.add('active-mobile-nav-link');
      } else {
        link.classList.add('active-nav-link');
      }
    }
  });
});
