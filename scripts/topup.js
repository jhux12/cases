// scripts/topup.js

// Load and inject the top-up popup component
async function loadTopupPopup() {
  const res = await fetch("/components/topup.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);

  const popup = document.getElementById("topup-popup");
  const closeBtn = document.getElementById("close-topup");

  if (popup && closeBtn) {
    closeBtn.onclick = () => popup.classList.add("hidden");
  }

  document.getElementById("topup-button")?.addEventListener("click", () => popup.classList.remove("hidden"));
  document.getElementById("topup-button-mobile")?.addEventListener("click", () => popup.classList.remove("hidden"));
}

loadTopupPopup();

// Add Firestore payment listener to update coins
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
