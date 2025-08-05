// Simple Tower game logic
const floors = [
  { name: 'Floor 1', prizes: [10, 20, 30] },
  { name: 'Floor 2', prizes: [20, 40, 60] },
  { name: 'Floor 3', prizes: [40, 80, 120] },
  { name: 'Floor 4', prizes: [80, 160, 240] },
  { name: 'Floor 5', prizes: [160, 320, 480] },
  { name: 'Floor 6', prizes: [320, 640, 960] },
  { name: 'Floor 7', prizes: [640, 1280, 1920] },
  { name: 'Floor 8', prizes: [1280, 2560, 3840] },
  { name: 'Floor 9', prizes: [2560, 5120, 7680] },
  { name: 'Floor 10', prizes: [5000, 10000, 15000] },
];

let currentFloor = 1;
let winnings = 0;
let lastPrize = 0;

const towerEl = document.getElementById('tower');
const statusEl = document.getElementById('status');
const openBtn = document.getElementById('open-btn');
const climbBtn = document.getElementById('climb-btn');
const cashoutBtn = document.getElementById('cashout-btn');

function renderTower() {
  towerEl.innerHTML = '';
  floors.slice().reverse().forEach((floor, idx) => {
    const level = floors.length - idx;
    const div = document.createElement('div');
    div.className = 'h-14 flex items-center justify-center border-b border-gray-700';
    if (level === currentFloor) {
      div.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-pink-500', 'font-bold');
    }
    div.textContent = floor.name;
    towerEl.appendChild(div);
  });
}

function openPack() {
  const floor = floors[currentFloor - 1];
  lastPrize = floor.prizes[Math.floor(Math.random() * floor.prizes.length)];
  winnings += lastPrize;
  statusEl.textContent = `You pulled a card worth ${lastPrize} coins! Total: ${winnings}`;
  openBtn.disabled = true;
  climbBtn.disabled = false;
  cashoutBtn.disabled = false;
}

function climb() {
  if (currentFloor >= 3) {
    const failChance = (currentFloor - 2) * 0.1; // increases per floor
    if (Math.random() < failChance) {
      statusEl.textContent = 'You fell from the tower and lost everything!';
      resetGame();
      return;
    }
  }
  if (currentFloor === floors.length) {
    statusEl.textContent = `Top floor reached! You win ${winnings} coins!`;
    resetGame();
    return;
  }
  currentFloor++;
  statusEl.textContent = `Climbed to Floor ${currentFloor}. Open your next pack.`;
  openBtn.disabled = false;
  climbBtn.disabled = true;
  cashoutBtn.disabled = true;
  renderTower();
}

function cashOut() {
  statusEl.textContent = `You cashed out with ${winnings} coins.`;
  resetGame();
}

function resetGame() {
  currentFloor = 1;
  winnings = 0;
  lastPrize = 0;
  openBtn.disabled = false;
  climbBtn.disabled = true;
  cashoutBtn.disabled = true;
  renderTower();
}

openBtn.addEventListener('click', openPack);
climbBtn.addEventListener('click', climb);
cashoutBtn.addEventListener('click', cashOut);

renderTower();
