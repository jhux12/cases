document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  fetch("/components/nav.html")
    .then((res) => res.text())
    .then((html) => {
      header.innerHTML = html;

      // Toggle user dropdown
      document.addEventListener("click", (e) => {
        const toggle = document.getElementById("dropdown-toggle");
        const dropdown = document.getElementById("user-dropdown");

        if (toggle?.contains(e.target)) {
          dropdown?.classList.toggle("hidden");
        } else {
          dropdown?.classList.add("hidden");
        }
      });

      // Toggle mobile menu
      document.getElementById("menu-toggle")?.addEventListener("click", () => {
        document.getElementById("mobile-dropdown")?.classList.toggle("hidden");
      });

      firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) return;

        const db = firebase.database();
        const userRef = db.ref("users/" + user.uid);
        const snapshot = await userRef.once("value");
        const data = snapshot.val() || {};
        const balance = data.balance || 0;
        const username = data.username || user.displayName || user.email || "User";

        // Wait for elements to load
        const waitForEl = (id, cb) => {
          const interval = setInterval(() => {
            const el = document.getElementById(id);
            if (el) {
              clearInterval(interval);
              cb(el);
            }
          }, 100);
        };

        waitForEl("balance-amount", () => {
          document.getElementById("balance-amount").innerText = balance;
          document.getElementById("balance-amount-mobile").innerText = balance;
          document.getElementById("user-balance").classList.remove("hidden");
          document.getElementById("username-display").innerText = username;

          document.getElementById("signin-desktop")?.classList.add("hidden");
          document.getElementById("logout-desktop")?.classList.remove("hidden");

          document.getElementById("logout-desktop").onclick = (e) => {
            e.preventDefault();
            firebase.auth().signOut().then(() => location.reload());
          };

          // Mobile auth button
          const mobileAuth = document.getElementById("mobile-auth-button");
          if (mobileAuth) {
            mobileAuth.innerText = "Logout";
            mobileAuth.href = "#";
            mobileAuth.onclick = (e) => {
              e.preventDefault();
              firebase.auth().signOut().then(() => location.reload());
            };
          }

          // Show inventory link in mobile
          document.getElementById("inventory-link")?.classList.remove("hidden");
        });
      });
    });
});

