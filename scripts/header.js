document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  header.innerHTML = `
    <nav class="navbar fixed w-full z-50 py-3 px-4 flex items-center justify-between bg-gray-900 border-b border-gray-800" style="min-height: 72px;">
      <div class="flex items-center gap-4">
        <a href="index.html">
          <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Untitled%20design%20(29).png?alt=media&token=51dc030a-b05d-46ec-b1ab-c2fd1824d74e" class="h-10 sm:h-12">
        </a>
      </div>
      <div class="hidden sm:flex items-center gap-4 relative">
        <a href="rewards.html" class="flex items-center gap-1 text-yellow-400 font-semibold hover:text-yellow-300 transition">
          <i class="fas fa-gift"></i> Rewards
        </a>
        <a href="leaderboard.html" class="flex items-center gap-1 text-blue-400 font-semibold hover:text-blue-300 transition">
          <i class="fas fa-trophy"></i> Leaderboard
        </a>
        <a href="marketplace.html" class="flex items-center gap-1 text-pink-400 font-semibold hover:text-pink-300 transition">
          <i class="fas fa-store"></i> Marketplace
        </a>
        <div id="user-balance" class="flex items-center gap-1 bg-gray-800 text-white px-3 py-1 rounded-full text-sm hidden">
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 object-contain" />
          <span id="balance-amount">0</span>
          <span>coins</span>
          <button id="topup-button" class="text-green-400 font-bold ml-1">+</button>
        </div>
        <div class="relative">
          <button id="dropdown-toggle" class="flex items-center space-x-2 text-white focus:outline-none">
            <i class="fas fa-user-circle text-xl"></i>
            <span id="username-display">User</span>
            <i class="fas fa-chevron-down text-xs"></i>
          </button>
          <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg hidden z-50">
            <a href="index.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700"><i class="fas fa-cube mr-2"></i> Open Packs</a>
            <a href="inventory.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700"><i class="fas fa-box-open mr-2"></i> Inventory</a>
            <a href="profile.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700"><i class="fas fa-user mr-2"></i> Profile</a>
            <a href="how-it-works.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700"><i class="fas fa-question-circle mr-2"></i> How It Works</a>
            <a id="signin-desktop" href="auth.html" class="block px-4 py-2 text-sm text-green-400 hover:bg-gray-700"><i class="fas fa-sign-in-alt mr-2"></i> Sign In</a>
            <a id="logout-desktop" href="#" class="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700"><i class="fas fa-sign-out-alt mr-2"></i> Logout</a>
          </div>
        </div>
      </div>
      <div class="sm:hidden flex items-center gap-2">
        <div id="user-balance-mobile-header" class="hidden items-center gap-1 bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 object-contain" />
          <span id="balance-amount-mobile">0</span>
          <span>coins</span>
          <button id="topup-button-mobile-header" class="text-green-400 ml-1">
            <i class="fas fa-wallet"></i>
          </button>
        </div>
        <div id="auth-buttons-mobile-header" class="hidden items-center gap-2">
          <a id="signin-mobile-header" href="auth.html" class="text-green-400 text-sm">Sign In</a>
          <a id="register-mobile-header" href="auth.html?register=true" class="text-blue-400 text-sm">Register</a>
        </div>
      </div>
      </nav>
      <div id="drawer-overlay" class="fixed inset-0 bg-black/50 hidden z-40 sm:hidden"></div>
      <aside id="mobile-drawer" class="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 transform -translate-x-full transition-transform duration-300 z-[100] sm:hidden">
        <div class="p-4 h-full overflow-y-auto pb-24 space-y-4">
          <div id="drawer-balance-section" class="flex items-center justify-between text-white">
            <div class="flex items-center gap-2">
              <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-5 h-5" />
              <span id="drawer-balance-amount">0</span>
              <span>coins</span>
            </div>
            <button id="topup-button-mobile-drawer" class="text-green-400 hover:text-green-300">
              <i class="fas fa-wallet text-xl"></i>
            </button>
          </div>
          <div id="drawer-auth-buttons" class="flex flex-col gap-2">
            <a id="drawer-signin" href="auth.html" class="w-full text-center py-2 bg-green-600 rounded text-white">Sign In</a>
            <a id="drawer-register" href="auth.html?register=true" class="w-full text-center py-2 bg-blue-600 rounded text-white">Register</a>
          </div>
          <nav class="flex flex-col gap-2">
            <a href="index.html" class="block px-4 py-2 text-sm text-white rounded hover:bg-gray-800 flex items-center gap-2"><i class="fas fa-cube"></i> Open Packs</a>
            <a id="drawer-inventory-link" href="inventory.html" class="block px-4 py-2 text-sm text-white rounded hover:bg-gray-800 flex items-center gap-2 hidden"><i class="fas fa-box-open"></i> Inventory</a>
            <a id="drawer-profile-link" href="profile.html" class="block px-4 py-2 text-sm text-white rounded hover:bg-gray-800 flex items-center gap-2 hidden"><i class="fas fa-user"></i> Profile</a>
            <a href="how-it-works.html" class="block px-4 py-2 text-sm text-white rounded hover:bg-gray-800 flex items-center gap-2"><i class="fas fa-question-circle"></i> How It Works</a>
            <a href="rewards.html" class="block px-4 py-2 text-sm text-yellow-400 rounded hover:bg-gray-800 flex items-center gap-2"><i class="fas fa-gift"></i> Rewards</a>
            <a href="marketplace.html" class="block px-4 py-2 text-sm text-pink-400 rounded hover:bg-gray-800 flex items-center gap-2"><i class="fas fa-store"></i> Marketplace</a>
            <a href="leaderboard.html" class="block px-4 py-2 text-sm text-blue-400 rounded hover:bg-gray-800 flex items-center gap-2"><i class="fas fa-trophy"></i> Leaderboard</a>
            <a id="drawer-logout" href="#" class="block px-4 py-2 text-sm text-red-400 rounded hover:bg-gray-800 flex items-center gap-2 hidden"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </nav>
        </div>
      </aside>
      <nav id="mobile-bottom-nav" class="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around py-2 sm:hidden z-50">
        <button id="drawer-menu-button" type="button" class="flex flex-col items-center text-xs text-white">
          <i class="fas fa-bars text-lg"></i>
          <span>Menu</span>
        </button>
        <a id="inventory-link" href="inventory.html" class="flex flex-col items-center text-xs text-white hidden">
          <i class="fas fa-box-open text-lg"></i>
          <span>Inventory</span>
        </a>
        <a href="how-it-works.html" class="flex flex-col items-center text-xs text-white">
          <i class="fas fa-question-circle text-lg"></i>
          <span>How It Works</span>
        </a>
        <a href="rewards.html" class="flex flex-col items-center text-xs text-yellow-400">
          <i class="fas fa-gift text-lg"></i>
          <span>Rewards</span>
        </a>
        <a href="marketplace.html" class="flex flex-col items-center text-xs text-pink-400">
          <i class="fas fa-store text-lg"></i>
          <span>Market</span>
        </a>
      </nav>
    `; // <-- closing backtick and semicolon!
  const drawerMenuButton = document.getElementById("drawer-menu-button");
  const mobileDrawer = document.getElementById("mobile-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");

  if (drawerMenuButton && mobileDrawer && drawerOverlay) {
    const toggleDrawer = () => {
      mobileDrawer.classList.toggle("-translate-x-full");
      drawerOverlay.classList.toggle("hidden");
    };
    drawerMenuButton.onclick = toggleDrawer;
    drawerOverlay.onclick = toggleDrawer;
  }

  // Firebase auth logic
  firebase.auth().onAuthStateChanged(async (user) => {
    const drawerAuthButtons = document.getElementById("drawer-auth-buttons");
    const drawerBalanceSection = document.getElementById("drawer-balance-section");
    const authButtonsMobileHeader = document.getElementById("auth-buttons-mobile-header");
    const userBalanceMobileHeader = document.getElementById("user-balance-mobile-header");
    const drawerInventoryLink = document.getElementById("drawer-inventory-link");
    const drawerProfileLink = document.getElementById("drawer-profile-link");
    const drawerLogout = document.getElementById("drawer-logout");
    const inventoryLink = document.getElementById("inventory-link");

    if (!user) {
      if (authButtonsMobileHeader) authButtonsMobileHeader.classList.remove("hidden");
      if (userBalanceMobileHeader) userBalanceMobileHeader.classList.add("hidden");
      if (drawerAuthButtons) drawerAuthButtons.classList.remove("hidden");
      if (drawerBalanceSection) drawerBalanceSection.classList.add("hidden");
      if (drawerInventoryLink) drawerInventoryLink.classList.add("hidden");
      if (drawerProfileLink) drawerProfileLink.classList.add("hidden");
      if (drawerLogout) drawerLogout.classList.add("hidden");
      if (inventoryLink) inventoryLink.classList.add("hidden");
      return;
    }

    if (authButtonsMobileHeader) authButtonsMobileHeader.classList.add("hidden");
    if (userBalanceMobileHeader) userBalanceMobileHeader.classList.remove("hidden");
    if (drawerAuthButtons) drawerAuthButtons.classList.add("hidden");
    if (drawerBalanceSection) drawerBalanceSection.classList.remove("hidden");
    if (drawerInventoryLink) drawerInventoryLink.classList.remove("hidden");
    if (drawerProfileLink) drawerProfileLink.classList.remove("hidden");
    if (drawerLogout) drawerLogout.classList.remove("hidden");
    if (inventoryLink) inventoryLink.classList.remove("hidden");

    const db = firebase.database();
    const userRef = db.ref("users/" + user.uid);
    let prevBalance = null;

    userRef.on("value", (snapshot) => {
      const data = snapshot.val() || {};
      const balance = data.balance || 0;

      const balanceDesktop = document.getElementById("balance-amount");
      const balanceMobile = document.getElementById("balance-amount-mobile");
      const balanceDrawer = document.getElementById("drawer-balance-amount");
      const userBalanceDiv = document.getElementById("user-balance");
      const usernameDisplay = document.getElementById("username-display");
      const signinDesktop = document.getElementById("signin-desktop");
      const logoutDesktop = document.getElementById("logout-desktop");

      const formatted = parseInt(balance, 10).toLocaleString();
      if (balanceDesktop) balanceDesktop.innerText = formatted;
      if (balanceMobile) balanceMobile.innerText = formatted;
      if (balanceDrawer) balanceDrawer.innerText = formatted;
      if (userBalanceDiv) userBalanceDiv.classList.remove("hidden");
      if (drawerBalanceSection) drawerBalanceSection.classList.remove("hidden");

      if (prevBalance !== balance) {
        [userBalanceDiv, userBalanceMobileHeader, drawerBalanceSection].forEach((el) => {
          if (el) {
            el.classList.add("pulse-balance");
            el.addEventListener(
              "animationend",
              () => el.classList.remove("pulse-balance"),
              { once: true }
            );
          }
        });
        prevBalance = balance;
      }
      if (usernameDisplay) usernameDisplay.innerText = user.displayName || data.username || user.email || "User";
      if (signinDesktop) signinDesktop.classList.add("hidden");
      if (logoutDesktop) logoutDesktop.classList.remove("hidden");

      if (logoutDesktop) {
        logoutDesktop.onclick = (e) => {
          e.preventDefault();
          firebase.auth().signOut().then(() => location.reload());
        };
      }
      if (drawerLogout) {
        drawerLogout.onclick = (e) => {
          e.preventDefault();
          firebase.auth().signOut().then(() => location.reload());
        };
      }
    });
  });
});

