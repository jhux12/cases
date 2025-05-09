document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  header.innerHTML = `
    <nav class="navbar fixed w-full z-50 py-3 px-4 flex items-center justify-between bg-gray-900 border-b border-gray-800" style="min-height: 72px;">
      <div class="flex items-center gap-4">
        <a href="index.html">
          <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Untitled%20design%20(12).png?alt=media&token=40696ba9-f512-4316-8dec-bab9a4f037c8" class="h-10 sm:h-12">
        </a>
      </div>
      <div class="hidden sm:flex items-center gap-4 relative">
        <a href="rewards.html" class="flex items-center gap-1 text-yellow-400 font-semibold hover:text-yellow-300 transition">
          <i class="fas fa-gift"></i> Rewards
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
            <a href="inventory.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700">Inventory</a>
            <a href="how-it-works.html" class="block px-4 py-2 text-sm text-white hover:bg-gray-700">How It Works</a>
            <a id="signin-desktop" href="auth.html" class="block px-4 py-2 text-sm text-green-400 hover:bg-gray-700">Sign In</a>
            <a id="logout-desktop" href="#" class="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Logout</a>
          </div>
        </div>
      </div>
      <div class="sm:hidden">
        <button id="menu-toggle" class="text-white text-2xl">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </nav>
    <div id="mobile-dropdown" class="hidden mt-2 bg-gray-800 border border-gray-700 rounded-lg w-48 py-2 fixed right-4 top-[72px] z-[9999] shadow-lg sm:hidden">
      <div id="user-balance-mobile" class="flex items-center justify-between px-4 py-2 text-sm text-white border-b border-gray-700">
        <span><img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="inline w-4 h-4 mr-1"> <span id="balance-amount-mobile">0</span> coins</span>
        <button id="topup-button-mobile" class="text-green-400 text-lg font-bold hover:text-green-500">+</button>
      </div>
      <a id="inventory-link" href="inventory.html" class="block px-4 py-2 hover:bg-gray-700 text-white text-sm hidden">Inventory</a>
      <a href="how-it-works.html" class="block px-4 py-2 hover:bg-gray-700 text-white text-sm">How It Works</a>
      <a href="rewards.html" class="block px-4 py-2 hover:bg-gray-700 text-yellow-400 text-sm">
        <i class="fas fa-gift mr-2"></i> Rewards
      </a>
      <a id="mobile-auth-button" href="auth.html" class="block px-4 py-2 hover:bg-gray-700 text-red-400 text-sm">Sign In</a>
    </div>
  `;

  // Firebase Auth check
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;
    const db = firebase.database();
    const userRef = db.ref("users/" + user.uid);
    const snapshot = await userRef.once("value");
    const data = snapshot.val() || {};
    const balance = data.balance || 0;

    const balanceDesktop = document.getElementById("balance-amount");
    const balanceMobile = document.getElementById("balance-amount-mobile");
    const userBalanceDiv = document.getElementById("user-balance");
    const usernameDisplay = document.getElementById("username-display");
    const signinDesktop = document.getElementById("signin-desktop");
    const logoutDesktop = document.getElementById("logout-desktop");
    const mobileAuth = document.getElementById("mobile-auth-button");

    if (balanceDesktop) balanceDesktop.innerText = balance;
    if (balanceMobile) balanceMobile.innerText = balance;
    if (userBalanceDiv) userBalanceDiv.classList.remove("hidden");
    if (usernameDisplay) usernameDisplay.innerText = data.username || user.displayName || user.email || "User";
    if (signinDesktop) signinDesktop.classList.add("hidden");
    if (logoutDesktop) logoutDesktop.classList.remove("hidden");

    if (logoutDesktop) {
      logoutDesktop.onclick = (e) => {
        e.preventDefault();
        firebase.auth().signOut().then(() => location.reload());
      };
    }

    if (mobileAuth) {
      mobileAuth.innerText = "Logout";
      mobileAuth.href = "#";
      mobileAuth.onclick = (e) => {
        e.preventDefault();
        firebase.auth().signOut().then(() => location.reload());
      };
    }
  });
});

