// scripts/topup.js

let stripeInstance = null;

function getStripe() {
  if (stripeInstance) {
    return stripeInstance;
  }

  const publishableKey = window.APP_CONFIG?.stripe?.publishableKey;
  if (!publishableKey) {
    console.warn('[topup] Stripe publishable key not provided. Payments are disabled.');
    return null;
  }

  if (typeof Stripe !== 'function') {
    console.error('[topup] Stripe.js failed to load.');
    return null;
  }

  stripeInstance = Stripe(publishableKey);
  return stripeInstance;
}

// Load and inject the top-up popup component
async function loadTopupPopup() {
  const res = await fetch("components/topup.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);

  const popup = document.getElementById("topup-popup");
  const closeBtn = document.getElementById("close-topup");
  const topupDesktop = document.getElementById("topup-button");
  const topupMobileHeader = document.getElementById("topup-button-mobile-header");
  const topupMobileDrawer = document.getElementById("topup-button-mobile-drawer");

  if (popup && closeBtn) {
    closeBtn.onclick = () => popup.classList.add("hidden");
  }

  const openPopup = () => {
    if (popup) popup.classList.remove("hidden");
    const mobileDrawer = document.getElementById("mobile-drawer");
    const drawerOverlay = document.getElementById("drawer-overlay");
    if (mobileDrawer && !mobileDrawer.classList.contains("-translate-x-full")) {
      mobileDrawer.classList.add("-translate-x-full");
    }
    if (drawerOverlay && !drawerOverlay.classList.contains("hidden")) {
      drawerOverlay.classList.add("hidden");
    }
  };
  if (topupDesktop) topupDesktop.onclick = openPopup;
  if (topupMobileHeader) topupMobileHeader.onclick = openPopup;
  if (topupMobileDrawer) topupMobileDrawer.onclick = openPopup;

  // Attach loading feedback to all buy buttons
  document.querySelectorAll("#topup-popup form").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const button = form.querySelector("button");
      const priceId = form.getAttribute("data-price-id");
      if (priceId && button) {
        redirectToCheckout(e, priceId, button);
      }
    });
  });
}

// Ensure the top-up popup is initialized after the full page, including the
// header component, has loaded. This avoids race conditions where the popup
// tries to bind to wallet buttons before they exist in the DOM.
window.addEventListener("load", loadTopupPopup);

// Stripe redirect with loading indicator
function redirectToCheckout(event, priceId, button) {
  event?.preventDefault?.();

  const stripe = getStripe();
  if (!stripe) {
    alert('Payments are temporarily unavailable. Please try again later.');
    return;
  }

  const targetButton = button || (event?.currentTarget instanceof HTMLElement ? event.currentTarget : null);
  const originalText = targetButton?.innerHTML;

  if (targetButton) {
    targetButton.disabled = true;
    targetButton.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Loading...`;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Please sign in to purchase gems.");
    if (targetButton) {
      targetButton.disabled = false;
      targetButton.innerHTML = originalText;
    }
    return;
  }

  firebase.firestore()
    .collection("customers")
    .doc(user.uid)
    .collection("checkout_sessions")
    .add({
      mode: "payment",
      success_url: window.location.href,
      cancel_url: window.location.href,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { priceId }
    })
    .then((docRef) => {
      docRef.onSnapshot((snap) => {
        const data = snap.data();
        if (!data) {
          return;
        }

        const { error, sessionId } = data;
        if (error) {
          alert(`An error occurred: ${error.message}`);
          if (targetButton) {
            targetButton.disabled = false;
            targetButton.innerHTML = originalText;
          }
        }
        if (sessionId) {
          stripe.redirectToCheckout({ sessionId });
        }
      });
    });
}

// Update gem balance when payment is successful
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;
  const dbRTDB = firebase.database();
  const dbFS = firebase.firestore();
  const userRef = dbRTDB.ref("users/" + user.uid);

  const paymentsRef = dbFS.collection("customers").doc(user.uid).collection("payments");

  paymentsRef.onSnapshot(async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === "added") {
        const payment = change.doc.data();
        const priceId = payment?.metadata?.priceId || payment?.price?.id;

        if (payment.status === "succeeded" && !payment.processed && priceId) {
          try {
            const productSnap = await dbFS.collection("products").where("priceId", "==", priceId).get();

            if (!productSnap.empty) {
              const product = productSnap.docs[0].data();
              const gems = parseInt(product.coin_amount || "0");
              const bonus = parseInt(product.bonus || "0");
              const total = gems + bonus;

              const currentSnap = await userRef.once("value");
              const currentBalance = currentSnap.val()?.balance || 0;
              const newBalance = currentBalance + total;

              await userRef.update({ balance: newBalance });

              const formattedBalance = newBalance.toLocaleString();
              document.getElementById("balance-amount").innerText = formattedBalance;
              const mobileBalance = document.getElementById("balance-amount-mobile");
              const mobileDropdownBalance = document.getElementById("balance-amount-mobile-dropdown");
              if (mobileBalance) mobileBalance.innerText = formattedBalance;
              if (mobileDropdownBalance) mobileDropdownBalance.innerText = formattedBalance;

              const popupBalance = document.getElementById("popup-balance");
              if (popupBalance) popupBalance.innerText = `${formattedBalance} gems`;

              await change.doc.ref.update({ processed: true });
            }
          } catch (err) {
            console.error("🔥 Error processing Stripe payment:", err);
          }
        }
      }
    }
  });
});


