/* =================================================================
   Pieza 1.2 - Perfiles y tubos estructurales   [id: c1-02]
   Coche solar - renders Babylon.js - categorias 1-6
   -----------------------------------------------------------------
   COMO USARLO (una sola linea en tu HTML):
       <script src="02-perfiles.js"></script>
   El archivo hace todo solo: carga Babylon.js desde CDN, crea el
   canvas si la pagina no tiene ninguno, y monta la escena con
   rejilla de 10 cm, ejes XYZ, luces, etiquetas y giro automatico.
   Escala real: 1 unidad = 1 m.  Arrastra para orbitar, rueda = zoom.
   ================================================================= */
(function(){
"use strict";
/* ------------------------------------------------------------
   SOLAR CORE - runtime Babylon.js para las piezas del coche solar
   (escena, camara orbital, luces, rejilla de 10 cm, materiales
   didacticos, etiquetas flotantes y encuadre automatico)
   ------------------------------------------------------------ */
var SOLAR_CORE = (function () {
"use strict";

var CSS_ID = "solar-piezas-css";

function ensureCSS() {
  if (document.getElementById(CSS_ID)) return;
  var st = document.createElement("style");
  st.id = CSS_ID;
  st.textContent =
    ".sol-lbl{position:fixed;z-index:9;transform:translate(-50%,-130%);background:rgba(10,13,17,.9);color:#fff;" +
    "border:1px solid rgba(255,255,255,.22);border-left:3px solid #e8833a;font:11.5px 'Segoe UI',system-ui,Arial,sans-serif;" +
    "padding:4px 9px;border-radius:8px;white-space:nowrap;pointer-events:none;display:none}" +
    ".sol-lbl::after{content:'';position:absolute;left:50%;bottom:-8px;width:1px;height:8px;background:rgba(255,255,255,.35)}" +
    ".sol-card{position:fixed;top:16px;left:16px;z-index:10;background:rgba(14,17,22,.87);color:#eef2f6;" +
    "border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px 18px;max-width:400px;" +
    "box-shadow:0 8px 30px rgba(0,0,0,.35);font-family:'Segoe UI',system-ui,Arial,sans-serif}" +
    ".sol-card h1{font-size:19px;margin:9px 0 4px;font-weight:700;line-height:1.25}" +
    ".sol-card .desc{font-size:12.5px;color:#aeb9c4;margin:0;line-height:1.5}" +
    ".sol-chip{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.5px;color:#10131a;border-radius:999px;padding:3px 10px}" +
    ".sol-hint{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:10;color:#93a3b3;font-size:11.5px;" +
    "background:rgba(14,17,22,.78);border:1px solid rgba(255,255,255,.09);border-radius:999px;padding:6px 14px;" +
    "white-space:nowrap;font-family:'Segoe UI',system-ui,Arial,sans-serif}" +
    ".sol-err{position:fixed;left:16px;right:16px;bottom:48px;z-index:30;color:#ffb4a8;font:12px/1.5 Consolas,monospace;" +
    "white-space:pre-wrap;pointer-events:none;display:none}";
  document.head.appendChild(st);
}

/* Carga Babylon.js desde CDN (con respaldo) y ejecuta ok()/fail() */
function loadBabylon(ok, fail) {
  if (window.BABYLON) { ok(); return; }
  var urls = [
    "https://cdn.jsdelivr.net/npm/babylonjs@7.54.3/babylon.min.js",
    "https://cdn.babylonjs.com/babylon.js"
  ], i = 0;
  (function next() {
    if (i >= urls.length) { if (fail) fail(); return; }
    var s = document.createElement("script");
    s.src = urls[i++];
    s.onload = function () { if (window.BABYLON) ok(); else next(); };
    s.onerror = next;
    document.head.appendChild(s);
  })();
}

/* Crea motor+escena completos en un canvas y construye la pieza.
   opts: {labels:true|false, accent:"#hex", shot:true|false}       */
function makeView(canvas, BUILD, opts) {
  opts = opts || {};
  var ACCENT = opts.accent || "#e8833a";
  var engine = new BABYLON.Engine(canvas, true, { stencil: true, antialias: true });
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.75));
  var scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.055, 0.066, 0.086, 1);

  // Camara orbital con auto-giro
  var camera = new BABYLON.ArcRotateCamera("cam", -1.15, 1.12, 2.5, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 0.06; camera.upperRadiusLimit = 14;
  camera.wheelDeltaPercentage = 0.012; camera.pinchDeltaPercentage = 0.012; camera.minZ = 0.01;
  if (opts.shot) {
    camera.alpha = 1.05; camera.beta = 1.1;
  } else {
    camera.useAutoRotationBehavior = true;
    camera.autoRotationBehavior.idleRotationSpeed = 0.16;
    camera.autoRotationBehavior.idleRotationWaitTime = 2200;
    camera.autoRotationBehavior.idleRotationSpinupTime = 1400;
  }

  // Luces
  var hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0.25, 1, 0.15), scene);
  hemi.intensity = 0.6; hemi.groundColor = new BABYLON.Color3(0.1, 0.11, 0.13);
  var dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.45, -1, -0.3), scene);
  dir.position = new BABYLON.Vector3(4, 9, 3); dir.intensity = 0.9;
  var sg = new BABYLON.ShadowGenerator(1024, dir);
  sg.usePercentageCloserFiltering = true; sg.darkness = 0.45;
  var glow = new BABYLON.GlowLayer("glow", scene); glow.intensity = 0.45;

  // Suelo y rejilla de referencia (1 unidad = 1 m, celdas de 10 cm)
  var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 5, height: 5 }, scene);
  var gm = new BABYLON.StandardMaterial("gm", scene);
  gm.diffuseColor = BABYLON.Color3.FromHexString("#151a20"); gm.specularColor = BABYLON.Color3.Black();
  ground.material = gm; ground.receiveShadows = true; ground.isPickable = false;
  var minor = [], major = [];
  for (var i = -25; i <= 25; i++) {
    var p = i / 10, arr = (i % 5 === 0) ? major : minor;
    arr.push([new BABYLON.Vector3(p, 0.0015, -2.5), new BABYLON.Vector3(p, 0.0015, 2.5)]);
    arr.push([new BABYLON.Vector3(-2.5, 0.0015, p), new BABYLON.Vector3(2.5, 0.0015, p)]);
  }
  var lsMin = BABYLON.MeshBuilder.CreateLineSystem("lsMin", { lines: minor }, scene);
  lsMin.color = BABYLON.Color3.FromHexString("#232b34"); lsMin.isPickable = false;
  var lsMaj = BABYLON.MeshBuilder.CreateLineSystem("lsMaj", { lines: major }, scene);
  lsMaj.color = BABYLON.Color3.FromHexString("#3a4550"); lsMaj.isPickable = false;
  function axis(a, b, c) { var l = BABYLON.MeshBuilder.CreateLines("ax", { points: [a, b] }, scene); l.color = c; l.isPickable = false; }
  axis(new BABYLON.Vector3(0, 0.004, 0), new BABYLON.Vector3(0.55, 0.004, 0), BABYLON.Color3.FromHexString("#e2574c"));
  axis(new BABYLON.Vector3(0, 0.004, 0), new BABYLON.Vector3(0, 0.55, 0.004), BABYLON.Color3.FromHexString("#58c470"));
  axis(new BABYLON.Vector3(0, 0.004, 0), new BABYLON.Vector3(0, 0.004, 0.55), BABYLON.Color3.FromHexString("#4c7de2"));
  function tagPlane(txt, hex, pos) {
    var dt = new BABYLON.DynamicTexture("dtx", { width: 64, height: 64 }, scene, false);
    dt.drawText(txt, null, 48, "bold 46px Arial", hex, "transparent", true);
    var m = new BABYLON.StandardMaterial("tm", scene);
    m.diffuseTexture = dt; m.emissiveTexture = dt; m.emissiveColor = new BABYLON.Color3(1, 1, 1);
    m.useAlphaFromDiffuseTexture = true; m.backFaceCulling = false; m.specularColor = BABYLON.Color3.Black();
    var pl = BABYLON.MeshBuilder.CreatePlane("tag", { size: 0.09 }, scene);
    pl.material = m; pl.position = pos; pl.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; pl.isPickable = false;
  }
  tagPlane("X", "#e2574c", new BABYLON.Vector3(0.63, 0.004, 0));
  tagPlane("Y", "#58c470", new BABYLON.Vector3(0, 0.63, 0.004));
  tagPlane("Z", "#4c7de2", new BABYLON.Vector3(0, 0.004, 0.63));

  // Materiales y helpers didacticos
  var MATS = {};
  function M(hex, o) {
    o = o || {};
    var k = hex + "|" + (o.alpha || "") + "|" + (o.metal ? "m" : "") + "|" + (o.spec || "") + "|" + (o.power || "") + "|" + (o.emissive || "") + "|" + (o.back ? "b" : "");
    if (MATS[k]) return MATS[k];
    var m = new BABYLON.StandardMaterial("mat" + (Object.keys(MATS).length), scene);
    m.diffuseColor = BABYLON.Color3.FromHexString(hex);
    var s = (o.spec !== undefined) ? o.spec : 0.22;
    m.specularColor = new BABYLON.Color3(s, s, s); m.specularPower = o.power || 32;
    if (o.metal) { m.specularColor = new BABYLON.Color3(0.85, 0.86, 0.9); m.specularPower = 72; }
    if (o.alpha !== undefined) m.alpha = o.alpha;
    if (o.emissive) m.emissiveColor = BABYLON.Color3.FromHexString(o.emissive);
    if (o.back) m.backFaceCulling = false;
    MATS[k] = m; return m;
  }
  var MAT = {
    alu: M("#c9ced4", { metal: 1 }),
    steel: M("#98a0a9", { metal: 1, spec: 0.5 }),
    darksteel: M("#686f77", { metal: 1, spec: 0.45 }),
    chrome: M("#e9edf2", { metal: 1 }),
    copper: M("#b06a32", { metal: 1, spec: 0.55 }),
    brass: M("#c29a3a", { metal: 1, spec: 0.5 }),
    gold: M("#d8b64a", { metal: 1 }),
    black: M("#24272b", { spec: 0.12 }),
    plastic: M("#4a505a", { spec: 0.18 }),
    pcb: M("#17663c", { spec: 0.15 }),
    white: M("#eef0f2", { spec: 0.1 }),
    pvblue: M("#1a3f8f", { spec: 0.85, power: 96 }),
    cellline: M("#2a55a0", { spec: 0.85, power: 96 }),
    glass: M("#bcd9ff", { alpha: 0.3, spec: 0.9, power: 96, back: 1 }),
    eva: M("#e6edf6", { alpha: 0.42, back: 1 }),
    transp: M("#ffffff", { alpha: 0.35, spec: 0.6, back: 1 }),
    rubber: M("#24262a", { spec: 0.05 }),
    tire: M("#1c1e21", { spec: 0.06 }),
    red: M("#c2372c"), blue: M("#2c66c2"), green: M("#2f8f4e"), yellow: M("#e3b534"),
    orange: M("#e0762b"), purple: M("#7a4fb0"), gray: M("#7c848c"),
    cast: M("#5f6a75", { spec: 0.3 }),
    spring: M("#dd7a26", { spec: 0.35 }),
    seat: M("#39424e", { spec: 0.08 }),
    strap: M("#d84a1f", { spec: 0.1 }),
    ledW: M("#f4faff", { emissive: "#cfe8ff" }),
    ledG: M("#37e06a", { emissive: "#2bd55c" }),
    ledR: M("#ff5a4d", { emissive: "#ff4433" }),
    screen: M("#0b1420", { emissive: "#123a5e" })
  };
  var root = new BABYLON.TransformNode("root", scene);
  function done(m) { m.isPickable = false; return m; }
  function box(w, h, d, m, x, y, z) {
    var b = BABYLON.MeshBuilder.CreateBox("b", { width: w, height: h, depth: d }, scene);
    b.position.set(x || 0, y || 0, z || 0); b.material = m; b.parent = root; return done(b);
  }
  function cyl(d, h, m, x, y, z, tess) {
    var b = BABYLON.MeshBuilder.CreateCylinder("c", { diameter: d, height: h, tessellation: tess || 32 }, scene);
    b.position.set(x || 0, y || 0, z || 0); b.material = m; b.parent = root; return done(b);
  }
  function cone(dT, dB, h, m, x, y, z, tess) {
    var b = BABYLON.MeshBuilder.CreateCylinder("cn", { diameterTop: dT, diameterBottom: dB, height: h, tessellation: tess || 32 }, scene);
    b.position.set(x || 0, y || 0, z || 0); b.material = m; b.parent = root; return done(b);
  }
  function hex(d, h, m, x, y, z) { return cyl(d, h, m, x, y, z, 6); }
  function sphere(d, m, x, y, z, seg) {
    var b = BABYLON.MeshBuilder.CreateSphere("s", { diameter: d, segments: seg || 18 }, scene);
    b.position.set(x || 0, y || 0, z || 0); b.material = m; b.parent = root; return done(b);
  }
  function torus(d, t, m, x, y, z) {
    var b = BABYLON.MeshBuilder.CreateTorus("tor", { diameter: d, thickness: t, tessellation: 48 }, scene);
    b.position.set(x || 0, y || 0, z || 0); b.material = m; b.parent = root; return done(b);
  }
  function cylAB(a, b, r, m, tess) {
    var d = b.subtract(a), len = d.length(); if (len < 1e-6) len = 1e-6;
    var c = BABYLON.MeshBuilder.CreateCylinder("ca", { height: len, diameter: r * 2, tessellation: tess || 24 }, scene);
    c.material = m; c.position.copyFrom(a.add(b).scale(0.5)); c.parent = root;
    var dirV = d.normalize(), axisV = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), dirV), al = axisV.length();
    if (al < 1e-4) { if (dirV.y < 0) c.rotation.x = Math.PI; }
    else { axisV.normalize(); var ang = Math.acos(Math.max(-1, Math.min(1, dirV.y))); c.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axisV, ang); }
    return done(c);
  }
  function tubePath(pts, r, m, tess) {
    var curve = BABYLON.Curve3.CreateCatmullRomSpline(pts, Math.max(pts.length * 8, 16));
    var b = BABYLON.MeshBuilder.CreateTube("tp", { path: curve.getPoints(), radius: r, cap: BABYLON.Mesh.CAP_ALL, tessellation: tess || 12 }, scene);
    b.material = m; b.parent = root; return done(b);
  }
  function grp(x, y, z) {
    var t = new BABYLON.TransformNode("g", scene); t.parent = root; t.position.set(x || 0, y || 0, z || 0); return t;
  }
  var LBL = [];
  var H = { scene: scene, engine: engine, root: root, M: M, MAT: MAT,
    L: { add: function (t, x, y, z) { LBL.push({ t: t, p: new BABYLON.Vector3(x, y, z) }); } },
    v: function (x, y, z) { return new BABYLON.Vector3(x, y, z); },
    box: box, cyl: cyl, cone: cone, hex: hex, sphere: sphere, torus: torus,
    cylAB: cylAB, tube: cylAB, tubePath: tubePath, grp: grp };

  // Construir la pieza
  BUILD(H);

  root.getChildMeshes().forEach(function (m) {
    m.isPickable = false;
    var a = (m.material && m.material.alpha !== undefined) ? m.material.alpha : 1;
    if (a >= 0.7) sg.addShadowCaster(m);
  });

  // Encuadre automatico de camara
  var mn = new BABYLON.Vector3(1e9, 1e9, 1e9), mx = new BABYLON.Vector3(-1e9, -1e9, -1e9), has = false;
  root.getChildMeshes().forEach(function (m) {
    m.computeWorldMatrix(true);
    var bb = m.getBoundingInfo().boundingBox; has = true;
    mn = BABYLON.Vector3.Minimize(mn, bb.minimumWorld);
    mx = BABYLON.Vector3.Maximize(mx, bb.maximumWorld);
  });
  if (has) {
    var ctr = mn.add(mx).scale(0.5), size = mx.subtract(mn);
    var rad = Math.max(size.x, size.y, size.z);
    camera.setTarget(ctr);
    camera.radius = Math.max(rad * 1.45, 0.3);
    camera.upperRadiusLimit = Math.max(rad * 6, 2);
  }

  // Etiquetas flotantes (proyeccion 3D a pantalla, con anti-encimado)
  var els = [];
  if (opts.labels !== false && LBL.length) {
    for (var e = 0; e < LBL.length; e++) {
      var dEl = document.createElement("div");
      dEl.className = "sol-lbl"; dEl.textContent = LBL[e].t;
      dEl.style.borderLeftColor = ACCENT;
      document.body.appendChild(dEl); els.push(dEl);
    }
  }
  var rect = canvas.getBoundingClientRect();
  function refreshRect() { rect = canvas.getBoundingClientRect(); }
  function updLbls() {
    if (!els.length) return;
    var w = engine.getRenderWidth(), h = engine.getRenderHeight();
    var vp = camera.viewport.toGlobal(w, h), tm = scene.getTransformMatrix();
    var fwd = camera.getForwardRay().direction;
    var vis = [], pos = [];
    for (var i = 0; i < LBL.length; i++) {
      var p = BABYLON.Vector3.Project(LBL[i].p, BABYLON.Matrix.Identity(), tm, vp);
      var ok = BABYLON.Vector3.Dot(fwd, LBL[i].p.subtract(camera.position)) > 0.01;
      ok = ok && p.x > -60 && p.x < w + 60 && p.y > -60 && p.y < h + 60;
      vis.push(ok); pos.push({ x: p.x, y: p.y });
    }
    var order = []; for (var j = 0; j < LBL.length; j++) if (vis[j]) order.push(j);
    order.sort(function (a, b) { return pos[a].y - pos[b].y; });
    var placed = [];
    for (var q = 0; q < order.length; q++) {
      var idx = order[q], yy = pos[idx].y, xx = pos[idx].x;
      for (var r2 = 0; r2 < placed.length; r2++) {
        var pl = placed[r2];
        if (Math.abs(yy - pl.y) < 26 && Math.abs(xx - pl.x) < 150) { yy = pl.y + 26; }
      }
      placed.push({ x: xx, y: yy });
      pos[idx].y = yy;
    }
    for (var k2 = 0; k2 < LBL.length; k2++) {
      if (vis[k2]) {
        els[k2].style.display = "block";
        els[k2].style.left = (rect.left + pos[k2].x) + "px";
        els[k2].style.top = (rect.top + pos[k2].y) + "px";
      } else { els[k2].style.display = "none"; }
    }
  }
  engine.runRenderLoop(function () { scene.render(); updLbls(); });

  function onResize() { engine.resize(); refreshRect(); }
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", refreshRect, true);
  var rectTimer = setInterval(refreshRect, 700);

  function dispose() {
    try { engine.stopRenderLoop(); } catch (e) {}
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", refreshRect, true);
    clearInterval(rectTimer);
    els.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
    els = [];
    try { scene.dispose(); } catch (e) {}
    try { engine.dispose(); } catch (e) {}
  }

  return { engine: engine, scene: scene, camera: camera, canvas: canvas, dispose: dispose };
}

