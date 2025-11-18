// =============== CANVAS / KONFIG =================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// "Gulvlinje" der kajakken står
const groundLevel = H * 0.8; // 80% ned på skjermen

// Bakgrunn (STATISK)
const background = new Image();
background.src = './Images/Nidelven_background.png'; // sjekk sti

const backgroundWidth = 800;   // tilpass til faktisk bilde
const backgroundHeight = 400;  // tilpass til faktisk bilde

// =============== SPRITES / BILDER =================

// Seagull spritesheet config
const seagullConfig = {
  frameWidth: 50,
  frameHeight: 50,
  framesPerRow: 3,
  totalFrames: 6,
  frameTime: 80 // ms per frame
};

const obstacleImages = [new Image(), new Image()];
obstacleImages[0].src = './Images/Log.png';      // tømmerstokk
obstacleImages[1].src = './Images/Seagull.png';  // måke-spritesheet

// Spiller (kajakk) – to frames for "padleanimasjon"
const playerImages = [new Image(), new Image()];
playerImages[0].src = './Images/Kayak.png';
playerImages[1].src = './Images/Kayak2.png';

// =============== UI-ELEMENTER =====================
const overlay = document.getElementById('overlay');
const btnStart = document.getElementById('btnStart');
const scoreEl = document.getElementById('score');
const endCard = document.getElementById('endCard');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreText = document.getElementById('finalScoreText');

console.log('script.js loaded');

// =============== SPILLTILSTAND ====================

const player = {
  x: Math.floor(W * 0.32), 
  y: groundLevel - (19 * 2),   // start rett på "vannet"
  w: 55 * 2,
  h: 19 * 2,
  dy: 0,
  gravity: 0.8,    // litt tyngre tyngdekraft
  jumpForce: 13,   // kraftigere hopp -> lettere å komme over tømmerstokk
  grounded: true,
  frameIndex: 0,
  animationSpeed: 300,     // ms per frame
  animationTimer: 0
};

let obstacles = [];        // hver: {type:'log'|'seagull', x,y,w,h,speed,image,...}
let spawnTimer = 0;
let score = 0;

let running = false;
let gameIsOver = false;

// Litt høyere startfart
let gameSpeed = 2.2;               // tidligere 1
const speedIncreaseRate = 0.00005; // fartsøkning per ms

let startTid = 0;                // for tidtaking til highscore
let last = 0;                    // for dt-beregning i loop

// =============== INPUT ============================

window.addEventListener('keydown', (e) => {
  // Hopp
  if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
    e.preventDefault();
    tryJump();
  }

  // Restart når game over
  if (gameIsOver && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
    e.preventDefault();
    start();
  }
});

// Klikk for hopp 
canvas.addEventListener('click', () => {
  tryJump();
});

// Start/restart via knapper
btnStart?.addEventListener('click', start);
restartBtn?.addEventListener('click', start);

// =============== START / SLUTT ====================

function start() {
  score = 0;
  obstacles = [];
  spawnTimer = 0;
  gameIsOver = false;
  running = true;
  gameSpeed = 2.2;   // reset startfart
  startTid = Date.now();

  // UI
  overlay.classList.add('hidden');
  endCard.classList.remove('show');
  endCard.classList.add('hidden');
  scoreEl.textContent = '0';

  // Spiller til startposisjon
  player.x = Math.floor(W * 0.25);
  player.y = groundLevel - player.h;
  player.dy = 0;
  player.grounded = true;
  player.frameIndex = 0;
  player.animationTimer = 0;

  last = 0;

  requestAnimationFrame(loop);
}

function end() {
  running = false;
  gameIsOver = true;

  const sluttTid = (Date.now() - startTid) / 1000;

  if (finalScoreText) {
    finalScoreText.textContent = String(score);
  }

  // Vis sluttkort
  endCard.classList.remove('hidden');
  endCard.classList.add('show');
  overlay.classList.remove('hidden');

  // Lagre score i localStorage
  if (saveScoreBtn) {
    saveScoreBtn.onclick = () => {
      const navn = prompt("Skriv inn navnet ditt:");
      if (!navn) return;

      const resultat = { tid: sluttTid, score, navn, ts: Date.now() };
      let bestResults = JSON.parse(localStorage.getItem("bestResults")) || [];
      bestResults.push(resultat);
      // Sorter: høyest score først, deretter lavest tid
      bestResults.sort((a, b) => (b.score - a.score) || (a.tid - b.tid));
      bestResults = bestResults.slice(0, 3);
      localStorage.setItem("bestResults", JSON.stringify(bestResults));

      alert("Resultatet ditt er lagret!");
    };
  }
}

// =============== HOPP / FYSIKK ====================

function tryJump() {
  if (player.grounded) {
    player.dy = -player.jumpForce;
    player.grounded = false;
  }
}

function hit(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}

// =============== HINDERE ==========================

