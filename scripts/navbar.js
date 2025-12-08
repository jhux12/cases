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
    const balanceMobileDrawer = document.getElementById("user-balance-mobile-drawer");
    const topupBtn = document.getElementById("topup-button");
    const topupMobileHeader = document.getElementById("topup-button-mobile-header");
    const topupMobileDrawer = document.getElementById("topup-button-mobile-drawer");
    const toolbarDesktop = document.getElementById("user-toolbar-desktop");
    const toolbarMobile = document.getElementById("user-toolbar-mobile");
    const notificationBell = document.getElementById("notification-bell");
    const notificationBellMobile = document.getElementById("notification-bell-mobile");
    const notificationPanel = document.getElementById("notification-center");
    const notificationList = document.getElementById("notification-list");
    const notificationIndicator = document.getElementById("notification-indicator");
    const notificationIndicatorMobile = document.getElementById("notification-indicator-mobile");
    const dismissNotifications = document.getElementById("dismiss-notifications");
    const themeToggleStandaloneDesktop = document.getElementById("theme-toggle-desktop-standalone");
    const themeToggleChipDesktop = document.getElementById("theme-toggle-desktop-chip");
    const mobileInventoryLink = document.getElementById("mobile-inventory-link");
    const mobileProfileLink = document.getElementById("mobile-profile-link");
    const inventoryLink = document.getElementById("inventory-link");
    const userLinks = document.querySelectorAll(".user-nav-link");

      if (!usernameEl || !balanceEl) return;

      const attachBalanceEffect = (el) => {
        if (!el) return;
        let prev = el.textContent;
        const observer = new MutationObserver(() => {
          const current = el.textContent;
          if (current !== prev) {
            prev = current;
            el.classList.add("balance-change");
            el.addEventListener(
              "animationend",
              () => el.classList.remove("balance-change"),
              { once: true }
            );
          }
        });
        observer.observe(el, { characterData: true, childList: true, subtree: true });
      };

      [balanceEl, balanceMobile, balanceDropdown].forEach(attachBalanceEffect);

      let userRef;
      let handler;
      let unsubscribeNotifications;
      let latestNotificationTimestamp = 0;
      let lastSeenTimestamp = Number(localStorage.getItem("packly-last-notification") || 0);
      let notificationCache = [];

      const updateNotificationBadge = (items = []) => {
        const unread = items.filter((item) => (item.createdAt || 0) > lastSeenTimestamp).length;
        const toggle = (el) => {
          if (!el) return;
          el.classList.toggle("hidden", unread === 0);
        };
        toggle(notificationIndicator);
        toggle(notificationIndicatorMobile);
      };

      const renderNotifications = (items = []) => {
        if (!notificationList) return;
        notificationList.innerHTML = "";

        if (!items.length) {
          notificationCache = [];
          notificationList.innerHTML = '<p class="notification-empty">No notifications yet.</p>';
          updateNotificationBadge([]);
          return;
        }

        notificationCache = items;
        items.forEach((item) => {
          const card = document.createElement("article");
          card.className = "notification-card";
          card.dataset.severity = item.severity || "info";

          const header = document.createElement("div");
          header.className = "flex items-center justify-between gap-3";
          const title = document.createElement("p");
          title.className = "notification-card__title";
          title.textContent = item.title || "Update";
          const meta = document.createElement("span");
          meta.className = "notification-card__meta";
          meta.textContent = item.createdAt ? new Date(item.createdAt).toLocaleString() : "";
          header.appendChild(title);
          header.appendChild(meta);

          const body = document.createElement("p");
          body.className = "notification-card__body";
          body.textContent = item.body || "";

          card.appendChild(header);
          card.appendChild(body);

          if (item.link) {
            const link = document.createElement("a");
            link.className = "notification-card__link";
            link.href = item.link;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = item.link;
            card.appendChild(link);
          }

          notificationList.appendChild(card);
        });

        updateNotificationBadge(items);
      };

      const attachNotificationStream = () => {
        if (unsubscribeNotifications || !notificationList) return;
        const ref = firebase.database().ref("notifications").orderByChild("createdAt").limitToLast(25);
        const listener = ref.on("value", (snap) => {
          const notifications = [];
          snap.forEach((child) => {
            notifications.push({ id: child.key, ...(child.val() || {}) });
          });
          notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          latestNotificationTimestamp = notifications[0]?.createdAt || 0;
          renderNotifications(notifications);
        });
        unsubscribeNotifications = () => ref.off("value", listener);
      };

      const hideNotificationPanel = () => {
        if (notificationPanel) notificationPanel.classList.add("hidden");
      };

      const openNotificationPanel = () => {
        if (!notificationPanel) return;
        notificationPanel.classList.remove("hidden");
        lastSeenTimestamp = latestNotificationTimestamp || Date.now();
        localStorage.setItem("packly-last-notification", String(lastSeenTimestamp));
        updateNotificationBadge(notificationCache);
      };

      const toggleNotificationPanel = (event) => {
        event?.stopPropagation();
        if (!notificationPanel) return;
        if (notificationPanel.classList.contains("hidden")) {
          openNotificationPanel();
        } else {
          hideNotificationPanel();
        }
      };

      [notificationBell, notificationBellMobile].forEach((btn) => {
        if (!btn) return;
        btn.addEventListener("click", toggleNotificationPanel);
      });

      document.addEventListener("click", (event) => {
        if (!notificationPanel || notificationPanel.classList.contains("hidden")) return;
        if (
          !notificationPanel.contains(event.target) &&
          !notificationBell?.contains(event.target) &&
          !notificationBellMobile?.contains(event.target)
        ) {
          hideNotificationPanel();
        }
      });

      if (dismissNotifications) {
        dismissNotifications.addEventListener("click", () => {
          lastSeenTimestamp = latestNotificationTimestamp || Date.now();
          localStorage.setItem("packly-last-notification", String(lastSeenTimestamp));
          updateNotificationBadge(notificationCache);
        });
      }

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
          if (popupBalance) popupBalance.innerText = `${balanceFormatted} gems`;
        };
        userRef.on("value", handler);

        if (authButtons) authButtons.classList.add("hidden");
        if (userArea) {
          userArea.classList.remove("hidden", "md:hidden");
          userArea.classList.add("md:flex");
        }
        if (toolbarDesktop) toolbarDesktop.classList.remove("hidden");
        if (balanceContainer) balanceContainer.classList.remove("hidden");
        if (balanceMobileHeader) balanceMobileHeader.classList.remove("hidden");
        if (toolbarMobile) toolbarMobile.classList.remove("hidden");
        if (balanceMobileDrawer) balanceMobileDrawer.classList.remove("hidden");
        if (topupBtn) topupBtn.classList.remove("hidden");
        if (topupMobileHeader) topupMobileHeader.classList.remove("hidden");
        if (topupMobileDrawer) topupMobileDrawer.classList.remove("hidden");
        if (notificationBell) notificationBell.classList.remove("hidden");
        if (notificationBellMobile) notificationBellMobile.classList.remove("hidden");
        attachNotificationStream();
        if (themeToggleStandaloneDesktop) themeToggleStandaloneDesktop.classList.add("hidden");
        if (themeToggleChipDesktop) themeToggleChipDesktop.classList.remove("hidden");
        if (mobileRegisterBtn) mobileRegisterBtn.classList.add("hidden");
        [inventoryLink, mobileInventoryLink, mobileProfileLink].forEach((el) => {
          if (el) el.classList.remove("hidden");
        });
        userLinks.forEach((link) => link.classList.remove("hidden"));

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
        if (popupBalance) popupBalance.innerText = "0 gems";

        if (authButtons) authButtons.classList.remove("hidden");
        if (userArea) {
          userArea.classList.add("hidden", "md:hidden");
          userArea.classList.remove("md:flex");
        }
        if (toolbarDesktop) toolbarDesktop.classList.add("hidden");
        if (balanceContainer) balanceContainer.classList.add("hidden");
        if (balanceMobileHeader) balanceMobileHeader.classList.add("hidden");
        if (toolbarMobile) toolbarMobile.classList.remove("hidden");
        if (balanceMobileDrawer) balanceMobileDrawer.classList.add("hidden");
        if (topupBtn) topupBtn.classList.add("hidden");
        if (topupMobileHeader) topupMobileHeader.classList.add("hidden");
        if (topupMobileDrawer) topupMobileDrawer.classList.add("hidden");
        if (notificationBell) notificationBell.classList.add("hidden");
        if (notificationBellMobile) notificationBellMobile.classList.add("hidden");
        hideNotificationPanel();
        if (unsubscribeNotifications) {
          unsubscribeNotifications();
          unsubscribeNotifications = null;
        }
        if (themeToggleStandaloneDesktop) themeToggleStandaloneDesktop.classList.remove("hidden");
        if (themeToggleChipDesktop) themeToggleChipDesktop.classList.add("hidden");
        if (mobileRegisterBtn) mobileRegisterBtn.classList.remove("hidden");
        [inventoryLink, mobileInventoryLink, mobileProfileLink].forEach((el) => {
          if (el) el.classList.add("hidden");
        });
        userLinks.forEach((link) => link.classList.add("hidden"));

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
    const topupMobileHeader = document.getElementById("topup-button-mobile-header");
    const topupMobileDrawer = document.getElementById("topup-button-mobile-drawer");

    const openTopup = () => {
      topupPopup.classList.remove("hidden");
    };

    if (topupDesktop) topupDesktop.addEventListener("click", openTopup);
    if (topupMobileHeader) topupMobileHeader.addEventListener("click", openTopup);
    if (topupMobileDrawer) topupMobileDrawer.addEventListener("click", openTopup);
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