return { ensureCSS: ensureCSS, loadBabylon: loadBabylon, makeView: makeView };
})();

var META={id:'c1-02',num:'1.2',name:'Perfiles y tubos estructurales',cat:'Estructura y carrocer\u00EDa',color:'#e8833a',desc:'Las tres secciones base del chasis a escala real: tubo circular, tubo cuadrado (paredes visibles) y canal C.'};

function build(H){
  var A=H.MAT,L=H.L;
  function legs(x){H.cylAB(H.v(x-0.06,0.02,-0.3),H.v(x-0.02,0.1,-0.05),0.008,A.steel);H.cylAB(H.v(x+0.06,0.02,-0.3),H.v(x+0.02,0.1,-0.05),0.008,A.steel);}
  // tubo circular
  H.cylAB(H.v(-0.5,0.135,-0.35),H.v(-0.5,0.135,0.35),0.035,A.alu,28);
  legs(-0.5);
  // tubo cuadrado (4 paredes)
  var s=0.04,tw=0.011,cx=-0.02;
  H.box(s*2,tw,0.7,A.alu,cx,0.1+s-tw/2,0.0);
  H.box(s*2,tw,0.7,A.alu,cx,0.1-s+tw/2,0.0);
  H.box(tw,s*2-2*tw,0.7,A.alu,cx-s+tw/2,0.1,0.0);
  H.box(tw,s*2-2*tw,0.7,A.alu,cx+s-tw/2,0.1,0.0);
  legs(cx);
  // canal C (web + 2 patas)
  H.box(0.07,0.012,0.7,A.alu,0.48,0.205,0.0);
  H.box(0.012,0.09,0.7,A.alu,0.48-0.029,0.16,0.0);
  H.box(0.012,0.09,0.7,A.alu,0.48+0.029,0.16,0.0);
  legs(0.48);
  L.add("Tubo circular \u00D870 mm",-0.5,0.24,-0.1);
  L.add("Tubo cuadrado 80\u00D780 mm",-0.02,0.27,0.05);
  L.add("Canal C (perfil abierto)",0.48,0.29,0.0);
}

