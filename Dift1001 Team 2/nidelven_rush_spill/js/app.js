document.addEventListener("DOMContentLoaded", () => {
  // === hamburger-meny ===
  const drawer = document.getElementById("navDrawer"); // bootstrap collapse
  if (drawer) {
    const collapse = bootstrap.Collapse.getOrCreateInstance(drawer, { toggle: false }); 
    drawer
      .querySelectorAll("[data-close]")
      .forEach((a) => a.addEventListener("click", () => collapse.hide())); // lukk ved klikk på lenker
  }

  // === inline spill i forsiden ===
  const startBtn  = document.getElementById("startGameBtn");
  const stageBg   = document.querySelector(".stage-bg");
  const gameFrame = document.getElementById("gameFrame");
  const closeBtn  = document.getElementById("closeGameBtn");

  if (!startBtn || !gameFrame) return;

  startBtn.addEventListener("click", (e) => { 
    if (startBtn.dataset.inline === "true") {
      e.preventDefault(); 

      if (stageBg) stageBg.style.display = "none"; // skjul splash
      startBtn.style.display = "none"; // skjul knapp

      // laster spillet
      gameFrame.src = startBtn.getAttribute("href"); 
      gameFrame.hidden = false; // vis iframe

      // vis lukk-knapp ved game over

      if (closeBtn) closeBtn.hidden = false;
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      gameFrame.src = "about:blank"; // tøm iframe
      gameFrame.hidden = true; // skjul iframe
      closeBtn.hidden = true;      // vis splash og knapp igjen

      if (stageBg) stageBg.style.display = ""; // vis splash
      startBtn.style.display = ""; // vis knapp
    });
  }
});
