/* Forno — interactions : reveals au scroll + cuisson de la pizza */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveals ---------- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- cuisson de la pizza ---------- */
  var range = document.getElementById("bakeRange");
  var btn = document.getElementById("bakeBtn");
  if (!range) return;

  var charRing = document.getElementById("charRing");
  var cheeseChar = document.getElementById("cheeseChar");
  var timeEl = document.getElementById("bakeTime");
  var statusEl = document.getElementById("bakeStatus");
  var meter = document.getElementById("meterFill");
  var heat = document.getElementById("heat");
  var pizza = document.getElementById("pizza");
  var SVGNS = "http://www.w3.org/2000/svg";

  // taches de "léopard" sur le bord (cornicione) — réparties, chacune avec un seuil d'apparition
  var spots = [];
  var N = 22;
  for (var i = 0; i < N; i++) {
    var a = (i / N) * Math.PI * 2 + (i % 3) * 0.18;
    var r = 130 + (i % 4) * 2 - 2;
    var cx = 150 + Math.cos(a) * r;
    var cy = 150 + Math.sin(a) * r;
    var sp = document.createElementNS(SVGNS, "ellipse");
    sp.setAttribute("cx", cx.toFixed(1));
    sp.setAttribute("cy", cy.toFixed(1));
    sp.setAttribute("rx", (3 + (i % 3)).toString());
    sp.setAttribute("ry", (2.4 + (i % 2)).toString());
    sp.setAttribute("fill", i % 5 === 0 ? "#3a2416" : "#5a3418");
    sp.setAttribute("transform", "rotate(" + ((a * 180) / Math.PI).toFixed(0) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ")");
    sp.style.opacity = "0";
    sp.style.transition = "opacity .25s";
    charRing.appendChild(sp);
    spots.push({ el: sp, at: 30 + (i / N) * 55 }); // apparaissent entre 30% et 85%
  }
  // taches sur le fromage
  var cheeseSpots = [[122,116],[186,130],[150,180],[196,186],[112,188],[150,110],[168,150]];
  var cSpots = cheeseSpots.map(function (p, idx) {
    var el = document.createElementNS(SVGNS, "circle");
    el.setAttribute("cx", p[0]); el.setAttribute("cy", p[1]);
    el.setAttribute("r", (2 + (idx % 3)).toString());
    el.setAttribute("fill", "#b8763a");
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    cheeseChar.appendChild(el);
    return { el: el, at: 45 + idx * 6 };
  });

  var STATES = [
    [0,  "pâte crue, prête à enfourner"],
    [8,  "elle entre au four…"],
    [28, "le bord commence à gonfler"],
    [52, "la mozzarella fond"],
    [74, "les taches de léopard arrivent"],
    [92, "à point — on la sort !"],
    [100,"servie, encore fumante 🔥"]
  ];

  function setBake(p) {
    p = Math.max(0, Math.min(100, p));
    // temps restant (90 s → 0)
    var t = Math.round(90 * (1 - p / 100));
    timeEl.textContent = t;
    // statut
    var label = STATES[0][1];
    for (var s = 0; s < STATES.length; s++) { if (p >= STATES[s][0]) label = STATES[s][1]; }
    statusEl.textContent = label;
    // jauge
    meter.style.width = p + "%";
    // char du bord
    spots.forEach(function (o) { o.el.style.opacity = p >= o.at ? String(Math.min(1, (p - o.at) / 14 + 0.25)) : "0"; });
    cSpots.forEach(function (o) { o.el.style.opacity = p >= o.at ? "0.9" : "0"; });
    // chaleur
    if (heat) heat.classList.toggle("on", p > 4 && p < 100);
    // le bord se dore légèrement
    var crust = pizza.querySelector(".crust");
    if (crust) {
      var mix = p / 100;
      var rC = Math.round(231 - 70 * mix), gC = Math.round(207 - 90 * mix), bC = Math.round(160 - 70 * mix);
      crust.setAttribute("fill", "rgb(" + rC + "," + gC + "," + bC + ")");
    }
    // petit "pop" quand c'est servi
    if (pizza) pizza.style.transform = p >= 100 ? "scale(1.03)" : "scale(1)";
  }

  range.addEventListener("input", function () { stopAuto(); setBake(+range.value); });

  var raf = null;
  function stopAuto() { if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = "Enfourner ▸"; } }
  function auto() {
    stopAuto();
    if (reduce) { range.value = 100; setBake(100); return; }
    btn.textContent = "Cuisson…";
    var start = null, DUR = 4200;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(100, ((ts - start) / DUR) * 100);
      range.value = Math.round(p);
      setBake(p);
      if (p < 100) { raf = requestAnimationFrame(step); }
      else { raf = null; btn.textContent = "Réenfourner ↻"; }
    }
    raf = requestAnimationFrame(step);
  }
  btn.addEventListener("click", auto);

  setBake(0);
})();
