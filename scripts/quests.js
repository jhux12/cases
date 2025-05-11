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

  const hasRareCard = Object.values(inventory).some(item => (item.rarity || '').toLowerCase() === 'rare');

  const questList = [
    {
      id: "open-pack",
      label: "Open 1 Pack",
      reward: 10,
      icon: "fas fa-box-open",
      isCompleted: () => quests["open-pack"]?.completed || false
    },
    {
      id: "spend-coins",
      label: "Spend 500 Coins",
      reward: 15,
      icon: "fas fa-coins",
      isCompleted: () => spentCoins >= 500
    },
    {
      id: "win-rare",
      label: "Win a Rare Card",
      reward: 20,
      icon: "fas fa-star",
      isCompleted: () => hasRareCard
    }
  ];

  container.innerHTML = `
    <div class="bg-gradient-to-br from-[#1f1f2b] to-[#12121b] rounded-2xl p-6 sm:p-8 shadow-xl text-white w-full max-w-3xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-6 text-yellow-300 tracking-tight">🎯 Daily Quests</h2>
      <ul id="quest-list" class="space-y-4"></ul>
    </div>
  `;

  const list = document.getElementById("quest-list");

  for (const quest of questList) {
    const status = quests[quest.id] || {};
    const isCompleted = quest.isCompleted();
    const isClaimed = status.claimed || false;

    const item = document.createElement("li");
    item.className = "flex items-center justify-between bg-gray-900 border border-yellow-500 rounded-xl px-6 py-4 shadow-lg hover:scale-[1.01] transition-transform";

    item.innerHTML = `
      <div class="flex items-center gap-3">
        <i class="${quest.icon} text-yellow-400 text-lg"></i>
        <span class="text-white font-medium">${quest.label}</span>
        <span class="ml-3 text-yellow-300 text-sm">+${quest.reward} coins</span>
      </div>
      <button class="quest-claim-btn bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-1.5 px-5 rounded-full text-sm transition" ${(!isCompleted || isClaimed) ? "disabled" : ""}>
        ${isClaimed ? "Claimed" : isCompleted ? "Claim" : "Incomplete"}
      </button>
    `;

    const claimButton = item.querySelector(".quest-claim-btn");

    claimButton.onclick = async () => {
      if (isCompleted && !isClaimed) {
        await firebase.database().ref(`users/${user.uid}/quests/${quest.id}`).update({
          claimed: true
        });
        await firebase.database().ref(`users/${user.uid}`).update({
          balance: balance + quest.reward
        });

        claimButton.disabled = true;
        claimButton.innerText = "Claimed";

        const toast = document.createElement("div");
        toast.className = "fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-xl z-[9999]";
        toast.innerText = `+${quest.reward} coins claimed!`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    };

    list.appendChild(item);
  }
}
