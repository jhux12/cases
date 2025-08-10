document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  // Ensure the neon navigation styles are available on every page
  if (!document.querySelector('link[href="styles/main.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/main.css';
    document.head.appendChild(link);
  }

  header.innerHTML = `
    <nav class="navbar crazy-nav fixed top-0 left-0 w-full z-50 py-3 px-6 flex items-center justify-between" style="min-height: 72px; background-color: #111117;">
      <div class="flex items-center gap-4">
        <a href="index.html" class="nav-link logo-link">
          <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Untitled%20design%20(29).png?alt=media&token=51dc030a-b05d-46ec-b1ab-c2fd1824d74e" class="h-10 sm:h-12">
        </a>
      </div>
      <div class="hidden sm:flex items-center gap-6 relative">
        <a href="rewards.html" class="nav-link text-yellow-400"><i class="fas fa-gift"></i><span>Rewards</span></a>
        <a href="leaderboard.html" class="nav-link text-blue-400"><i class="fas fa-trophy"></i><span>Leaderboard</span></a>
        <a href="marketplace.html" class="nav-link text-pink-400"><i class="fas fa-store"></i><span>Marketplace</span></a>
        <div id="user-balance" class="hidden flex items-center neon-balance rounded-full overflow-hidden text-sm">
          <div class="flex items-center gap-1 px-3 py-1">
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 object-contain" />
            <span id="balance-amount">0</span>
          </div>
          <button id="topup-button" class="px-3 py-1 border-l flex items-center"><i class="fas fa-wallet"></i></button>
        </div>
        <div class="relative">
          <button id="dropdown-toggle" class="nav-link flex items-center space-x-2 text-white">
            <i class="fas fa-user-circle text-xl"></i>
            <span id="username-display">User</span>
            <i class="fas fa-chevron-down text-xs"></i>
          </button>
          <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg hidden z-[60]">
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
        <div id="user-balance-mobile-header" class="hidden flex items-center neon-balance rounded-full overflow-hidden text-sm">
          <div class="flex items-center gap-1 px-3 py-1">
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 object-contain" />
            <span id="balance-amount-mobile">0</span>
          </div>
          <button id="topup-button-mobile-header" class="px-3 py-1 border-l flex items-center"><i class="fas fa-wallet"></i></button>
        </div>
        <div id="auth-buttons-mobile-header" class="hidden items-center gap-2">
          <a id="signin-mobile-header" href="auth.html" class="px-3 py-1 rounded bg-green-600 text-white text-sm">Sign In</a>
          <a id="register-mobile-header" href="auth.html?register=true" class="px-3 py-1 rounded bg-blue-600 text-white text-sm">Register</a>
        </div>
      </div>
    </nav>
      <div id="drawer-overlay" class="fixed inset-0 bg-black/50 hidden z-40 sm:hidden"></div>
      <aside id="mobile-drawer" class="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 transform -translate-x-full transition-transform duration-300 z-[100] sm:hidden">
        <div class="p-4 h-full overflow-y-auto pb-24 space-y-4">
        <div
            id="drawer-user-info"
            class="hidden flex flex-col items-center text-center text-white space-y-1 pb-4 border-b border-gray-800"
          >
            <span id="drawer-username" class="font-semibold"></span>
            <div class="flex items-center gap-2 text-xs">
              <div id="drawer-badge" class="px-2 py-0.5 rounded-full bg-purple-600"></div>
              <span class="text-gray-400">Lvl <span id="drawer-level"></span></span>
            </div>
            <div class="w-full mt-2 px-4">
              <div class="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div id="drawer-xp-bar" class="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-500 rounded-full transition-all duration-300" style="width:0%"></div>
              </div>
              <div id="drawer-progress-text" class="text-[10px] text-gray-400 mt-1"></div>
              <div id="drawer-next-reward" class="text-[10px] text-yellow-400"></div>
            </div>
          </div>
          <div id="drawer-balance-section" class="flex items-center justify-between text-white">
            <div class="flex items-center gap-2">
              <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-5 h-5" />
              <span id="drawer-balance-amount">0</span>
            </div>
            <button id="topup-button-mobile-drawer" class="text-yellow-400 hover:text-yellow-300">
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
      <nav id="mobile-bottom-nav" class="crazy-bottom-nav fixed bottom-0 left-0 right-0 flex justify-around py-2 sm:hidden z-50" style="background-color: #111117;">
        <button id="drawer-menu-button" type="button" class="flex flex-col items-center text-xs text-white">
          <i class="fas fa-bars text-lg"></i>
          <span>Menu</span>
        </button>
        <a id="inventory-link" href="inventory.html" class="flex flex-col items-center text-xs text-white hidden">
          <i class="fas fa-box-open text-lg"></i>
          <span>Inventory</span>
        </a>
        <a href="index.html" class="flex flex-col items-center text-xs text-white">
          <i class="fas fa-cube text-lg"></i>
          <span>Open Packs</span>
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

  // Prevent drawer animation on initial load
  if (mobileDrawer) {
    mobileDrawer.style.transition = "none";
    requestAnimationFrame(() => {
      mobileDrawer.style.transition = "";
    });
  }

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
    const drawerUserInfo = document.getElementById("drawer-user-info");
    const drawerBadge = document.getElementById("drawer-badge");
    const drawerUsername = document.getElementById("drawer-username");
    const drawerLevel = document.getElementById("drawer-level");
    const drawerXpBar = document.getElementById("drawer-xp-bar");
    const drawerProgressText = document.getElementById("drawer-progress-text");
    const drawerNextReward = document.getElementById("drawer-next-reward");

    if (!user) {
      if (authButtonsMobileHeader) authButtonsMobileHeader.classList.remove("hidden");
      if (userBalanceMobileHeader) userBalanceMobileHeader.classList.add("hidden");
      if (drawerAuthButtons) drawerAuthButtons.classList.remove("hidden");
      if (drawerBalanceSection) drawerBalanceSection.classList.add("hidden");
      if (drawerInventoryLink) drawerInventoryLink.classList.add("hidden");
      if (drawerProfileLink) drawerProfileLink.classList.add("hidden");
      if (drawerLogout) drawerLogout.classList.add("hidden");
      if (inventoryLink) inventoryLink.classList.add("hidden");
      if (drawerUserInfo) drawerUserInfo.classList.add("hidden");
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
    if (drawerUserInfo) drawerUserInfo.classList.remove("hidden");

    const db = firebase.database();
    const userRef = db.ref("users/" + user.uid);

    // Load username and balance continuously
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
      const uname = user.displayName || data.username || user.email || "User";
      if (usernameDisplay) usernameDisplay.innerText = uname;
      if (drawerUsername) drawerUsername.innerText = uname;
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

    // Load level and badge info
    const [lbDoc, badgeSnap, levelSnap] = await Promise.all([
      firebase.firestore().collection("leaderboard").doc(user.uid).get(),
      db.ref("milestoneConfig/badges").once("value"),
      db.ref("milestoneConfig/levels").once("value"),
    ]);
    const lbData = lbDoc.data() || {};
    const packsOpened = lbData.packsOpened || 0;
    const cardValue = lbData.cardValue || 0;
    const badgeCfg = badgeSnap.val() || [];
    let currentBadge = null;
    if (Array.isArray(badgeCfg)) {
      badgeCfg.forEach((b) => {
        const threshold = b.threshold || 0;
        const type = b.type || "packs";
        if (
          (type === "packs" && packsOpened >= threshold) ||
          (type === "value" && cardValue >= threshold)
        ) {
          if (!currentBadge || threshold > (currentBadge.threshold || 0)) {
            currentBadge = b;
          }
        }
      });
    }
    const levelConfig = levelSnap.val() || [];
    const levelInfo = determineLevel(packsOpened, levelConfig);
    if (drawerLevel) drawerLevel.innerText = levelInfo.level;
    if (drawerBadge) {
      if (currentBadge) {
        drawerBadge.innerText = currentBadge.name;
        drawerBadge.style.backgroundColor = currentBadge.color || "#9333ea";
        drawerBadge.classList.remove("hidden");
      } else {
        drawerBadge.classList.add("hidden");
      }
    }

    if (drawerXpBar) {
      let pct = 100;
      if (levelInfo.nextThreshold > levelInfo.prevThreshold) {
        pct =
          ((packsOpened - levelInfo.prevThreshold) /
            (levelInfo.nextThreshold - levelInfo.prevThreshold)) * 100;
        const remaining = levelInfo.nextThreshold - packsOpened;
        if (drawerProgressText)
          drawerProgressText.textContent = `${remaining} packs to next level`;
        const nextCfg = Array.isArray(levelConfig)
          ? levelConfig[levelInfo.level]
          : null;
        const reward =
          typeof nextCfg === "object" ? nextCfg.reward || 0 : 0;
        if (drawerNextReward && nextCfg) {
          drawerNextReward.textContent = `Reward: +${reward.toLocaleString()} coins`;
        } else if (drawerNextReward) {
          drawerNextReward.textContent = "";
        }
      } else {
        if (drawerProgressText)
          drawerProgressText.textContent = "Max level achieved";
        if (drawerNextReward) drawerNextReward.textContent = "";
      }
      drawerXpBar.style.width = pct + "%";
    }
  });

  function determineLevel(packs, levels) {
    if (!Array.isArray(levels) || levels.length === 0) {
      const level = Math.floor(packs / 10) + 1;
      const prev = (level - 1) * 10;
      const next = level * 10;
      return { level, prevThreshold: prev, nextThreshold: next };
    }
    let lvl = 1;
    let prev = 0;
    let next = null;
    levels.forEach((entry, idx) => {
      const t = typeof entry === 'object' ? entry.threshold : entry;
      if (packs >= t) {
        lvl = idx + 1;
        prev = t;
      } else if (next === null) {
        next = t;
      }
    });
    if (next === null) next = prev;
    return { level: lvl, prevThreshold: prev, nextThreshold: next };
  }
});

