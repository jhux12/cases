document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  header.innerHTML = `...`; // your full HTML from above

  // Add menu toggle logic for mobile
  setTimeout(() => {
    const toggleBtn = document.getElementById("menu-toggle");
    const dropdown = document.getElementById("mobile-dropdown");
    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener("click", () => {
        dropdown.classList.toggle("hidden");
      });
    }
  }, 100);

  // Wait for Firebase to be ready
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;

    const db = firebase.database();
    const userRef = db.ref("users/" + user.uid);
    const snapshot = await userRef.once("value");
    const data = snapshot.val() || {};
    const balance = data.balance || 0;
    const username = data.username || user.displayName || user.email || "User";

    // Safe DOM updates with null checks
    const desktopBal = document.getElementById("balance-amount");
    if (desktopBal) desktopBal.innerText = balance;

    const mobileBal = document.getElementById("balance-amount-mobile");
    if (mobileBal) mobileBal.innerText = balance;

    const desktopWrap = document.getElementById("user-balance");
    if (desktopWrap) desktopWrap.classList.remove("hidden");

    const userNameEl = document.getElementById("username-display");
    if (userNameEl) userNameEl.innerText = username;

    const signinEl = document.getElementById("signin-desktop");
    if (signinEl) signinEl.classList.add("hidden");

    const logoutEl = document.getElementById("logout-desktop");
    if (logoutEl) {
      logoutEl.classList.remove("hidden");
      logoutEl.onclick = (e) => {
        e.preventDefault();
        firebase.auth().signOut().then(() => location.reload());
      };
    }

    const mobileAuth = document.getElementById("mobile-auth-button");
    if (mobileAuth) {
      mobileAuth.innerText = "Logout";
      mobileAuth.href = "#";
      mobileAuth.onclick = (e) => {
        e.preventDefault();
        firebase.auth().signOut().then(() => location.reload());
      };
    }

    const inventoryLink = document.getElementById("inventory-link");
    if (inventoryLink) inventoryLink.classList.remove("hidden");
  });
});

