const canvas = document.getElementById("gamescreen");
const ctx = canvas.getContext("2d");

const spiller = {
    X : 100,
    y: 300,
    width: 40,
    height: 40,
    color: "blue",
    vy: 0,
    gravity: 1,
    jumpPower: - 14,
    isOnGround: true,
};

    let obstacles = [];
    let obstacleSpeed = 5;
    let gameOver = false;
    let frameCount = 0;

    function drawPlayer() {
      ctx.fillStyle = spiller.color;
      ctx.fillRect(spiller.x, spiller.y, spiller.width, spiller.height);
    }

    function drawObstacles() {
      ctx.fillStyle = "green";
      obstacles.forEach((obs) => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });
    }

    function updateObstacles() {
      obstacles.forEach((obs) => (obs.x -= obstacleSpeed));
      obstacles = obstacles.filter((obs) => obs.x + obs.width > 0);

      // Legg til nye hindre
      if (frameCount % 100 === 0) {
        obstacles.push({
          x: canvas.width,
          y: 360,
          width: 30,
          height: 40,
        });
      }
    }

    function detectCollision() {
      for (let obs of obstacles) {
        if (
          spiller.x < obs.x + obs.width &&
          spiller.x + spiller.width > obs.x &&
          spiller.y < obs.y + obs.height &&
          spiller.y + spiller.height > obs.y
        ) {
          return true;
        }
      }
      return false;
    }

    function spillet() {
      if (gameOver) return;

      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawPlayer();
      updateObstacles();
      drawObstacles();

      if (detectCollision()) {
        document.getElementById("gameOver").style.display = "block";
        gameOver = true;
        return;
      }

      // Øk farten sakte over tid
      if (frameCount % 500 === 0) {
        obstacleSpeed += 0.5;
      }

      requestAnimationFrame(spillet);
    }

    // Kontroller
    document.addEventListener("keydown", (e) => {
      if (gameOver) return;
      if (e.key === "ArrowUp" && spiller.y > 0) {
        player.y -= player.speed * 2;
      }
      if (e.key === "ArrowDown" && spiller.y + spiller.height < canvas.height) {
        spiller.y += spiller.speed * 2;
      }
    });

    spillet (); 