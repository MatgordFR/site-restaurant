/* ============================================================
   Forno — interactions (vanilla, 0 dépendance)
   Sécurité : aucun innerHTML, aucun eval, aucune requête réseau.
   Tout le DOM est créé via createElement / createElementNS + textContent.
   ============================================================ */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 1. reveals au scroll ---------- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ioR = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ioR.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { ioR.observe(el); });
  }

  /* ---------- 2. nav : condense au scroll + menu mobile ---------- */
  var nav = document.querySelector("[data-nav]");
  if (nav) {
    var ticking = false;
    var applyScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 24); ticking = false; };
    applyScroll();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(applyScroll); }
    }, { passive: true });

    var burger = $("navBurger");
    if (burger) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.querySelectorAll("#navLinks a").forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); });
      });
    }
  }

  /* ---------- 4. étincelles de braise (canvas) ---------- */
  (function embers() {
    var cv = $("embersCanvas");
    if (!cv || reduce) return;
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    var COLORS = ["#FF7A18", "#F0872B", "#D6472F", "#FFB24A"];
    var parts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(18, Math.min(40, Math.round(W / 34)));
      parts = [];
      for (var i = 0; i < count; i++) parts.push(spawn(true));
    }
    function spawn(anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 8,
        r: 0.6 + Math.random() * 1.9,
        vy: 0.25 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.35,
        a: 0.15 + Math.random() * 0.45,
        tw: Math.random() * Math.PI * 2,
        c: COLORS[(Math.random() * COLORS.length) | 0]
      };
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy; p.x += p.vx; p.tw += 0.05;
        if (p.y < -10) { parts[i] = spawn(false); continue; }
        var flick = 0.6 + 0.4 * Math.sin(p.tw);
        ctx.globalAlpha = p.a * flick;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    var raf = null, running = false;
    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, W, H); }

    resize();
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 200); }, { passive: true });

    // ne tourne que si l'onglet est visible ET le hero à l'écran (perf + n'anime plus sous la nav)
    var heroVisible = true, tabVisible = true;
    function sync() { (heroVisible && tabVisible) ? start() : stop(); }
    document.addEventListener("visibilitychange", function () { tabVisible = !document.hidden; sync(); });
    var hero = document.querySelector(".hero");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
    }
    sync();
  })();

  /* ---------- 5. « 72 heures » — la vie de la pâte ---------- */
  (function pate() {
    var rail = $("pateRail");
    if (!rail) return;
    var steps = rail.querySelectorAll(".pate-step");
    var fill = $("pateFill");
    var ball = $("doughBall");
    var body = document.querySelector(".dough-body");
    var bubblesG = $("doughBubbles");
    var flourG = $("doughFlour");
    var hhEl = $("pateHH"), titleEl = $("pateTitle"), descEl = $("pateDesc");
    var hydraEl = $("pateHydra"), tempEl = $("pateTemp"), riseEl = $("pateRise");

    var STAGES = [
      { hh: "0 h · pétrissage", title: "Quatre ingrédients, pas un de plus",
        desc: "Farine type « 00 », eau, sel, levain naturel. On pétrit lentement pour former le réseau de gluten — la pâte devient élastique, presque vivante sous la main.",
        hydra: "62 %", temp: "22 °C", rise: "—", scale: 0.84, fill: "#EDDCBE", bubbles: 0, flour: false },
      { hh: "2 h · pointage", title: "Elle prend l'air",
        desc: "Première levée à température ambiante. Les levures se réveillent, la masse gonfle doucement et commence à sentir bon la fermentation.",
        hydra: "62 %", temp: "22 °C", rise: "× 1,4", scale: 0.93, fill: "#ecd9b6", bubbles: 2, flour: false },
      { hh: "24 h · maturation au froid", title: "Le froid fait le travail",
        desc: "Direction la chambre froide à 4 °C. La fermentation ralentit mais ne s'arrête pas : c'est là que naissent les arômes et la digestibilité.",
        hydra: "63 %", temp: "4 °C", rise: "× 1,8", scale: 1.0, fill: "#ead3a8", bubbles: 4, flour: false },
      { hh: "48 h · façonnage en pâtons", title: "Chacun son pâton",
        desc: "On divise et on boule à la main, 250 g pièce. Un peu de semoule, un geste sec, et chaque pâton repart au repos, bien serré.",
        hydra: "63 %", temp: "6 °C", rise: "× 2,1", scale: 1.06, fill: "#e6cc9d", bubbles: 5, flour: true },
      { hh: "72 h · prête à enfourner", title: "Souple, aérée, prête",
        desc: "Le pâton s'étale à la main en une seconde, sans rouleau. Le bord reste épais pour gonfler au four — le fameux cornicione. Direction 485 °C.",
        hydra: "63 %", temp: "18 °C", rise: "× 2,4", scale: 1.12, fill: "#e2c692", bubbles: 6, flour: true }
    ];

    // pré-créer les bulles (apparaissent avec le temps) + la farine
    var bubbleSpecs = [[104, 112], [138, 118], [116, 132], [128, 100], [96, 126], [146, 130]];
    var bubbleEls = bubbleSpecs.map(function (p, i) {
      var c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]);
      c.setAttribute("r", (2.2 + (i % 3)).toString());
      c.setAttribute("fill", "#c9b083");
      c.style.opacity = "0"; c.style.transition = "opacity .5s";
      bubblesG.appendChild(c);
      return c;
    });
    var flourSpecs = [[92, 100], [150, 106], [110, 96], [134, 140], [100, 138], [156, 122], [120, 90]];
    var flourEls = flourSpecs.map(function (p) {
      var c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]);
      c.setAttribute("r", "1.5"); c.setAttribute("fill", "#fff");
      c.style.opacity = "0"; c.style.transition = "opacity .5s";
      flourG.appendChild(c);
      return c;
    });

    function apply(idx) {
      var s = STAGES[idx];
      hhEl.textContent = s.hh;
      titleEl.textContent = s.title;
      descEl.textContent = s.desc;
      hydraEl.textContent = s.hydra;
      tempEl.textContent = s.temp;
      riseEl.textContent = s.rise;
      if (ball) ball.style.transform = "scale(" + s.scale + ")";
      if (body) body.style.fill = s.fill;
      bubbleEls.forEach(function (el, i) { el.style.opacity = i < s.bubbles ? "0.75" : "0"; });
      flourEls.forEach(function (el) { el.style.opacity = s.flour ? "0.8" : "0"; });
      if (fill) fill.style.width = (idx / (STAGES.length - 1)) * 100 + "%";
      steps.forEach(function (b, i) {
        var on = i === idx;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    steps.forEach(function (b, i) {
      b.addEventListener("click", function () { apply(i); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          var d = e.key === "ArrowRight" ? 1 : -1;
          var next = Math.max(0, Math.min(STAGES.length - 1, i + d));
          apply(next); steps[next].focus();
        }
      });
    });
    apply(0);
  })();

  /* ---------- 6. filtres de la carte ---------- */
  (function carte() {
    var chips = document.querySelectorAll(".carte-filters .chip");
    if (!chips.length) return;
    var items = document.querySelectorAll(".menu .mi");
    var dolci = document.querySelector(".menu-dolci");
    var empty = $("carteEmpty");

    function applyFilter(f) {
      var shown = 0;
      items.forEach(function (it) {
        var cats = (it.getAttribute("data-cat") || "").split(" ");
        var vis = f === "all" || cats.indexOf(f) !== -1;
        it.hidden = !vis;
        if (vis) shown++;
      });
      if (dolci) dolci.hidden = f !== "all";
      if (empty) empty.hidden = shown !== 0;
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); c.setAttribute("aria-pressed", "false"); });
        chip.classList.add("is-active"); chip.setAttribute("aria-pressed", "true");
        applyFilter(chip.getAttribute("data-filter"));
      });
    });
  })();

  /* ---------- 7. le four : cuisson de la pizza ---------- */
  (function four() {
    var range = $("bakeRange");
    var btn = $("bakeBtn");
    if (!range) return;

    var charRing = $("charRing");
    var cheeseChar = $("cheeseChar");
    var sparksG = $("sparks");
    var timeEl = $("bakeTime");
    var statusEl = $("bakeStatus");
    var meter = $("meterFill");
    var heat = $("heat");
    var pizza = $("pizza");
    var stage = document.querySelector(".four-stage");

    // taches de « léopard » sur le bord (cornicione)
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
      charRing.appendChild(sp);
      spots.push({ el: sp, at: 30 + (i / N) * 55 });
    }
    // taches sur le fromage
    var cheeseSpots = [[122, 116], [186, 130], [150, 180], [196, 186], [112, 188], [150, 110], [168, 150]];
    var cSpots = cheeseSpots.map(function (p, idx) {
      var el = document.createElementNS(SVGNS, "circle");
      el.setAttribute("cx", p[0]); el.setAttribute("cy", p[1]);
      el.setAttribute("r", (2 + (idx % 3)).toString());
      el.setAttribute("fill", "#b8763a");
      el.style.opacity = "0";
      cheeseChar.appendChild(el);
      return { el: el, at: 45 + idx * 6 };
    });
    // étincelles émises pendant la cuisson
    if (sparksG) {
      var sparkPos = [[120, 40], [150, 34], [180, 42], [104, 54], [196, 54], [138, 30], [166, 30]];
      sparkPos.forEach(function (p, idx) {
        var c = document.createElementNS(SVGNS, "circle");
        c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]);
        c.setAttribute("r", (1.4 + (idx % 2)).toString());
        c.setAttribute("fill", idx % 2 ? "#FFB24A" : "#FF7A18");
        c.style.animationDelay = (idx * 0.18).toFixed(2) + "s";
        sparksG.appendChild(c);
      });
    }

    var STATES = [
      [0, "pâte crue, prête à enfourner"],
      [8, "elle entre au four…"],
      [28, "le bord commence à gonfler"],
      [52, "la mozzarella fond"],
      [74, "les taches de léopard arrivent"],
      [92, "à point — on la sort !"],
      [100, "servie, encore fumante 🔥"]
    ];

    function setBake(p) {
      p = Math.max(0, Math.min(100, p));
      timeEl.textContent = Math.round(90 * (1 - p / 100));
      var label = STATES[0][1];
      for (var s = 0; s < STATES.length; s++) { if (p >= STATES[s][0]) label = STATES[s][1]; }
      statusEl.textContent = label;
      range.setAttribute("aria-valuetext", timeEl.textContent + " s restantes — " + label);
      meter.style.width = p + "%";
      spots.forEach(function (o) { o.el.style.opacity = p >= o.at ? String(Math.min(1, (p - o.at) / 14 + 0.25)) : "0"; });
      cSpots.forEach(function (o) { o.el.style.opacity = p >= o.at ? "0.9" : "0"; });
      var cooking = p > 4 && p < 100;
      if (heat) heat.classList.toggle("on", cooking);
      if (sparksG) sparksG.classList.toggle("on", cooking && !reduce);
      var crust = pizza.querySelector(".crust");
      if (crust) {
        var mix = p / 100;
        var rC = Math.round(231 - 70 * mix), gC = Math.round(207 - 90 * mix), bC = Math.round(160 - 70 * mix);
        crust.setAttribute("fill", "rgb(" + rC + "," + gC + "," + bC + ")");
      }
      if (pizza) pizza.style.transform = p >= 100 ? "scale(1.03)" : "scale(1)";
    }

    range.addEventListener("input", function () { stopAuto(); setBake(+range.value); });

    var raf = null;
    function stopAuto() { if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = "Enfourner ▸"; } if (stage) stage.classList.remove("is-baking"); }
    function auto() {
      stopAuto();
      if (reduce) { range.value = 100; setBake(100); return; }
      btn.textContent = "Cuisson…";
      if (stage) stage.classList.add("is-baking");
      var start = null, DUR = 4200;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(100, ((ts - start) / DUR) * 100);
        range.value = Math.round(p);
        setBake(p);
        if (p < 100) { raf = requestAnimationFrame(step); }
        else { raf = null; btn.textContent = "Réenfourner ↻"; if (stage) stage.classList.remove("is-baking"); }
      }
      raf = requestAnimationFrame(step);
    }
    btn.addEventListener("click", auto);
    setBake(0);
  })();

  /* ---------- 8. statut du service (ouvert / fermé) ---------- */
  (function status() {
    var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    var now = new Date();
    var day = now.getDay();                       // 0 = dimanche, 1 = lundi (fermé)
    var mins = now.getHours() * 60 + now.getMinutes();
    var OPEN = 18 * 60 + 30, CLOSE = 22 * 60 + 30;
    var serviceDay = day !== 1;
    var isOpen = serviceDay && mins >= OPEN && mins < CLOSE;

    function nextOpenLabel() {
      // avant l'ouverture, un jour de service → ce soir
      if (serviceDay && mins < OPEN) return "ouvre à 18 h 30";
      // sinon, prochain jour de service
      for (var i = 1; i <= 7; i++) {
        var d = (day + i) % 7;
        if (d !== 1) return "ouvre " + DAYS[d] + " 18 h 30";
      }
      return "ouvre bientôt";
    }

    var navStatus = $("navStatus"), navLabel = $("navStatusLabel");
    if (navStatus && navLabel) {
      navStatus.classList.toggle("is-closed", !isOpen);
      navLabel.textContent = isOpen ? "Four allumé" : "Four éteint";
      navStatus.title = isOpen ? "Ouvert — ferme à 22 h 30" : "Fermé — " + nextOpenLabel();
    }
    var vStatus = $("venirStatus"), vText = $("venirStatusText");
    if (vStatus && vText) {
      vStatus.classList.toggle("is-closed", !isOpen);
      vText.textContent = isOpen ? "Ouvert maintenant · ferme à 22 h 30" : "Fermé — " + nextOpenLabel();
    }
  })();

})();
