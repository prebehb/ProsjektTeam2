document.addEventListener("DOMContentLoaded", () => {
  const drawer = document.getElementById("navDrawer");
  if (!drawer) return;

  const collapse = bootstrap.Collapse.getOrCreateInstance(drawer, { toggle: false });

  // Klikk på mørk bakgrunn lukker
  const backdrop = drawer.querySelector(".backdrop");
  if (backdrop) backdrop.addEventListener("click", () => collapse.hide());

  // Klikk på X lukker
  const closeBtn = drawer.querySelector(".close-x");
  if (closeBtn) closeBtn.addEventListener("click", () => collapse.hide());

  // Klikk på en menylenke lukker, men lar navigasjonen gå
  drawer.querySelectorAll(".drawer-links a,[data-close]").forEach(el => {
    el.addEventListener("click", () => collapse.hide());
  });
});
