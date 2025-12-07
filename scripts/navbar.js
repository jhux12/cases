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
    const mobileInventoryLink = document.getElementById("mobile-inventory-link");
    const mobileProfileLink = document.getElementById("mobile-profile-link");
    const inventoryLink = document.getElementById("inventory-link");
    const userLinks = document.querySelectorAll(".user-nav-link");
    const notificationContainer = document.getElementById("notification-container");
    const notificationButton = document.getElementById("notification-button");
    const notificationBadge = document.getElementById("notification-badge");
    const notificationDropdown = document.getElementById("notification-dropdown");
    const notificationList = document.getElementById("notification-list");
    const notificationContainerMobile = document.getElementById("notification-container-mobile");
    const notificationButtonMobile = document.getElementById("notification-button-mobile");
    const notificationBadgeMobile = document.getElementById("notification-badge-mobile");
    const notificationDropdownMobile = document.getElementById("notification-dropdown-mobile");
    const notificationListMobile = document.getElementById("notification-list-mobile");

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
      let notificationsRef;
      let shipmentsQuery;
      let shipmentHandlers = [];
      let notificationsData = {};
      let notificationTogglesAttached = false;

      const formatTimestamp = (timestamp) => {
        if (!timestamp) return "Just now";
        try {
          const date = new Date(timestamp);
          return date.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
        } catch (e) {
          return "Just now";
        }
      };

      const setBadgeCount = (badgeEl, count) => {
        if (!badgeEl) return;
        if (count > 0) {
          badgeEl.textContent = count > 9 ? "9+" : count;
          badgeEl.classList.remove("hidden");
        } else {
          badgeEl.classList.add("hidden");
        }
      };

      const renderNotificationList = (listEl, entries) => {
        if (!listEl) return;
        if (!entries.length) {
          listEl.innerHTML = '<p class="px-4 py-3 text-sm text-gray-500">No recent notifications.</p>';
          return;
        }

        listEl.innerHTML = entries
          .map(([id, notif]) => {
            const title = notif.title || "Notification";
            const body = notif.body || "";
            const chip = notif.type === "shipment" ? '<span class="text-[11px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">Shipment</span>' : "";

            return `
              <div class="px-4 py-3 bg-white hover:bg-gray-50">
                <div class="flex items-start gap-3">
                  <div class="flex-1 space-y-1">
                    <p class="text-sm font-semibold text-gray-800">${title}</p>
                    <p class="text-xs text-gray-600 leading-snug">${body}</p>
                    <p class="text-[11px] text-gray-400">${formatTimestamp(notif.timestamp)}</p>
                    ${chip}
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <button class="text-[11px] text-gray-400 hover:text-gray-600" data-notification-id="${id}" aria-label="Dismiss notification">×</button>
                    ${notif.read ? '<span class="text-[11px] text-gray-400">Read</span>' : '<span class="text-[11px] text-indigo-600 font-semibold">New</span>'}
                  </div>
                </div>
              </div>
            `;
          })
          .join("");

        listEl.querySelectorAll("[data-notification-id]").forEach((button) => {
          button.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = button.getAttribute("data-notification-id");
            if (id && notificationsRef) {
              notificationsRef.child(id).remove();
            }
          });
        });
      };

      const renderNotifications = () => {
        const entries = Object.entries(notificationsData || {}).sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0));
        const unreadCount = entries.filter(([, notif]) => !notif.read).length;

        setBadgeCount(notificationBadge, unreadCount);
        setBadgeCount(notificationBadgeMobile, unreadCount);
        renderNotificationList(notificationList, entries);
        renderNotificationList(notificationListMobile, entries);
      };

      const markNotificationsRead = () => {
        if (!notificationsRef || !notificationsData) return;
        const updates = {};
        Object.entries(notificationsData).forEach(([id, notif]) => {
          if (!notif.read) updates[`${id}/read`] = true;
        });
        if (Object.keys(updates).length) notificationsRef.update(updates);
      };

      const closeNotificationMenus = () => {
        [notificationDropdown, notificationDropdownMobile].forEach((menu) => {
          if (menu) menu.classList.add("hidden");
        });
      };

      const attachNotificationToggles = () => {
        if (notificationTogglesAttached) return;
        const attachToggle = (button, dropdown) => {
          if (!button || !dropdown) return;
          button.addEventListener("click", (e) => {
            e.stopPropagation();
            const opening = dropdown.classList.contains("hidden");
            closeNotificationMenus();
            dropdown.classList.toggle("hidden");
            if (opening) markNotificationsRead();
          });
        };

        attachToggle(notificationButton, notificationDropdown);
        attachToggle(notificationButtonMobile, notificationDropdownMobile);

        document.addEventListener("click", (event) => {
          [
            [notificationButton, notificationDropdown],
            [notificationButtonMobile, notificationDropdownMobile],
          ].forEach(([button, dropdown]) => {
            if (
              button &&
              dropdown &&
              !dropdown.classList.contains("hidden") &&
              !dropdown.contains(event.target) &&
              !button.contains(event.target)
            ) {
              dropdown.classList.add("hidden");
            }
          });
        });

        notificationTogglesAttached = true;
      };

      const ensureNotificationListeners = (user) => {
        if (!user) return;
        notificationsRef = firebase.database().ref("notifications/" + user.uid);
        notificationsRef.on("value", (snap) => {
          notificationsData = snap.val() || {};
          renderNotifications();
        });

        shipmentsQuery = firebase.database().ref("shipments").orderByChild("userId").equalTo(user.uid);
        const handleShipmentUpdate = (snap) => {
          const shipment = snap.val() || {};
          if (shipment.status !== "Shipped") return;
          const notifId = `shipment-${snap.key}`;
          const payload = {
            title: "Item shipped",
            body: `${shipment.name || "Your item"} has shipped and is on the way!`,
            type: "shipment",
            timestamp: shipment.timestamp || Date.now(),
            relatedId: snap.key,
            read: false,
          };

          notificationsRef.child(notifId).transaction((current) => {
            if (current && current.read) return current;
            if (current) return { ...current, ...payload, read: current.read };
            return payload;
          });
        };

        shipmentHandlers = [
          ["child_added", handleShipmentUpdate],
          ["child_changed", handleShipmentUpdate],
        ];

        shipmentHandlers.forEach(([event, handler]) => shipmentsQuery.on(event, handler));
      };

      const detachNotificationListeners = () => {
        if (notificationsRef) {
          notificationsRef.off();
          notificationsRef = null;
        }
        if (shipmentsQuery) {
          shipmentHandlers.forEach(([event, handler]) => shipmentsQuery.off(event, handler));
          shipmentsQuery = null;
          shipmentHandlers = [];
        }
        notificationsData = {};
        renderNotifications();
        closeNotificationMenus();
      };

      attachNotificationToggles();
      renderNotifications();

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
        if (balanceContainer) balanceContainer.classList.remove("hidden");
        if (balanceMobileHeader) balanceMobileHeader.classList.add("hidden");
        if (balanceMobileDrawer) balanceMobileDrawer.classList.remove("hidden");
        if (topupBtn) topupBtn.classList.remove("hidden");
        if (topupMobileHeader) topupMobileHeader.classList.add("hidden");
        if (topupMobileDrawer) topupMobileDrawer.classList.remove("hidden");
        if (mobileRegisterBtn) mobileRegisterBtn.classList.add("hidden");
        [inventoryLink, mobileInventoryLink, mobileProfileLink].forEach((el) => {
          if (el) el.classList.remove("hidden");
        });
        userLinks.forEach((link) => link.classList.remove("hidden"));
        ensureNotificationListeners(user);

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
        if (balanceContainer) balanceContainer.classList.add("hidden");
        if (balanceMobileHeader) balanceMobileHeader.classList.add("hidden");
        if (balanceMobileDrawer) balanceMobileDrawer.classList.add("hidden");
        if (topupBtn) topupBtn.classList.add("hidden");
        if (topupMobileHeader) topupMobileHeader.classList.add("hidden");
        if (topupMobileDrawer) topupMobileDrawer.classList.add("hidden");
        if (mobileRegisterBtn) mobileRegisterBtn.classList.remove("hidden");
        [inventoryLink, mobileInventoryLink, mobileProfileLink].forEach((el) => {
          if (el) el.classList.add("hidden");
        });
        userLinks.forEach((link) => link.classList.add("hidden"));
        detachNotificationListeners();

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
