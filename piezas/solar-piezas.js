/* =================================================================
   solar-piezas.js - las 39 piezas del coche solar en un solo archivo
   Coche solar - renders Babylon.js - categorias 1-6 - v1.0
   -----------------------------------------------------------------
   INTEGRACION EN TU PAGINA / APP:
       <canvas id="miEscena"></canvas>
       <script src="solar-piezas.js"></script>
       <script>
         SolarPart.loadBabylon(function(){
           SolarPart.mount('#miEscena','c4-01'); // motor de traccion
         });
       </script>
   API: SolarPart.mount(canvas|selector, id) - SolarPart.list()
        SolarPart.meta - SolarPart.cats - SolarPart.disposeAll()
   Escala real: 1 unidad = 1 m.  Rejilla de 10 cm.
   ================================================================= */
import * as BABYLON from "@babylonjs/core";
if (typeof window !== "undefined" && !window.BABYLON) {
  window.BABYLON = BABYLON;
}

window.SolarPart=(function(){
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

var CATS=[{n:1,name:'Estructura y carrocer\u00EDa',color:'#e8833a'},{n:2,name:'Sistema solar',color:'#f0b429'},{n:3,name:'Almacenamiento y gesti\u00F3n de energ\u00EDa',color:'#34a06b'},{n:4,name:'Tren motriz',color:'#3f7fd9'},{n:5,name:'Direcci\u00F3n, suspensi\u00F3n y frenos',color:'#8a63d2'},{n:6,name:'Electr\u00F3nica de control y auxiliares',color:'#d4587e'}];
var META={'c1-01':{id:'c1-01',num:'1.1',name:'Chasis / estructura portante',cat:1,color:'#e8833a',desc:'Bastidor tipo spaceframe con arco de seguridad, bandeja de bater\u00EDa y placa de motor. Los nodos esf\u00E9ricos simulan las soldaduras.',file:'piezas/01-chasis.js'},
'c1-02':{id:'c1-02',num:'1.2',name:'Perfiles y tubos estructurales',cat:1,color:'#e8833a',desc:'Las tres secciones base del chasis a escala real: tubo circular, tubo cuadrado (paredes visibles) y canal C.',file:'piezas/02-perfiles.js'},
'c1-03':{id:'c1-03',num:'1.3',name:'Paneles de carrocer\u00EDa',cat:1,color:'#e8833a',desc:'Carenado en composite: nariz el\u00EDptica, panel lateral curvo, piso del habit\u00E1culo y cubierta trasera.',file:'piezas/03-paneles.js'},
'c1-04':{id:'c1-04',num:'1.4',name:'Torniller\u00EDa, remaches y adhesivos',cat:1,color:'#e8833a',desc:'Tornillo con rosca helicoidal, tuerca, arandela, remache de popa y cartucho de adhesivo estructural.',file:'piezas/04-tornilleria.js'},
'c1-05':{id:'c1-05',num:'1.5',name:'Soportes y anclajes',cat:1,color:'#e8833a',desc:'Brida en L con gusset, ojual (eyeleta) de anclaje con pasador y soporte antivibrante de goma.',file:'piezas/05-soportes.js'},
'c1-06':{id:'c1-06',num:'1.6',name:'Asiento y arn\u00E9s de sujeci\u00F3n',cat:1,color:'#e8833a',desc:'Asiento tipo bucket con rieles, laterales de sujeci\u00F3n y arn\u00E9s de 5 puntos con hebilla de liberaci\u00F3n r\u00E1pida.',file:'piezas/06-asiento-arnes.js'},
'c2-01':{id:'c2-01',num:'2.1',name:'Celdas fotovoltaicas',cat:2,color:'#f0b429',desc:'Celda monocristalina con busbars plateados, l\u00EDneas fingers y bordes biselados, m\u00E1s un mini-arreglo en serie.',file:'piezas/07-celdas.js'},
'c2-02':{id:'c2-02',num:'2.2',name:'Encapsulado de las celdas',cat:2,color:'#f0b429',desc:'Despiece del laminado: vidrio templado, EVA, celdas, EVA trasero, backsheet y marco de aluminio.',file:'piezas/08-encapsulado.js'},
'c2-03':{id:'c2-03',num:'2.3',name:'Diodos de bypass',cat:2,color:'#f0b429',desc:'Caja de conexi\u00F3n IP67 con 3 diodos Schottky entre strings y un diodo axial suelto con banda de c\u00E1todo.',file:'piezas/09-diodos.js'},
'c2-04':{id:'c2-04',num:'2.4',name:'Cableado solar',cat:2,color:'#f0b429',desc:'Conductores PV 6 mm\u00B2 de doble aislamiento, positivo y negativo, con puntas peladas esta\u00F1adas y rollo.',file:'piezas/10-cableado-solar.js'},
'c2-05':{id:'c2-05',num:'2.5',name:'Conectores del sistema solar',cat:2,color:'#f0b429',desc:'Par MC4 acoplado y par separado (macho con pin, hembra con z\u00F3calo), con traba de clic sellada IP68.',file:'piezas/11-conectores.js'},
'c2-06':{id:'c2-06',num:'2.6',name:'Estructura de montaje de paneles',cat:2,color:'#f0b429',desc:'Rack inclinado 20\u00B0 con patas en A, rieles, traviesas, abrazaderas medias y placas de anclaje.',file:'piezas/12-estructura-paneles.js'},
'c3-01':{id:'c3-01',num:'3.1',name:'Bater\u00EDa de tracci\u00F3n',cat:3,color:'#34a06b',desc:'Pack Li-ion con dos m\u00F3dulos de celdas 18650, busbars de cobre en serie, terminales M8 y placa refrigerante.',file:'piezas/13-bateria.js'},
'c3-02':{id:'c3-02',num:'3.2',name:'Sistema de gesti\u00F3n de bater\u00EDa (BMS)',cat:3,color:'#34a06b',desc:'Tarjeta con AFE de monitoreo, MOSFET de corte, shunt, headers de balanceo y cables hacia cada celda.',file:'piezas/14-bms.js'},
'c3-03':{id:'c3-03',num:'3.3',name:'Controlador de carga solar (MPPT)',cat:3,color:'#34a06b',desc:'Convertidor con aletas disipadoras, bloques de terminal, pantalla y botones; entrada PV y salida a bater\u00EDa.',file:'piezas/15-mppt.js'},
'c3-04':{id:'c3-04',num:'3.4',name:'Convertidor de voltaje DC-DC',cat:3,color:'#34a06b',desc:'M\u00F3dulo potted que baja la tensi\u00F3n del pack a 13.8 V para auxiliares; vista interior con inductor toroidal.',file:'piezas/16-dcdc.js'},
'c3-05':{id:'c3-05',num:'3.5',name:'Contactor principal',cat:3,color:'#34a06b',desc:'Rel\u00E9 de potencia con terminales M6, tuerca y arandela, bobina de control de 12 V y bridas de fijaci\u00F3n.',file:'piezas/17-contactor.js'},
'c3-06':{id:'c3-06',num:'3.6',name:'Fusibles y portafusibles',cat:3,color:'#34a06b',desc:'Fusible ANL con elemento zigzag visible sobre su portafusible, m\u00E1s fusible tipo cuchilla ATO con base.',file:'piezas/18-fusibles.js'},
'c3-07':{id:'c3-07',num:'3.7',name:'Sensores de corriente y voltaje',cat:3,color:'#34a06b',desc:'Sensor Hall de anillo atravesado por el busbar, shunt de precisi\u00F3n con muestreo Kelvin y divisor de voltaje.',file:'piezas/19-sensores.js'},
'c4-01':{id:'c4-01',num:'4.1',name:'Motor el\u00E9ctrico de tracci\u00F3n',cat:4,color:'#3f7fd9',desc:'Motor BLDC con carcasa aleteada, brida de fijaci\u00F3n, eje de salida, cables de fase U/V/W y sensor Hall.',file:'piezas/20-motor.js'},
'c4-02':{id:'c4-02',num:'4.2',name:'Controlador del motor',cat:4,color:'#3f7fd9',desc:'Inversor con aletas, capacitor del bus, fases al motor, entrada de bater\u00EDa y se\u00F1ales de acelerador/Hall.',file:'piezas/21-controlador-motor.js'},
'c4-03':{id:'c4-03',num:'4.3',name:'Sistema de transmisi\u00F3n',cat:4,color:'#3f7fd9',desc:'Pi\u00F1\u00F3n de 16T, corona de 30T con dientes individuales, cadena cerrada y tensor con polea loca.',file:'piezas/22-transmision.js'},
'c4-04':{id:'c4-04',num:'4.4',name:'Ejes de transmisi\u00F3n',cat:4,color:'#3f7fd9',desc:'Semieje escalonado con caja de diferencial, juntas homocin\u00E9ticas, fuelles de goma y estrias.',file:'piezas/23-ejes.js'},
'c4-05':{id:'c4-05',num:'4.5',name:'Rodamientos y soportes',cat:4,color:'#3f7fd9',desc:'Rodamiento de bolas en despiece (pistas, bolas y jaula) y soporte de bancada tipo pillow block.',file:'piezas/24-rodamientos.js'},
'c4-06':{id:'c4-06',num:'4.6',name:'Ruedas',cat:4,color:'#3f7fd9',desc:'Rin monocasco de 6 brazos con neum\u00E1tico estrecho de alta presi\u00F3n, torniller\u00EDa del cubo y v\u00E1lvula.',file:'piezas/25-ruedas.js'},
'c4-07':{id:'c4-07',num:'4.7',name:'Acoples y sujeciones mec\u00E1nicas',cat:4,color:'#3f7fd9',desc:'Acoplamiento de garra con aranjela el\u00E1stica naranja, acoplamiento de brida partida y collarines.',file:'piezas/26-acoples.js'},
'c5-01':{id:'c5-01',num:'5.1',name:'Volante',cat:5,color:'#8a63d2',desc:'Volante de 3 radios con aro antideslizante, hub de liberaci\u00F3n r\u00E1pida y salida a la columna.',file:'piezas/27-volante.js'},
'c5-02':{id:'c5-02',num:'5.2',name:'Columna de direcci\u00F3n',cat:5,color:'#8a63d2',desc:'Columna inclinada con dos juntas universales, eje intermedio, cremallera y terminales de direcci\u00F3n.',file:'piezas/28-columna.js'},
'c5-03':{id:'c5-03',num:'5.3',name:'Brazos y r\u00F3tulas de direcci\u00F3n',cat:5,color:'#8a63d2',desc:'Brazo en A con r\u00F3tula esf\u00E9rica, bieleta ajustable con tuerca y rod ends con pivotes al chasis.',file:'piezas/29-brazos-rotulas.js'},
'c5-04':{id:'c5-04',num:'5.4',name:'Sistema de suspensi\u00F3n',cat:5,color:'#8a63d2',desc:'Esquina con doble horquilla (brazos superior e inferior), mangueta, buje y pushrod hacia la torreta.',file:'piezas/30-suspension.js'},
'c5-05':{id:'c5-05',num:'5.5',name:'Amortiguadores y resortes',cat:5,color:'#8a63d2',desc:'Monoamortiguador coilover: cuerpo, v\u00E1stago cromado, ojales con buje y resorte helicoidal con copelas.',file:'piezas/31-amortiguadores.js'},
'c5-06':{id:'c5-06',num:'5.6',name:'Sistema de frenos',cat:5,color:'#8a63d2',desc:'Disco ventilado perforado, c\u00E1liper naranja con pastilla, manguera hidr\u00E1ulica con banjo y torniller\u00EDa.',file:'piezas/32-frenos.js'},
'c5-07':{id:'c5-07',num:'5.7',name:'Pedales y cables/mangueras',cat:5,color:'#8a63d2',desc:'Pedalera con eje de pivotes, pedal de freno y acelerador, cilindro maestro con dep\u00F3sito y l\u00EDneas.',file:'piezas/33-pedales.js'},
'c6-01':{id:'c6-01',num:'6.1',name:'Unidad de control electr\u00F3nico',cat:6,color:'#d4587e',desc:'ECU en carcasa de aluminio sellada IP67, conectores multipin dorados, LED de estado y orejas de montaje.',file:'piezas/34-ecu.js'},
'c6-02':{id:'c6-02',num:'6.2',name:'Arn\u00E9s de cableado',cat:6,color:'#d4587e',desc:'Faisl\u00E1n principal con manguera, tres derivaciones de colores, conectores sellados y cintas de agrupamiento.',file:'piezas/35-arnes.js'},
'c6-03':{id:'c6-03',num:'6.3',name:'Interruptores y pulsadores',cat:6,color:'#d4587e',desc:'Panel con interruptor de palanca, basculante de encendido, pulsador iluminado y terminales traseros.',file:'piezas/36-interruptores.js'},
'c6-04':{id:'c6-04',num:'6.4',name:'Instrumentaci\u00F3n o telemetr\u00EDa',cat:6,color:'#d4587e',desc:'Pantalla con velocidad/SOC/potencia solar, tac\u00F3metro con aguja, m\u00F3dulo de telemetr\u00EDa y antena GPS.',file:'piezas/37-instrumentacion.js'},
'c6-05':{id:'c6-05',num:'6.5',name:'Luces y bocina',cat:6,color:'#d4587e',desc:'Faro LED con lente y aro, luz trasera roja y bocina de disco de 12 V con soporte antivibrante.',file:'piezas/38-luces-bocina.js'},
'c6-06':{id:'c6-06',num:'6.6',name:'Conectores y protecciones el\u00E9ctricas',cat:6,color:'#d4587e',desc:'Conector de 4 v\u00EDas dorado, rel\u00E9 de 12 V, varistor supresor y bloque de fusibles auxiliar.',file:'piezas/39-conectores-protecciones.js'}};

var BUILDERS={};
BUILDERS['c1-01']=(function build(H){
  var v=H.v,A=H.MAT,L=H.L;
  function rail(a,b,r){H.cylAB(a,b,r,A.darksteel,10);}
  function node(x,y,z){H.sphere(0.045,A.darksteel,x,y,z,10);}
  // bastidor inferior: largueros y morro (eje Z = adelante)
  rail(v(-0.45,0.14,-1.25),v(-0.45,0.14,0.95),0.021);
  rail(v(0.45,0.14,-1.25),v(0.45,0.14,0.95),0.021);
  rail(v(-0.45,0.14,0.95),v(-0.10,0.14,1.55),0.018);
  rail(v(0.45,0.14,0.95),v(0.10,0.14,1.55),0.018);
  rail(v(-0.10,0.14,1.55),v(0.10,0.14,1.55),0.016);
  rail(v(-0.45,0.14,-1.25),v(-0.28,0.14,-1.45),0.018);
  rail(v(0.45,0.14,-1.25),v(0.28,0.14,-1.45),0.018);
  rail(v(-0.28,0.14,-1.45),v(0.28,0.14,-1.45),0.016);
  // traviesas del piso
  for(var i=0;i<4;i++){var z=-1.0+i*0.62;rail(v(-0.45,0.14,z),v(0.45,0.14,z),0.017);}
  // pista superior y postes
  rail(v(-0.45,0.52,-0.95),v(-0.45,0.52,0.62),0.017);
  rail(v(0.45,0.52,-0.95),v(0.45,0.52,0.62),0.017);
  rail(v(-0.45,0.52,-0.95),v(0.45,0.52,-0.95),0.017);
  rail(v(-0.45,0.52,0.62),v(0.45,0.52,0.62),0.017);
  rail(v(-0.45,0.14,-0.95),v(-0.45,0.52,-0.95),0.017);
  rail(v(0.45,0.14,-0.95),v(0.45,0.52,-0.95),0.017);
  rail(v(-0.45,0.14,0.62),v(-0.45,0.52,0.62),0.017);
  rail(v(0.45,0.14,0.62),v(0.45,0.52,0.62),0.017);
  // arco principal (roll bar)
  var arc=[];for(var k=0;k<=14;k++){var t=k/14,ang=Math.PI*t;arc.push(v(Math.cos(ang)*0.45,0.52+Math.sin(ang)*0.32,0.16));}
  H.tubePath(arc,0.021,A.steel,12);
  // diagonales de refuerzo
  rail(v(-0.45,0.14,-0.3),v(0.45,0.52,-0.95),0.013);
  rail(v(0.45,0.14,-0.3),v(-0.45,0.52,-0.95),0.013);
  // bandeja de bater\u00EDa y placa de motor
  rail(v(-0.40,0.30,-1.35),v(0.40,0.30,-1.35),0.014);
  rail(v(-0.40,0.30,-0.85),v(0.40,0.30,-0.85),0.014);
  rail(v(-0.40,0.30,-1.35),v(-0.40,0.30,-0.85),0.014);
  rail(v(0.40,0.30,-1.35),v(0.40,0.30,-0.85),0.014);
  H.box(0.16,0.012,0.5,A.alu,0,0.32,-1.1);
  // nodos soldados
  [-0.45,0.45].forEach(function(x){node(x,0.14,-0.95);node(x,0.14,0.62);node(x,0.52,-0.95);node(x,0.52,0.62);});
  node(-0.10,0.14,1.55);node(0.10,0.14,1.55);
  L.add("Arco principal (seguridad)",0,0.92,0.16);
  L.add("Largueros laterales",-0.45,0.32,0.1);
  L.add("Traviesas del piso",0,0.13,-0.38);
  L.add("Bandeja de bater\u00EDa",0,0.46,-1.1);
  L.add("Placa de soporte del motor",0.32,0.36,-1.1);
});
BUILDERS['c1-02']=(function build(H){
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
});
BUILDERS['c1-03']=(function build(H){
  var A=H.MAT,L=H.L;
  var comp=H.M("#e8ecef",{spec:0.3});
  // nariz: media elipsoide (carena naranja)
  var nose=H.sphere(0.62,comp,0,0.2,0.9,24);
  nose.scaling.set(0.9,0.55,2.0);
  // panel lateral curvo (ribbon)
  var c1=[],c2=[];
  for(var i=0;i<=8;i++){
    var z=-0.9+i*0.24,bulge=0.06*Math.sin(Math.PI*i/8);
    c1.push(H.v(-0.5-bulge,0.12,z));
    c2.push(H.v(-0.5-bulge,0.44,z));
  }
  var side=BABYLON.MeshBuilder.CreateRibbon("side",{pathArray:[c1,c2]},H.scene);
  side.material=comp;side.parent=H.root;side.isPickable=false;
  // piso
  H.box(1.0,0.014,2.3,A.black,0,0.05,-0.1);
  // cubierta trasera
  H.box(0.85,0.014,0.7,comp,0,0.56,-0.6);
  L.add("Panel de nariz (composite)",0,0.36,1.1);
  L.add("Panel lateral curvo",-0.62,0.3,-0.15);
  L.add("Piso del habit\u00E1culo",0.55,0.07,-0.1);
  L.add("Cubierta trasera",0,0.62,-0.6);
});
BUILDERS['c1-04']=(function build(H){
  var A=H.MAT,L=H.L;
  // tornillo
  H.hex(0.024,0.013,A.steel,-0.42,0.0065,0);
  H.cyl(0.014,0.075,A.steel,-0.42,0.05,0);
  var th=[];for(var i=0;i<=40;i++){var t=i/40;th.push(H.v(-0.42+Math.cos(t*Math.PI*6)*0.0076,0.018+t*0.058,Math.sin(t*Math.PI*6)*0.0076));}
  H.tubePath(th,0.0011,A.darksteel,6);
  L.add("Tornillo M8 con rosca",-0.42,0.16,0.05);
  // tuerca + arandela
  H.torus(0.036,0.004,A.steel,-0.12,0.003,0).scaling.y=0.45;
  H.hex(0.027,0.015,A.steel,-0.12,0.017,0);
  H.cyl(0.015,0.017,A.black,-0.12,0.017,0);
  L.add("Tuerca M8",-0.12,0.1,0.06);
  L.add("Arandela plana",-0.12,0.05,-0.06);
  // remache de cabeza abombada
  H.cyl(0.008,0.03,A.alu,0.15,0.015,0);
  var dome=H.sphere(0.017,A.alu,0.15,0.031,0,12);dome.scaling.y=0.6;
  L.add("Remache de popa",0.15,0.09,0.05);
  // cartucho de adhesivo estructural
  H.cyl(0.05,0.22,A.white,-0.02,0.13,0.4);
  H.cyl(0.051,0.05,A.orange,-0.02,0.13,0.4);
  H.cone(0.012,0.03,0.07,A.plastic,-0.02,0.27,0.4);
  H.cyl(0.048,0.02,A.black,-0.02,0.01,0.4);
  L.add("Cartucho de adhesivo estructural",-0.02,0.3,0.52);
});
BUILDERS['c1-05']=(function build(H){
  var A=H.MAT,L=H.L;
  // brida en L con gusset
  H.box(0.14,0.012,0.07,A.alu,-0.35,0.012,0);
  H.box(0.14,0.075,0.012,A.alu,-0.35,0.049,-0.03);
  var gus=H.box(0.06,0.062,0.008,A.alu,-0.35,0.036,-0.026);gus.rotation.z=0.79;
  [[-0.41,0.0],[-0.29,0.0]].forEach(function(p){H.cyl(0.009,0.014,A.black,p[0],0.012,p[1]);});
  [[-0.41,-0.03],[-0.29,-0.03]].forEach(function(p){H.cyl(0.009,0.014,A.black,p[0],0.055,p[1]);});
  L.add("Brida en L con gusset",-0.35,0.13,0.06);
  // ojual de anclaje
  H.box(0.07,0.008,0.03,A.steel,0.05,0.006,0);
  var ring=H.torus(0.034,0.007,A.steel,0.05,0.026,0);
  H.cylAB(H.v(0.05,0.026,-0.012),H.v(0.05,0.026,0.012),0.004,A.darksteel);
  L.add("Ojual (eyeleta) de anclaje",0.05,0.11,0.05);
  // antivibrante de goma
  H.box(0.05,0.008,0.05,A.steel,0.4,0.048,0);
  H.box(0.05,0.008,0.05,A.steel,0.4,0.008,0);
  H.cyl(0.04,0.032,A.rubber,0.4,0.028,0);
  H.cyl(0.012,0.07,A.steel,0.4,0.045,0);
  H.hex(0.02,0.008,A.steel,0.4,0.084,0);
  L.add("Soporte antivibrante (goma)",0.4,0.13,0.06);
});
BUILDERS['c1-06']=(function build(H){
  var A=H.MAT,L=H.L;
  // asiento tipo bucket
  var shell=H.M("#2b3038",{spec:0.12});
  H.box(0.44,0.09,0.42,A.seat,0,0.3,0.06);
  var back=H.box(0.44,0.56,0.08,A.seat,0,0.6,-0.16);back.rotation.x=-0.21;
  var shBack=H.box(0.48,0.6,0.03,shell,0,0.6,-0.24);shBack.rotation.x=-0.21;
  var l1=H.box(0.06,0.1,0.42,A.seat,-0.2,0.33,0.06);l1.rotation.z=0.35;
  var l2=H.box(0.06,0.1,0.42,A.seat,0.2,0.33,0.06);l2.rotation.z=-0.35;
  var b1=H.box(0.06,0.5,0.08,A.seat,-0.2,0.62,-0.12);b1.rotation.z=0.3;b1.rotation.x=-0.21;
  var b2=H.box(0.06,0.5,0.08,A.seat,0.2,0.62,-0.12);b2.rotation.z=-0.3;b2.rotation.x=-0.21;
  H.box(0.2,0.12,0.06,A.seat,0,0.92,-0.28);
  // rieles
  H.cylAB(H.v(-0.17,0.14,-0.22),H.v(-0.17,0.14,0.28),0.012,A.steel);
  H.cylAB(H.v(0.17,0.14,-0.22),H.v(0.17,0.14,0.28),0.012,A.steel);
  H.cylAB(H.v(-0.17,0.14,0.24),H.v(0.17,0.14,0.24),0.01,A.darksteel);
  // arn\u00E9s de 5 puntos
  var s1=H.box(0.075,0.52,0.008,A.strap,-0.11,0.62,-0.1);s1.rotation.x=-0.21;
  var s2=H.box(0.075,0.52,0.008,A.strap,0.11,0.62,-0.1);s2.rotation.x=-0.21;
  H.box(0.09,0.014,0.3,A.strap,0,0.27,0.16);
  H.box(0.26,0.014,0.09,A.strap,0,0.27,0.16);
  H.box(0.085,0.035,0.055,A.steel,0,0.285,0.2);
  H.box(0.05,0.05,0.02,A.alu,-0.11,0.87,-0.2);
  H.box(0.05,0.05,0.02,A.alu,0.11,0.87,-0.2);
  L.add("Coj\u00EDn del asiento",0.28,0.34,0.2);
  L.add("Respaldo",0.28,0.72,-0.24);
  L.add("Hombreras del arn\u00E9s (5 puntos)",-0.14,0.66,-0.05);
  L.add("Hebilla de liberaci\u00F3n r\u00E1pida",0,0.3,0.3);
  L.add("Rieles de anclaje al chasis",0,0.07,0.35);
});
BUILDERS['c2-01']=(function build(H){
  var A=H.MAT,L=H.L;
  // celda grande en caballete
  var cell=H.cyl(0.156,0.0022,A.pvblue,-0.25,0.2,0,8);
  cell.rotation.z=Math.PI/8;cell.rotation.x=Math.PI/2;
  // busbars y finger lines sobre la celda
  var grpC=H.grp(-0.25,0.203,0);grpC.rotation.z=Math.PI/8;grpC.rotation.x=Math.PI/2;
  for(var b=-1;b<=1;b++){
    var bb=H.box(0.15,0.0006,0.0045,A.alu,0,b*0.042,0);bb.parent=grpC;
  }
  for(var f=-4;f<=4;f++){
    var fl=H.box(0.0008,0.13,0.0012,A.cellline,0,0,0);
    fl.parent=grpC;fl.position.set(f*0.016,0,0.0);
  }
  // caballete
  H.cylAB(H.v(-0.36,0.02,0.08),H.v(-0.28,0.19,-0.03),0.006,A.steel);
  H.cylAB(H.v(-0.14,0.02,0.08),H.v(-0.22,0.19,-0.03),0.006,A.steel);
  H.box(0.24,0.012,0.14,A.darksteel,-0.25,0.006,0.1);
  // mini arreglo 3x2 en serie
  for(var r=0;r<2;r++)for(var c=0;c<3;c++){
    var x=0.14+c*0.185,y=0.13,z=-0.09+r*0.2;
    var m=H.cyl(0.16,0.002,A.pvblue,x,y,z,8);
    m.rotation.x=Math.PI/2;m.rotation.z=Math.PI/8;
    H.box(0.05,0.003,0.006,A.alu,x,y+0.002,z+0.088);
  }
  H.box(0.6,0.012,0.42,A.darksteel,0.325,0.124,0.0);
  L.add("Celda monocristalina (silicio)",-0.25,0.34,0.12);
  L.add("Busbars plateados (3)",-0.25,0.27,-0.12);
  L.add("Bordes biselados (pseudo-cuadrado)",-0.25,0.12,-0.2);
  L.add("Mini-arreglo en serie (tabbing)",0.325,0.28,0.28);
});
BUILDERS['c2-02']=(function build(H){
  var A=H.MAT,L=H.L;
  var S=0.32;
  // vidrio
  H.box(S,0.004,S,A.glass,0,0.34,0);
  // EVA frontal
  H.box(S,0.0025,S,A.eva,0,0.26,0);
  // celdas 2x2
  for(var r=0;r<2;r++)for(var c=0;c<2;c++){
    var m=H.cyl(0.14,0.0022,A.pvblue,-0.08+c*0.16,0.18,-0.08+r*0.16,8);
    m.rotation.x=Math.PI/2;m.rotation.z=Math.PI/8;
  }
  // EVA trasero
  H.box(S,0.0025,S,A.eva,0,0.10,0);
  // backsheet
  H.box(S,0.002,S,A.white,0,0.02,0);
  // marco de aluminio alrededor del vidrio
  var fw=0.012;
  H.box(S+fw*2,fw,0.012,A.alu,0,0.34,S/2+fw/2);
  H.box(S+fw*2,fw,0.012,A.alu,0,0.34,-S/2-fw/2);
  H.box(0.012,fw,S,A.alu,S/2+fw/2,0.34,0);
  H.box(0.012,fw,S,A.alu,-S/2-fw/2,0.34,0);
  L.add("Vidrio templado (3.2 mm)",0.24,0.36,0.22);
  L.add("Encapsulante EVA frontal",0.24,0.27,0.2);
  L.add("Celdas fotovoltaicas",-0.24,0.19,0.2);
  L.add("EVA trasero",0.24,0.1,0.2);
  L.add("Backsheet blanco (TEDLAR)",0.24,0.02,0.2);
  L.add("Marco de aluminio",-0.26,0.37,-0.22);
});
BUILDERS['c2-03']=(function build(H){
  var A=H.MAT,L=H.L;
  // caja de conexi\u00F3n con tapa abierta
  H.box(0.1,0.03,0.065,A.plastic,0,0.015,0);
  var lid=H.box(0.1,0.008,0.065,A.plastic,0,0.055,-0.058);lid.rotation.x=1.85;
  H.box(0.075,0.002,0.045,A.pcb,0,0.032,0);
  // 3 diodos sobre la placa
  for(var i=-1;i<=1;i++){
    H.cyl(0.009,0.028,A.black,i*0.028,0.041,0.004,16).rotation.z=Math.PI/2;
    H.cyl(0.0095,0.004,A.gray,i*0.028-0.015,0.041,0.004,16).rotation.z=Math.PI/2;
    H.cyl(0.0095,0.004,A.gray,i*0.028+0.015,0.041,0.004,16).rotation.z=Math.PI/2;
  }
  // barras de cobre y cables
  H.box(0.09,0.003,0.006,A.copper,0,0.034,-0.016);
  H.box(0.09,0.003,0.006,A.copper,0,0.034,0.016);
  H.tubePath([H.v(-0.05,0.01,0.03),H.v(-0.09,0.01,0.05),H.v(-0.14,0.01,0.04),H.v(-0.18,0.01,0.07)],0.004,A.red);
  H.tubePath([H.v(0.05,0.01,0.03),H.v(0.09,0.01,0.05),H.v(0.14,0.01,0.04),H.v(0.18,0.01,0.07)],0.004,A.blue);
  H.tubePath([H.v(0,0.01,0.03),H.v(0,0.01,0.08),H.v(0.02,0.01,0.12)],0.004,A.black);
  // diodo axial grande aparte
  var dx=0.32;
  H.cyl(0.013,0.05,A.black,dx,0.008,0,20).rotation.z=Math.PI/2;
  H.cyl(0.0135,0.006,A.white,dx,0.008,0,20).rotation.z=Math.PI/2;
  H.cyl(0.006,0.05,A.gray,dx-0.033,0.008,0,12).rotation.z=Math.PI/2;
  H.cyl(0.006,0.05,A.gray,dx+0.033,0.008,0,12).rotation.z=Math.PI/2;
  L.add("Caja de conexi\u00F3n IP67",0,0.1,0.1);
  L.add("3 diodos de bypass (Schottky)",-0.05,0.09,-0.05);
  L.add("Barras de cobre entre strings",0.12,0.06,0.08);
  L.add("Diodo axial: banda = c\u00E1todo",0.32,0.06,0.05);
  L.add("Salida al MPPT",0.18,0.03,0.12);
});
BUILDERS['c2-04']=(function build(H){
  var A=H.MAT,L=H.L;
  // cable positivo rojo serpenteante
  H.tubePath([H.v(-0.35,0.006,-0.3),H.v(-0.15,0.006,-0.2),H.v(0.0,0.006,-0.32),H.v(0.2,0.006,-0.18),H.v(0.33,0.006,-0.02)],0.005,A.red);
  // punta pelada con hilos
  H.cyl(0.006,0.025,A.copper,0.35,0.006,0.01,10).rotation.x=Math.PI/2;
  H.tubePath([H.v(0.352,0.006,0.02),H.v(0.37,0.006,0.045)],0.0012,A.copper,6);
  H.tubePath([H.v(0.35,0.006,0.022),H.v(0.345,0.006,0.05)],0.0012,A.copper,6);
  H.tubePath([H.v(0.348,0.006,0.022),H.v(0.36,0.008,0.048)],0.0012,A.copper,6);
  L.add("Positivo (rojo) 6 mm\u00B2",-0.15,0.06,-0.1);
  L.add("Punta pelada esta\u00F1ada",0.37,0.05,0.05);
  // cable negro
  H.tubePath([H.v(-0.3,0.006,0.25),H.v(-0.1,0.006,0.15),H.v(0.08,0.006,0.3),H.v(0.3,0.006,0.22)],0.005,A.black);
  L.add("Negativo (negro) 6 mm\u00B2",0.05,0.06,0.38);
  // rollo de cable
  var coil=[];
  for(var i=0;i<=120;i++){var t=i/120,ang=t*Math.PI*10;
    coil.push(H.v(-0.55+0.05*Math.cos(ang),0.03+0.002*Math.sin(ang*2),0.45+0.05*Math.sin(ang)));}
  H.tubePath(coil,0.004,A.red);
  L.add("Rollo (doble aislamiento XLPE)",-0.55,0.12,0.55);
});
BUILDERS['c2-05']=(function build(H){
  var A=H.MAT,L=H.L;
  // par acoplado en el centro
  H.cyl(0.016,0.05,A.black,0,0.06,0.0,20);
  H.cone(0.008,0.015,0.03,A.black,0,0.015,0);
  H.cyl(0.016,0.045,A.black,0,0.105,0.0,20);
  H.box(0.006,0.03,0.024,A.black,0.008,0.105,0);
  H.box(0.006,0.03,0.024,A.black,-0.008,0.105,0);
  H.tubePath([H.v(0,0.005,0),H.v(0.02,0.004,0.05),H.v(0.06,0.004,0.08)],0.005,A.black);
  L.add("Par MC4 acoplado",0,0.17,0.05);
  // macho separado
  var mx=-0.3;
  H.cyl(0.016,0.045,A.black,mx,0.05,-0.15,20);
  H.cyl(0.017,0.006,A.gray,mx,0.076,-0.15,20);
  H.cyl(0.004,0.018,A.gold,mx,0.088,-0.15,10);
  H.box(0.006,0.028,0.022,A.black,mx+0.009,0.05,-0.15);
  H.tubePath([H.v(mx,0.005,-0.15),H.v(mx-0.03,0.004,-0.2),H.v(mx-0.07,0.004,-0.18)],0.005,A.red);
  L.add("Macho (pin central)",mx,0.13,-0.1);
  // hembra separada
  var fx=0.3;
  H.cyl(0.016,0.045,A.black,fx,0.05,-0.15,20);
  H.cyl(0.017,0.006,A.gray,fx,0.076,-0.15,20);
  H.cyl(0.006,0.008,A.black,fx,0.085,-0.15,10);
  H.box(0.006,0.028,0.022,A.black,fx-0.009,0.05,-0.15);
  H.tubePath([H.v(fx,0.005,-0.15),H.v(fx+0.03,0.004,-0.2),H.v(fx+0.07,0.004,-0.18)],0.005,A.black);
  L.add("Hembra (z\u00F3calo)",fx,0.13,-0.1);
  L.add("Traba de clic (IP68)",0,0.08,-0.06);
});
BUILDERS['c2-06']=(function build(H){
  var A=H.MAT,L=H.L;
  var ang=0.35; // ~20 grados
  // patas en A
  H.cylAB(H.v(-0.42,0.02,0.4),H.v(-0.42,0.5,-0.32),0.016,A.steel);
  H.cylAB(H.v(-0.42,0.02,-0.42),H.v(-0.42,0.5,-0.32),0.016,A.steel);
  H.cylAB(H.v(0.42,0.02,0.4),H.v(0.42,0.5,-0.32),0.016,A.steel);
  H.cylAB(H.v(0.42,0.02,-0.42),H.v(0.42,0.5,-0.32),0.016,A.steel);
  H.cylAB(H.v(-0.42,0.24,0.05),H.v(0.42,0.24,0.05),0.012,A.darksteel);
  // rieles inclinados
  H.cylAB(H.v(-0.4,0.48,0.32),H.v(-0.4,0.72,-0.34),0.014,A.alu);
  H.cylAB(H.v(0.4,0.48,0.32),H.v(0.4,0.72,-0.34),0.014,A.alu);
  // traviesas
  H.cylAB(H.v(-0.4,0.55,0.13),H.v(0.4,0.55,0.13),0.01,A.darksteel);
  H.cylAB(H.v(-0.4,0.66,-0.15),H.v(0.4,0.66,-0.15),0.01,A.darksteel);
  // panel con marco
  var pg=H.grp(0,0.64,-0.01);pg.rotation.x=ang;
  var pn=H.box(0.88,0.022,0.62,A.pvblue,0,0,0);pn.parent=pg;
  H.box(0.9,0.02,0.014,A.alu,0,0,0.31).parent=pg;
  H.box(0.9,0.02,0.014,A.alu,0,0,-0.31).parent=pg;
  H.box(0.014,0.02,0.62,A.alu,0.443,0,0).parent=pg;
  H.box(0.014,0.02,0.62,A.alu,-0.443,0,0).parent=pg;
  // abrazaderas medias
  H.box(0.03,0.02,0.03,A.gray,-0.41,0.575,-0.01);
  H.box(0.03,0.02,0.03,A.gray,0.41,0.575,-0.01);
  // placas de anclaje
  H.box(0.1,0.01,0.1,A.steel,-0.42,0.012,0.4);H.box(0.1,0.01,0.1,A.steel,0.42,0.012,0.4);
  H.box(0.1,0.01,0.1,A.steel,-0.42,0.012,-0.42);H.box(0.1,0.01,0.1,A.steel,0.42,0.012,-0.42);
  L.add("Rieles inclinados a 20\u00B0",0,0.78,0.3);
  L.add("Traviesas",-0.5,0.58,0.13);
  L.add("Abrazadera media",0.47,0.6,0.03);
  L.add("Placas de anclaje al suelo",0.3,0.05,0.5);
});
BUILDERS['c3-01']=(function build(H){
  var A=H.MAT,L=H.L;
  // caja del pack en corte (sin paredes frontales para ver el interior)
  H.box(0.6,0.012,0.4,A.plastic,0,0.006,0);
  H.box(0.6,0.14,0.012,A.plastic,0,0.076,-0.194);
  H.box(0.012,0.14,0.4,A.plastic,-0.294,0.076,0);
  var lid=H.box(0.6,0.01,0.4,A.plastic,0,0.006,-0.52);
  // placa refrigerante
  H.box(0.56,0.012,0.36,A.alu,0,0.024,0);
  // dos m\u00F3dulos con 6 celdas 18650 cada uno
  for(var m=0;m<2;m++){
    var mx=-0.14+m*0.28;
    for(var r=0;r<2;r++)for(var c=0;c<3;c++){
      H.cyl(0.033,0.115,A.gray,mx-0.09+c*0.09,0.088,-0.075+r*0.15,18);
    }
    // busbars en serie
    for(var c2=0;c2<2;c2++){
      H.box(0.012,0.004,0.16,A.copper,mx-0.045+c2*0.09,0.147,0);
    }
    H.box(0.19,0.004,0.012,A.copper,mx,0.147,-0.075);
    H.box(0.19,0.004,0.012,A.copper,mx,0.147,0.075);
  }
  // barra de uni\u00F3n entre m\u00F3dulos + terminales
  H.box(0.05,0.004,0.012,A.copper,0,0.147,0.075);
  H.box(0.02,0.012,0.02,A.red,0.27,0.16,0.075);
  H.cyl(0.012,0.02,A.brass,0.27,0.18,0.075,16);
  H.box(0.02,0.012,0.02,A.black,-0.27,0.16,0.075);
  H.cyl(0.012,0.02,A.darksteel,-0.27,0.18,0.075,16);
  // BMS en la pared
  H.box(0.18,0.003,0.09,A.pcb,0.05,0.1,-0.17);
  L.add("M\u00F3dulos de celdas Li-ion",-0.14,0.24,0.1);
  L.add("Busbars de cobre (serie)",0.14,0.2,-0.05);
  L.add("Terminal positivo M8",0.27,0.25,0.15);
  L.add("Terminal negativo",-0.27,0.25,0.15);
  L.add("Placa de refrigeraci\u00F3n",0,0.05,0.24);
  L.add("BMS montado en pared",0.05,0.16,-0.28);
});
BUILDERS['c3-02']=(function build(H){
  var A=H.MAT,L=H.L;
  H.box(0.16,0.003,0.1,A.pcb,0,0.02,0);
  // AFEs
  for(var i=-1;i<=1;i++) H.box(0.018,0.004,0.014,A.black,i*0.045,0.024,0.01);
  // MOSFET de corte
  H.box(0.03,0.005,0.02,A.black,0,0.025,-0.032);
  // shunt
  H.box(0.05,0.004,0.014,A.steel,0.045,0.025,-0.032);
  H.cyl(0.012,0.008,A.brass,0.022,0.03,-0.032,14);
  H.cyl(0.012,0.008,A.brass,0.068,0.03,-0.032,14);
  // headers de balanceo + cables delgados
  H.box(0.035,0.01,0.012,A.white,-0.05,0.028,-0.032);
  H.box(0.035,0.01,0.012,A.white,0.005,0.028,-0.032);
  var cols=["red","orange","yellow","green","blue","purple"];
  cols.forEach(function(cn,ix){
    var x=-0.062+ix*0.011;
    H.tubePath([H.v(x,0.03,-0.03),H.v(x*1.5,0.05,-0.09),H.v(x*2.2,0.02,-0.16),H.v(x*2.6,0.004,-0.2)],0.0015,A[cn],6);
  });
  // condensadores y LEDs
  H.cyl(0.01,0.02,A.black,-0.065,0.034,0.038,14);
  H.cyl(0.01,0.02,A.black,-0.045,0.034,0.038,14);
  H.box(0.004,0.003,0.003,A.ledG,-0.02,0.024,0.04);
  H.box(0.004,0.003,0.003,A.ledR,-0.01,0.024,0.04);
  // soportes
  [[-0.07,0.04],[0.07,0.04],[-0.07,-0.04],[0.07,-0.04]].forEach(function(p){H.cyl(0.008,0.02,A.rubber,p[0],0.01,p[1],10);});
  L.add("AFE de monitoreo de celdas",-0.045,0.07,0.06);
  L.add("MOSFET de corte",0,0.06,-0.09);
  L.add("Shunt de corriente",0.075,0.06,-0.09);
  L.add("Conectores de balanceo",-0.03,0.07,-0.07);
  L.add("Cables a cada celda",-0.1,0.03,-0.22);
  L.add("LED de estado",0,0.05,0.07);
});
BUILDERS['c3-03']=(function build(H){
  var A=H.MAT,L=H.L;
  H.box(0.24,0.085,0.11,A.plastic,0,0.05,0);
  // aletas
  for(var i=0;i<9;i++) H.box(0.005,0.085,0.1,A.plastic,-0.1+i*0.025,0.05,0);
  H.box(0.24,0.09,0.11,A.plastic,0,0.045,0);
  // bloques de terminales
  var gterm=H.M("#2c8a4b",{spec:0.2});
  H.box(0.1,0.02,0.025,gterm,-0.05,0.1,0.055);
  H.box(0.1,0.02,0.025,gterm,0.05,0.1,0.055);
  for(var s=0;s<4;s++){
    H.cyl(0.008,0.006,A.steel,-0.085+s*0.024,0.113,0.055,12);
    H.cyl(0.008,0.006,A.steel,0.015+s*0.024,0.113,0.055,12);
  }
  // pantalla y botones
  H.box(0.05,0.025,0.004,A.screen,-0.05,0.05,0.057);
  H.cyl(0.012,0.006,A.black,0.03,0.05,0.057,14);
  H.cyl(0.012,0.006,A.black,0.06,0.05,0.057,14);
  // cables PV y bater\u00EDa
  H.tubePath([H.v(-0.08,0.11,0.06),H.v(-0.14,0.13,0.14),H.v(-0.2,0.13,0.2)],0.005,A.red);
  H.tubePath([H.v(-0.05,0.11,0.06),H.v(-0.1,0.13,0.15),H.v(-0.16,0.13,0.22)],0.005,A.black);
  H.tubePath([H.v(0.05,0.11,0.06),H.v(0.12,0.13,0.14),H.v(0.18,0.13,0.2)],0.006,A.red);
  H.tubePath([H.v(0.08,0.11,0.06),H.v(0.15,0.13,0.15),H.v(0.21,0.13,0.22)],0.006,A.black);
  // sensor de temperatura
  H.tubePath([H.v(0.1,0.05,0.057),H.v(0.15,0.04,0.12),H.v(0.14,0.01,0.16)],0.002,A.white,6);
  L.add("Aletas disipadoras",0,0.14,-0.04);
  L.add("Entrada solar (PV)",-0.2,0.18,0.22);
  L.add("Salida a bater\u00EDa",0.2,0.18,0.22);
  L.add("Pantalla y botones (MPPT)",0.02,0.09,0.12);
  L.add("Sensor de temperatura de bater\u00EDa",0.16,0.04,0.16);
});
BUILDERS['c3-04']=(function build(H){
  var A=H.MAT,L=H.L;
  // unidad sellada (potting)
  H.box(0.16,0.012,0.1,A.alu,0,0.006,0);
  H.box(0.16,0.055,0.1,A.black,0,0.04,0);
  H.box(0.05,0.006,0.03,A.gray,-0.03,0.07,0);
  // orejas
  H.box(0.03,0.008,0.05,A.alu,-0.095,0.04,0);
  H.box(0.03,0.008,0.05,A.alu,0.095,0.04,0);
  H.cyl(0.008,0.012,A.black,-0.1,0.04,0,10).rotation.z=Math.PI/2;
  H.cyl(0.008,0.012,A.black,0.1,0.04,0,10).rotation.z=Math.PI/2;
  // cables alta tensi\u00F3n
  H.tubePath([H.v(-0.06,0.03,-0.05),H.v(-0.12,0.01,-0.12),H.v(-0.2,0.01,-0.16)],0.006,A.red);
  H.tubePath([H.v(-0.04,0.03,-0.05),H.v(-0.09,0.01,-0.14),H.v(-0.17,0.01,-0.18)],0.006,A.black);
  H.tubePath([H.v(0.06,0.03,0.02),H.v(0.14,0.01,0.08),H.v(0.2,0.01,0.1)],0.004,A.yellow);
  H.tubePath([H.v(0.06,0.03,-0.02),H.v(0.14,0.01,-0.06),H.v(0.2,0.01,-0.08)],0.004,A.black);
  // variante abierta con inductor toroidal
  var ox=0.42;
  H.box(0.12,0.003,0.09,A.pcb,ox,0.02,0.25);
  var tor=H.torus(0.05,0.014,A.copper,ox,0.045,0.25);
  tor.scaling.y=1.2;
  H.cyl(0.016,0.025,A.black,ox-0.035,0.035,0.21,14);
  H.cyl(0.016,0.025,A.black,ox+0.035,0.035,0.21,14);
  L.add("Carcasa potted (resina)",0,0.12,-0.03);
  L.add("Entrada HV del pack (48\u201396 V)",-0.2,0.08,-0.18);
  L.add("Salida 13.8 V a auxiliares",0.2,0.08,0.12);
  L.add("Base disipadora",0.1,0.02,0.08);
  L.add("Vista interior: inductor toroidal",0.42,0.14,0.3);
});
BUILDERS['c3-05']=(function build(H){
  var A=H.MAT,L=H.L;
  H.box(0.09,0.075,0.07,A.black,0,0.05,0);
  // tapa superior con terminales de potencia
  H.box(0.09,0.012,0.07,A.plastic,0,0.094,0);
  [-0.03,0.03].forEach(function(x){
    H.cyl(0.012,0.03,A.brass,x,0.115,0,16);
    H.hex(0.022,0.008,A.brass,x,0.128,0);
    H.cyl(0.016,0.004,A.steel,x,0.124,0,16);
  });
  // etiqueta frontal
  H.box(0.05,0.03,0.002,A.white,0,0.05,0.036);
  // terminales de bobina (spades)
  H.box(0.01,0.014,0.003,A.brass,-0.025,0.06,0.037);
  H.box(0.01,0.014,0.003,A.brass,0.025,0.06,0.037);
  // bridas de fijaci\u00F3n
  H.box(0.02,0.06,0.075,A.plastic,-0.055,0.05,0);
  H.box(0.02,0.06,0.075,A.plastic,0.055,0.05,0);
  H.cyl(0.007,0.09,A.darksteel,-0.055,0.05,0,10);
  H.cyl(0.007,0.09,A.darksteel,0.055,0.05,0,10);
  L.add("Terminales de potencia M6",0,0.17,0.05);
  L.add("Cuerpo del contactor",0,0.1,-0.08);
  L.add("Bobina de control (12 V)",0,0.08,0.1);
  L.add("Bridas de fijaci\u00F3n",0.09,0.1,0.05);
  L.add("Corte principal del pack",-0.12,0.14,0.0);
});
BUILDERS['c3-06']=(function build(H){
  var A=H.MAT,L=H.L;
  // portafusible ANL con fusible montado
  H.box(0.12,0.02,0.06,A.black,0,0.01,0);
  [-0.035,0.035].forEach(function(x){
    H.cyl(0.014,0.025,A.brass,x,0.03,0,16);
    H.hex(0.026,0.008,A.brass,x,0.046,0);
  });
  var fbody=H.M("#dfe7ee",{alpha:0.45,spec:0.4,back:1});
  H.box(0.08,0.018,0.048,fbody,0,0.043,0);
  // elemento fusible zigzag
  var zz=[];
  for(var i=0;i<=12;i++){var t=i/12;zz.push(H.v(-0.032+t*0.058,0.043,-0.012+0.024*Math.abs(Math.sin(t*Math.PI*3))));}
  H.tubePath(zz,0.0022,A.copper,6);
  H.box(0.014,0.006,0.048,A.steel,-0.043,0.043,0);
  H.box(0.014,0.006,0.048,A.steel,0.043,0.043,0);
  L.add("Elemento fusible visible",0,0.1,0.05);
  L.add("Portafusible ANL 125 A",0,0.05,-0.09);
  L.add("Terminal M10",0,0.09,-0.05);
  // fusible tipo cuchilla ATO
  var fx=0.26;
  H.box(0.021,0.008,0.011,fbody,fx,0.012,0);
  H.box(0.019,0.006,0.008,A.orange,fx,0.019,0);
  H.box(0.004,0.014,0.004,A.steel,fx-0.007,0.007,0);
  H.box(0.004,0.014,0.004,A.steel,fx+0.007,0.007,0);
  L.add("Fusible tipo cuchilla (ATO)",0.26,0.06,0.03);
  // base para cuchillas
  H.box(0.035,0.014,0.02,A.black,0.26,0.007,0.06);
  L.add("Base portafusible",0.26,0.04,0.09);
});
BUILDERS['c3-07']=(function build(H){
  var A=H.MAT,L=H.L;
  // sensor Hall de anillo
  var tor=H.torus(0.05,0.013,A.black,-0.3,0.032,0);
  tor.scaling.y=1.1;
  H.box(0.028,0.022,0.018,A.black,-0.3,0.055,0);
  H.cyl(0.004,0.012,A.gold,-0.293,0.072,0,8);
  H.cyl(0.004,0.012,A.gold,-0.3,0.072,0,8);
  H.cyl(0.004,0.012,A.gold,-0.307,0.072,0,8);
  H.tubePath([H.v(-0.3,0.06,0.008),H.v(-0.26,0.05,0.05),H.v(-0.2,0.01,0.08)],0.0022,A.blue,6);
  // busbar atravesando el anillo
  H.cylAB(H.v(-0.3,0.032,-0.06),H.v(-0.3,0.032,0.06),0.007,A.copper);
  L.add("Sensor Hall de anillo (corriente)",-0.3,0.13,0.05);
  L.add("Busbar que atraviesa el n\u00FAcleo",-0.3,0.03,-0.12);
  // shunt de precisi\u00F3n
  H.box(0.07,0.007,0.016,A.steel,0.05,0.012,0);
  H.hex(0.018,0.006,A.brass,0.02,0.019,0);
  H.hex(0.018,0.006,A.brass,0.08,0.019,0);
  H.tubePath([H.v(0.035,0.016,0.008),H.v(0.03,0.05,0.03),H.v(0.02,0.04,0.06)],0.0015,A.yellow,6);
  H.tubePath([H.v(0.065,0.016,0.008),H.v(0.07,0.05,0.03),H.v(0.08,0.04,0.06)],0.0015,A.yellow,6);
  L.add("Shunt 100 A / 50 mV",0.05,0.06,-0.05);
  L.add("Cables de muestreo (Kelvin)",0.06,0.09,0.08);
  // divisor de tensi\u00F3n
  H.box(0.03,0.004,0.02,A.pcb,0.24,0.01,0);
  H.box(0.008,0.005,0.012,A.black,0.24,0.015,0);
  H.tubePath([H.v(0.24,0.012,0.01),H.v(0.27,0.01,0.04),H.v(0.3,0.01,0.04)],0.0015,A.red,6);
  H.tubePath([H.v(0.24,0.012,-0.01),H.v(0.27,0.01,-0.04),H.v(0.3,0.01,-0.04)],0.0015,A.black,6);
  L.add("Divisor de voltaje",0.24,0.05,0.02);
  L.add("Se\u00F1ales al BMS",0.3,0.04,0.07);
});
BUILDERS['c4-01']=(function build(H){
  var A=H.MAT,L=H.L;
  // carcasa con aletas (eje Z)
  var body=H.cyl(0.12,0.14,A.black,0,0.16,0,28);body.rotation.x=Math.PI/2;
  for(var i=0;i<8;i++){
    var a=i*Math.PI/4;
    var fin=H.box(0.004,0.02,0.14,A.darksteel,Math.cos(a)*0.062,0.16+Math.sin(a)*0.062,0);
    fin.rotation.z=a;
  }
  // tapa trasera y delantera
  var bell=H.cyl(0.12,0.03,A.alu,0,0.16,-0.085,28);bell.rotation.x=Math.PI/2;
  var bell2=H.cyl(0.12,0.03,A.alu,0,0.16,0.085,28);bell2.rotation.x=Math.PI/2;
  // brida de fijaci\u00F3n con agujeros
  var fl=H.cyl(0.17,0.012,A.alu,0,0.16,0.108,32);fl.rotation.x=Math.PI/2;
  for(var k=0;k<4;k++){
    var a2=k*Math.PI/2+Math.PI/4;
    H.cyl(0.01,0.014,A.black,Math.cos(a2)*0.062,0.16+Math.sin(a2)*0.062,0.108,10).rotation.x=Math.PI/2;
  }
  // eje de salida
  var sh=H.cyl(0.02,0.06,A.steel,0,0.16,0.14,16);sh.rotation.x=Math.PI/2;
  // cables de fase + Hall
  H.tubePath([H.v(0.02,0.1,-0.09),H.v(0.05,0.03,-0.14),H.v(0.02,0.01,-0.2),H.v(0.06,0.01,-0.26)],0.004,A.yellow);
  H.tubePath([H.v(0,0.1,-0.09),H.v(0,0.03,-0.15),H.v(-0.02,0.01,-0.21),H.v(-0.03,0.01,-0.27)],0.004,A.green);
  H.tubePath([H.v(-0.02,0.1,-0.09),H.v(-0.05,0.03,-0.14),H.v(-0.08,0.01,-0.2),H.v(-0.11,0.01,-0.26)],0.004,A.blue);
  H.tubePath([H.v(-0.04,0.14,-0.1),H.v(-0.1,0.12,-0.16),H.v(-0.16,0.1,-0.18)],0.0022,A.gray,6);
  // base de montaje
  H.box(0.08,0.01,0.16,A.darksteel,0,0.09,-0.02);
  L.add("Carcasa con aletas",0.1,0.24,0.0);
  L.add("Brida de fijaci\u00F3n",0.1,0.22,0.12);
  L.add("Eje de salida",0,0.2,0.18);
  L.add("Cables de fase U/V/W",0.05,0.05,-0.24);
  L.add("Conector de sensor (Hall)",-0.14,0.15,-0.2);
});
BUILDERS['c4-02']=(function build(H){
  var A=H.MAT,L=H.L;
  H.box(0.22,0.06,0.11,A.plastic,0,0.045,0);
  // aletas laterales
  for(var i=0;i<7;i++) H.box(0.005,0.05,0.1,A.plastic,-0.09+i*0.03,0.045,0);
  // capacitor de bus
  H.cyl(0.035,0.02,A.black,0.06,0.085,0,20);
  H.cyl(0.033,0.004,A.gray,0.06,0.096,0,20);
  // conectores
  H.box(0.03,0.02,0.02,A.black,-0.08,0.06,0.06);
  H.box(0.025,0.015,0.015,A.white,0,0.055,0.06);
  // cables de fase
  H.tubePath([H.v(-0.05,0.05,0.055),H.v(-0.09,0.02,0.12),H.v(-0.16,0.01,0.16)],0.005,A.yellow);
  H.tubePath([H.v(-0.07,0.05,0.055),H.v(-0.11,0.02,0.13),H.v(-0.18,0.01,0.17)],0.005,A.green);
  H.tubePath([H.v(-0.09,0.05,0.055),H.v(-0.13,0.02,0.14),H.v(-0.2,0.01,0.18)],0.005,A.blue);
  // entrada bater\u00EDa
  H.tubePath([H.v(0.08,0.05,0.05),H.v(0.13,0.03,0.11),H.v(0.19,0.02,0.14)],0.006,A.red);
  H.tubePath([H.v(0.1,0.05,0.05),H.v(0.15,0.03,0.12),H.v(0.21,0.02,0.15)],0.006,A.black);
  // se\u00F1al delgada
  H.tubePath([H.v(0,0.055,0.06),H.v(0.02,0.08,0.1),H.v(0.05,0.09,0.13)],0.0018,A.gray,6);
  L.add("Aletas de disipaci\u00F3n",0,0.12,-0.03);
  L.add("Capacitor del bus DC",0.06,0.13,0.03);
  L.add("Fases al motor U/V/W",-0.16,0.07,0.2);
  L.add("Entrada bater\u00EDa (+/\u2212)",0.19,0.08,0.18);
  L.add("Se\u00F1ales: acelerador / Hall",0.04,0.13,0.15);
});
BUILDERS['c4-03']=(function build(H){
  var A=H.MAT,L=H.L;
  var cy=0.36;
  var Ac={y:cy,z:-0.18},r1=0.055,Bc={y:cy,z:0.42},r2=0.17;
  function sprocket(c,r,n){
    var s=H.cyl(r*2,0.014,A.alu,0,c.y,c.z,32);s.rotation.z=Math.PI/2;
    var hub=H.cyl(r*0.6,0.02,A.darksteel,0,c.y,c.z,20);hub.rotation.z=Math.PI/2;
    for(var k=0;k<n;k++){
      var a=k*Math.PI*2/n;
      var th=H.box(0.016,0.016,0.009,A.darksteel,0,c.y+(r+0.005)*Math.cos(a),c.z+(r+0.005)*Math.sin(a));
      th.rotation.x=a;
    }
  }
  sprocket(Ac,r1,16);sprocket(Bc,r2,30);
  // cadena (trayectoria cerrada aproximada)
  var pts=[];
  pts.push(H.v(0,Ac.y+r1,Ac.z));
  pts.push(H.v(0,Bc.y+r2,Bc.z));
  for(var a1=90;a1>=-90;a1-=15){var rad=a1*Math.PI/180;
    pts.push(H.v(0,Bc.y+r2*Math.cos(rad),Bc.z+r2*Math.sin(rad)));}
  pts.push(H.v(0,Ac.y-r1,Ac.z));
  for(var a2=-90;a2>=-270;a2-=15){var rad2=a2*Math.PI/180;
    pts.push(H.v(0,Ac.y+r1*Math.cos(rad2),Ac.z+r1*Math.sin(rad2)));}
  H.tubePath(pts,0.007,A.gray);
  // tensor
  var tid=H.cyl(0.05,0.014,A.alu,0,cy-0.14,0.1,24);tid.rotation.z=Math.PI/2;
  H.cylAB(H.v(0,cy-0.14,0.1),H.v(0,cy-0.05,0.16),0.006,A.steel);
  L.add("Pi\u00F1\u00F3n del motor (16T)",0,cy+0.12,-0.18);
  L.add("Corona de rueda (30T)",0,cy+0.26,0.42);
  L.add("Cadena (paso 25H)",0,cy+0.05,0.12);
  L.add("Tensor de cadena",0,cy-0.2,0.14);
});
BUILDERS['c4-04']=(function build(H){
  var A=H.MAT,L=H.L;
  // semieje escalonado (eje X)
  H.cylAB(H.v(-0.2,0.15,0),H.v(0.2,0.15,0),0.014,A.steel);
  H.cylAB(H.v(-0.26,0.15,0),H.v(-0.2,0.15,0),0.01,A.steel);
  H.cylAB(H.v(0.2,0.15,0),H.v(0.26,0.15,0),0.01,A.steel);
  // caja del diferencial
  var diff=H.sphere(0.14,A.cast,0,0.15,0,18);diff.scaling.set(1.3,0.9,1.0);
  H.cyl(0.05,0.02,A.alu,0,0.15,-0.075,20).rotation.x=Math.PI/2;
  // juntas homocin\u00E9ticas + fuelles
  [-0.3,0.3].forEach(function(x){
    var s=x>0?1:-1;
    H.cyl(0.05,0.055,A.steel,x+s*0.02,0.15,0,20).rotation.z=Math.PI/2;
    var boot=H.cone(0.03,0.046,0.05,A.rubber,x+s*0.07,0.15,0,20);boot.rotation.z=Math.PI/2;
    H.torus(0.032,0.004,A.gray,x+s*0.045,0.15,0).rotation.y=Math.PI/2;
    H.torus(0.046,0.004,A.gray,x+s*0.095,0.15,0).rotation.y=Math.PI/2;
    // estrias
    for(var k=0;k<6;k++){var a=k*Math.PI/3;
      var sp=H.box(0.05,0.004,0.003,A.darksteel,x+s*0.125,0.15+Math.cos(a)*0.011,Math.sin(a)*0.011);
      sp.rotation.x=a;
    }
  });
  L.add("Semieje (eje de transmisi\u00F3n)",0,0.22,0.06);
  L.add("Diferencial (caja)",0,0.3,-0.06);
  L.add("Junta homocin\u00E9tica",-0.3,0.24,0.04);
  L.add("Fuelle de goma (CV boot)",0.37,0.24,0.04);
  L.add("Estrias (splines)",0.42,0.18,0.02);
});
BUILDERS['c4-05']=(function build(H){
  var A=H.MAT,L=H.L;
  // rodamiento en despiece (eje X)
  var out=H.torus(0.09,0.016,A.steel,-0.07,0.12,0);out.rotation.z=Math.PI/2;
  var inn=H.torus(0.052,0.014,A.darksteel,0.07,0.12,0);inn.rotation.z=Math.PI/2;
  for(var k=0;k<8;k++){
    var a=k*Math.PI/4;
    H.sphere(0.017,A.chrome,0,0.12+Math.cos(a)*0.036,Math.sin(a)*0.036,12);
  }
  var cage=H.torus(0.072,0.004,A.orange,0,0.12,0);cage.rotation.z=Math.PI/2;
  // eje de referencia
  H.cylAB(H.v(-0.14,0.12,0),H.v(0.14,0.12,0),0.004,A.gray);
  L.add("Pista exterior",-0.07,0.2,0.05);
  L.add("Bolas de acero",0,0.2,0.05);
  L.add("Jaula",0.03,0.16,-0.05);
  L.add("Pista interior",0.07,0.2,0.05);
  // soporte de bancada (pillow block)
  var px=0.42;
  H.box(0.11,0.028,0.055,A.cast,px,0.014,0);
  H.box(0.06,0.045,0.055,A.cast,px,0.048,0);
  var ins=H.torus(0.07,0.014,A.steel,px,0.062,0);ins.rotation.z=Math.PI/2;
  H.cyl(0.045,0.032,A.darksteel,px,0.062,0,24).rotation.z=Math.PI/2;
  H.cyl(0.008,0.07,A.black,px-0.038,0.008,0,10).rotation.x=Math.PI/2;
  H.cyl(0.008,0.07,A.black,px+0.038,0.008,0,10).rotation.x=Math.PI/2;
  H.cyl(0.008,0.012,A.brass,px,0.078,0,8);
  L.add("Soporte de bancada (pie de apoyo)",0.42,0.13,0.06);
  L.add("Eje insertado en el rodamiento",0.42,0.1,-0.06);
});
BUILDERS['c4-06']=(function build(H){
  var A=H.MAT,L=H.L;
  var cy=0.285;
  // neum\u00E1tico estrecho de alta presi\u00F3n
  var tire=H.torus(0.5,0.055,A.tire,0,cy,0,64);tire.rotation.x=Math.PI/2;
  // rin monocasco
  var rim=H.torus(0.4,0.018,A.alu,0,cy,0,56);rim.rotation.x=Math.PI/2;
  for(var k=0;k<6;k++){
    var a=k*Math.PI/3;
    var sp=H.box(0.15,0.05,0.016,A.alu,Math.cos(a)*0.145,cy+Math.sin(a)*0.145,0);
    sp.rotation.z=a;
  }
  var disc=H.cyl(0.17,0.045,A.alu,0,cy,0,28);disc.rotation.x=Math.PI/2;
  var hub=H.cyl(0.1,0.075,A.darksteel,0,cy,0,24);hub.rotation.x=Math.PI/2;
  // torniller\u00EDa del cubo
  for(var b=0;b<4;b++){
    var ab=b*Math.PI/2;
    H.hex(0.014,0.02,A.steel,Math.cos(ab)*0.032,cy+Math.sin(ab)*0.032,0.026).rotation.x=Math.PI/2;
  }
  // v\u00E1lvula
  var vl=H.cyl(0.008,0.02,A.brass,Math.cos(0.8)*0.2,cy+Math.sin(0.8)*0.2,0.02,8);
  vl.rotation.x=Math.PI/2;
  L.add("Neum\u00E1tico bajo fricci\u00F3n (95 psi)",0,cy+0.32,0.05);
  L.add("Rin monocasco",0.2,cy+0.16,0.05);
  L.add("Torniller\u00EDa del cubo",0,cy+0.08,0.12);
  L.add("V\u00E1lvula",0.16,cy+0.2,0.05);
});
BUILDERS['c4-07']=(function build(H){
  var A=H.MAT,L=H.L;
  // acoplamiento de garra con aranjela
  var h1=H.cyl(0.05,0.03,A.steel,-0.12,0.1,0,24);h1.rotation.z=Math.PI/2;
  var h2=H.cyl(0.05,0.03,A.steel,-0.06,0.1,0,24);h2.rotation.z=Math.PI/2;
  for(var k=0;k<3;k++){
    var a=k*Math.PI*2/3;
    H.box(0.02,0.014,0.02,A.steel,-0.105,0.1+Math.cos(a)*0.02,Math.sin(a)*0.02).rotation.x=a;
    H.box(0.02,0.014,0.02,A.steel,-0.075,0.1+Math.cos(a)*0.02,Math.sin(a)*0.02).rotation.x=a;
  }
  var spider=H.cyl(0.046,0.012,A.orange,-0.09,0.1,0,24);spider.rotation.z=Math.PI/2;
  // ejes de entrada/salida
  H.cylAB(H.v(-0.24,0.1,0),H.v(-0.13,0.1,0),0.011,A.darksteel);
  H.cylAB(H.v(-0.05,0.1,0),H.v(0.06,0.1,0),0.011,A.darksteel);
  L.add("Acoplamiento de garra",-0.09,0.16,0.04);
  L.add("Elemento el\u00E1stico (aranjela)",-0.09,0.05,0.05);
  // acoplamiento de brida partida
  var cl=H.cyl(0.045,0.05,A.alu,0.2,0.1,0,24);cl.rotation.z=Math.PI/2;
  H.box(0.052,0.004,0.046,A.black,0.2,0.1,0);
  H.cylAB(H.v(0.2,0.1,-0.03),H.v(0.2,0.1,0.03),0.005,A.darksteel);
  H.hex(0.014,0.01,A.steel,0.2,0.14,0);
  H.hex(0.014,0.01,A.steel,0.2,0.06,0);
  L.add("Acoplamiento de brida partida",0.2,0.17,0.04);
  // collarines con prisionero
  [0.32,0.37].forEach(function(x){
    var col=H.cyl(0.05,0.014,A.steel,x,0.1,0,24);col.rotation.z=Math.PI/2;
    H.cyl(0.008,0.03,A.black,x,0.115,0,8);
  });
  L.add("Collarines de sujeci\u00F3n",0.345,0.15,0.04);
});
BUILDERS['c5-01']=(function build(H){
  var A=H.MAT,L=H.L;
  var cy=0.14;
  // aro
  var rim=H.torus(0.26,0.02,A.rubber,0,cy,0,56);rim.rotation.x=Math.PI/2;
  // 3 radios
  for(var k=0;k<3;k++){
    var a=k*Math.PI*2/3;
    var sp=H.box(0.11,0.026,0.012,A.steel,Math.cos(a)*0.07,cy+Math.sin(a)*0.07,0);
    sp.rotation.z=a;
  }
  // hub con liberaci\u00F3n r\u00E1pida
  H.cyl(0.05,0.028,A.black,0,cy,0,22).rotation.x=Math.PI/2;
  var qr=H.torus(0.072,0.012,A.alu,0,cy,0.012,40);qr.rotation.x=Math.PI/2;
  H.cyl(0.03,0.012,A.orange,0,cy,0.02,18).rotation.x=Math.PI/2;
  // stub de columna hacia atr\u00E1s
  H.cylAB(H.v(0,cy,0.01),H.v(0,cy+0.08,0.16),0.014,A.darksteel);
  L.add("Aro antideslizante",0.16,cy+0.18,0.02);
  L.add("Radios (3)",-0.16,cy+0.05,0.03);
  L.add("Hub de liberaci\u00F3n r\u00E1pida",0,cy-0.06,0.05);
  L.add("Salida a la columna",0,cy+0.12,0.2);
});
BUILDERS['c5-02']=(function build(H){
  var A=H.MAT,L=H.L;
  // columna superior inclinada
  H.cylAB(H.v(0,0.52,-0.12),H.v(0,0.26,0.12),0.017,A.alu);
  // junta universal 1
  H.box(0.036,0.03,0.02,A.steel,0,0.26,0.12);
  H.cyl(0.008,0.05,A.steel,0,0.26,0.12,12).rotation.z=Math.PI/2;
  // eje intermedio
  H.cylAB(H.v(0,0.24,0.14),H.v(0,0.14,0.2),0.01,A.steel);
  // junta universal 2
  H.box(0.03,0.028,0.02,A.steel,0,0.13,0.205);
  H.cyl(0.008,0.046,A.steel,0,0.13,0.205,12).rotation.z=Math.PI/2;
  // cremallera (rack)
  H.cylAB(H.v(-0.28,0.08,0.24),H.v(0.28,0.08,0.24),0.018,A.darksteel);
  H.box(0.07,0.05,0.045,A.alu,0,0.085,0.24);
  // terminales de direcci\u00F3n
  H.cylAB(H.v(-0.28,0.08,0.24),H.v(-0.4,0.08,0.24),0.008,A.steel);
  H.cylAB(H.v(0.28,0.08,0.24),H.v(0.4,0.08,0.24),0.008,A.steel);
  H.sphere(0.03,A.steel,-0.42,0.08,0.24,12);
  H.sphere(0.03,A.steel,0.42,0.08,0.24,12);
  // soportes al bastidor
  H.box(0.02,0.05,0.04,A.plastic,-0.12,0.12,0.22);
  H.box(0.02,0.05,0.04,A.plastic,0.12,0.12,0.22);
  L.add("Columna superior",0,0.56,-0.16);
  L.add("Junta universal",0.05,0.27,0.14);
  L.add("Eje intermedio",0,0.16,0.24);
  L.add("Cremallera (rack)",0.2,0.13,0.24);
  L.add("Terminal de direcci\u00F3n (extremo)",0.42,0.13,0.24);
});
BUILDERS['c5-03']=(function build(H){
  var A=H.MAT,L=H.L;
  // brazo en A: dos tubos convergentes a r\u00F3tula
  H.cylAB(H.v(0.16,0.3,0.14),H.v(-0.18,0.3,0),0.01,A.steel);
  H.cylAB(H.v(0.16,0.3,-0.14),H.v(-0.18,0.3,0),0.01,A.steel);
  // r\u00F3tula esf\u00E9rica
  H.sphere(0.038,A.chrome,-0.2,0.3,0,14);
  H.cyl(0.052,0.028,A.black,-0.225,0.3,0,18).rotation.z=Math.PI/2;
  H.cylAB(H.v(-0.24,0.3,0),H.v(-0.24,0.24,0),0.007,A.steel);
  // pivotes al chasis
  H.box(0.03,0.04,0.03,A.plastic,0.18,0.3,0.14);
  H.box(0.03,0.04,0.03,A.plastic,0.18,0.3,-0.14);
  // terminal de direcci\u00F3n (rod end)
  H.cylAB(H.v(0.16,0.2,0.02),H.v(-0.16,0.22,0.02),0.008,A.steel);
  H.sphere(0.032,A.chrome,-0.19,0.222,0.02,12);
  H.cyl(0.045,0.024,A.black,-0.212,0.222,0.02,16).rotation.z=Math.PI/2;
  H.hex(0.018,0.012,A.steel,-0.13,0.214,0.02);
  L.add("Brazo en A (wishbone)",0,0.36,0.05);
  L.add("R\u00F3tula esf\u00E9rica",-0.2,0.37,0.04);
  L.add("Pivotes al chasis",0.18,0.37,0.18);
  L.add("Terminal de direcci\u00F3n (rod end)",-0.2,0.28,0.02);
  L.add("Bieleta ajustable (con tuerca)",0.05,0.24,0.03);
});
BUILDERS['c5-04']=(function build(H){
  var A=H.MAT,L=H.L;
  // mangueta (upright)
  var up=H.box(0.05,0.17,0.045,A.darksteel,-0.22,0.32,0);up.rotation.z=0.12;
  H.cyl(0.045,0.055,A.alu,-0.25,0.32,0,22).rotation.z=Math.PI/2;
  // brazo superior
  H.cylAB(H.v(0.1,0.42,0.1),H.v(-0.2,0.4,0),0.009,A.steel);
  H.cylAB(H.v(0.1,0.42,-0.1),H.v(-0.2,0.4,0),0.009,A.steel);
  // brazo inferior
  H.cylAB(H.v(0.1,0.22,0.11),H.v(-0.21,0.24,0),0.01,A.steel);
  H.cylAB(H.v(0.1,0.22,-0.11),H.v(-0.21,0.24,0),0.01,A.steel);
  H.sphere(0.03,A.chrome,-0.21,0.24,0,10);
  // pushrod
  H.cylAB(H.v(-0.235,0.26,0),H.v(0.02,0.52,-0.02),0.008,A.orange);
  H.sphere(0.026,A.chrome,0.025,0.53,-0.02,10);
  // buje
  H.cyl(0.06,0.04,A.steel,-0.27,0.32,0,20).rotation.z=Math.PI/2;
  // torretas
  H.box(0.03,0.03,0.06,A.plastic,0.1,0.44,0.1);
  H.box(0.03,0.03,0.06,A.plastic,0.1,0.44,-0.1);
  H.box(0.03,0.03,0.06,A.plastic,0.1,0.2,0.11);
  H.box(0.03,0.03,0.06,A.plastic,0.1,0.2,-0.11);
  L.add("Brazo superior",0,0.47,0.1);
  L.add("Brazo inferior",0,0.18,0.11);
  L.add("Mangueta (upright)",-0.22,0.45,0.02);
  L.add("Pushrod",-0.12,0.4,-0.05);
  L.add("Buje de rueda",-0.28,0.36,0.02);
});
BUILDERS['c5-05']=(function build(H){
  var A=H.MAT,L=H.L;
  var x=0;
  // cuerpo y v\u00E1stago
  H.cyl(0.032,0.17,A.alu,x,0.13,0,24);
  H.cyl(0.016,0.12,A.chrome,x,0.28,0,16);
  // ojales con bujes
  var t1=H.torus(0.026,0.007,A.steel,x,0.05,0,24);
  H.cyl(0.014,0.016,A.rubber,x,0.05,0,12).rotation.x=Math.PI/2;
  var t2=H.torus(0.026,0.007,A.steel,x,0.35,0,24);
  H.cyl(0.014,0.016,A.rubber,x,0.35,0,12).rotation.x=Math.PI/2;
  // resorte helicoidal
  var pts=[];
  for(var i=0;i<=90;i++){
    var t=i/90,ang=t*Math.PI*2*5.5;
    pts.push(H.v(x+Math.cos(ang)*0.038,0.08+t*0.2,Math.sin(ang)*0.038));
  }
  H.tubePath(pts,0.006,A.spring,8);
  // copelas y perilla de precarga
  H.cyl(0.05,0.008,A.darksteel,x,0.082,0,22);
  H.cyl(0.05,0.008,A.darksteel,x,0.278,0,22);
  H.cyl(0.042,0.014,A.black,x,0.302,0,22);
  L.add("Resorte helicoidal",x+0.06,0.24,0.03);
  L.add("Cuerpo con aceite",x-0.06,0.12,0.02);
  L.add("V\u00E1stago cromado",x+0.03,0.3,0.02);
  L.add("Ojal con buje de goma",x,0.03,-0.05);
  L.add("Perilla de precarga",x,0.34,0.04);
});
BUILDERS['c5-06']=(function build(H){
  var A=H.MAT,L=H.L;
  // disco ventilado (de cara al espectador, eje Z)
  var rot=H.cyl(0.22,0.012,A.steel,0,0.24,0,48);rot.rotation.x=Math.PI/2;
  H.cyl(0.2,0.004,A.darksteel,0,0.24,0.002,48).rotation.x=Math.PI/2;
  for(var k=0;k<12;k++){
    var a=k*Math.PI/6;
    H.cyl(0.007,0.016,A.black,Math.cos(a)*0.078,0.24+Math.sin(a)*0.078,0.004,8).rotation.x=Math.PI/2;
  }
  var hat=H.cyl(0.09,0.032,A.alu,0,0.24,0.004,28);hat.rotation.x=Math.PI/2;
  for(var b=0;b<4;b++){var ab=b*Math.PI/2;
    H.hex(0.012,0.014,A.darksteel,Math.cos(ab)*0.034,0.24+Math.sin(ab)*0.034,0.022,6).rotation.x=Math.PI/2;}
  // c\u00E1liper
  var cx=Math.cos(0.7)*0.135,cy=0.24+Math.sin(0.7)*0.135;
  var cal=H.box(0.075,0.06,0.045,A.orange,cx,cy,0);
  cal.rotation.z=0.7+Math.PI/2;
  H.box(0.06,0.012,0.038,A.gray,cx*0.86,cy*0.86,0).rotation.z=0.7+Math.PI/2;
  // pastillas de repuesto
  H.box(0.05,0.012,0.036,A.gray,0.16,0.05,0.1);
  H.box(0.05,0.012,0.036,A.gray,0.16,0.02,0.1);
  // manguera hidr\u00E1ulica
  H.tubePath([H.v(cx*0.9,cy*0.9+0.02,0.01),H.v(0.1,0.42,0.05),H.v(0.02,0.45,0.1)],0.004,A.rubber);
  // banjo
  H.hex(0.014,0.008,A.steel,cx*0.92,cy*0.92+0.01,0.012);
  L.add("Disco ventilado",0,0.36,0.06);
  L.add("C\u00E1liper (pinza)",cx+0.06,cy+0.07,0.02);
  L.add("Pastillas de fricci\u00F3n",0.16,0.08,0.12);
  L.add("Manguera hidr\u00E1ulica",0.08,0.44,0.08);
  L.add("Torniller\u00EDa del disco",0.05,0.15,0.06);
});
BUILDERS['c5-07']=(function build(H){
  var A=H.MAT,L=H.L;
  // eje de pivotes
  H.cylAB(H.v(-0.12,0.2,0),H.v(0.12,0.2,0),0.012,A.darksteel);
  // pedal de freno
  var arm=H.box(0.014,0.17,0.02,A.steel,-0.07,0.12,0.0);arm.rotation.x=-0.5;
  var pad=H.box(0.05,0.075,0.008,A.rubber,-0.07,0.05,0.08);pad.rotation.x=-0.5;
  for(var r=0;r<3;r++)H.box(0.05,0.004,0.002,A.black,-0.07,0.03+r*0.02,0.086);
  // pedal acelerador
  var arm2=H.box(0.014,0.13,0.02,A.steel,0.08,0.15,0.0);arm2.rotation.x=-0.4;
  var pad2=H.box(0.04,0.06,0.008,A.rubber,0.08,0.1,0.06);pad2.rotation.x=-0.4;
  // cilindro maestro
  var mc=H.cyl(0.028,0.09,A.alu,-0.07,0.22,-0.05,20);mc.rotation.x=Math.PI/2;
  H.cylAB(H.v(-0.07,0.19,-0.01),H.v(-0.07,0.2,0.0),0.006,A.steel);
  // dep\u00F3sito
  var res=H.M("#dfe7ee",{alpha:0.5,spec:0.4,back:1});
  H.box(0.03,0.035,0.03,res,-0.07,0.27,-0.05);
  H.cyl(0.01,0.012,A.black,-0.07,0.29,-0.05,10);
  // l\u00EDnea hidr\u00E1ulica
  H.tubePath([H.v(-0.07,0.22,0.0),H.v(-0.1,0.12,0.06),H.v(-0.14,0.02,0.12),H.v(-0.2,0.01,0.16)],0.004,A.rubber);
  // cable de acelerador
  H.tubePath([H.v(0.08,0.16,-0.01),H.v(0.12,0.24,0.05),H.v(0.2,0.26,0.1)],0.002,A.steel,6);
  L.add("Pedal de freno",-0.07,0.03,0.14);
  L.add("Pedal acelerador (sensor Hall)",0.08,0.07,0.12);
  L.add("Cilindro maestro",-0.07,0.27,-0.03);
  L.add("Dep\u00F3sito de l\u00EDquido",-0.07,0.32,-0.05);
  L.add("L\u00EDnea hidr\u00E1ulica",-0.18,0.05,0.14);
  L.add("Cable de acelerador",0.19,0.29,0.11);
});
BUILDERS['c6-01']=(function build(H){
  var A=H.MAT,L=H.L;
  // caja sellada
  H.box(0.16,0.035,0.11,A.alu,0,0.03,0);
  H.box(0.157,0.006,0.107,A.alu,0,0.051,0);
  // tornillos de tapa
  [[-0.065,0.04],[0.065,0.04],[-0.065,-0.04],[0.065,-0.04],[0,0.048],[0,-0.048]].forEach(function(p){
    H.hex(0.008,0.004,A.steel,p[0],0.056,p[1]);
  });
  // conectores multipin sellados
  for(var i=-1;i<=1;i++){
    H.box(0.032,0.024,0.02,A.black,i*0.05,0.03,0.062);
    for(var p=0;p<4;p++){
      H.cyl(0.004,0.006,A.gold,i*0.05-0.012+p*0.008,0.033,0.073,8).rotation.x=Math.PI/2;
    }
  }
  // LED de estado
  H.box(0.005,0.003,0.003,A.ledG,0.06,0.055,0.05);
  H.box(0.005,0.003,0.003,A.ledR,0.07,0.055,0.05);
  // orejas de montaje
  H.box(0.025,0.006,0.05,A.alu,-0.092,0.03,0);
  H.box(0.025,0.006,0.05,A.alu,0.092,0.03,0);
  H.cyl(0.006,0.01,A.black,-0.1,0.03,0,8).rotation.z=Math.PI/2;
  H.cyl(0.006,0.01,A.black,0.1,0.03,0,8).rotation.z=Math.PI/2;
  // etiqueta
  H.box(0.05,0.02,0.002,A.white,0,0.03,-0.057);
  L.add("Carcasa sellada (IP67)",0,0.1,-0.04);
  L.add("Conectores multipin",0,0.09,0.1);
  L.add("LED de estado",0.07,0.09,0.07);
  L.add("Orejas de montaje",0.1,0.05,0.03);
});
BUILDERS['c6-02']=(function build(H){
  var A=H.MAT,L=H.L;
  // faisl\u00E1n principal
  H.tubePath([H.v(-0.38,0.1,-0.2),H.v(-0.2,0.16,-0.05),H.v(0,0.18,0.05),H.v(0.2,0.14,0.15),H.v(0.34,0.1,0.24)],0.02,A.black);
  // derivaciones
  H.tubePath([H.v(-0.2,0.16,-0.05),H.v(-0.26,0.08,0.08),H.v(-0.3,0.04,0.18)],0.011,A.blue);
  H.tubePath([H.v(0,0.18,0.05),H.v(0.02,0.1,0.16),H.v(0.06,0.04,0.24)],0.011,A.red);
  H.tubePath([H.v(0.2,0.14,0.15),H.v(0.26,0.08,0.06),H.v(0.32,0.04,-0.02)],0.011,A.yellow);
  // conectores al final de cada derivaci\u00F3n
  function conn(x,y,z){
    H.box(0.038,0.02,0.02,A.black,x,y,z);
    H.cyl(0.004,0.014,A.gold,x-0.01,y,z+0.016,6).rotation.x=Math.PI/2;
    H.cyl(0.004,0.014,A.gold,x+0.01,y,z+0.016,6).rotation.x=Math.PI/2;
  }
  conn(-0.31,0.035,0.2);conn(0.07,0.033,0.26);conn(0.34,0.033,-0.03);
  // cintas de agrupamiento
  H.torus(0.046,0.006,A.gray,-0.05,0.185,0.062).rotation.z=1.2;
  H.torus(0.046,0.006,A.gray,0.13,0.155,0.107).rotation.z=0.8;
  L.add("Faisl\u00E1n principal (manguera)",-0.1,0.26,0.0);
  L.add("Derivaciones",0.02,0.08,0.2);
  L.add("Conectores sellados",0.34,0.1,-0.06);
  L.add("Cintas de agrupamiento",-0.05,0.24,0.1);
});
BUILDERS['c6-03']=(function build(H){
  var A=H.MAT,L=H.L;
  // panel
  H.box(0.26,0.012,0.09,A.plastic,0,0.04,0);
  // interruptor de palanca
  H.cyl(0.016,0.01,A.black,-0.08,0.05,0,16);
  var lev=H.cyl(0.005,0.024,A.chrome,-0.08,0.065,0,10);lev.rotation.x=-0.35;
  H.sphere(0.009,A.chrome,-0.077,0.078,-0.004,10);
  // basculante
  H.box(0.02,0.006,0.03,A.black,0.0,0.05,0);
  var cap=H.box(0.018,0.008,0.027,A.red,0.0,0.056,0);cap.rotation.x=-0.12;
  // pulsador
  H.cyl(0.018,0.012,A.black,0.08,0.05,0,18);
  H.cyl(0.012,0.008,A.ledG,0.08,0.059,0,16);
  // terminales traseros
  H.box(0.012,0.01,0.006,A.gray,-0.08,0.03,-0.05);
  H.box(0.012,0.01,0.006,A.gray,0,0.03,-0.05);
  H.box(0.012,0.01,0.006,A.gray,0.08,0.03,-0.05);
  L.add("Interruptor de palanca",-0.08,0.12,0.02);
  L.add("Basculante (encendido)",0,0.1,0.03);
  L.add("Pulsador iluminado",0.08,0.11,0.02);
  L.add("Terminales traseros",0,0.06,-0.1);
});
BUILDERS['c6-04']=(function build(H){
  var A=H.MAT,L=H.L;
  // pantalla con texto
  var dt=new BABYLON.DynamicTexture("scr",{width:512,height:320},H.scene,false);
  dt.drawText("48 km/h",60,130,"bold 92px Arial","#6fd3ff","#0a1626",true);
  dt.drawText("SOC  87%",60,250,"bold 72px Arial","#8fe6a8",null,true);
  dt.drawText("PANEL SOLAR  612 W",60,306,"bold 44px Arial","#ffd479",null,true);
  var sm=new BABYLON.StandardMaterial("scrM",H.scene);
  sm.diffuseTexture=dt;sm.emissiveTexture=dt;sm.emissiveColor=new BABYLON.Color3(1,1,1);
  sm.specularColor=BABYLON.Color3.Black();sm.backFaceCulling=false;
  H.box(0.17,0.1,0.012,A.plastic,0,0.22,0);
  var scr=BABYLON.MeshBuilder.CreatePlane("scrP",{width:0.15,height:0.085},H.scene);
  scr.material=sm;scr.position.set(0,0.22,0.0072);scr.parent=H.root;scr.isPickable=false;
  // tac\u00F3metro
  H.torus(0.075,0.008,A.black,-0.26,0.16,0,40);
  H.cyl(0.07,0.006,A.white,-0.26,0.16,0,32).rotation.x=Math.PI/2;
  var nd=H.box(0.006,0.05,0.004,A.red,-0.245,0.185,0.006);nd.rotation.z=0.9;
  // m\u00F3dulo de telemetr\u00EDa
  H.box(0.07,0.02,0.05,A.black,0.26,0.1,0.05);
  H.cyl(0.006,0.09,A.gray,0.26,0.16,0.05,8);
  H.sphere(0.012,A.gray,0.26,0.21,0.05,10);
  // antena GPS
  var dome=H.sphere(0.05,A.gray,0.26,0.012,0.14,14);dome.scaling.y=0.55;
  L.add("Pantalla: velocidad y SOC",0,0.32,0.02);
  L.add("Tac\u00F3metro",-0.26,0.25,0.03);
  L.add("M\u00F3dulo de telemetr\u00EDa",0.26,0.15,0.07);
  L.add("Antena GPS",0.26,0.05,0.19);
});
BUILDERS['c6-05']=(function build(H){
  var A=H.MAT,L=H.L;
  // faro LED
  H.cyl(0.07,0.032,A.black,-0.22,0.1,0,28).rotation.x=Math.PI/2;
  var lens=H.sphere(0.066,A.glass,-0.22,0.1,0.014,18);lens.scaling.set(1,1,0.45);
  var bez=H.torus(0.066,0.005,A.alu,-0.22,0.1,0.012,36);
  H.cyl(0.03,0.004,A.ledW,-0.22,0.1,0.012,20).rotation.x=Math.PI/2;
  // soporte
  H.box(0.02,0.05,0.02,A.steel,-0.22,0.045,0);
  // luz trasera
  H.box(0.085,0.032,0.016,A.ledR,0.05,0.1,0);
  H.box(0.09,0.036,0.012,A.plastic,0.05,0.1,-0.012);
  // bocina de disco
  var hx=0.28;
  H.cyl(0.062,0.022,A.gray,hx,0.09,0,28).rotation.x=Math.PI/2;
  H.cyl(0.05,0.004,A.black,hx,0.09,0.012,28).rotation.x=Math.PI/2;
  H.box(0.02,0.03,0.008,A.steel,hx,0.045,0);
  H.box(0.008,0.012,0.004,A.brass,hx-0.015,0.06,0.012);
  H.box(0.008,0.012,0.004,A.brass,hx+0.015,0.06,0.012);
  L.add("Faro LED con lente",-0.22,0.18,0.05);
  L.add("Luz trasera (LED)",0.05,0.16,0.03);
  L.add("Bocina de disco 12 V",0.28,0.16,0.05);
  L.add("Soporte antivibrante",0.28,0.03,0.02);
});
BUILDERS['c6-06']=(function build(H){
  var A=H.MAT,L=H.L;
  // conector de 4 v\u00EDas
  H.box(0.048,0.022,0.022,A.black,-0.3,0.02,0);
  for(var p=0;p<4;p++){
    H.cyl(0.005,0.012,A.gold,-0.318+p*0.012,0.022,0.014,6).rotation.x=Math.PI/2;
  }
  H.box(0.01,0.012,0.008,A.black,-0.276,0.028,0);
  // rel\u00E9 de 12 V
  H.box(0.032,0.026,0.032,A.black,-0.05,0.035,0);
  for(var q=0;q<5;q++){
    var aq=-0.02+ (q%3)*0.02, zq=(q<3)?0.014:-0.014;
    H.box(0.004,0.014,0.003,A.gray,-0.05+aq,0.012,zq);
  }
  // varistor
  H.cyl(0.016,0.007,A.blue,0.12,0.014,0,18);
  H.cyl(0.002,0.03,A.gray,0.114,0.008,0,6);
  H.cyl(0.002,0.03,A.gray,0.126,0.008,0,6);
  // bloque de fusibles auxiliar
  H.box(0.06,0.024,0.04,A.black,0.3,0.015,0);
  var fbody=H.M("#dfe7ee",{alpha:0.45,spec:0.4,back:1});
  for(var f=0;f<3;f++){
    H.box(0.014,0.007,0.009,fbody,0.282+f*0.018,0.032,0);
    H.box(0.012,0.005,0.007,[A.red,A.blue,A.yellow][f],0.282+f*0.018,0.037,0);
  }
  L.add("Conector de 4 v\u00EDas",-0.3,0.08,0.03);
  L.add("Rel\u00E9 de 12 V",-0.05,0.09,0.03);
  L.add("Varistor (supresor de picos)",0.12,0.06,0.03);
  L.add("Bloque de fusibles auxiliar",0.3,0.07,0.04);
});

/* -- API publica del bundle -- */
var views = [];

function mount(target, partId, opts) {
  opts = opts || {};
  var canvas = (typeof target === "string") ? document.querySelector(target) : target;
  if (!canvas || canvas.tagName !== "CANVAS") {
    throw new Error("SolarPart.mount: pasa un <canvas> o un selector CSS que apunte a un <canvas>. Recibido: " + target);
  }
  var B = BUILDERS[partId];
  if (!B) {
    throw new Error("SolarPart.mount: pieza desconocida '" + partId + "'. Usa SolarPart.list() para ver los 39 ids disponibles.");
  }
  if (canvas.__solarView) { try { canvas.__solarView.dispose(); } catch (e) {} }
  var view = SOLAR_CORE.makeView(canvas, B, { labels: opts.labels !== false, accent: (META[partId] || {}).color });
  canvas.__solarView = view;
  views.push(view);
  return view;
}

function list() {
  return Object.keys(META).map(function (k) { return META[k]; });
}

function disposeAll() {
  views.forEach(function (v) { try { v.dispose(); } catch (e) {} });
  views = [];
}

return {
  mount: mount,
  list: list,
  meta: META,
  cats: CATS,
  builders: BUILDERS,
  loadBabylon: SOLAR_CORE.loadBabylon,
  disposeAll: disposeAll,
  version: "1.0.0"
};
})();

