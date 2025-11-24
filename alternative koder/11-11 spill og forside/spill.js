// Canvas og ctx
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const viseCanvasKnapp = document.getElementById('viseCanvas');

const backgroundMusic = new Audio('lambo_01.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.05;

// Last inn bakgrunn og hinder
const background = new Image();
background.src = 'bakgrunn_natt.png';

const obstacleImages = [
    new Image(),
    new Image()
];
obstacleImages[0].src = 'hinder1.png';
obstacleImages[1].src = 'hinder2.png';

// Bilder av spillerkarakteren
const playerImages = [
    new Image(),
    new Image(),
	new Image(),
    new Image()
];
playerImages[0].src = '1figurframe.png';
playerImages[1].src = '2figurframe.png';
playerImages[2].src = '3figurframe.png';
playerImages[3].src = '4figurframe.png';

let backgroundStart = 0;
const backgroundSpeed = 2;
const backgroundWidth = 2604;
const backgroundHeight = 400;

// Spiller og hinder
const player = {
    x: 50,
    y: canvas.height - 70,
    width: 60,
    height: 60, 
    dy: 0,
    gravity: 0.6,
    jumpForce: 12,
    grounded: false,
    frameIndex: 0,
    animationSpeed: 10,  
    animationCounter: 0  
};

let obstacles = [];
let frameCount = 0;
let gameSpeed = 6;
let isGameOver = false;

// Score og high score
let score = 0;
let scoreInterval;

// Hent highScores fra localStorage eller lag en tom liste
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];


// Funksjon for å oppdatere high score-listen
function updateHighScores(newScore) {
    highScores.push(newScore);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 5); // Behold kun de fem beste score
    localStorage.setItem('highScores', JSON.stringify(highScores)); // Oppdater localStorage
}

// Funksjon for å hente topplisten 
function getHighScores() {
    return JSON.parse(localStorage.getItem('highScores')) || [];
}




// Sjekk at bildene laster inn riktig før spillet starter. Akkurat nå: imagesLoaded = 1 + 4 + 2 = 7
let imagesLoaded = 0;
const startGameIfReady = () => {
    imagesLoaded++;
    if (imagesLoaded === 7) {
        update();
    }
};

background.onload = startGameIfReady;
playerImages.forEach(img => img.onload = startGameIfReady);
obstacleImages.forEach(img => img.onload = startGameIfReady);


// Brukerinput fra tastatur
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
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
        clearInterval(scoreInterval);
        updateHighScores(score);
        displayGameOver();
        return;
    }

    frameCount++;

    // Bevegelig bakgrunn
    backgroundStart -= backgroundSpeed;
    if (backgroundStart <= -backgroundWidth) {
        backgroundStart = 0;
    }

    // Tyngdekraft
    player.dy += player.gravity;
    player.y += player.dy;

    // Kontakt med bakken
    if (player.y + player.height >= canvas.height - 20) { 
        player.y = canvas.height - player.height - 20;
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
        const randomImage = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
        obstacles.push({
            x: canvas.width,
            y: canvas.height - 70,
            width: 60,
            height: 60,
            image: randomImage
        });
    }

    // Beveg på hinder og kollisjon
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;
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
    ctx.drawImage(currentPlayerImage, player.x, player.y, player.width, player.height);

    // Tegning av hinder
    obstacles.forEach((obstacle) => {
        ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Vis score
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 30, 30);
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

function startScore() {
    score = 0;
    scoreInterval = setInterval(() => {
        score++;
    }, 1500);
}

// Last bakgrunnen og start spillet når bildet er klart
background.onload = function () {
    startScore();
    update();
};

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
	
	backgroundMusic.pause();
    backgroundMusic.currentTime = 0;  // Reset to start
}

viseCanvasKnapp.addEventListener('click', () => {
    if (isGameOver) {
        resetGame();
    }
});

// Nullstill spillet
function resetGame() {
    isGameOver = false;
    obstacles = []; 
    score = 0;
    player.y = canvas.height - player.height - 20;
    player.dy = 0;
    player.grounded = true;
	
	backgroundMusic.play();

    startScore();
    update();
}