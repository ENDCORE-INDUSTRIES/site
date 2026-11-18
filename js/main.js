import * as THREE from "three";

/* Boot sequence */
(function boot() {
  const bootEl = document.getElementById("boot");
  const fill = document.getElementById("boot-fill");
  const lines = [
    document.getElementById("boot-line-1"),
    document.getElementById("boot-line-2"),
    document.getElementById("boot-line-3"),
  ];
  if (!bootEl || !fill) return;

  let progress = 0;
  const steps = [
    { at: 15, line: 0 },
    { at: 45, line: 1 },
    { at: 80, line: 2 },
  ];

  const timer = setInterval(() => {
    progress += 2.2 + Math.random() * 1.8;
    if (progress > 100) progress = 100;
    fill.style.width = progress + "%";

    steps.forEach((s) => {
      if (progress >= s.at && lines[s.line] && !lines[s.line].classList.contains("is-on")) {
        lines[s.line].classList.add("is-on");
      }
    });

    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(() => bootEl.classList.add("is-done"), 350);
    }
  }, 40);
})();

/* Uptime clock */
(function uptime() {
  const el = document.getElementById("uptime");
  if (!el) return;
  const start = Date.now();
  function tick() {
    const s = Math.floor((Date.now() - start) / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    el.textContent = "FOUNDRY UPTIME — " + h + ":" + m + ":" + sec;
  }
  tick();
  setInterval(tick, 1000);
})();

/* Scroll progress + chapter highlight */
const bar = document.getElementById("scroll-bar");
const nav = document.getElementById("nav");
const chapterLinks = document.querySelectorAll("[data-chapter]");

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  if (bar) bar.style.transform = "scaleX(" + progress + ")";
  nav && nav.classList.toggle("is-scrolled", window.scrollY > 20);
}
updateScroll();
window.addEventListener("scroll", updateScroll, { passive: true });

const chapters = ["foundry", "origin", "build", "bays", "drops", "signal", "support", "community"];
const nodes = chapters.map(function (id) { return document.getElementById(id); }).filter(Boolean);

const observer = new IntersectionObserver(
  function (entries) {
    const visible = entries
      .filter(function (e) { return e.isIntersecting; })
      .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
    if (visible && visible.target.id) {
      chapterLinks.forEach(function (link) {
        const active = link.dataset.chapter === visible.target.id;
        if (link.closest(".nav-links")) {
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        } else {
          link.classList.toggle("is-active", active);
        }
      });
    }
  },
  { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.5] }
);
nodes.forEach(function (node) { observer.observe(node); });

/* Keyboard nav */
document.addEventListener("keydown", function (e) {
  if (e.target.matches("input, textarea, select")) return;
  if (e.key >= "0" && e.key <= "7") {
    var idx = Number(e.key);
    var el = document.getElementById(chapters[idx]);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth" }); }
  }
});

/* Lane filter */
document.querySelectorAll(".lane").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".lane").forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    btn.setAttribute("aria-pressed", "true");
  });
});

