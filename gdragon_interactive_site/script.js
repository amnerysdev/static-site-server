(() => {
  const stage = document.getElementById("experience");
  const lens = document.getElementById("lens");
  const handle = document.getElementById("lensHandle");
  const reset = document.getElementById("resetButton");
  const music = document.getElementById("siteMusic");
  const musicButton = document.getElementById("musicButton");
  const xRead = document.getElementById("xValue");
  const yRead = document.getElementById("yValue");
  const modeNumber = document.getElementById("modeNumber");
  const modeName = document.getElementById("modeName");
  const modeReadout = document.getElementById("modeReadout");
  const background = document.querySelector(".background-base");
  const ghost = document.querySelector(".background-ghost");
  const tint = document.querySelector(".background-tint");
  const under = document.querySelector(".lens-image-under");
  const over = document.querySelector(".lens-image-over");

  const modes = [
    { name: "MONOCHROME", under: "grayscale(1) contrast(1.8) brightness(1.06)", over: "sepia(1) saturate(4) hue-rotate(285deg) contrast(1.6)", blend: "screen", tint: .28 },
    { name: "RED SHIFT", under: "grayscale(1) contrast(2.2) brightness(.95)", over: "sepia(1) saturate(7) hue-rotate(305deg) contrast(1.4)", blend: "screen", tint: .42 },
    { name: "NEGATIVE", under: "invert(1) grayscale(1) contrast(1.4)", over: "invert(1) sepia(1) saturate(3) hue-rotate(290deg)", blend: "lighten", tint: .2 },
    { name: "X-RAY", under: "grayscale(1) contrast(2.7) brightness(1.45)", over: "hue-rotate(125deg) saturate(2.8) contrast(1.5)", blend: "screen", tint: .35 },
    { name: "DUOTONE", under: "grayscale(1) contrast(1.5) sepia(.3)", over: "sepia(1) saturate(8) hue-rotate(260deg) contrast(1.6)", blend: "color-dodge", tint: .48 }
  ];
  let x = 68, y = 22, dragging = false, startX = 0, startY = 0, originX = x, originY = y;
  let mode = 0;

  function setMusicButton(isPlaying) {
    musicButton.setAttribute("aria-pressed", String(isPlaying));
    musicButton.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
    musicButton.querySelector("span").textContent = isPlaying ? "MUSIC ON" : "PLAY MUSIC";
    musicButton.classList.toggle("is-playing", isPlaying);
  }
  musicButton.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        setMusicButton(true);
      } catch (_) {
        setMusicButton(false);
      }
    } else {
      music.pause();
      setMusicButton(false);
    }
  });
  music.addEventListener("play", () => setMusicButton(true));
  music.addEventListener("pause", () => setMusicButton(false));
  // Try to start on entry. Browsers may block audible autoplay until the visitor interacts.
  music.play().then(() => setMusicButton(true)).catch(() => setMusicButton(false));

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function applyMode(next) {
    mode = (next + modes.length) % modes.length;
    const m = modes[mode];
    under.style.filter = m.under;
    over.style.filter = m.over;
    over.style.mixBlendMode = m.blend;
    tint.style.opacity = m.tint;
    modeNumber.textContent = String(mode + 1).padStart(2, "0");
    modeName.textContent = m.name;
    modeReadout.textContent = `MODE ${String(mode + 1).padStart(2, "0")} / 05`;
  }
  function update() {
    lens.style.setProperty("--lens-x", `${x}%`);
    lens.style.setProperty("--lens-y", `${y}%`);
    xRead.textContent = `X ${Math.round(x)}`;
    yRead.textContent = `Y ${Math.round(y)}`;
    const px = clamp(x, 0, 100), py = clamp(y, 0, 100);
    const bgX = `${clamp(100 - px * .65, 0, 100)}%`;
    const bgY = `${clamp(20 + py * .9, 0, 100)}%`;
    under.style.backgroundPosition = `${bgX} ${bgY}`;
    over.style.backgroundPosition = `${clamp(px * .8, 0, 100)}% ${clamp(100 - py * .6, 0, 100)}%`;
    stage.style.setProperty("--bg-x", `${clamp(50 + (x - 50) * .13, 42, 58)}%`);
    stage.style.setProperty("--bg-y", `${clamp(45 + (y - 45) * .15, 38, 54)}%`);
    stage.style.setProperty("--hue", `${(x - 68) * .65 + (mode * 9)}deg`);
    background.style.transform = `scale(1.035) translate(${(x - 50) * -.025}px, ${(y - 50) * -.02}px)`;
    ghost.style.opacity = String(.10 + Math.abs(x - 50) / 260);
    over.style.clipPath = `polygon(0 0,100% 0,100% ${clamp(20 + x * .55, 20, 90)}%,0 ${clamp(20 + y * 1.2, 20, 90)}%)`;
  }
  function down(e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; startX = e.clientX; startY = e.clientY; originX = x; originY = y;
    lens.classList.add("is-dragging");
    try { lens.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  }
  function move(e) {
    if (!dragging) return;
    const r = stage.getBoundingClientRect(), box = lens.getBoundingClientRect();
    const dx = (e.clientX - startX) / r.width * 100;
    const dy = (e.clientY - startY) / r.height * 100;
    const halfW = box.width / r.width * 50, halfH = box.height / r.height * 50;
    const oldMode = mode;
    x = clamp(originX + dx, halfW + 1, 99 - halfW);
    y = clamp(originY + dy, 2, Math.max(3, 98 - halfH));
    // Crossing horizontal zones selects a different image treatment.
    const zone = clamp(Math.floor(x / 20), 0, 4);
    if (zone !== oldMode && Math.abs(dx) > 2) applyMode(zone);
    update();
  }
  function up() { dragging = false; lens.classList.remove("is-dragging"); }
  lens.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);

  handle.addEventListener("keydown", e => {
    const step = e.shiftKey ? 5 : 1;
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","PageUp","PageDown"].includes(e.key)) return;
    e.preventDefault();
    if (e.key === "ArrowLeft") x -= step;
    if (e.key === "ArrowRight") x += step;
    if (e.key === "ArrowUp") y -= step;
    if (e.key === "ArrowDown") y += step;
    if (e.key === "PageUp") applyMode(mode - 1);
    if (e.key === "PageDown") applyMode(mode + 1);
    if (e.key === "Home") { x = 68; y = 22; applyMode(0); }
    const r = stage.getBoundingClientRect(), b = lens.getBoundingClientRect();
    x = clamp(x, b.width / r.width * 50 + 1, 99 - b.width / r.width * 50);
    y = clamp(y, 2, 98 - b.height / r.height * 50);
    update();
  });
  reset.addEventListener("click", () => { x = 68; y = 22; applyMode(0); update(); });
  stage.addEventListener("pointermove", e => {
    if (dragging) return;
    const r = stage.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5;
    const py = (e.clientY - r.top) / r.height - .5;
    stage.style.setProperty("--bg-x", `${50 + px * 3}%`);
    stage.style.setProperty("--bg-y", `${45 + py * 3}%`);
  });
  applyMode(0);
  update();
})();
