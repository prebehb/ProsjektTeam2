// ======== ENKEL 2D RUNNER ========

// --- BILDER (stier relativt til /game/ mappen) ---
const background = new Image();
background.src = 'assets/Nidelven_background.png';   // sjekk case og mappe

const seagullImg = new Image();
seagullImg.src = 'Images/Seagull.png';               // sjekk case og mappe

// --- seagull sprite data ---
const seagullSprite = {
  frameW: 150 / 3,  // 3 frames across
  frameH: 100 / 2,  // 2 rows
  frameCount: 6,
  frameIndex: 0,
  frameTime: 100,   // ms per frame
  frameTimer: 0
};

// --- Canvas og grunnverdier ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const riverY = Math.floor(H * 0.62); // vannets overflate
const gravity = 0.8;                 // tyngdekraft
const jumpForce = 15;                // hoppstyrke

let gameSpeed = 1;                   // starthastighet på hindre
const speedIncreaseRate = 0.00005;   // fartsøkning per ms

let startTid = 0; // tidtaking start

// *Spiller*
const player = {
  x: Math.floor(W * 0.25),
  y: riverY - 24,
  w: 44,
  h: 24,
  vy: 0,
  canJump: true
};

// *Hindre*
const obstacles = []; // {type:'float'|'air', x,y,w,h,speed,scored}
let spawnTimer = 0;
let score = 0;
let running = false;
let gameIsOver = false;

// --- UI/overlay ---
const overlay = document.getElementById('overlay');
const btnStart = document.getElementById('btnStart');
const scoreEl = document.getElementById('score');
const endCard = document.getElementById('endCard');
const saveScoreBtn = document.getElementById('saveScoreBtn'); // NY
const restartBtn = document.getElementById('restartBtn');         // NY
const finalScoreText = document.getElementById('finalScoreText'); // NY

console.log('script.js loaded');

const keys = {}; 

// Tastatur (W / Pil opp) for hopp 
window.addEventListener('keydown', (e) => {
  keys[e.code] = true; // lagrer knappen så lenge den er trykket inn
  if (e.code === 'KeyW' || e.code === 'ArrowUp') {
    e.preventDefault();  // gjør at knappen som er trykket på ikke påvirker selve nettsiden
    tryJump();
  }
  // Restart via Space/Enter/R når game over 
  if (gameIsOver && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
    e.preventDefault();
    start();
  }
});

btnStart.addEventListener('click', start); // Start spill
restartBtn?.addEventListener('click', () => start()); // Restart knapp

// --- Start spill
function start() {
  score = 0;
  obstacles.length = 0;
  spawnTimer = 0;
  gameIsOver = false;
  running = true;
  gameSpeed = 1;
  startTid = Date.now();

  // UI
  overlay.classList.add('hidden');
  endCard.classList.remove('show');
  endCard.classList.add('hidden');
  scoreEl.textContent = '0';

  // Spiller
  player.x = Math.floor(W * 0.25);
  player.y = riverY - player.h;
  player.vy = 0;
  player.canJump = true;

  last = 0;
  requestAnimationFrame(loop);
}

// --- Sluttspill 
function end() {
  running = false;
  gameIsOver = true;

  const sluttTid = (Date.now() - startTid) / 1000;

  // vis sluttpoeng
  if (finalScoreText) finalScoreText.textContent = String(score);

  // vis sluttkort
  endCard.classList.remove('hidden');
  endCard.classList.add('show');

  // lagre-knappen
  if (saveScoreBtn) {
    saveScoreBtn.onclick = () => {
      const navn = prompt("Skriv inn navnet ditt:");
      if (!navn) return;

      // lagre i localStorage
      const resultat = { tid: sluttTid, score, navn, ts: Date.now() };
      let bestResults = JSON.parse(localStorage.getItem("bestResults")) || [];
      bestResults.push(resultat);
      // Sortér: høyest score først, deretter lavest tid
      bestResults.sort((a, b) => (b.score - a.score) || (a.tid - b.tid));
      bestResults = bestResults.slice(0, 3);
      localStorage.setItem("bestResults", JSON.stringify(bestResults));

      alert("Resultatet ditt er lagret!"); 
    };
  }
}