function createHelper(scene, root) {
  var MATS = {};
  function M(hex, o) {
    o = o || {};
    var k = hex + "|" + (o.alpha || "") + "|" + (o.metal ? "m" : "") + "|" + (o.spec || "") + "|" + (o.power || "") + "|" + (o.emissive || "") + "|" + (o.back ? "b" : "");
    if (MATS[k]) return MATS[k];
    var m = new BABYLON.StandardMaterial("sol_mat_" + (Object.keys(MATS).length), scene);
    m.diffuseColor = BABYLON.Color3.FromHexString(hex);
    var s = (o.spec !== undefined) ? o.spec : 0.22;
    m.specularColor = new BABYLON.Color3(s, s, s);
    m.specularPower = o.power || 32;
    if (o.metal) {
      m.specularColor = new BABYLON.Color3(0.85, 0.86, 0.9);
      m.specularPower = 72;
    }
    if (o.alpha !== undefined) m.alpha = o.alpha;
    if (o.emissive) m.emissiveColor = BABYLON.Color3.FromHexString(o.emissive);
    if (o.back) m.backFaceCulling = false;
    MATS[k] = m;
    return m;
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

  function done(m) {
    m.isPickable = true;
    return m;
  }
  function box(w, h, d, m, x, y, z) {
    var b = BABYLON.MeshBuilder.CreateBox("b", { width: w, height: h, depth: d }, scene);
    b.position.set(x || 0, y || 0, z || 0);
    b.material = m;
    b.parent = root;
    return done(b);
  }
  function cyl(d, h, m, x, y, z, tess) {
    var b = BABYLON.MeshBuilder.CreateCylinder("c", { diameter: d, height: h, tessellation: tess || 32 }, scene);
    b.position.set(x || 0, y || 0, z || 0);
    b.material = m;
    b.parent = root;
    return done(b);
  }
  function cone(dT, dB, h, m, x, y, z, tess) {
    var b = BABYLON.MeshBuilder.CreateCylinder("cn", { diameterTop: dT, diameterBottom: dB, height: h, tessellation: tess || 32 }, scene);
    b.position.set(x || 0, y || 0, z || 0);
    b.material = m;
    b.parent = root;
    return done(b);
  }
  function hex(d, h, m, x, y, z) { return cyl(d, h, m, x, y, z, 6); }
  function sphere(d, m, x, y, z, seg) {
    var b = BABYLON.MeshBuilder.CreateSphere("s", { diameter: d, segments: seg || 18 }, scene);
    b.position.set(x || 0, y || 0, z || 0);
    b.material = m;
    b.parent = root;
    return done(b);
  }
  function torus(d, t, m, x, y, z) {
    var b = BABYLON.MeshBuilder.CreateTorus("tor", { diameter: d, thickness: t, tessellation: 48 }, scene);
    b.position.set(x || 0, y || 0, z || 0);
    b.material = m;
    b.parent = root;
    return done(b);
  }
  function cylAB(a, b, r, m, tess) {
    var d = b.subtract(a), len = d.length(); if (len < 1e-6) len = 1e-6;
    var c = BABYLON.MeshBuilder.CreateCylinder("ca", { height: len, diameter: r * 2, tessellation: tess || 24 }, scene);
    c.material = m;
    c.position.copyFrom(a.add(b).scale(0.5));
    c.parent = root;
    var dirV = d.normalize(), axisV = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), dirV), al = axisV.length();
    if (al < 1e-4) { if (dirV.y < 0) c.rotation.x = Math.PI; }
    else { axisV.normalize(); var ang = Math.acos(Math.max(-1, Math.min(1, dirV.y))); c.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axisV, ang); }
    return done(c);
  }
  function tubePath(pts, r, m, tess) {
    var curve = BABYLON.Curve3.CreateCatmullRomSpline(pts, Math.max(pts.length * 8, 16));
    var b = BABYLON.MeshBuilder.CreateTube("tp", { path: curve.getPoints(), radius: r, cap: BABYLON.Mesh.CAP_ALL, tessellation: tess || 12 }, scene);
    b.material = m;
    b.parent = root;
    return done(b);
  }
  function grp(x, y, z) {
    var t = new BABYLON.TransformNode("g", scene);
    t.parent = root;
    t.position.set(x || 0, y || 0, z || 0);
    return t;
  }
  var LBL = [];
  return {
    scene: scene,
    root: root,
    M: M,
    MAT: MAT,
    L: { add: function (t, x, y, z) { LBL.push({ t: t, p: new BABYLON.Vector3(x, y, z) }); } },
    v: function (x, y, z) { return new BABYLON.Vector3(x, y, z); },
    box: box,
    cyl: cyl,
    cone: cone,
    hex: hex,
    sphere: sphere,
    torus: torus,
    cylAB: cylAB,
    tube: cylAB,
    tubePath: tubePath,
    grp: grp
  };
}

export function createSolarPart(scene, partId, options = {}) {
  const builders = window.SolarPart && window.SolarPart.builders;
  const B = builders ? builders[partId] : null;
  if (!B) throw new Error("Pieza solar no encontrada: " + partId);
  const root = new BABYLON.TransformNode("solarPart_" + partId, scene);
  if (options.scale) root.scaling.setAll(options.scale);
  const H = createHelper(scene, root);
  B(H);
  const meta = (window.SolarPart && window.SolarPart.meta) ? window.SolarPart.meta[partId] : null;
  root.metadata = { id: partId, ...(meta || {}) };
  return root;
}

export function createAllSolarParts(scene, options = {}) {
  const parts = new Map();
  const builders = window.SolarPart && window.SolarPart.builders ? window.SolarPart.builders : {};
  for (const id of Object.keys(builders)) {
    parts.set(id, createSolarPart(scene, id, options));
  }
  return parts;
}

export const SolarPart = window.SolarPart;
export const SOLAR_PARTS_META = (window.SolarPart && window.SolarPart.meta) ? window.SolarPart.meta : {};
export const SOLAR_CATEGORIES = (window.SolarPart && window.SolarPart.cats) ? window.SolarPart.cats : [];

