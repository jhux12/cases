function loadHeader() {
  fetch('/components/header.html')
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById('main-header');
      container.innerHTML = html;

      // Run after header is injected
      firebase.auth().onAuthStateChanged(async user => {
        const balanceSpan = document.getElementById('balance-amount');
        const balanceMobile = document.getElementById('balance-amount-mobile');
        const usernameDisplay = document.getElementById('username-display');

        if (user) {
          const userRef = firebase.database().ref('users/' + user.uid);
          const snap = await userRef.once('value');
          const userData = snap.val() || {};

          balanceSpan.innerText = userData.balance || 0;
          balanceMobile.innerText = userData.balance || 0;
          usernameDisplay.innerText = userData.username || "User";

          document.getElementById('logout-desktop')?.addEventListener('click', e => {
            e.preventDefault();
            firebase.auth().signOut().then(() => location.reload());
          });

          const mobileButton = document.getElementById('mobile-auth-button');
          if (mobileButton) {
            mobileButton.innerText = "Logout";
            mobileButton.href = "#";
            mobileButton.onclick = (e) => {
              e.preventDefault();
              firebase.auth().signOut().then(() => location.reload());
            };
          }
        } else {
          balanceSpan.innerText = '0';
          balanceMobile.innerText = '0';
          usernameDisplay.innerText = 'User';
        }
      });

      document.getElementById('menu-toggle')?.addEventListener('click', () => {
        document.getElementById('mobile-dropdown').classList.toggle('hidden');
      });

      document.getElementById('topup-button')?.addEventListener('click', () => {
        document.getElementById('topup-popup')?.classList.remove('hidden');
      });
      document.getElementById('topup-button-mobile')?.addEventListener('click', () => {
        document.getElementById('topup-popup')?.classList.remove('hidden');
      });
    });
}
