window.onload = winInit;

function winInit() { 
  // funksjoner for meny knapper
  document.getElementById('viseCanvas').onclick = viseCanvas;
  document.getElementById('hvordan-knapp').onclick = hvordanSpille;
  document.getElementById('highScore').onclick = viseScore;
  document.getElementById('avsluttSpillet').onclick = avslutt;
  
  // for å ikke vise canvas før knappen har blitt trykket på
  const canvasG = document.getElementById('gameCanvas');
  canvasG.style.display = "none";
  const canvasS = document.getElementById('scoreCanvas');
  canvasS.style.display = "none";
	
  // Meny-musikk
  const menuMusic = document.getElementById("menuMusic");
  menuMusic.volume = 0.05;
  menuMusic.play();

  // for å få knappene til å lage lyd
  const button = document.querySelectorAll('.hoverLyd');
  
  button.forEach(button => {
    button.addEventListener('mouseover', () => {
      const sound = document.getElementById('hoverSound');
      sound.play();
    });
  });
}

function displayX(valgtID) {
  const canvasG = document.getElementById("gameCanvas");
  const box = document.getElementById("hvordan-boks");
  const canvasS = document.getElementById("scoreCanvas");
  const tekst = document.getElementById("bartCity");

  // for å gjemme alle elementene
  canvasG.style.display = "none";
  box.style.display = "none";
  canvasS.style.display = "none";
  tekst.style.transform = "none";

  // for å vise det valgte elementet og flytte på overskriften
  const valgtElement = document.getElementById(valgtID);
  if (valgtElement.style.display === "none") {
    valgtElement.style.display = "block";
    tekst.style.transform = "translate(0px, -250px)";
  }

  //lyd for klikk
  const klikk = document.getElementById('klikkSound');
  klikk.play();
}

function drawHighScores() {
  const canvasS = document.getElementById('scoreCanvas');
  const ctx = canvasS.getContext('2d');
  const highScores = getHighScores();

  
  ctx.clearRect(0, 0, canvasS.width, canvasS.height);

 
  ctx.fillStyle = '#fff';
  ctx.font = '36px Arial'; 
  ctx.textAlign = 'center';

  
  ctx.fillText('High Scores', canvasS.width / 2, 100);

  // High Score-liste
  ctx.font = '24px Arial';
  highScores.forEach((score, index) => {
      ctx.fillText(`${index + 1}. ${score}`, canvasS.width / 2, 150 + index * 30);
  });

}

function viseCanvas() {
  displayX("gameCanvas");

  const menuMusic = document.getElementById("menuMusic");
  menuMusic.pause();
}

function hvordanSpille() {
  displayX("hvordan-boks");
}

function viseScore() {
  displayX("scoreCanvas");
  drawHighScores();
}

function avslutt() {
  const canvasG = document.getElementById("gameCanvas");
  const box = document.getElementById("hvordan-boks");
  const canvasS = document.getElementById("scoreCanvas");
  const tekst = document.getElementById("bartCity");

  // gjøm alle elementene og reset hovedskjermen
  canvasG.style.display = "none";
  box.style.display = "none";
  canvasS.style.display = "none";
  tekst.style.transform = "none";

  //lyd for klikk
  const klikk = document.getElementById('klikkSound');
  klikk.play();
}