/* Light parallax */
(function parallax() {
  var items = document.querySelectorAll(".parallax");
  if (!items.length) return;
  var ticking = false;
  function update() {
    var mid = window.innerHeight / 2;
    items.forEach(function (el) {
      var depth = parseFloat(el.dataset.depth || "0.05");
      var rect = el.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var offset = (center - mid) * depth;
      el.style.transform = "translate3d(0, " + (offset * 0.15) + "px, 0)";
    });
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();

/* Reticle */
(function initReticle() {
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine) return;
  var root = document.getElementById("reticle");
  var lag = document.getElementById("reticle-lag");
  var label = document.getElementById("reticle-label");
  if (!root || !lag || !label) return;

  document.documentElement.classList.add("ec-fine");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var x = 0, y = 0, cx = 0, cy = 0, rx = 0, ry = 0, seen = false, hot = "";

  window.addEventListener("pointermove", function (event) {
    x = event.clientX; y = event.clientY;
    if (!seen) {
      seen = true; cx = x; cy = y; rx = x; ry = y;
      root.hidden = false;
    }
    var target = event.target instanceof Element ? event.target : null;
    var typing = Boolean(target && target.closest("input, textarea"));
    document.documentElement.classList.toggle("ec-ibeam", typing);
    var hit = target && target.closest("a, button, [data-cursor]");
    var next = typing ? "" : (hit && hit.dataset.cursor ? hit.dataset.cursor : (hit ? "OPEN" : ""));
    if (next !== hot) {
      hot = next;
      root.dataset.hot = next ? "1" : "0";
      label.textContent = next;
    }
  });
  window.addEventListener("pointerdown", function () { root.dataset.down = "1"; });
  window.addEventListener("pointerup", function () { root.dataset.down = "0"; });

  function tick() {
    var coreEase = reduced ? 1 : 0.38;
    var ringEase = reduced ? 1 : 0.14;
    cx += (x - cx) * coreEase;
    cy += (y - cy) * coreEase;
    rx += (x - rx) * ringEase;
    ry += (y - ry) * ringEase;
    root.style.transform = "translate3d(" + cx + "px, " + cy + "px, 0)";
    lag.style.transform = "translate3d(" + (rx - cx) + "px, " + (ry - cy) + "px, 0)";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* EARTH ASCENDANT 3D scene — futuristic Earth at the center of the show */
(function initFoundryScene() {
  var canvas = document.getElementById("foundry-canvas");
  if (!canvas) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia("(max-width: 760px)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !small,
      alpha: false,
      powerPreference: small ? "low-power" : "high-performance",
    });
  } catch (e) { return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.6));
  renderer.setClearColor(0x020409, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020409);
  scene.fog = new THREE.FogExp2(0x020409, 0.0062);

  var camera = new THREE.PerspectiveCamera(small ? 46 : 37, 1, 0.1, 320);
  camera.position.set(0, small ? 2.4 : 1.8, small ? 9.6 : 8.2);

  var anisotropy = renderer.capabilities.getMaxAnisotropy();
  var loader = new THREE.TextureLoader();
  function loadTex(path, srgb) {
    var t = loader.load(path);
    if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
    return t;
  }

  /* ---------- procedural helpers ---------- */
  function makeRadialTexture(stops, size) {
    size = size || 128;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeBandTexture(base, bandColors, stormColor) {
    var w = 512, h = 256;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var ctx = c.getContext("2d");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 2) {
      var wave = Math.sin(y * 0.055) * 14 + Math.sin(y * 0.013 + 1.7) * 26;
      var idx = Math.abs(Math.floor((y + wave * 0.35) / 11)) % bandColors.length;
      ctx.fillStyle = bandColors[idx];
      ctx.fillRect(0, y, w, 2);
    }
    for (var s = 0; s < 2200; s++) {
      ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.12)";
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.3, 1.3);
    }
    if (stormColor) {
      var sg = ctx.createRadialGradient(356, 150, 2, 356, 150, 46);
      sg.addColorStop(0, stormColor);
      sg.addColorStop(0.55, "rgba(120,80,40,0.3)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(290, 84, 150, 130);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  function makeSpeckleTexture(base, speckColors, density) {
    density = density || 2400;
    var w = 512, h = 256;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var ctx = c.getContext("2d");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    var lg = ctx.createLinearGradient(0, 0, 0, h);
    lg.addColorStop(0, "rgba(255,255,255,0.1)");
    lg.addColorStop(0.5, "rgba(0,0,0,0)");
    lg.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < density; i++) {
      ctx.fillStyle = speckColors[(Math.random() * speckColors.length) | 0];
      var r = 0.6 + Math.random() * 4.2;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeRingTexture() {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 64;
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 64);
    for (var x = 0; x < 512; x++) {
      var n = Math.sin(x * 0.085) * 0.5 + Math.sin(x * 0.021 + 2.1) * 0.5;
      var a = 0.16 + 0.46 * Math.abs(n) + (Math.random() < 0.05 ? 0.3 : 0);
      ctx.fillStyle = "rgba(238,234,214," + Math.min(0.8, a).toFixed(3) + ")";
      ctx.fillRect(x, 0, 1, 64);
    }
    var fade = ctx.createLinearGradient(0, 0, 512, 0);
    fade.addColorStop(0, "rgba(0,0,0,1)");
    fade.addColorStop(0.14, "rgba(0,0,0,0)");
    fade.addColorStop(0.86, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 512, 64);
    return new THREE.CanvasTexture(c);
  }

  function circleLine(radius, opacity, color) {
    var pts = [];
    var segments = 140;
    for (var i = 0; i <= segments; i++) {
      var a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: color || 0xd6ff3c, transparent: true, opacity: opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    }));
  }

  /* ---------- starfield + nebulae ---------- */
  var starCount = small ? 420 : 950;
  var starPositions = new Float32Array(starCount * 3);
  var starColors = new Float32Array(starCount * 3);
  var starPalette = [[1,1,0.96],[0.84,1,0.62],[0.8,0.9,1],[1,0.88,0.7]];
  for (var s = 0; s < starCount; s++) {
    var u = Math.random() * 2 - 1;
    var theta = Math.random() * Math.PI * 2;
    var r = 42 + Math.random() * 75;
    var sinPhi = Math.sqrt(Math.max(0, 1 - u * u));
    starPositions[s * 3] = r * sinPhi * Math.cos(theta);
    starPositions[s * 3 + 1] = r * u;
    starPositions[s * 3 + 2] = r * sinPhi * Math.sin(theta);
    var col = starPalette[(Math.random() * starPalette.length) | 0];
    var dim = 0.4 + Math.random() * 0.6;
    starColors[s * 3] = col[0] * dim;
    starColors[s * 3 + 1] = col[1] * dim;
    starColors[s * 3 + 2] = col[2] * dim;
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  var starField = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      size: small ? 0.22 : 0.16, vertexColors: true, transparent: true,
      opacity: 1, sizeAttenuation: true, depthWrite: false, fog: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(starField);

  var nebulae = [];
  var nebulaSpecs = [
    { c: ["rgba(120,160,255,0.38)", "rgba(40,60,140,0.1)", "rgba(0,0,0,0)"], p: [-30, 10, -46], s: 36, o: 0.45 },
    { c: ["rgba(90,220,190,0.3)", "rgba(20,90,80,0.1)", "rgba(0,0,0,0)"], p: [26, -8, -44], s: 30, o: 0.4 },
  ];
  for (var n = 0; n < nebulaSpecs.length; n++) {
    var ns = nebulaSpecs[n];
    var mat = new THREE.SpriteMaterial({
      map: makeRadialTexture([[0, ns.c[0]], [0.45, ns.c[1]], [1, ns.c[2]]], 256),
      transparent: true, opacity: ns.o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    var sprite = new THREE.Sprite(mat);
    sprite.position.set(ns.p[0], ns.p[1], ns.p[2]);
    sprite.scale.set(ns.s, ns.s * 0.72, 1);
    scene.add(sprite);
    nebulae.push(sprite);
  }

  /* ---------- the sun (far away) + key light ---------- */
  var sunDir = new THREE.Vector3(-0.42, 0.25, -0.52).normalize();
  var sunLight = new THREE.DirectionalLight(0xfff2dc, 2.6);
  sunLight.position.copy(sunDir).multiplyScalar(30);
  scene.add(sunLight);
  var rimLight = new THREE.DirectionalLight(0x6fb8ff, 0.7);
  rimLight.position.set(8, -2, 10);
  scene.add(rimLight);
  var camFill = new THREE.DirectionalLight(0xcfe4ff, 0.5);
  camFill.position.set(2, 3.5, 15);
  scene.add(camFill);
  var hemi = new THREE.HemisphereLight(0x35506e, 0x03060a, 0.72);
  scene.add(hemi);

  var sunGlare = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture([[0, "rgba(255,252,235,1)"], [0.16, "rgba(255,236,170,0.9)"], [0.42, "rgba(255,196,90,0.28)"], [1, "rgba(0,0,0,0)"]], 256),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 1,
  }));
  sunGlare.position.copy(sunDir).multiplyScalar(46);
  sunGlare.scale.set(26, 26, 1);
  scene.add(sunGlare);

  /* ---------- EARTH — the star of the show ---------- */
  var earthGroup = new THREE.Group();
  earthGroup.position.set(small ? 0 : 1.4, small ? -1.1 : -0.35, 0);
  scene.add(earthGroup);

  var earthRadius = small ? 1.95 : 1.9;
  var earth = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, 64, 64),
    new THREE.MeshStandardMaterial({
      map: loadTex("assets/textures/earth_atmos_2048.jpg"),
      normalMap: loadTex("assets/textures/earth_normal_2048.jpg", false),
      normalScale: new THREE.Vector2(0.9, 0.9),
      emissiveMap: loadTex("assets/textures/earth_lights_2048.png"),
      emissive: 0xffffff,
      emissiveIntensity: 0.9,
      roughness: 0.62,
      metalness: 0.08,
    })
  );
  earth.rotation.z = 0.41; // axial tilt
  earthGroup.add(earth);

  // atmosphere — inner shell + outer glare sprite
  var atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.045, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x5ea8ff, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, fog: false,
    })
  );
  earthGroup.add(atmosphere);
  var earthGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture([[0, "rgba(120,200,255,0.5)"], [0.35, "rgba(80,160,255,0.18)"], [1, "rgba(0,0,0,0)"]], 256),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.95,
  }));
  earthGlow.scale.set(earthRadius * 4.6, earthRadius * 4.6, 1);
  earthGroup.add(earthGlow);

  // holographic dashed equatorial scan ring
  var holoRing = new THREE.Mesh(
    new THREE.TorusGeometry(earthRadius * 1.09, 0.008, 6, 96),
    new THREE.MeshBasicMaterial({
      color: 0xd6ff3c, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    })
  );
  holoRing.rotation.x = Math.PI / 2 - 0.41;
  earthGroup.add(holoRing);

  /* ---------- THE ORBITAL RING — equatorial megastructure ---------- */
  var ringGroup = new THREE.Group();
  ringGroup.rotation.z = 0.41; // same tilt axis as Earth's equator
  earthGroup.add(ringGroup);

  var haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.68, 0.022, 10, 128),
    new THREE.MeshBasicMaterial({
      color: 0x8affd0, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    })
  );
  haloRing.rotation.x = Math.PI / 2;
  ringGroup.add(haloRing);

  var haloOuter = new THREE.Mesh(
    new THREE.TorusGeometry(3.16, 0.011, 8, 128),
    new THREE.MeshBasicMaterial({
      color: 0x3cffb4, transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    })
  );
  haloOuter.rotation.x = Math.PI / 2;
  ringGroup.add(haloOuter);


  /* ---------- inclined satellite constellations (dots on orbit lines) ---------- */
  var constellations = [];
  var constellationSpecs = [
    { radius: 2.35, tiltX: 0.62, tiltZ: 0.18, count: small ? 8 : 14, speed: 0.22, opacity: 0.18 },
    { radius: 2.9, tiltX: -0.5, tiltZ: 0.42, count: small ? 10 : 18, speed: -0.16, opacity: 0.16 },
    { radius: 3.45, tiltX: 0.28, tiltZ: -0.36, count: small ? 12 : 22, speed: 0.12, opacity: 0.14 },
  ];
  for (var ci = 0; ci < constellationSpecs.length; ci++) {
    var spec = constellationSpecs[ci];
    var orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = spec.tiltX;
    orbitGroup.rotation.z = spec.tiltZ;
    orbitGroup.add(circleLine(spec.radius, spec.opacity, 0x8affd0));

    orbitGroup.position.copy(earthGroup.position);
    scene.add(orbitGroup);
    constellations.push({ group: orbitGroup, speed: spec.speed });
  }

  /* ---------- the Moon (real texture, slow orbit) ---------- */
  var moonPivot = new THREE.Group();
  moonPivot.rotation.z = 0.16;
  scene.add(moonPivot);
  var moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 40, 40),
    new THREE.MeshStandardMaterial({
      map: loadTex("assets/textures/moon_1024.jpg"),
      roughness: 0.95, metalness: 0.02,
    })
  );
  moon.position.set(-8.6, 1.9, -7.6);
  moonPivot.add(moon);

  /* ---------- distant planets (they share our sky) ---------- */
  var saturn = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 40, 40),
    new THREE.MeshStandardMaterial({
      map: makeBandTexture("#6b5432", ["#8a6f45", "#4a3a24", "#c4a878", "#54452a", "#a8895a"], null),
      roughness: 0.9, metalness: 0.02,
      emissiveMap: makeBandTexture("#6b5432", ["#8a6f45", "#4a3a24", "#c4a878", "#54452a", "#a8895a"], null),
      emissive: 0xffffff, emissiveIntensity: 0.45,
    })
  );
  saturn.position.set(-12.5, -7.3, -22);
  saturn.rotation.z = 0.32;
  scene.add(saturn);
  var saturnRing = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 3.35, 72, 1),
    new THREE.MeshBasicMaterial({
      map: makeRingTexture(), color: 0xe8e4cc, transparent: true, opacity: 0.6,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    })
  );
  saturnRing.position.copy(saturn.position);
  saturnRing.rotation.x = Math.PI / 2.45;
  saturnRing.rotation.y = 0.18;
  scene.add(saturnRing);
  var saturnHolo = circleLine(4.3, 0.18, 0xffd27a);
  saturnHolo.position.copy(saturn.position);
  saturnHolo.rotation.x = 1.02;
  saturnHolo.rotation.y = 0.5;
  scene.add(saturnHolo);
  
  var distant = [saturn];
  function addDistantPlanet(map, position, radius, holoColor, holoOpacity) {
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshStandardMaterial({ map: map, roughness: 0.9, metalness: 0.02, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.45 })
    );
    mesh.position.set(position[0], position[1], position[2]);
    scene.add(mesh);
    var holo = circleLine(radius * 1.75, holoOpacity || 0.22, holoColor || 0x8affd0);
    holo.position.copy(mesh.position);
    holo.rotation.x = 1.05;
    holo.rotation.y = 0.4;
    scene.add(holo);
    distant.push(mesh);
    return mesh;
  }
  addDistantPlanet(
    makeBandTexture("#4a3a24", ["#6b5432", "#33281a", "#8a6f45", "#54452a"], "rgba(214,255,60,0.35)"),
    [13.5, 6.2, -28], 2.15, 0xffd27a, 0.28
  );
  addDistantPlanet(
    makeSpeckleTexture("#4a1e0c", ["#a34a20", "#d2691e", "#6b2f10", "#e08349"], 1500),
    [-13.5, -5.6, -24], 1.05, 0xff9a5a, 0.24
  );
  addDistantPlanet(
    makeSpeckleTexture("#b8d4d8", ["#ffffff", "#8fb8c4", "#d8eef2", "#6a94a4"], 1500),
    [9.5, -3.9, -26], 0.72, 0x9adfff, 0.22
  );
  addDistantPlanet(
    makeSpeckleTexture("#3c1e52", ["#5a2e78", "#7a44a4", "#2a1038", "#a86fd0"], 2200),
    [15.2, 2.6, -27], 1.25, 0xc07aff, 0.26
  );
  addDistantPlanet(
    makeSpeckleTexture("#2a0e04", ["#ff6a1e", "#ffb04a", "#802a08"], 1100),
    [-8.2, -6.2, -19], 0.55, 0xff7a2a, 0.34
  );
  addDistantPlanet(
    makeBandTexture("#1e3a52", ["#2e5a78", "#14242e", "#4a8ab0", "#22364a"], null),
    [-9.5, 5.2, 26.5], 1.5, 0x6ad4ff, 0.3
  );
  addDistantPlanet(
    makeSpeckleTexture("#3a1608", ["#c46a2a", "#e08a3a", "#7a3a14", "#ffb05a"], 1300),
    [11, -4.2, 27.5], 0.8, 0xffab4a, 0.34
  );

  /* ---------- comet ---------- */
  var comet = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.15),
    new THREE.MeshBasicMaterial({
      map: makeRadialTexture([[0, "rgba(255,255,255,1)"], [0.2, "rgba(190,220,255,0.85)"], [1, "rgba(0,0,0,0)"]], 128),
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    })
  );
  scene.add(comet);
  var cometState = { active: false, t: 0, dur: 1.15, from: new THREE.Vector3(), to: new THREE.Vector3(), nextAt: 1.5 };

  /* ---------- pointer + scroll ---------- */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", function (e) {
    pointer.tx = e.clientX / window.innerWidth - 0.5;
    pointer.ty = e.clientY / window.innerHeight - 0.5;
  });

  var scroll = 0;
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scroll = max > 0 ? window.scrollY / max : 0;
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function resize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    if (width < 1 || height < 1) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  resize();
  window.addEventListener("resize", resize);

  var last = performance.now();
  var elapsed = 0;

  function smoothstep(edge0, edge1, value) {
    var t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    if (!reduced) elapsed += dt;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;


    // starfield shimmer + parallax
    starField.rotation.y = elapsed * 0.003 + pointer.x * 0.035;
    starField.rotation.x = pointer.y * 0.02;
    for (var n = 0; n < nebulae.length; n++) {
      nebulae[n].material.opacity = nebulaSpecs[n].o * (0.85 + 0.3 * Math.sin(elapsed * 0.3 + n * 2.1));
    }

    // Earth turns beneath us
    if (!reduced) earth.rotation.y += dt * 0.055;
    holoRing.rotation.z = elapsed * 0.12;
    holoRing.material.opacity = 0.34 + (Math.sin(elapsed * 1.4) * 0.5 + 0.5) * 0.3;
    earthGlow.material.opacity = 0.72 + Math.sin(elapsed * 0.9) * 0.16;


    // constellations orbit at their own inclinations
    for (var ci = 0; ci < constellations.length; ci++) {
      if (!reduced) constellations[ci].group.rotation.y += constellations[ci].speed * dt;
    }

    // Moon drifts through its far orbit
    if (!reduced) moonPivot.rotation.y += dt * 0.012;
    moon.rotation.y += dt * 0.02;

    // distant worlds rotate slowly
    for (var di2 = 0; di2 < distant.length; di2++) distant[di2].rotation.y += dt * 0.03;

    // comet streaks
    if (!reduced) {
      if (!cometState.active && elapsed > cometState.nextAt) {
        cometState.active = true;
        cometState.t = 0;
        var fromLeft = Math.random() < 0.5;
        cometState.from.set(fromLeft ? -30 : 30, 8 + Math.random() * 6, -22 - Math.random() * 10);
        cometState.to.set(fromLeft ? 30 : -30, 3 + Math.random() * 4, -16 - Math.random() * 8);
      }
      if (cometState.active) {
        cometState.t += dt / cometState.dur;
        var t = Math.min(1, cometState.t);
        var ease = t * t * (3 - 2 * t);
        comet.position.lerpVectors(cometState.from, cometState.to, ease);
        var dir = cometState.to.clone().sub(cometState.from);
        comet.rotation.z = Math.atan2(dir.y, dir.x);
        comet.material.opacity = Math.sin(t * Math.PI) * 0.95;
        if (t >= 1) { cometState.active = false; cometState.nextAt = elapsed + 3.5 + Math.random() * 5; comet.material.opacity = 0; }
      }
    }

    // sun glare breathes very slightly
    sunGlare.material.opacity = 0.9 + Math.sin(elapsed * 0.5) * 0.08;

    // camera — FIXED-distance orbital spin, always trained on Earth.
    // Scroll does NOT move the camera at all.
    var earthX = earthGroup.position.x;
    var earthY = earthGroup.position.y;
    var orbitAngle = elapsed * 0.055; // scroll does NOT move the camera
    var dist = small ? 9.6 : 8.2;           // fixed — never zooms
    var aimAngle = orbitAngle + pointer.x * 0.055;
    var camX = earthX + Math.sin(aimAngle) * dist;
    var camZ = Math.cos(aimAngle) * dist;
    var camY = (small ? 2.3 : 1.75) + pointer.y * -0.4 + Math.sin(elapsed * 0.22) * 0.07;
    camera.position.x += (camX - camera.position.x) * 0.05;
    camera.position.y += (camY - camera.position.y) * 0.05;
    camera.position.z += (camZ - camera.position.z) * 0.05;
    camera.lookAt(earthX, earthY + 0.15, 0);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();

/* =========================================================
   EC // UPGRADE PASS — reveal-on-scroll + copy deterrents
   ========================================================= */

/* Reveal on scroll */
(function reveal() {
  var targets = document.querySelectorAll(
    ".hero-copy, .hero-mark, .panel .col, .breather .col, .footer-row"
  );
  if (!targets.length) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("reveal", "is-in"); });
    return;
  }
  targets.forEach(function (el) { el.classList.add("reveal"); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
  targets.forEach(function (el) { io.observe(el); });
})();

/* Copy deterrents — raises the bar for casual copying.
   NOTE: client-side code cannot be made uncopiable; a determined
   visitor with DevTools can always read what the browser downloads. */
(function deterrents() {
  // Right-click / context menu
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  // Block common view-source / devtools / save shortcuts
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;
    // F12
    if (k === "f12") return void e.preventDefault();
    // Ctrl/Cmd+Shift+I / J / C  (devtools)
    if (ctrl && shift && (k === "i" || k === "j" || k === "c")) return void e.preventDefault();
    // Ctrl/Cmd+U (view source), Ctrl/Cmd+S (save page)
    if (ctrl && (k === "u" || k === "s")) return void e.preventDefault();
  }, true);

  // No image dragging
  document.addEventListener("dragstart", function (e) {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });

  // Console notice
  try {
    console.log(
      "%cEC // ENDCORE INDUSTRIES",
      "color:#d6ff3c;font-size:16px;font-weight:bold;background:#060708;padding:2px 6px;",
      "\nThis site and its assets are the property of Endcore Industries. Copying is not authorized."
    );
  } catch (e) { /* noop */ }
})();
