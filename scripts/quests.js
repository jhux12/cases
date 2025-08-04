// scripts/quests.js

// Render weekly quests on the rewards page. Global configuration lives in
// `questConfig` and can be edited from the admin panel. User progress is
// stored under `users/{uid}/weeklyQuests`.

export async function renderWeeklyQuests(containerId = "quest-container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user = firebase.auth().currentUser;
  if (!user) return;

  const userRef = firebase.database().ref("users/" + user.uid);
  const [userSnap, configSnap] = await Promise.all([
    userRef.once("value"),
    firebase.database().ref("questConfig").once("value")
  ]);

  const userData = userSnap.val() || {};
  const config = configSnap.val() || {};

  const balance = userData.balance || 0;
  const quests = userData.weeklyQuests || {};
  const lastReset = userData.lastWeeklyReset || Date.now();

  const questList = [
    {
      id: "openPacks",
      label: `Open ${config.openPacks?.goal || 0} Packs`,
      icon: "fas fa-box-open",
      goal: config.openPacks?.goal || 0,
      reward: config.openPacks?.reward || 0,
      progress: quests.openPacks?.progress || 0,
      claimed: quests.openPacks?.claimed || false,
    },
    {
      id: "spendCoins",
      label: `Spend ${config.spendCoins?.goal || 0} Coins`,
      icon: "fas fa-coins",
      goal: config.spendCoins?.goal || 0,
      reward: config.spendCoins?.reward || 0,
      progress: quests.spendCoins?.progress || 0,
      claimed: quests.spendCoins?.claimed || false,
    },
    {
      id: "pullRare",
      label: `Pull ${config.pullRare?.goal || 0} Rare+ Card${(config.pullRare?.goal || 0) === 1 ? "" : "s"}`,
      icon: "fas fa-star",
      goal: config.pullRare?.goal || 0,
      reward: config.pullRare?.reward || 0,
      progress: quests.pullRare?.progress || 0,
      claimed: quests.pullRare?.claimed || false,
    },
  ];

  const resetTime = 7 * 24 * 60 * 60 * 1000;

  container.innerHTML = `
    <div class="bg-gradient-to-br from-[#1f1f2b] to-[#12121b] rounded-2xl p-6 sm:p-8 shadow-xl text-white w-full max-w-3xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-2 text-yellow-300 tracking-tight">🎯 Weekly Tasks</h2>
      <p id="quest-reset-timer" class="text-sm text-gray-400 text-center mb-4"></p>
      <ul id="quest-list" class="space-y-4"></ul>
    </div>`;

  const timerEl = document.getElementById("quest-reset-timer");
  const interval = setInterval(async () => {
    const timeLeft = resetTime - (Date.now() - lastReset);
    if (timeLeft <= 0) {
      clearInterval(interval);
      timerEl.innerText = "Quests reset!";
      await userRef.child("weeklyQuests").remove();
      await userRef.update({ lastWeeklyReset: Date.now() });
      renderWeeklyQuests(containerId);
    } else {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);
      timerEl.innerText = `Resets in: ${days}d ${hours}h ${mins}m ${secs}s`;
    }
  }, 1000);

  const listEl = document.getElementById("quest-list");

  questList.forEach(quest => {
    const percent = quest.goal > 0 ? Math.min(100, Math.floor((quest.progress / quest.goal) * 100)) : 0;
    const completed = quest.progress >= quest.goal;

    const li = document.createElement("li");
    li.className = `bg-gray-900 border border-yellow-500 rounded-xl px-6 py-4 shadow-lg hover:scale-[1.01] transition-transform ${completed ? "opacity-100" : "opacity-60"}`;

    li.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <i class="${quest.icon} text-yellow-400 text-lg"></i>
          <span class="text-white font-medium">${quest.label}</span>
          <span class="ml-3 text-yellow-300 text-sm">+${quest.reward} coins</span>
        </div>
        <button class="quest-claim-btn bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-1.5 px-5 rounded-full text-sm transition" ${(!completed || quest.claimed) ? "disabled" : ""}>
          ${quest.claimed ? "Claimed" : completed ? "Claim" : "Incomplete"}
        </button>
      </div>
      <div class="w-full bg-gray-800 rounded-full h-2.5">
        <div class="bg-yellow-400 h-2.5 rounded-full" style="width: ${percent}%"></div>
      </div>`;

    const claimBtn = li.querySelector(".quest-claim-btn");

    claimBtn.onclick = async () => {
      const questRef = userRef.child(`weeklyQuests/${quest.id}`);
      const questSnap = await questRef.once("value");
      const live = questSnap.val() || {};

      if ((live.progress || 0) < quest.goal || live.claimed) {
        alert("You must complete the task before claiming.");
        return;
      }

      await questRef.update({ claimed: true });
      await userRef.update({ balance: balance + quest.reward });

      claimBtn.disabled = true;
      claimBtn.innerText = "Claimed";

      const toast = document.createElement("div");
      toast.className = "fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-xl z-[9999]";
      toast.innerText = `+${quest.reward} coins claimed!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    };

    listEl.appendChild(li);
  });
}

// Track long-term milestones and award badges stored in Firestore.
// Called whenever a pack is opened to update stats used by the leaderboard.
export async function updateMilestones(uid, prizeValue = 0) {
  if (!uid) return;
  const fs = firebase.firestore();
  const docRef = fs.collection('leaderboard').doc(uid);

  await fs.runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    const data = doc.exists ? doc.data() : {};
    const packsOpened = (data.packsOpened || 0) + 1;
    const cardValue = (data.cardValue || 0) + (prizeValue || 0);
    let badges = data.badges || [];

    const newBadges = [];
    if (packsOpened >= 10 && !badges.includes('10 Packs')) newBadges.push('10 Packs');
    if (packsOpened >= 50 && !badges.includes('50 Packs')) newBadges.push('50 Packs');
    if (cardValue >= 1000 && !badges.includes('1k Value')) newBadges.push('1k Value');
    if (cardValue >= 5000 && !badges.includes('5k Value')) newBadges.push('5k Value');

    if (newBadges.length) badges = [...badges, ...newBadges];

    tx.set(docRef, {
      username: firebase.auth().currentUser?.displayName || firebase.auth().currentUser?.email || 'Anonymous',
      packsOpened,
      cardValue,
      badges,
    }, { merge: true });
  });
}

