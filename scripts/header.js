document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  if (!document.querySelector('link[href="styles/main.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/main.css';
    document.head.appendChild(link);
  }

  header.innerHTML = `
    <nav class="navbar fixed top-0 left-0 right-0 z-50 border-b border-gray-200 backdrop-blur bg-white/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <a href="index.html" class="flex-shrink-0 flex items-center">
              <span class="text-2xl font-bold gradient-text">Packly.gg</span>
            </a>
            <div class="hidden md:ml-6 md:flex md:space-x-8">
              <a href="index.html" class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"><i class="fas fa-box-open mr-1"></i>Open Packs</a>
              <a href="box-battles.html" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"><i class="fas fa-sword mr-1"></i><i class="fas fa-shield-alt mr-2"></i> Battles</a>
              <a href="leaderboard.html" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"><i class="fas fa-trophy mr-1"></i>Leaderboard</a>
              <a href="marketplace.html" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"><i class="fas fa-store mr-1"></i>Marketplace</a>
            </div>
          </div>
          <div class="hidden md:ml-6 md:flex md:items-center">
            <div id="auth-buttons" class="flex items-center space-x-4">
              <a href="auth.html" class="text-sm font-medium text-gray-700 hover:text-gray-900">Sign In</a>
              <a href="auth.html#register" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">Register</a>
            </div>
            <div id="user-area" class="hidden md:flex md:items-center">
              <div id="user-balance" class="hidden coin-box text-white text-sm mr-4">
                <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 object-contain" alt="Coins">
                <span id="balance-amount" class="font-medium">0</span>
                <span class="text-gray-300">coins</span>
                <button id="topup-button" class="hidden ml-2 w-5 h-5 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center shadow"><i class="fas fa-plus text-xs"></i></button>
              </div>
              <div class="ml-4 relative flex-shrink-0">
                <button id="dropdown-toggle" class="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none">
                  <span id="username-display">User</span>
                  <svg class="w-5 h-5 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div class="py-1">
                    <a href="inventory.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Inventory</a>
                    <a href="profile.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                    <a href="how-it-works.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">How It Works</a>
                    <a id="logout-desktop" href="#" class="hidden block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="-mr-2 flex items-center md:hidden">
            <div id="user-balance-mobile-header" class="hidden coin-box text-white text-sm mr-3">
              <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 object-contain" alt="Coins">
              <span id="balance-amount-mobile" class="font-medium">0</span>
              <span class="text-gray-300">coins</span>
              <button id="topup-button-mobile-header" class="hidden ml-2 w-5 h-5 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center shadow"><i class="fas fa-plus text-xs"></i></button>
            </div>
            <button id="menu-toggle" type="button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none" aria-expanded="false">
              <span class="sr-only">Open main menu</span>
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div id="mobile-dropdown" class="md:hidden hidden">
        <div class="pt-2 pb-3 space-y-1">
          <a href="index.html" class="block pl-3 pr-4 py-2 border-l-4 border-indigo-500 text-base font-medium text-indigo-700 bg-indigo-50"><i class="fas fa-box-open mr-2"></i>Open Packs</a>
          <a href="box-battles.html" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"><i class="fas fa-sword mr-1"></i><i class="fas fa-shield-alt mr-2"></i> Battles</a>
          <a href="leaderboard.html" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"><i class="fas fa-trophy mr-2"></i>Leaderboard</a>
          <a href="marketplace.html" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"><i class="fas fa-store mr-2"></i>Marketplace</a>
        </div>
        <div class="pt-4 pb-3 border-t border-gray-200">
          <div id="user-balance-mobile-drawer" class="hidden coin-box text-white text-sm mx-4 mb-3">
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 object-contain" alt="Coins">
            <span id="balance-amount-mobile-dropdown" class="font-medium">0</span>
            <span class="text-gray-300">coins</span>
            <button id="topup-button-mobile-drawer" class="hidden ml-2 w-5 h-5 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center shadow"><i class="fas fa-plus text-xs"></i></button>
          </div>
          <div class="space-y-1">
            <a href="inventory.html" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">Inventory</a>
            <a href="profile.html" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">Profile</a>
            <a href="how-it-works.html" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">How It Works</a>
            <a id="mobile-auth-button" href="auth.html" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">Sign In</a>
            <a id="mobile-register-button" href="auth.html#register" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">Register</a>
          </div>
        </div>
      </div>
    </nav>
  `;
});

