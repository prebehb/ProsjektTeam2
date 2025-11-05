// ======== ENKEL 2D RUNNER ========
// Mål: superenkel, lett å lese, få konsepter.  heo nfeiwofoepw åfjireoqpwjfgreiowpgjreiowpjrfeiowpree


const background = new Image();
background.src = '../Nidelven_Background.png';

const seagullImg = new Image();
seagullImg.src = "../Images/Seagull.png";

// --- Seagull sprite data ---
const seagullSprite = {
  frameW: 150 / 3,   // 3 frames across
  frameH: 100 / 2,   // 2 rows
  frameCount: 6,     // total frames
  frameIndex: 0,
  frameTime: 100,    // ms per frame
  frameTimer: 0
};

// --- Canvas og grunnverdier
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d'); // canvas element for å tegne grafikk, tekst og bilder i spillet
const W = canvas.width;
const H = canvas.height;
 
const riverY = Math.floor(H * 0.62);   // Hvor vannets overflate starter
const gravity = 0.8;                   // tyngdekraft
const jumpForce = 15;                  // Hvor høyt spilleren hopper (Skrives med - i hoppelogikken)
 
let gameSpeed = 1; // setter farten på hindre til en starthastighet
const speedIncreaseRate = 0.00005; //øker farten med 0.05 sek
 

// *Spiller*
const player = {
  x: Math.floor(W * 0.25), // Spillerens plassering på canvaset (x-aksen)
  y: riverY - 24,   // starter ved overflata
  w: 44,
  h: 24,
  vy: 0,
  canJump: true
};
 

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
const endCard = document.getElementById("endCard");
 
console.log('game-simple.js loaded');
btnStart.addEventListener('click', start);
 

// *Input gjennom tastaturet*
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
 
  // Hopp -> Pil opp, W 
  if ((e.code === 'KeyW' || e.code === 'ArrowUp')) { 
    tryJump();
  }
}); 
 

// --- Start spill
function start() {
  // Reset
  score = 0;
  obstacles.length = 0;
  spawnTimer = 0;
  gameIsOver = false;
  running = true;
  gameSpeed = 1;
  startTid = Date.now();   // <-- STARTER tidtakingen her

  // Nullstill score
  scoreEl.textContent = score.toString();

  // Skjul end card om spilleren starter på nytt
  endCard.classList.add("hidden");

  requestAnimationFrame(loop);
}


// --- Sluttspill
function end() {
  running = false;
  gameIsOver = true;

  const sluttTid = (Date.now() - startTid) / 1000;

  // Vis pop-up kortet
  endCard.classList.add("show");

  // Når brukeren klikker lagre score-knappen
  saveScoreBtn.onclick = () => {
    const navn = prompt("Skriv inn navnet ditt:");

    if (!navn) return;

    const resultat = { tid: sluttTid, score, navn };

    let bestResults = JSON.parse(localStorage.getItem("bestResults")) || [];
    bestResults.push(resultat);

    bestResults.sort((a, b) => a.tid - b.tid); // sorterer lavest tid først
    bestResults = bestResults.slice(0, 3);    // kun topp 3

    localStorage.setItem("bestResults", JSON.stringify(bestResults));

    alert("Resultatet ditt er lagret!");
  };
}
 

// --- Enkel hoppelogikk
function tryJump() {
  // Kan hoppe hvis vi står i overflata
  const onSurface = player.y >= riverY - player.h - 0.01 ; // 0.01 er en sikkerhetsmargin som gjør at man ikke står helt på vannoverflaten. 
  if (onSurface) { // Gjør at spilleren kan hoppe når på vannoverflaten 
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
  // 70% sjanse på flytende, 30% på fugl
  const type = Math.random() < 0.75 ? 'float' : 'air';
 
  if (type === 'float') {
    // Flytende hindring ved overflate (gjør hitboksen litt dypere)
    const w = 65 ; //+ Math.random() * 40 (legg til om tilfelig størelse. senk W)
    const h = 30;
    const y = riverY - 15; // at hinderet har sin midt på vannoverflaten. hvis -15 = 0 vil den ligge rett under 
    obstacles.push({ type, x: W + 10, y, w, h, speed: 4 });
  } 

  else {
    // Fugl litt over vann
    const w = 28, h = 20;
    const y = riverY - 45 - Math.random() * 90;
    obstacles.push({ type, x: W + 10, y, w, h, speed: 4 });
  }
}
 

// --- Spill-løkke
let last = 0;
function loop(now) {
  if (!running) return;
  const dt = Math.min(50, now - last); // ms. Setter spillet til å fungere på 20 fps?
  last = now;
 
  update(dt);
  draw();
 
  requestAnimationFrame(loop);
}
 

// --- Oppdater alt
function update(dt) {
  // Spiller – enkel fysikk
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
  
  // Hindre – beveg, fjern, tell poeng, sjekk treff
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 1000 + Math.random() * 1000; // nytt hinder mellom 1.000sek - 2.000sek 
    
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
      spawnTimer = 800 + Math.random() * 1000; 
    } 
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
        end(); 
        return;
      } else if (o.type === 'air') { 
        end(); 
        return; 
      }
    }
  }
  
  // Animate seagull sprite frames
  seagullSprite.frameTimer += dt;
  if (seagullSprite.frameTimer >= seagullSprite.frameTime) {
    seagullSprite.frameTimer = 0;
    seagullSprite.frameIndex = (seagullSprite.frameIndex + 1) % seagullSprite.frameCount;
  }
  
  gameSpeed += speedIncreaseRate * dt;
}
 

// --- Tegn alt (enkel stil)
function draw() {
  // Himmel
  const g = ctx.createLinearGradient(0, 0, 0, H); // Hardkoding av bakgrunnsfarger
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

function circle(x,y,r){ 
  ctx.beginPath(); 
  ctx.arc(x,y,r,0,Math.PI*2); 
  ctx.fill(); 
}

function triangle(x1,y1,x2,y2,x3,y3){ 
  ctx.beginPath(); 
  ctx.moveTo(x1,y1); 
  ctx.lineTo(x2,y2); 
  ctx.lineTo(x3,y3); 
  ctx.closePath(); 
  ctx.fill(); 
}

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
  ctx.beginPath();
  ctx.rect(0, riverY, W, H - riverY);
 
  // Farge i vannet
  const g = ctx.createLinearGradient(0, riverY, 0, H);
  g.addColorStop(0, '#13337a');
  ctx.fillStyle = g;
  ctx.fillRect(0, riverY, W, H - riverY);
}
 

function drawPlayer() {
  // Båtfarge
  ctx.fillStyle = '#f97316';
  // Båt form og størrelse
  roundRect(player.x - player.w*0.5 + player.w/2, player.y + player.h*0.6, player.w, player.h, 12);
  ctx.fill();
 
  // Padler (lite hode)
  ctx.fillStyle = '#fde68a';
  circle(player.x + player.w*0.2, player.y, 6);
}
