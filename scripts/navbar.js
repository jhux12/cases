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

  // Firebase user info injection AFTER header is rendered
  waitForElement("#username-display", () => {
    firebase.auth().onAuthStateChanged((user) => {
      const usernameEl = document.getElementById("username-display");
      const balanceEl = document.getElementById("balance-amount");
      const balanceMobile = document.getElementById("balance-amount-mobile");
      const popupBalance = document.getElementById("popup-balance");
      const mobileAuthBtn = document.getElementById("mobile-auth-button");
      const logoutBtn = document.getElementById("logout-desktop");
      const signinBtn = document.getElementById("signin-desktop");

      if (!usernameEl || !balanceEl) return;

      if (user) {
        const userRef = firebase.database().ref("users/" + user.uid);
        userRef.once("value").then((snap) => {
          const data = snap.val() || {};
          const balance = data.balance || 0;
          const formattedBalance = Number(balance).toLocaleString();
          const username = user.displayName || data.username || user.email;

          usernameEl.innerText = username;
          balanceEl.innerText = formattedBalance;
          if (balanceMobile) balanceMobile.innerText = formattedBalance;
          if (popupBalance) popupBalance.innerText = `${formattedBalance} coins`;

          if (logoutBtn) {
            logoutBtn.style.display = "block";
            logoutBtn.onclick = (e) => {
              e.preventDefault();
              firebase.auth().signOut().then(() => location.reload());
            };
          }

          if (signinBtn) signinBtn.style.display = "none";

          if (mobileAuthBtn) {
            mobileAuthBtn.innerText = "Logout";
            mobileAuthBtn.href = "#";
            mobileAuthBtn.onclick = (e) => {
              e.preventDefault();
              firebase.auth().signOut().then(() => location.reload());
            };
          }
        });
      } else {
        const zeroBalance = Number(0).toLocaleString();
        usernameEl.innerText = "User";
        balanceEl.innerText = zeroBalance;
        if (balanceMobile) balanceMobile.innerText = zeroBalance;
        if (popupBalance) popupBalance.innerText = `${zeroBalance} coins`;

        if (logoutBtn) logoutBtn.style.display = "none";
        if (signinBtn) signinBtn.style.display = "block";

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

    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (
        !userDropdown.classList.contains("hidden") &&
        !userDropdown.contains(e.target) &&
        !dropdownToggle.contains(e.target)
      ) {
        userDropdown.classList.add("hidden");
      }
    });
  });

  // Mobile menu toggle
  waitForElement("#menu-toggle", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const mobileDropdown = document.getElementById("mobile-dropdown");

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
      if (
        !mobileDropdown.classList.contains("hidden") &&
        !mobileDropdown.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        mobileDropdown.classList.add("hidden");
      }
    });
  });
});
