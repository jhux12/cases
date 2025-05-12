// scripts/quests.js

export async function renderDailyQuests(containerId = "quest-container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user = firebase.auth().currentUser;
  if (!user) return;

  const userRef = firebase.database().ref("users/" + user.uid);
  const snapshot = await userRef.once("value");
  const userData = snapshot.val() || {};
  const balance = userData.balance || 0;
  const quests = userData.quests || {};
  const inventory = userData.inventory || {};
  const spentCoins = userData.spent || 0;
  const lastQuestReset = userData.lastQuestReset || Date.now();

  const hasRareCard = Object.values(inventory).some(item => (item.rarity || '').toLowerCase() === 'rare');

  const questList = [
    {
      id: "open-pack",
      label: "Open 10 Packs",
      reward: 50,
      icon: "fas fa-box-open",
      progress: quests["open-pack"]?.progress || 0,
      goal: 10
    },
     {
      id: "open-pack-50",
      label: "Open 50 Packs",
      reward: 500,
      icon: "fas fa-box-open",
      progress: quests["open-pack-50"]?.progress || 0,
      goal: 50
    },
    {
      id: "spend-coins",
      label: "Spend 500 Coins",
      reward: 15,
      icon: "fas fa-coins",
      progress: 0, // will update dynamically
      goal: 500
    },
  ];
  

  const now = Date.now();
  const resetTime = 24 * 60 * 60 * 1000;
  const timeUntilReset = resetTime - (now - lastQuestReset);

  container.innerHTML = `
    <div class="bg-gradient-to-br from-[#1f1f2b] to-[#12121b] rounded-2xl p-6 sm:p-8 shadow-xl text-white w-full max-w-3xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-2 text-yellow-300 tracking-tight">🎯 Daily Quests</h2>
      <p id="quest-reset-timer" class="text-sm text-gray-400 text-center mb-4"></p>
      <ul id="quest-list" class="space-y-4"></ul>
    </div>
  `;

  const timerEl = document.getElementById("quest-reset-timer");
  const interval = setInterval(async () => {
    const remaining = resetTime - (Date.now() - lastQuestReset);
    if (remaining <= 0) {
      clearInterval(interval);
      timerEl.innerText = "Quests reset!";
      await userRef.child("quests").remove();
      await userRef.update({ lastQuestReset: Date.now(), spent: 0 });
      renderDailyQuests(containerId);
    } else {
      const h = Math.floor(remaining / (1000 * 60 * 60));
      const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((remaining % (1000 * 60)) / 1000);
      timerEl.innerText = `Resets in: ${h}h ${m}m ${s}s`;
    }
  }, 1000);

  const list = document.getElementById("quest-list");

  for (const quest of questList) {
    if (quest.id === "spend-coins") {
      quest.progress = spentCoins;
    }

    const status = quests[quest.id] || {};
const actualProgress = quest.id === "spend-coins"
  ? spentCoins
  : quest.id === "win-rare"
    ? hasRareCard ? 1 : 0
    : status.progress || 0;

const isCompleted = (status.completed === true) || (actualProgress >= quest.goal);
const isClaimed = status.claimed || false;
quest.progress = actualProgress; // Update for bar/percent display


    const item = document.createElement("li");
    item.className = `bg-gray-900 border border-yellow-500 rounded-xl px-6 py-4 shadow-lg hover:scale-[1.01] transition-transform ${isCompleted ? 'opacity-100' : 'opacity-60'}`;

    const percent = Math.min(100, Math.floor((quest.progress / quest.goal) * 100));

    item.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <i class="${quest.icon} text-yellow-400 text-lg"></i>
          <span class="text-white font-medium">${quest.label}</span>
          <span class="ml-3 text-yellow-300 text-sm">+${quest.reward} coins</span>
        </div>
        <button class="quest-claim-btn bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-1.5 px-5 rounded-full text-sm transition" ${(!isCompleted || isClaimed) ? "disabled" : ""}>
          ${isClaimed ? "Claimed" : isCompleted ? "Claim" : "Incomplete"}
        </button>
      </div>
      <div class="w-full bg-gray-800 rounded-full h-2.5">
        <div class="bg-yellow-400 h-2.5 rounded-full" style="width: ${percent}%;"></div>
      </div>
    `;

    const claimButton = item.querySelector(".quest-claim-btn");

claimButton.onclick = async () => {
  const questRef = firebase.database().ref(`users/${user.uid}/quests/${quest.id}`);
  const questSnap = await questRef.once("value");
  const liveQuest = questSnap.val() || {};

  const isActuallyCompleted = liveQuest.completed === true;
  const alreadyClaimed = liveQuest.claimed === true;

  if (!isActuallyCompleted || alreadyClaimed) {
    alert("You must complete the quest before claiming.");
    return;
  }

  await questRef.update({ claimed: true });

  const newBalance = balance + quest.reward;
  await firebase.database().ref(`users/${user.uid}`).update({ balance: newBalance });

  const balanceFormatted = newBalance.toLocaleString();
  const el1 = document.getElementById("balance-amount");
  if (el1) el1.innerText = balanceFormatted;
  const el2 = document.getElementById("balance-amount-mobile");
  if (el2) el2.innerText = balanceFormatted;
  const el3 = document.getElementById("popup-balance");
  if (el3) el3.innerText = `${balanceFormatted} coins`;

  claimButton.disabled = true;
  claimButton.innerText = "Claimed";

  const toast = document.createElement("div");
  toast.className = "fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-xl z-[9999]";
  toast.innerText = `+${quest.reward} coins claimed!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

    list.appendChild(item);
  }
}

