// Canvas og ctx
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Last inn bakgrunn og hinder
const background = new Image();
background.src = './Images/Nidelven_background.png';

// Seagull spritesheet config
const seagullConfig = {
    frameWidth: 50,      // Bredde på en frame
    frameHeight: 50,     // Høyde på en frame
    framesPerRow: 3,     // 3 frames across
    totalFrames: 6,      // 6 totale frames, 2 rader
    animationSpeed: 4    // Antall frames mellom hver animasjonsoppdatering
};

const obstacleImages = [
    new Image(),
    new Image()
];
obstacleImages[0].src = './Images/Log.png';
obstacleImages[1].src = './Images/Seagull.png';


// Bilder av spillerkarakteren
const playerImages = [
    new Image(),
    new Image()
];
playerImages[0].src = './Images/Kayak.png';
playerImages[1].src = './Images/Kayak2.png';

let backgroundStart = 0;
const backgroundWidth = 800;
const backgroundHeight = 400;

// Spiller og hinder
const player = {
    x: 50,
    y: canvas.height - 70,
    width: 55 * 2,
    height: 19 * 2, 
    dy: 0,
    gravity: 0.6,
    jumpForce: 12,
    grounded: false,
    frameIndex: 0,
    animationSpeed: 30,  
    animationCounter: 0  
};

let obstacles = [];
let frameCount = 0;
let gameSpeed = 6;
let isGameOver = false;
let score = 0; 
const scoreEl = document.getElementById('score');

btnStart.addEventListener('click', start); // Start spill
restartBtn?.addEventListener('click', () => start()); // Restart knapp

// --- Start spill
function start() {
  score = 0;
  obstacles.length = 0;
  spawnTimer = 0;
  gameIsOver = false;
  running = true;
  gameSpeed = 6;
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




// Sjekk at bildene laster inn riktig før spillet starter. Akkurat nå: imagesLoaded = 1 + 4 + 2 = 7
let imagesLoaded = 0;
const startGameIfReady = () => {
    imagesLoaded++;
    if (imagesLoaded === 5) {
        update();
    }
};

background.onload = startGameIfReady;
playerImages.forEach(img => img.onload = startGameIfReady);
obstacleImages.forEach(img => img.onload = startGameIfReady);


// Brukerinput fra tastatur
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        jump();
    }
});

document.addEventListener('click', () => {
    jump();
});

// Hopping
function jump() {
    if (player.grounded) {
        player.dy = -player.jumpForce;
        player.grounded = false;
    }
}

// Update-funksjon med gameplay
function update() {
    if (isGameOver) {
        score = calculateScore();
        scoreEl.textContent = score.toString();
        displayGameOver();
        return;
    }

    frameCount++;

     // Oppdater score
    score = calculateScore();
    scoreEl.textContent = score.toString();

    // Tyngdekraft
    player.dy += player.gravity;
    player.y += player.dy;

    // Kontakt med bakken
    const groundLevel = canvas.height * (4 / 5); // 1/3 up from bottom

    if (player.y + player.height >= groundLevel) {
        player.y = groundLevel - player.height;
        player.dy = 0;
        player.grounded = true;
    }

    // Spilleranimasjon
    player.animationCounter++;
    if (player.animationCounter >= player.animationSpeed) {
        player.animationCounter = 0;
        player.frameIndex = (player.frameIndex + 1) % playerImages.length;
    }

    // Hinder i tilfeldig rekkefølge
    if (frameCount % 90 === 0) {
        const isSeagull = Math.random() > 0.5;
        const randomImage = isSeagull ? obstacleImages[1] : obstacleImages[0];
        
        const obstacleY = canvas.height * (4 / 5) - (isSeagull ? 100 : 20); // Seagulls fly higher than logs

        if (isSeagull) {
            obstacles.push({
                x: canvas.width,
                y: obstacleY,
                width: 50,
                height: 50,
                image: randomImage,
                isSeagull: true,
                frameIndex: 0,
                animationCounter: 0,
                isReversing: false
            });
        
            
        } else {
            obstacles.push({
                x: canvas.width,
                y: obstacleY,
                width: 60,
                height: 20,
                image: randomImage,
                isSeagull: false,
                frameIndex: 0,
                animationCounter: 0
            });
        }
    }

    // Beveg på hinder og kollisjon
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;
        
        // Oppdatering av seagull animasjon
        if (obstacle.isSeagull) {
            obstacle.animationCounter++;
            if (obstacle.animationCounter >= seagullConfig.animationSpeed) {
                obstacle.animationCounter = 0;
                
                // Boomerang animasjon: Frem så tilbake
                if (!obstacle.isReversing) {
                    obstacle.frameIndex++;
                    if (obstacle.frameIndex >= seagullConfig.totalFrames - 1) {
                        obstacle.isReversing = true;
                    }
                } else {
                    obstacle.frameIndex--;
                    if (obstacle.frameIndex <= 0) {
                        obstacle.isReversing = false;
                    }
                }
            }
        }
        
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
        if (collision(player, obstacle)) {
            isGameOver = true;
        }
    });

    draw();
    requestAnimationFrame(update);
}

// Tegnefunksjon
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Tegning av bakgrunn
    ctx.drawImage(background, backgroundStart, canvas.height - backgroundHeight, backgroundWidth, backgroundHeight);
	ctx.drawImage(background, backgroundStart + backgroundWidth, canvas.height - backgroundHeight, backgroundWidth, backgroundHeight);


    // Tegning av spilleranimasjon
    const currentPlayerImage = playerImages[player.frameIndex];
    const scaledWidth = 55 * 2;  
    const scaledHeight = 19 * 2;
    ctx.drawImage(currentPlayerImage, player.x, player.y, scaledWidth, scaledHeight);

    // Tegning av hinder
    obstacles.forEach((obstacle) => {
        if (obstacle.isSeagull) {
            // Draw seagull spritesheet
            const col = obstacle.frameIndex % seagullConfig.framesPerRow;
            const row = Math.floor(obstacle.frameIndex / seagullConfig.framesPerRow);
            
            const srcX = col * seagullConfig.frameWidth;
            const srcY = row * seagullConfig.frameHeight;
            
            ctx.drawImage(
                obstacle.image,
                srcX, srcY,
                seagullConfig.frameWidth, seagullConfig.frameHeight,
                obstacle.x, obstacle.y,
                obstacle.width, obstacle.height
            );
        } else {
            // Draw log
            ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });
}

// Kollisjon med hinder
function collision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

let startTid;

function calculateScore() {
    const elapsed = (Date.now() - startTid) / 1000;
    return Math.floor(elapsed);
}

// Game Over-skjerm
function displayGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Din Score: ' + score, canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText('Trykk spill for å spille igjen', canvas.width / 2, canvas.height / 2 + 40);
}

// Nullstill spillet
viseCanvasKnapp.addEventListener('click', () => {
    if (isGameOver) {
        start();  // <-- BRUK start() I STEDET FOR resetGame()
    }

    startScore();
    update();
});