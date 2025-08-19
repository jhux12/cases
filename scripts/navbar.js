document.addEventListener("DOMContentLoaded", () => {
  const waitForElement = (selector, callback) => {
    const el = document.querySelector(selector);
    if (el) return callback(el);
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        callback(el);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // Pickem countdown timer in nav
  const initNavTimer = () => {
    const timerEls = [
      document.getElementById('pickem-nav-timer'),
      document.getElementById('pickem-nav-timer-desktop')
    ].filter(Boolean);
    if (!timerEls.length) return;
    const HALF_HOUR = 30 * 60 * 1000;
    const update = () => {
      const diff = HALF_HOUR - (Date.now() % HALF_HOUR);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      timerEls.forEach(el => {
        el.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      });
    };
    update();
    setInterval(update, 1000);
  };
  initNavTimer();

  // Firebase user info injection AFTER header is rendered
  waitForElement("#username-display", () => {
    const usernameEl = document.getElementById("username-display");
    const balanceEl = document.getElementById("balance-amount");
    const balanceMobile = document.getElementById("balance-amount-mobile");
    const balanceDropdown = document.getElementById("balance-amount-mobile-dropdown");
    const popupBalance = document.getElementById("popup-balance");
    const mobileAuthBtn = document.getElementById("mobile-auth-button");
    const mobileRegisterBtn = document.getElementById("mobile-register-button");
    const logoutBtn = document.getElementById("logout-desktop");
    const authButtons = document.getElementById("auth-buttons");
    const userArea = document.getElementById("user-area");
    const balanceContainer = document.getElementById("user-balance");
    const balanceMobileHeader = document.getElementById("user-balance-mobile-header");
    const topupBtn = document.getElementById("topup-button");
    const topupMobile = document.getElementById("topup-button-mobile");

    if (!usernameEl || !balanceEl) return;

    let userRef;
    let handler;

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        userRef = firebase.database().ref("users/" + user.uid);
        handler = (snap) => {
          const data = snap.val() || {};
          const balance = data.balance || 0;
          const username = user.displayName || data.username || user.email;
          const balanceFormatted = Number(balance).toLocaleString();

          usernameEl.innerText = username;
          balanceEl.innerText = balanceFormatted;
          if (balanceMobile) balanceMobile.innerText = balanceFormatted;
          if (balanceDropdown) balanceDropdown.innerText = balanceFormatted;
          if (popupBalance) popupBalance.innerText = `${balanceFormatted} coins`;
        };
        userRef.on("value", handler);

        if (authButtons) authButtons.classList.add("hidden");
        if (userArea) userArea.classList.remove("hidden");
        if (balanceContainer) balanceContainer.classList.remove("hidden");
        if (balanceMobileHeader) balanceMobileHeader.classList.remove("hidden");
        if (topupBtn) topupBtn.classList.remove("hidden");
        if (topupMobile) topupMobile.classList.remove("hidden");
        if (mobileRegisterBtn) mobileRegisterBtn.classList.add("hidden");

        if (logoutBtn) {
          logoutBtn.style.display = "block";
          logoutBtn.onclick = (e) => {
            e.preventDefault();
            firebase.auth().signOut().then(() => location.reload());
          };
        }

        if (mobileAuthBtn) {
          mobileAuthBtn.innerText = "Logout";
          mobileAuthBtn.href = "#";
          mobileAuthBtn.onclick = (e) => {
            e.preventDefault();
            firebase.auth().signOut().then(() => location.reload());
          };
        }
      } else {
        if (userRef && handler) {
          userRef.off("value", handler);
          userRef = null;
          handler = null;
        }

        usernameEl.innerText = "User";
        balanceEl.innerText = "0";
        if (balanceMobile) balanceMobile.innerText = "0";
        if (balanceDropdown) balanceDropdown.innerText = "0";
        if (popupBalance) popupBalance.innerText = "0 coins";

        if (authButtons) authButtons.classList.remove("hidden");
        if (userArea) userArea.classList.add("hidden");
        if (balanceContainer) balanceContainer.classList.add("hidden");
        if (balanceMobileHeader) balanceMobileHeader.classList.add("hidden");
        if (topupBtn) topupBtn.classList.add("hidden");
        if (topupMobile) topupMobile.classList.add("hidden");
        if (mobileRegisterBtn) mobileRegisterBtn.classList.remove("hidden");

        if (logoutBtn) logoutBtn.style.display = "none";

        if (mobileAuthBtn) {
          mobileAuthBtn.innerText = "Sign In";
          mobileAuthBtn.href = "auth.html";
          mobileAuthBtn.onclick = null;
        }
      }
    });
  });

 // Top-up popup toggle
waitForElement("#topup-button", () => {
  waitForElement("#topup-popup", () => {
    const topupPopup = document.getElementById("topup-popup");
    const topupDesktop = document.getElementById("topup-button");
    const topupMobile = document.getElementById("topup-button-mobile");

    const openTopup = () => {
      topupPopup.classList.remove("hidden");
    };

    if (topupDesktop) topupDesktop.addEventListener("click", openTopup);
    if (topupMobile) topupMobile.addEventListener("click", openTopup);
  });
});
  // Dropdown toggle
  waitForElement("#dropdown-toggle", () => {
    const dropdownToggle = document.getElementById("dropdown-toggle");
    const userDropdown = document.getElementById("user-dropdown");
    const openDropdown = () => {
      userDropdown.classList.remove("hidden", "fade-out");
      userDropdown.classList.add("fade-in");
    };

    const closeDropdown = () => {
      userDropdown.classList.remove("fade-in");
      userDropdown.classList.add("fade-out");
      userDropdown.addEventListener(
        "animationend",
        () => {
          userDropdown.classList.add("hidden");
          userDropdown.classList.remove("fade-out");
        },
        { once: true }
      );
    };

    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (userDropdown.classList.contains("hidden")) {
        openDropdown();
      } else {
        closeDropdown();
      }
    });

    document.addEventListener("click", (e) => {
      if (
        !userDropdown.classList.contains("hidden") &&
        !userDropdown.contains(e.target) &&
        !dropdownToggle.contains(e.target)
      ) {
        closeDropdown();
      }
    });
  });

  // Mobile menu toggle
  waitForElement("#menu-toggle", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const mobileDropdown = document.getElementById("mobile-dropdown");

    const openMenu = () => {
      mobileDropdown.classList.remove("hidden", "fade-out");
      mobileDropdown.classList.add("fade-in");
    };

    const closeMenu = () => {
      mobileDropdown.classList.remove("fade-in");
      mobileDropdown.classList.add("fade-out");
      mobileDropdown.addEventListener(
        "animationend",
        () => {
          mobileDropdown.classList.add("hidden");
          mobileDropdown.classList.remove("fade-out");
        },
        { once: true }
      );
    };

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (mobileDropdown.classList.contains("hidden")) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        !mobileDropdown.classList.contains("hidden") &&
        !mobileDropdown.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });
  });
});
