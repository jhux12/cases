// scripts/topup.js

// Load and inject the top-up popup component
async function loadTopupPopup() {
  const res = await fetch("components/topup.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);

  const popup = document.getElementById("topup-popup");
  const closeBtn = document.getElementById("close-topup");
  const topupDesktop = document.getElementById("topup-button");
  const topupMobile = document.getElementById("topup-button-mobile");

  if (popup && closeBtn) {
    closeBtn.onclick = () => popup.classList.add("hidden");
  }

  const openPopup = () => popup?.classList.remove("hidden");
  if (topupDesktop) topupDesktop.onclick = openPopup;
  if (topupMobile) topupMobile.onclick = openPopup;

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

loadTopupPopup();

// Stripe redirect with loading indicator
function redirectToCheckout(event, priceId, button) {
  event.preventDefault();

  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Loading...`;

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Please sign in to purchase coins.");
    button.disabled = false;
    button.innerHTML = originalText;
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
        const { error, sessionId } = snap.data();
        if (error) {
          alert(`An error occurred: ${error.message}`);
          button.disabled = false;
          button.innerHTML = originalText;
        }
        if (sessionId) {
          stripe.redirectToCheckout({ sessionId });
        }
      });
    });
}

// Update coin balance when payment is successful
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
              const coins = parseInt(product.coin_amount || "0");
              const bonus = parseInt(product.bonus || "0");
              const total = coins + bonus;

              const currentSnap = await userRef.once("value");
              const currentBalance = currentSnap.val()?.balance || 0;
              const newBalance = currentBalance + total;

              await userRef.update({ balance: newBalance });

              document.getElementById("balance-amount").innerText = newBalance;
              document.getElementById("balance-amount-mobile").innerText = newBalance;

              const popupBalance = document.getElementById("popup-balance");
              if (popupBalance) popupBalance.innerText = `${newBalance} coins`;

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

