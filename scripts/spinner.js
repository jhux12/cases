/**
 * Spinner module rendering a seamless horizontal carousel that can spin to any prize index.
 * @module spinner
 */
/* global currentPrizes */

// --- Constants ---
export const CARD_W = 220;
export const CARD_H = 320;
export const GAP = 16;
export const TILE_W = CARD_W + GAP;
const IDLE_SPEED = 0.6; // px/ms

// --- Internal state ---
let viewport, track;
let prizes = [];
let trackItems = [];
let TRACK_PX = 0;
let offset = 0;
let speed = IDLE_SPEED;
let spinLock = false;
let lastTs = performance.now();
let rafId = 0;
const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Wrap value into [-mod, 0) */
function wrap(n, mod) {
  n = n % mod;
  if (n > 0) n -= mod;
  return n;
}

/** Center X position of tile index in track space */
function tileCenterX(idx) {
  return idx * TILE_W + CARD_W / 2;
}

/** Target offset for aligning index to viewport center */
function targetOffsetForIndex(idx, viewportW) {
  return viewportW / 2 - tileCenterX(idx);
}

/** Shortest wrapped distance from a to b within mod */
function shortestWrap(a, b, mod) {
  let d = ((b - a) % mod + mod) % mod;
  if (d > mod / 2) d -= mod;
  return d;
}

/** Preload prize images */
function preloadImages(list) {
  return Promise.all(list.map(p => new Promise(res => {
    const img = new Image();
    img.src = p.imageUrl;
    img.onload = img.onerror = res;
  })));
}

/** Build track items once and duplicate for seamless loop */
function renderTrack(list) {
  const first = list.map(p => {
    const tile = document.createElement('div');
    tile.className = 'card flex-shrink-0';
    tile.style.width = CARD_W + 'px';
    tile.style.height = CARD_H + 'px';
    const img = document.createElement('img');
    img.src = p.imageUrl;
    img.alt = p.name || '';
    img.draggable = false;
    tile.appendChild(img);
    return tile;
  });
  trackItems = [...first, ...first];
  track.innerHTML = '';
  trackItems.forEach(t => track.appendChild(t));
  TRACK_PX = trackItems.length * TILE_W;
}

/** Main requestAnimationFrame loop */
function loop(ts) {
  const dt = ts - lastTs;
  lastTs = ts;
  if (!document.hidden) {
    offset = wrap(offset - speed * dt, TRACK_PX);
    track.style.transform = `translate3d(${offset}px,0,0)`;
  }
  rafId = requestAnimationFrame(loop);
}

/** Return global index ahead of current offset for given local index */
function nearestForwardIndex(localIdx, startOffset, viewportW) {
  const len = prizes.length;
  const candidates = [localIdx % len, (localIdx % len) + len];
  let bestIdx = candidates[0];
  let bestDelta = -Infinity;
  for (const cand of candidates) {
    const target = targetOffsetForIndex(cand, viewportW);
    let delta = shortestWrap(startOffset, target, TRACK_PX);
    if (delta > 0) delta -= TRACK_PX; // enforce forward travel
    if (delta > bestDelta) {
      bestDelta = delta;
      bestIdx = cand;
    }
  }
  return bestIdx;
}

/** Cubic ease-in-out */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Quintic ease-out */
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

/** Ramp speed from "from" to "to" over duration */
function ramp(from, to, duration) {
  return new Promise(res => {
    const start = performance.now();
    function step(ts) {
      const t = Math.min(1, (ts - start) / duration);
      speed = from + (to - from) * easeInOutCubic(t);
      if (t < 1) requestAnimationFrame(step); else { speed = to; res(); }
    }
    requestAnimationFrame(step);
  });
}

/** Glide offset to target with easeOutQuint */
function glideTo(fromOffset, toOffset, duration) {
  return new Promise(res => {
    const start = performance.now();
    const diff = shortestWrap(fromOffset, toOffset, TRACK_PX);
    function step(ts) {
      const t = Math.min(1, (ts - start) / duration);
      const eased = easeOutQuint(t);
      offset = wrap(fromOffset + diff * eased, TRACK_PX);
      speed = 0.45 * (1 - eased);
      track.style.transform = `translate3d(${offset}px,0,0)`;
      if (t < 1) requestAnimationFrame(step); else { offset = wrap(toOffset, TRACK_PX); res(); }
    }
    requestAnimationFrame(step);
  });
}

/** Highlight the card under the center pin */
function highlightCenteredCard() {
  const viewportW = viewport.getBoundingClientRect().width;
  const centerPos = -offset + viewportW / 2;
  const idx = ((Math.round((centerPos - CARD_W / 2) / TILE_W)) % trackItems.length + trackItems.length) % trackItems.length;
  const card = trackItems[idx];
  card.classList.add('glow');
  setTimeout(() => card.classList.remove('glow'), 900);
}

/** Wait helper */
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Spin to prize index deterministically */
async function spinToIndex(winIndexLocal) {
  if (spinLock) return;
  spinLock = true;
  await ramp(IDLE_SPEED, 2.6, 600);
  await wait(300);
  const viewportW = viewport.getBoundingClientRect().width;
  const startOffset = offset;
  const baseIdx = nearestForwardIndex(winIndexLocal, startOffset, viewportW);
  const targetOffsetRaw = targetOffsetForIndex(baseIdx, viewportW);
  let delta = shortestWrap(startOffset, targetOffsetRaw, TRACK_PX);
  if (delta > 0) delta -= TRACK_PX;
  await glideTo(startOffset, startOffset + delta, 1400);
  await ramp(0.45, IDLE_SPEED, 500);
  highlightCenteredCard();
  spinLock = false;
}

const demo = {
  timer: null,
  start(interval = 6000) {
    if (prefersReduce) return;
    this.stop();
    this.timer = setInterval(() => {
      const idx = Math.floor(Math.random() * prizes.length);
      spinToIndex(idx);
    }, interval);
  },
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
};

/** Initialise spinner with viewport, track and prizes */
export async function initSpinner(viewportEl, trackEl, prizeList = currentPrizes) {
  viewport = viewportEl;
  track = trackEl;
  prizes = prizeList.slice(); // immutable copy
  await preloadImages(prizes);
  renderTrack(prizes);
  offset = 0;
  speed = IDLE_SPEED;
  lastTs = performance.now();
  rafId = requestAnimationFrame(loop);
  return { spinTo: spinToIndex, demo, destroy };
}

/** External spin API */
export function spinTo(winIndex) { return spinToIndex(winIndex); }

/** Destroy spinner instance */
export function destroy() {
  cancelAnimationFrame(rafId);
  demo.stop();
  track.innerHTML = '';
  trackItems = [];
}

// Example usage:
// <div class="spin-viewport"><div id="spinTrack" class="spin-track"></div><div class="center-pin"></div></div>
// import { initSpinner, spinTo } from './spinner.js';
// const api = await initSpinner(viewportEl, trackEl, prizes);
// api.demo.start(6000); // optional
// await api.spinTo(index);