function spawnObstacle() {
  const isSeagull = Math.random() > 0.8;

  if (isSeagull) {
    // Måke høyere enn kajakken
    const y = groundLevel - 110 - Math.random() * 40;
    obstacles.push({
      type: 'seagull',
      x: W + 10,
      y,
      w: 50,
      h: 50,
      speed: 6,             // litt raskere enn tømmerstokk
      image: obstacleImages[1],
      frameIndex: 0,
      frameTimer: 0,
      reversing: false,
      scored: false
    });
  } else {
    // Tømmerstokk på vannet
    const logHeight = 20;
    const y = groundLevel - logHeight + 4; // 4 px ned i "vannet"
    obstacles.push({
      type: 'log',
      x: W + 10,
      y,
      w: 55,   // litt kortere enn før
      h: logHeight,
      speed: 5,
      image: obstacleImages[0],
      scored: false
    });
  }
}

// =============== GAME LOOP ========================

function loop(now) {
  if (!running) return;

  if (!last) last = now;
  const dt = Math.min(33, now - last); // ms
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// =============== UPDATE ===========================

function update(dt) {
  // Spillerfysikk
  player.dy += player.gravity;
  player.y += player.dy;

  // Gulv: bottom av kajakken skal være på groundLevel
  if (player.y + player.h > groundLevel) {
    player.y = groundLevel - player.h;
    player.dy = 0;
    player.grounded = true;
  }

  // Maks hopphøyde 
  const minY = H * 0.25;
  if (player.y < minY) {
    player.y = minY;
    if (player.dy < 0) player.dy = 0;
  }

  // Spiller-animasjon
  player.animationTimer += dt;
  if (player.animationTimer >= player.animationSpeed) {
    player.animationTimer = 0;
    player.frameIndex = (player.frameIndex + 1) % playerImages.length;
  }

  // Spawn hindre
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();

    // Vanskelighetskurve – kortere tid mellom hindre med høyere score
    if (score >= 500) {
      spawnTimer = 100 + Math.random() * 500;
    } else if (score >= 300) {
      spawnTimer = 300 + Math.random() * 600;
    } else if (score >= 200) {
      spawnTimer = 500 + Math.random() * 700;
    } else if (score >= 100) {
      spawnTimer = 800 + Math.random() * 800;
    } else if (score >= 50) {
      spawnTimer = 1000 + Math.random() * 1000;
    } else {
      spawnTimer = 1500 + Math.random() * 1000;
    }
  }

  // Hindre
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];

    o.x -= o.speed * gameSpeed;

    // Seagull-animasjon
    if (o.type === 'seagull') {
      o.frameTimer += dt;
      if (o.frameTimer >= seagullConfig.frameTime) {
        o.frameTimer = 0;
        if (!o.reversing) {
          o.frameIndex++;
          if (o.frameIndex >= seagullConfig.totalFrames - 1) {
            o.reversing = true;
          }
        } else {
          o.frameIndex--;
          if (o.frameIndex <= 0) {
            o.reversing = false;
          }
        }
      }
    }

    // Score når man passerer hinder
    if (!o.scored && o.x + o.w < player.x) {
      o.scored = true;
      score += 5;
      scoreEl.textContent = String(score);
    }

    // Fjern hvis utenfor skjerm
    if (o.x + o.w < -10) {
      obstacles.splice(i, 1);
      continue;
    }

    // Kollisjon – LITT snillere hitbox for kajakk
    const hitboxPaddingX = 8;
    const hitboxPaddingY = 4;
    const px = player.x + hitboxPaddingX;
    const py = player.y + hitboxPaddingY;
    const pw = player.w - hitboxPaddingX * 2;
    const ph = player.h - hitboxPaddingY * 2;

    if (hit(px, py, pw, ph, o.x, o.y, o.w, o.h)) {
      end();
      return;
    }
  }

  // Øk vanskelighet
  gameSpeed += speedIncreaseRate * dt;
}

// =============== DRAW =============================

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Bakgrunn – STÅR STILLE
  // Hvis bakgrunnsbilde har samme størrelse som canvas:
  // ctx.drawImage(background, 0, 0, W, H);
  ctx.drawImage(
    background,
    0,
    H - backgroundHeight,
    backgroundWidth,
    backgroundHeight
  );

  // Hindre
  obstacles.forEach(o => {
    if (o.type === 'seagull') {
      const frame = o.frameIndex;
      const col = frame % seagullConfig.framesPerRow;
      const row = Math.floor(frame / seagullConfig.framesPerRow);
      const sx = col * seagullConfig.frameWidth;
      const sy = row * seagullConfig.frameHeight;

      ctx.drawImage(
        o.image,
        sx, sy,
        seagullConfig.frameWidth, seagullConfig.frameHeight,
        o.x, o.y,
        o.w, o.h
      );
    } else {
      // Tømmerstokk
      ctx.drawImage(o.image, o.x, o.y, o.w, o.h);
    }
  });

  // Spiller (kajakk)
  const currentPlayerImage = playerImages[player.frameIndex];
  ctx.drawImage(currentPlayerImage, player.x, player.y, player.w, player.h);
}
