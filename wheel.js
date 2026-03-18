/* =========================================
   WHEEL.JS — Fortune Wheel Logic
   25 segments: 1–24 + "Бас кандидат"
   ========================================= */

(function () {
  "use strict";

  // ─── Segments definition ──────────────────────────────────────────────────
  const TOTAL = 25;

  // Color palettes for segments (cycling through beautiful dark hues)
  const PALETTES = [
    { bg: "#1e1b4b", text: "#a5b4fc" },  // indigo
    { bg: "#0f172a", text: "#7dd3fc" },  // dark-blue
    { bg: "#1a1a2e", text: "#c4b5fd" },  // deep-purple
    { bg: "#0b1120", text: "#67e8f9" },  // navy-cyan
    { bg: "#18181b", text: "#f9a8d4" },  // dark-pink
    { bg: "#1c1917", text: "#fcd34d" },  // dark-amber
    { bg: "#022c22", text: "#6ee7b7" },  // dark-emerald
    { bg: "#1e0a0a", text: "#fca5a5" },  // dark-red
  ];

  const segments = [];
  for (let i = 1; i <= 24; i++) {
    segments.push({
      label: String(i),
      isSpecial: false,
      palette: PALETTES[i % PALETTES.length],
    });
  }
  // 25th segment — special "Бас кандидат"
  segments.push({
    label: "Бас\nкандидат",
    isSpecial: true,
    palette: { bg: "#7c2d12", text: "#fef08a" }, // rich amber-gold
  });

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const canvas    = document.getElementById("wheelCanvas");
  const ctx       = canvas.getContext("2d");
  const spinBtn   = document.getElementById("spinBtn");
  const resultCard  = document.getElementById("resultCard");
  const resultValue = document.getElementById("resultValue");
  const resultIcon  = document.getElementById("resultIcon");
  const againBtn  = document.getElementById("againBtn");
  const particlesEl = document.getElementById("particles");

  const introScreen = document.getElementById("introScreen");
  const startBtn = document.getElementById("startBtn");
  const firstNameInput = document.getElementById("firstNameInput");
  const lastNameInput = document.getElementById("lastNameInput");
  const resultUserName = document.getElementById("resultUserName");

  // ─── Intro Logic ──────────────────────────────────────────────────────────
  startBtn.addEventListener("click", () => {
    const fn = firstNameInput.value.trim();
    const ln = lastNameInput.value.trim();
    if (fn && ln) {
      localStorage.setItem("userFirstName", fn);
      localStorage.setItem("userLastName", ln);
      introScreen.style.display = "none";
    } else {
      alert("Өтінеміз, атыңыз бен тегіңізді толық енгізіңіз. (Пожалуйста, введите имя и фамилию).");
    }
  });

  if (localStorage.getItem("userFirstName") && localStorage.getItem("userLastName")) {
    introScreen.style.display = "none";
  }

  // ─── State ────────────────────────────────────────────────────────────────
  const SLICE = (2 * Math.PI) / TOTAL;   // radians per segment
  let   rotation   = 0;                  // current total rotation (radians)
  let   isSpinning = false;

  // ─── Drawing helpers ──────────────────────────────────────────────────────
  function getWheelRadius() {
    return canvas.width / 2;
  }

  function drawWheel(rot) {
    const R  = getWheelRadius();
    const cx = R;
    const cy = R;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < TOTAL; i++) {
      const startAngle = rot + i * SLICE;
      const endAngle   = startAngle + SLICE;
      const seg        = segments[i];
      const midAngle   = startAngle + SLICE / 2;

      // ── Slice fill ──
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R - 2, startAngle, endAngle);
      ctx.closePath();

      if (seg.isSpecial) {
        // Radial gradient for special segment
        const grd = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R - 2);
        grd.addColorStop(0, "#b45309");
        grd.addColorStop(0.5, "#92400e");
        grd.addColorStop(1, "#78350f");
        ctx.fillStyle = grd;
      } else {
        ctx.fillStyle = seg.palette.bg;
      }
      ctx.fill();

      // ── Slice border ──
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Text ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);

      const textX = R * 0.62;  // distance from center along mid-angle

      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";

      if (seg.isSpecial) {
        // Two-line label for "Бас\nкандидат"
        const lines = seg.label.split("\n");
        ctx.font = `bold ${calcFontSize(R, 0.055)}px 'Montserrat', sans-serif`;
        ctx.fillStyle = seg.palette.text;
        ctx.shadowColor = "rgba(254,240,138,0.6)";
        ctx.shadowBlur  = 8;
        const lineH = calcFontSize(R, 0.065);
        ctx.fillText(lines[0], textX, -lineH * 0.55);
        ctx.fillText(lines[1], textX,  lineH * 0.55);
        ctx.shadowBlur = 0;
      } else {
        ctx.font = `bold ${calcFontSize(R, 0.068)}px 'Montserrat', sans-serif`;
        ctx.fillStyle = seg.palette.text;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur  = 4;
        ctx.fillText(seg.label, textX, 0);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    // ── Outer decorative ring ──
    ctx.beginPath();
    ctx.arc(cx, cy, R - 2, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // ── Inner metallic circle border ──
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.14, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f0f24";
    ctx.fill();
    ctx.strokeStyle = "rgba(251,191,36,0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function calcFontSize(R, ratio) {
    return Math.max(10, Math.floor(R * ratio));
  }

  // ─── Spin logic ───────────────────────────────────────────────────────────
  function spin() {
    if (isSpinning) return;
    
    // Prevent spinning if already spun
    if (localStorage.getItem("hasSpun") === "true") {
      alert("Кешіріңіз, сіз дөңгелекті бір рет қана айналдыра аласыз!");
      return;
    }
    
    isSpinning = true;
    localStorage.setItem("hasSpun", "true"); // Prevent future spins

    hideResult();
    spinBtn.classList.add("disabled");

    // Always force landing on "Бас кандидат" (index 24)
    // Massive initial speed so the 15+ seconds spin doesn't look dead early
    const extraSpins = (25 + Math.floor(Math.random() * 10)) * 2 * Math.PI;
    const targetIndex = 24; 
    
    // "Еле-еле" (barely) logic:
    // The pointer enters segment 24 at angle (targetIndex + 1) * SLICE traversing counter-clockwise.
    // We calculate the rotation so the pointer lands exactly at the entrance boundary.
    const entranceRotation = (3 * Math.PI / 2) - ((targetIndex + 1) * SLICE);
    // Add a tiny offset (3% to 8% of a slice) so it ticks just over the line and stops immediately
    const barelyOffset = SLICE * (0.03 + Math.random() * 0.05);
    const requiredRotation = entranceRotation + barelyOffset;
    
    let angleToTarget = (requiredRotation - rotation) % (2 * Math.PI);
    if (angleToTarget < 0) {
      angleToTarget += 2 * Math.PI;
    }
    
    const totalDelta = extraSpins + angleToTarget;

    // Hyper prolonged duration (15–18 seconds) for ultimate suspense
    const duration = 15000 + Math.random() * 3000;
    const startTime = performance.now();
    const startRot  = rotation;

    function easeOut(t) {
      // Octic ease-out (power 8) ensures it's painfully slow for the last several seconds
      return 1 - Math.pow(1 - t, 8);
    }

    function frame(now) {
      const elapsed = now - startTime;
      const t       = Math.min(elapsed / duration, 1);
      const eased   = easeOut(t);

      rotation = startRot + totalDelta * eased;
      drawWheel(rotation);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        rotation = startRot + totalDelta;
        drawWheel(rotation);
        isSpinning = false;
        // Intentionally NOT removing 'disabled' from spinBtn so it stays inactive
        showResult();
      }
    }

    requestAnimationFrame(frame);
  }

  // ─── Result detection ─────────────────────────────────────────────────────
  function getWinningSegment() {
    // Pointer sits at top (−π/2 = 270°).
    // Normalize rotation so we find which segment is at the top.
    const normalised = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    // The "top" pointer corresponds to angle 0 in our local system,
    // but we started arc from rotation itself, so the segment at the
    // pointer tip is the one whose mid-angle is closest to −π/2 (top).
    const pointerAngle = (3 * Math.PI / 2); // 270° = top in canvas coords

    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < TOTAL; i++) {
      const midAngle = rotation + i * SLICE + SLICE / 2;
      const norm = ((midAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const diff = Math.abs(norm - pointerAngle);
      const diffAlt = 2 * Math.PI - diff;
      const minDiff = Math.min(diff, diffAlt);
      if (minDiff < bestDiff) {
        bestDiff = minDiff;
        bestIdx = i;
      }
    }
    return segments[bestIdx];
  }

  function showResult(skipConfetti = false) {
    const seg = getWinningSegment();
    const label = seg.label.replace("\n", " ");

    const fn = localStorage.getItem("userFirstName") || "";
    const ln = localStorage.getItem("userLastName") || "";
    if (fn || ln) {
      resultUserName.textContent = fn + " " + ln;
    }

    resultValue.textContent = label;
    resultIcon.textContent  = seg.isSpecial ? "🏆" : "🎉";
    againBtn.style.display = "none"; // Hide 'spin again' button forever
    resultCard.classList.add("visible");

    if (!skipConfetti) {
      launchConfetti(seg.isSpecial ? 120 : 60);
    }
  }

  function hideResult() {
    resultCard.classList.remove("visible");
  }

  // ─── Confetti ─────────────────────────────────────────────────────────────
  function launchConfetti(count) {
    let wrap = document.querySelector(".confetti-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "confetti-wrap";
      document.body.appendChild(wrap);
    }
    wrap.innerHTML = "";

    const colors = ["#c084fc","#38bdf8","#f472b6","#fbbf24","#34d399","#f87171","#a5f3fc"];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "conf";
      const x = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const dur   = 2 + Math.random() * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size  = 6 + Math.random() * 10;
      el.style.cssText = `
        left: ${x}%;
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${dur}s;
        animation-delay: ${delay}s;
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      `;
      wrap.appendChild(el);
    }

    setTimeout(() => { wrap.innerHTML = ""; }, 5000);
  }

  // ─── Background particles ─────────────────────────────────────────────────
  function createParticles() {
    const colors = ["#c084fc","#38bdf8","#f472b6"];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      const size  = 3 + Math.random() * 6;
      const x     = Math.random() * 100;
      const dur   = 8 + Math.random() * 14;
      const delay = Math.random() * 12;
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `
        left: ${x}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        animation-duration: ${dur}s;
        animation-delay: ${delay}s;
        box-shadow: 0 0 ${size * 2}px ${color};
      `;
      particlesEl.appendChild(p);
    }
  }

  // ─── Events ───────────────────────────────────────────────────────────────
  spinBtn.addEventListener("click", spin);
  againBtn.addEventListener("click", () => {
    hideResult();
    setTimeout(spin, 300);
  });

  // Resize handler — keep canvas square
  function resizeCanvas() {
    const parent = canvas.parentElement;
    const size   = Math.min(560, parent.offsetWidth);
    canvas.width  = size;
    canvas.height = size;
    drawWheel(rotation);
  }

  window.addEventListener("resize", resizeCanvas);

  // ─── Init ─────────────────────────────────────────────────────────────────
  createParticles();
  resizeCanvas();

  if (localStorage.getItem("hasSpun") === "true") {
    spinBtn.classList.add("disabled");
    
    // Set rotation purely to the winning segment
    const targetIndex = 24; 
    const requiredRotation = (3 * Math.PI / 2) - (targetIndex * SLICE + SLICE / 2);
    rotation = requiredRotation;
    drawWheel(rotation);
    
    // Show the result immediately (skip confetti on reload)
    showResult(true);
  }

})();
