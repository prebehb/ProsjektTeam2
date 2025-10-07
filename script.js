// ======== ENKEL 2D RUNNER ========
// Mål: superenkel, lett å lese, få konsepter.

// --- Canvas og grunnverdier
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const riverY = Math.floor(H * 0.62);   // vannlinje
const gravity = 0.6;                   // tyngdekraft
const jumpForce = 12;                  // hoppe-styrke

// --- Spiller (enkel boks + båt-ellipse for tegning)
const player = {
  x: Math.floor(W * 0.22),
  y: riverY - 24,   // starter ved overflata
  w: 44,
  h: 24,
  vy: 0,
  under: false,     // dykker (hold nede pil ned/S)
  canJump: true
};

// --- Enkle skyer (for litt liv i bakgrunnen)
const clouds = Array.from({length: 4}).map(() => ({
  x: Math.random() * W,
  y: 20 + Math.random() * 120,
  s: 0.4 + Math.random() * 0.6
}));

// --- Hindre
// type: 'float' (på vann) eller 'air' (fugl).
const obstacles = [];
let spawnTimer = 0;          // teller ned til neste hinder
let score = 0;
let running = false;
let gameIsOver = false;

// --- Overlay og UI
const overlay = document.getElementById('overlay');
const btnStart = document.getElementById('btnStart');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');

console.log('game-simple.js loaded');
btnStart.addEventListener('click', start);

// --- Input
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  // Hopp (ikke mens vi er under)
  if ((e.code === 'Space' || e.code === 'KeyW') && !player.under) {
    tryJump();
  }
  // Dykk holdes med ArrowDown/KeyS (slås av i keyup)
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    player.under = true;
  }
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    player.under = false;
  }
});

function start() {
  // Reset
  score = 0;
  obstacles.length = 0;
  spawnTimer = 0;
  gameIsOver = false;
  running = true;

  // Spiller tilbake til overflata
  player.y = riverY - player.h;
  player.vy = 0;
  player.under = false;
  player.canJump = true;

  overlay.style.display = 'none';
  scoreEl.textContent = score.toString();
  statusEl.textContent = 'spiller';

  requestAnimationFrame(loop);
}

function end() {
  running = false;
  gameIsOver = true;
  statusEl.textContent = 'game over';
  overlay.style.display = 'grid';
}

// --- Enkel hoppelogikk
function tryJump() {
  // Kan hoppe hvis vi står i overflata (ikke under)
  const onSurface = player.y >= riverY - player.h - 0.01;
  if (onSurface && !player.under) {
    player.vy = -jumpForce;
    player.canJump = false;
  }
}