/* -- Montaje automatico: busca (o crea) el canvas y arranca la pieza -- */
var SHOT = /shot/.test(location.search);

function showErr(t) {
  var d = document.getElementById("sol-err");
  if (!d) { d = document.createElement("div"); d.id = "sol-err"; d.className = "sol-err"; document.body.appendChild(d); }
  d.style.display = "block";
  d.textContent += t + "\n";
}
window.addEventListener("error", function (e) { showErr("Error: " + (e.message || e)); });

function findCanvas() {
  var c = document.getElementById("canvas") || document.getElementById("pieza") || document.querySelector("canvas");
  if (!c) {
    c = document.createElement("canvas");
    c.style.cssText = "width:100%;height:100%;display:block;outline:none;touch-action:none;position:fixed;inset:0";
    document.body.appendChild(c);
  } else {
    var r = c.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) {
      c.style.cssText += ";width:100%;height:100%;display:block;outline:none;touch-action:none;position:fixed;inset:0";
    }
  }
  return c;
}

function addCard() {
  var card = document.createElement("div");
  card.className = "sol-card";
  var chip = document.createElement("span");
  chip.className = "sol-chip";
  chip.textContent = META.cat;
  chip.style.background = META.color;
  var h1 = document.createElement("h1");
  h1.textContent = META.num + " \u00B7 " + META.name;
  var p = document.createElement("p");
  p.className = "desc";
  p.textContent = META.desc;
  card.appendChild(chip); card.appendChild(h1); card.appendChild(p);
  document.body.appendChild(card);
  var hint = document.createElement("div");
  hint.className = "sol-hint";
  hint.textContent = "Arrastra para orbitar \u00B7 Rueda para acercar \u00B7 El giro se reanuda solo";
  document.body.appendChild(hint);
}

function boot() {
  try {
    var canvas = findCanvas();
    SOLAR_CORE.makeView(canvas, build, { labels: true, accent: META.color, shot: SHOT });
    if (!SHOT) addCard();
  } catch (ex) {
    showErr("Error: " + ((ex && ex.message) || ex));
  }
}

SOLAR_CORE.ensureCSS();
SOLAR_CORE.loadBabylon(boot, function () {
  showErr("No se pudo cargar Babylon.js. Esta pieza necesita internet solo para descargar la librer\u00EDa (CDN). Recarga la p\u00E1gina.");
});
})();
