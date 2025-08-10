/**
 * Deterministic horizontal prize spinner.
 * Builds a duplicated track of fixed-width tiles and animates it via a single rAF loop
 * ensuring forward-only travel and sub-pixel accurate landings under a center pin.
 */
/* global currentPrizes */

// --- constants ---
export const CARD_W = 220;
export const CARD_H = 320;
export const GAP = 16;
export const TILE_W = CARD_W + GAP;
const IDLE_SPEED = 0.6; // px/ms

// --- state ---
let viewport, track, debugEl;
let prizes = [];
let trackItems = [];
let TRACK_PX = 0;

let offset = 0;        // px, negative = moved left
let speed = IDLE_SPEED;
let mode = 'idle';     // 'idle' | 'spinning' | 'braking'
let spinLock = false;
let raf = 0, lastTs = performance.now();

const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.max(1, Math.round(window.devicePixelRatio || 1));
function snap(px){ return Math.round(px * DPR) / DPR; }
function wrap(x, mod){ x %= mod; return x <= -mod ? x + mod : x > 0 ? x - mod : x; }

let brakeTarget = 0;
let debugOn = false;

// --- helpers ---
function tileCenter(idx){ return idx * TILE_W + CARD_W / 2; }
function targetOffsetForIndex(idx, viewportW){ return viewportW / 2 - tileCenter(idx); }
function shortestWrap(from, to, mod){ let d = ((to - from) % mod + mod) % mod; if (d > mod / 2) d -= mod; return d; }

// choose the forward copy of localIdx within duplicated track
function forwardIndex(localIdx, startOffset){
  const n = prizes.length;
  const lead = Math.floor((-startOffset) / TILE_W) % trackItems.length;
  const leadLocal = lead % n;
  let base = Math.floor(lead / n) * n;
  if (localIdx < leadLocal) base += n; // next copy
  return base + localIdx;
}

function drawDebug(){
  if (!debugEl) return;
  const viewportW = viewport.getBoundingClientRect().width;
  const center = viewportW / 2;
  const idx = Math.round((center - CARD_W / 2 - offset) / TILE_W);
  const err = tileCenter(idx) + offset - center;
  const delta = mode === 'braking' ? shortestWrap(offset, brakeTarget, TRACK_PX) : 0;
  debugEl.textContent = `off:${offset.toFixed(2)}\nspd:${speed.toFixed(2)}\nmode:${mode}\ndelta:${delta.toFixed(2)}\nerr:${Math.abs(err).toFixed(2)}`;
}

function frame(ts){
  let dt = ts - lastTs; lastTs = ts;
  if (document.visibilityState === 'hidden'){ raf = requestAnimationFrame(frame); return; }
  if (dt > 50) dt = 50;
  offset = wrap(offset - speed * dt, TRACK_PX);
  track.style.transform = `translate3d(${snap(offset)}px,0,0)`;
  if (debugOn) drawDebug();
  raf = requestAnimationFrame(frame);
}

async function renderTrack(list){
  const A = list.map(p => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    const img = document.createElement('img');
    img.src = p.imageUrl;
    img.alt = p.name || '';
    img.draggable = false;
    tile.appendChild(img);
    return tile;
  });
  trackItems = [...A, ...A];
  track.replaceChildren(...trackItems);
  // preload images
  const imgs = Array.from(track.querySelectorAll('img'));
  await Promise.all(imgs.map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => new Promise(r => { img.onload = img.onerror = r; }))));
  TRACK_PX = trackItems.length * TILE_W;
}

function highlightCenteredCard(){
  const viewportW = viewport.getBoundingClientRect().width;
  const center = viewportW / 2;
  const idx = ((Math.round((center - CARD_W / 2 - offset) / TILE_W)) % trackItems.length + trackItems.length) % trackItems.length;
  const err = Math.abs(tileCenter(idx) + offset - center);
  if (err > 0.5) console.warn('center error', err.toFixed(2));
  const card = trackItems[idx];
  card.classList.add('glow');
  setTimeout(() => card.classList.remove('glow'), 900);
}

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
function easeInOutCubic(x){ return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function easeOutQuint(x){ return 1 - Math.pow(1 - x, 5); }

function ramp(fromSpeed, toSpeed, durationMs){
  return new Promise(res => {
    const t0 = performance.now();
    (function step(t){
      const p = Math.min(1, (t - t0) / durationMs);
      speed = fromSpeed + (toSpeed - fromSpeed) * easeInOutCubic(p);
      if (p < 1) requestAnimationFrame(step); else { speed = toSpeed; res(); }
    })(performance.now());
  });
}

function glideTo(fromOffset, toOffset, durationMs){
  return new Promise(res => {
    const t0 = performance.now();
    const diff = shortestWrap(fromOffset, toOffset, TRACK_PX);
    const startSpeed = speed;
    (function step(t){
      const p = Math.min(1, (t - t0) / durationMs);
      const e = easeOutQuint(p);
      speed = 0.45 + (startSpeed - 0.45) * (1 - e);
      offset = wrap(fromOffset + diff * e, TRACK_PX);
      track.style.transform = `translate3d(${snap(offset)}px,0,0)`;
      if (debugOn) drawDebug();
      if (p < 1) requestAnimationFrame(step); else {
        offset = wrap(toOffset, TRACK_PX);
        track.style.transform = `translate3d(${snap(offset)}px,0,0)`;
        res();
      }
    })(performance.now());
  });
}

export async function spinToIndex(winLocal){
  if (spinLock) return;
  spinLock = true;
  mode = 'spinning';
  await ramp(speed, 2.6, 600);    // accelerate
  await wait(250);                 // brief cruise

  const viewportW = viewport.getBoundingClientRect().width;
  const startOffset = offset;
  const idx = forwardIndex(winLocal % prizes.length, startOffset);
  const target = targetOffsetForIndex(idx, viewportW);
  brakeTarget = wrap(target, TRACK_PX);
  let delta = shortestWrap(startOffset, target, TRACK_PX);
  if (delta >= 0) delta -= TRACK_PX; // forward only travel

  mode = 'braking';
  await glideTo(startOffset, startOffset + delta, 1400); // decelerate
  speed = 0;                                              // pause exactly on target
  highlightCenteredCard();                                // glow the centered card
  await wait(900);                                        // keep it visible
  await ramp(0, IDLE_SPEED, 500);                         // settle back to idle drift
  mode = 'idle';
  spinLock = false;
}

export const demo = {
  timer: null,
  start(ms = 6000){
    if (prefersReduce) return;
    this.stop();
    this.timer = setInterval(() => {
      const idx = Math.floor(Math.random() * prizes.length);
      spinToIndex(idx);
    }, ms);
  },
  stop(){ if (this.timer){ clearInterval(this.timer); this.timer = null; } }
};

export async function initSpinner(viewportEl, trackEl, prizeList = currentPrizes){
  viewport = viewportEl;
  track = trackEl;
  debugEl = viewport.querySelector('#spinDebug');
  const params = new URLSearchParams(location.search);
  debugOn = params.get('debug') === '1';
  if (debugOn) viewport.classList.add('debug');

  prizes = prizeList.slice();
  await renderTrack(prizes);
  offset = 0;
  speed = prefersReduce ? 0 : IDLE_SPEED;
  mode = 'idle';
  lastTs = performance.now();
  raf = requestAnimationFrame(frame);
  return { spinToIndex, demo, destroy };
}

export function destroy(){
  cancelAnimationFrame(raf);
  demo.stop();
  track.replaceChildren();
  trackItems = [];
}