// --- Hjelpefunksjon: rektangel-kollisjon
function hit(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// --- Lage nye hindre med enkel, jevn frekvens
function spawnObstacle() {
  // 65% sjanse på flytende, 35% på fugl
  const type = Math.random() < 0.65 ? 'float' : 'air';

  if (type === 'float') {
    // Flytende hindring ved overflate (gjør hitboksen litt dypere)
    const w = 36 + Math.random() * 20;
    const h = 28;
    const y = riverY - 14;
    obstacles.push({ type, x: W + 10, y, w, h, speed: 4 });
  } else {
    // Fugl litt over vann
    const w = 28, h = 20;
    const y = riverY - 70 - Math.random() * 25;
    obstacles.push({ type, x: W + 10, y, w, h, speed: 5 });
  }
}

// --- Spill-løkke
let last = 0;
function loop(now) {
  if (!running) return;
  const dt = Math.min(50, now - last); // ms
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// --- Oppdater alt
function update(dt) {
  // Skyer
  clouds.forEach(c => {
    c.x -= c.s * 0.6;
    if (c.x < -120) { c.x = W + 60; c.y = 20 + Math.random()*120; }
  });

  // Spiller – enkel fysikk
  if (player.under) {
    const target = riverY + 18; // litt under overflata
    if (player.y < target) player.y += 2.2;
    player.vy = 0;
    player.canJump = false;
  } else {
    player.vy += gravity;
    player.y += player.vy;

    // Ikke falle under overflata
    const surfaceY = riverY - player.h;
    if (player.y > surfaceY) {
      player.y = surfaceY;
      player.vy = 0;
      player.canJump = true;
    }

    // Maks hopphøyde (for enkelhet)
    const minY = H * 0.22;
    if (player.y < minY) {
      player.y = minY;
      player.vy = 0.4;
    }
  }

  // Hindre – beveg, fjern, tell poeng, sjekk treff
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 900; // nytt hinder ca. hver 0.9 sek
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= o.speed;

    // Score når hindret passerer spilleren
    if (!o.scored && o.x + o.w < player.x) {
      o.scored = true;
      score += 5;
      scoreEl.textContent = score.toString();
    }

    // Fjern utenfor skjerm
    if (o.x + o.w < -10) {
      obstacles.splice(i, 1);
      continue;
    }

    // Kollisjon
    const overlap = hit(player.x, player.y, player.w, player.h, o.x, o.y, o.w, o.h);
    if (overlap) {
      if (o.type === 'float') {
        end(); return;
      } else if (o.type === 'air' && !player.under) {
        end(); return;
      }
    }
  }
}

// --- Tegn alt (enkel stil)
function draw() {
  // Himmel
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b132b');
  g.addColorStop(1, '#0b1022');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Enkle silhuetter (Trondheim-ish)
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#1f2a44';
  // Tyholttårnet
  rect(W*0.16, H*0.18, 6, 90);
  rect(W*0.155, H*0.16, 26, 6);
  circle(W*0.165, H*0.14, 16);
  // Nidarosdomen tårn
  rect(W*0.66, H*0.22, 18, 95);
  rect(W*0.70, H*0.18, 22, 115);
  triangle(W*0.71, H*0.18, W*0.725, H*0.13, W*0.74, H*0.18);
  rect(W*0.75, H*0.22, 18, 95);
  ctx.globalAlpha = 1;

  // Skyer
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  clouds.forEach(c => {
    circle(c.x, c.y, 12*c.s);
    circle(c.x + 18*c.s, c.y - 6*c.s, 10*c.s);
    circle(c.x + 36*c.s, c.y, 13*c.s);
  });

  // Elv
  drawRiver();

  // Hindre
  obstacles.forEach(o => {
    if (o.type === 'float') {
      ctx.fillStyle = '#b45309';
      roundRect(o.x, o.y, o.w, o.h, 6);
      ctx.fill();
    } else {
      ctx.fillStyle = '#d1d5db';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.quadraticCurveTo(o.x + o.w*0.4, o.y - 8, o.x + o.w, o.y);
      ctx.quadraticCurveTo(o.x + o.w*0.4, o.y + 8, o.x, o.y);
      ctx.fill();
    }
  });

  // Spiller
  drawPlayer();
}

// --- Tegnehjelpere (ENKLE)
function rect(x,y,w,h){ ctx.fillRect(x,y,w,h); }
function circle(x,y,r){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); }
function triangle(x1,y1,x2,y2,x3,y3){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill(); }
function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
}

function drawRiver() {
  // Vannområde
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, riverY, W, H - riverY);
  ctx.clip();

  // Farge i vannet
  const g = ctx.createLinearGradient(0, riverY, 0, H);
  g.addColorStop(0, '#13337a');
  g.addColorStop(1, '#0b225a');
  ctx.fillStyle = g;
  ctx.fillRect(0, riverY, W, H - riverY);

  // Enkle bølger
  ctx.strokeStyle = 'rgba(255,255,255,.25)';
  ctx.globalAlpha = 0.6;
  for (let i=0;i<2;i++){
    const baseY = riverY + 12 + i*18;
    ctx.beginPath();
    for (let x=0;x<=W;x+=6){
      const yy = baseY + Math.sin((x + performance.now()*0.08)/160 + i)*6;
      if (x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  // Båt
  ctx.fillStyle = '#f97316';
  // ellipse-imitasjon: avrundete rektangler
  roundRect(player.x - player.w*0.5 + player.w/2, player.y + player.h*0.6, player.w, player.h, 12);
  ctx.fill();

  // Padler (lite hode)
  ctx.fillStyle = '#fde68a';
  circle(player.x + player.w*0.2, player.y, 6);

  // Bobler når under
  if (player.under) {
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    circle(player.x + 10, player.y - 8, 2);
    circle(player.x + 18, player.y - 14, 3);
  }
}