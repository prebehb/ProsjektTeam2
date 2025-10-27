// ======== ENKEL 2D RUNNER ========
// Mål: superenkel, lett å lese, få konsepter.
 
// --- Canvas og grunnverdier
const canvas = document.getElementById('game');
const ctx2d = canvas.getContext('2d'); // canvas element for å tegne grafikk, tekst og bilder i spillet
const W = canvas.width;
const H = canvas.height;
 
const riverY = Math.floor(H * 0.62);   // Hvor vannets overflate starter
const gravity = 0.6;                   // tyngdekraft
const jumpForce = 12;                  // Hvor høyt spilleren hopper (Skrives med - i hoppelogikken)


let gameSpeed = 1; // setter farten på hindre til en starthastighet
const speedIncreaseRate = 0.00005; //øker farten med 0.00005 sek

// *Spiller*
const player = {
  x: Math.floor(W * 0.25), // Spillerens plassering på canvaset (x-aksen)
  y: riverY - 24,   // starter ved overflata
  w: 44,
  h: 24,
  vy: 0,
  under: false,     // dykker (hold nede pil ned/S)
  canJump: true
};
 
// Enkle skyer (for litt liv i bakgrunnen).     ta bort!!!!!
const clouds = Array.from({length: 4}).map(() => ({
  x: Math.random() * W,
  y: 20 + Math.random() * 120,
  s: 0.4 + Math.random() * 0.6
}));
 
// *Hindre*
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
 
console.log('game-simple.js loaded');
btnStart.addEventListener('click', start);
 
// *Input gjennom tastaturet*
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
 
  // Hopp -> Pil opp, W eller mellomrom
  if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !player.under) {
    tryJump();
  }
  // Dykking må holdes med ArrowDown/KeyS
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
  gameSpeed = 1;
 
  // nulstiller score
  scoreEl.textContent = score.toString();
 
  requestAnimationFrame(loop); // looper bakgrunn
}
 
function end() {
  running = false;
  gameIsOver = true;
}
 
// --- Enkel hoppelogikk
function tryJump() {
  // Kan hoppe hvis vi står i overflata (ikke under)
  const onSurface = player.y >= riverY - player.h - 0.01;
  if (onSurface && !player.under) { // Gjør at spilleren kan hoppe når på vannoverflaten
    player.vy = -jumpForce;
    player.canJump = false;
  }
}
 
// *funksjon for kollisjon -> Spiller(a) og Hinder(b)
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
    spawnTimer = 1000; // nytt hinder ca. hver 1.0 sek
  }
 
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= o.speed * gameSpeed;

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
 
  gameSpeed += speedIncreaseRate * dt;
}
 
// --- Tegn alt (enkel stil)
function draw() {
  // Himmel
  const g = ctx2d.createLinearGradient(0, 0, 0, H); // Hardkoding av bakgrunnsfarger
  g.addColorStop(0, '#0a183fff');
  g.addColorStop(1, '#0b1022');
  ctx2d.fillStyle = g;
  ctx2d.fillRect(0, 0, W, H);
 
  // Elv
  drawRiver();
 
  // Hindre
  obstacles.forEach(o => {
    if (o.type === 'float') {
      ctx2d.fillStyle = '#b45309';
      roundRect(o.x, o.y, o.w, o.h, 6);
      ctx2d.fill();
    } else {
      ctx2d.fillStyle = '#d1d5db';
      ctx2d.beginPath();
      ctx2d.moveTo(o.x, o.y);
      ctx2d.quadraticCurveTo(o.x + o.w*0.4, o.y - 8, o.x + o.w, o.y);
      ctx2d.quadraticCurveTo(o.x + o.w*0.4, o.y + 8, o.x, o.y);
      ctx2d.fill();
    }
  });
 
  // Spiller
  drawPlayer();
}
 
// --- Tegnehjelpere (ENKLE)
function rect(x,y,w,h){ ctx2d.fillRect(x,y,w,h); }
function circle(x,y,r){ ctx2d.beginPath(); ctx2d.arc(x,y,r,0,Math.PI*2); ctx2d.fill(); }
function triangle(x1,y1,x2,y2,x3,y3){ ctx2d.beginPath(); ctx2d.moveTo(x1,y1); ctx2d.lineTo(x2,y2); ctx2d.lineTo(x3,y3); ctx2d.closePath(); ctx2d.fill(); }
function roundRect(x,y,w,h,r){
  ctx2d.beginPath();
  ctx2d.moveTo(x+r, y);
  ctx2d.arcTo(x+w, y,   x+w, y+h, r);
  ctx2d.arcTo(x+w, y+h, x,   y+h, r);
  ctx2d.arcTo(x,   y+h, x,   y,   r);
  ctx2d.arcTo(x,   y,   x+w, y,   r);
}
 
function drawRiver() {
  // Vannområde
  ctx2d.beginPath();
  ctx2d.rect(0, riverY, W, H - riverY);
 
  // Farge i vannet
  const g = ctx2d.createLinearGradient(0, riverY, 0, H);
  g.addColorStop(0, '#13337a');
  ctx2d.fillStyle = g;
  ctx2d.fillRect(0, riverY, W, H - riverY);
 
}
 
function drawPlayer() {
  // Båtfarge
  ctx2d.fillStyle = '#f97316';
  // Båt form og størrelse
  roundRect(player.x - player.w*0.5 + player.w/2, player.y + player.h*0.6, player.w, player.h, 12);
  ctx2d.fill();
 
  // Padler (lite hode)
  ctx2d.fillStyle = '#fde68a';
  circle(player.x + player.w*0.2, player.y, 6);
 
}