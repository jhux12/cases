// Physics token animation inside the vending machine glass using Matter.js

const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Composite,
  Events
} = Matter;

const glass = document.getElementById('glassWindow');
const canvas = document.getElementById('vendingCanvas');
const buyBtn = document.getElementById('buyBtn');

if (!glass || !canvas) {
  console.warn('Missing #glassWindow or #vendingCanvas');
}

const DPR = Math.min(window.devicePixelRatio || 1, 2);

// Token images (replace these with real rarity icons)
const tokenSprites = [
  { key: 'common', url: '/images/tokens/common.png', fill: '#67e8f9' },
  { key: 'uncommon', url: '/images/tokens/uncommon.png', fill: '#a5f3fc' },
  { key: 'rare', url: '/images/tokens/rare.png', fill: '#c4b5fd' },
  { key: 'epic', url: '/images/tokens/epic.png', fill: '#d8b4fe' },
  { key: 'legendary', url: '/images/tokens/legendary.png', fill: '#facc15' }
];

function preloadImages(list) {
  return Promise.all(
    list.map(
      (item) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ ...item, img });
          img.onerror = () => resolve({ ...item, img: null });
          img.src = item.url;
        })
    )
  );
}

let engine;
let render;
let runner;
let W = 0;
let H = 0;
let walls = [];
let tokens = [];

function rebuildWalls() {
  if (walls.length) {
    walls.forEach((wall) => Composite.remove(engine.world, wall));
  }
  walls = [];

  const w = W * DPR;
  const h = H * DPR;
  const thickness = 40 * DPR;

  const floor = Bodies.rectangle(w / 2, h + thickness / 2, w + thickness * 2, thickness, { isStatic: true });
  const ceiling = Bodies.rectangle(w / 2, -thickness / 2, w + thickness * 2, thickness, { isStatic: true });
  const leftWall = Bodies.rectangle(-thickness / 2, h / 2, thickness, h + thickness * 2, { isStatic: true });
  const rightWall = Bodies.rectangle(w + thickness / 2, h / 2, thickness, h + thickness * 2, { isStatic: true });

  const rampLeft = Bodies.rectangle(w * 0.18, h * 0.72, w * 0.55, 18 * DPR, {
    isStatic: true,
    angle: -0.25
  });

  const rampRight = Bodies.rectangle(w * 0.78, h * 0.62, w * 0.45, 18 * DPR, {
    isStatic: true,
    angle: 0.22
  });

  walls.push(floor, ceiling, leftWall, rightWall, rampLeft, rampRight);
  World.add(engine.world, walls);
}

function resizeRenderer() {
  if (!glass || !canvas) return;
  W = Math.floor(glass.clientWidth);
  H = Math.floor(glass.clientHeight);

  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);

  render.options.width = canvas.width;
  render.options.height = canvas.height;
  render.bounds.max.x = canvas.width;
  render.bounds.max.y = canvas.height;

  rebuildWalls();
}

function randomTokenSprite(loadedSprites) {
  const r = Math.random();
  if (r < 0.57) return loadedSprites.find((x) => x.key === 'common');
  if (r < 0.77) return loadedSprites.find((x) => x.key === 'uncommon');
  if (r < 0.93) return loadedSprites.find((x) => x.key === 'rare');
  if (r < 0.99) return loadedSprites.find((x) => x.key === 'epic');
  return loadedSprites.find((x) => x.key === 'legendary');
}

function spawnTokens(loadedSprites, count = 55) {
  tokens.forEach((token) => Composite.remove(engine.world, token));
  tokens = [];

  const w = W * DPR;
  const h = H * DPR;

  for (let i = 0; i < count; i += 1) {
    const radius = (18 + Math.random() * 8) * DPR;
    const x = Math.random() * (w - radius * 2) + radius;
    const y = Math.random() * (h * 0.35) + radius;

    const sprite = randomTokenSprite(loadedSprites);
    const fallbackFill = sprite?.fill || '#66ccff';
    const body = Bodies.circle(x, y, radius, {
      restitution: 0.45,
      friction: 0.1,
      frictionAir: 0.02,
      density: 0.0012,
      render: sprite?.img
        ? {
            sprite: {
              texture: sprite.url,
              xScale: (radius * 2) / 64,
              yScale: (radius * 2) / 64
            }
          }
        : {
            fillStyle: fallbackFill,
            strokeStyle: '#0ea5e9',
            lineWidth: 1.5
          }
    });

    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.25);
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 2.2 * DPR, y: (Math.random() - 0.5) * 1.2 * DPR });

    tokens.push(body);
  }

  World.add(engine.world, tokens);
}

function bumpTokens() {
  tokens.forEach((token) => {
    const fx = (Math.random() - 0.5) * 0.012 * token.mass * DPR;
    const fy = -Math.random() * 0.02 * token.mass * DPR;
    Body.applyForce(token, token.position, { x: fx, y: fy });
  });
}

async function init() {
  if (!glass || !canvas) return;
  const loadedSprites = await preloadImages(tokenSprites);

  engine = Engine.create();
  engine.gravity.y = 1.05;

  render = Render.create({
    canvas,
    engine,
    options: {
      width: 1,
      height: 1,
      wireframes: false,
      background: 'transparent',
      pixelRatio: 1
    }
  });

  runner = Runner.create();

  resizeRenderer();
  spawnTokens(loadedSprites, 60);

  Render.run(render);
  Runner.run(runner, engine);

  let t = 0;
  Events.on(engine, 'beforeUpdate', () => {
    t += 1;
    if (t % 55 === 0) {
      const pick = tokens[Math.floor(Math.random() * tokens.length)];
      if (pick) {
        Body.applyForce(pick, pick.position, {
          x: (Math.random() - 0.5) * 0.01 * pick.mass * DPR,
          y: -0.012 * pick.mass * DPR
        });
      }
    }
  });

  glass.addEventListener('pointerdown', (event) => {
    const rect = glass.getBoundingClientRect();
    const px = (event.clientX - rect.left) * DPR;
    const py = (event.clientY - rect.top) * DPR;

    tokens.forEach((body) => {
      const dx = body.position.x - px;
      const dy = body.position.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 * DPR) {
        const strength = (1 - dist / (120 * DPR)) * 0.02 * body.mass * DPR;
        Body.applyForce(body, body.position, { x: (dx / (dist || 1)) * strength, y: (dy / (dist || 1)) * strength });
      }
    });
  });

  buyBtn?.addEventListener('click', () => {
    bumpTokens();
  });

  window.addEventListener('resize', () => {
    resizeRenderer();
  });
}

init();