// --- Hopp funksjon 
function tryJump() {
  const onSurface = player.y >= riverY - player.h - 0.01;
  if (onSurface && player.canJump) {
    player.vy = -jumpForce;
    player.canJump = false;
  }
}

// --- Kollisjon deteksjon
function hit(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// --- Spawn hindre 
function spawnObstacle() {
  const type = Math.random() < 0.70 ? 'float' : 'air';

  if (type === 'float') {
    const w = 65 ; //+ Math.random() * 40 (legg til om tilfelig størelse. senk W)
    const h = 30;
    const y = riverY - 15 ; // at hinderet har sin midt på vannoverflaten. hvis -15 = 0 vil den ligge rett under 
    obstacles.push({ type, x: W + 10, y, w, h, speed: 4 });
  } 
  
  else { //fulg litt over vann
    const w = 28, h = 20;
    const y = riverY - 45 - Math.random() * 90;
    obstacles.push({ type, x: W + 10, y, w, h, speed: 4 });
  }
}

// --- Loop 
let last = 0;
function loop(now) {
  if (!running) return;
  const dt = Math.min(33, now - last); // ms. Setter spillet til å fungere på 30 fps?
  last = now;

  update(dt); 
  draw();

  requestAnimationFrame(loop); 
}

// --- Update 
function update(dt) {
  // Spillerfysikk 
  player.vy += gravity; // tyngdekraft
  player.y += player.vy; // oppdater posisjon

  // Gulv 
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

  // Hindre 
 spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 1500 + Math.random() * 1000; // nytt hinder mellom 1.500sek - 2.500sek 
    
    if (score >= 500){
      spawnTimer = 100 + Math.random() * 500; // endrer spawntid på hindere 
    } 
    if (score >= 300){
      spawnTimer = 300 + Math.random() * 600; 
    } 
    if (score >= 200){
      spawnTimer = 500 + Math.random() * 700; 
    } 
    if (score >= 100){
      spawnTimer = 800 + Math.random() * 800; 
    } 
    if (score >= 50){
      spawnTimer = 1000 + Math.random() * 1000; 
    } 
  } 
  

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= o.speed * gameSpeed;

    // Poeng for passering av hinder
    if (!o.scored && o.x + o.w < player.x) {
      o.scored = true;
      score += 5;
      scoreEl.textContent = String(score);
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
        end(); 
        return;
      } else if (o.type === 'air') { 
        end(); 
        return; 
      }
    }
  }

  // (valgfritt) animasjon av seagull sprite
  seagullSprite.frameTimer += dt;
  if (seagullSprite.frameTimer >= seagullSprite.frameTime) {
    seagullSprite.frameTimer = 0;
    seagullSprite.frameIndex = (seagullSprite.frameIndex + 1) % seagullSprite.frameCount;
  }

  // Øk vanskelighet
  gameSpeed += speedIncreaseRate * dt;
}

// --- Draw
function draw() {
  // Himmel
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a183fff');
  g.addColorStop(1, '#0b1022');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

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
      ctx.quadraticCurveTo(o.x + o.w * 0.4, o.y - 8, o.x + o.w, o.y);
      ctx.quadraticCurveTo(o.x + o.w * 0.4, o.y + 8, o.x, o.y);
      ctx.fill();
    }
  });

  // Spiller
  drawPlayer();
}

// --- Hjelpe-tegnere
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); }

function drawRiver() {
  ctx.beginPath();
  ctx.rect(0, riverY, W, H - riverY);
  const g = ctx.createLinearGradient(0, riverY, 0, H);
  g.addColorStop(0, '#13337a');
  ctx.fillStyle = g;
  ctx.fillRect(0, riverY, W, H - riverY);
}

function drawPlayer() {
  // Båt
  ctx.fillStyle = '#f97316';
  roundRect(player.x - player.w * 0.5 + player.w / 2, player.y + player.h * 0.6, player.w, player.h, 12);
  ctx.fill();
  // Padler
  ctx.fillStyle = '#fde68a';
  circle(player.x + player.w * 0.2, player.y, 6);
}

