import {
  Engine,
  Scene,
  UniversalCamera,
  ArcRotateCamera,
  FollowCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  PointLight,
  DirectionalLight,
  ShadowGenerator,
  StandardMaterial,
  MeshBuilder,
  Animation,
  HighlightLayer,
  TransformNode,
  Mesh
} from "@babylonjs/core";
import "@babylonjs/loaders";

import { createSafetyAndTools } from "./piezas/safety-tools.js";
import {
  createSolarPart,
  createAllSolarParts,
  SOLAR_PARTS_META,
  SOLAR_CATEGORIES
} from "./piezas/solar-piezas.js";

import { createPBRMaterialLibrary, createTireSmokeParticleSystem, createLocalSparkSystem } from "./pbr-materials.js";
import { loadGltfOrFallback } from "./gltf-loader.js";
import { SolarVehiclePhysics } from "./sim-physics.js";
import { SteamManager } from "./steam-manager.js";
import { vehicleAudio } from "./sim-audio.js";
import { ProgressManager } from "./progress-manager.js";
import { t, setLanguage, getLanguage } from "./i18n/index.js";

// ==========================================
// PANTALLA DE CARGA (LOADING SCREEN CON PROGRESO REAL)
// ==========================================
const loadingDiv = document.createElement("div");
loadingDiv.id = "app-loading-screen";
loadingDiv.innerHTML = `
  <div class="loading-box">
    <div class="loading-spinner"></div>
    <h2 id="loading-title">Iniciando Simulador Solar Fotorrealista...</h2>
    <div class="loading-bar-bg">
      <div id="loading-bar-fill" class="loading-bar-fill"></div>
    </div>
    <p id="loading-subtitle" style="font-size: 13px; color: #88a0c0; margin-top: 10px;">Compilando shaders PBR, texturas procedurales y generador de sombras...</p>
  </div>
  <style>
    #app-loading-screen {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, #141c2c 0%, #06090e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
      transition: opacity 0.5s ease;
    }
    .loading-box {
      width: 380px;
      text-align: center;
      padding: 32px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(80, 150, 255, 0.3);
      border-radius: 18px;
      box-shadow: 0 15px 45px rgba(0,0,0,0.7);
      backdrop-filter: blur(12px);
    }
    .loading-spinner {
      width: 52px;
      height: 52px;
      margin: 0 auto 18px;
      border: 4px solid rgba(80, 150, 255, 0.2);
      border-top-color: #007aff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-bar-bg {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 15px;
    }
    .loading-bar-fill {
      height: 100%;
      width: 15%;
      background: linear-gradient(90deg, #007aff, #30d158);
      transition: width 0.3s ease;
    }
  </style>
`;
document.body.appendChild(loadingDiv);

function updateLoadingProgress(pct, text) {
  const bar = document.getElementById("loading-bar-fill");
  const sub = document.getElementById("loading-subtitle");
  if (bar) bar.style.width = `${pct}%`;
  if (sub && text) sub.innerText = text;
}

function hideLoadingScreen() {
  updateLoadingProgress(100, "¡Entorno Físico Listo!");
  setTimeout(() => {
    if (loadingDiv) {
      loadingDiv.style.opacity = "0";
      setTimeout(() => loadingDiv.remove(), 500);
    }
  }, 450);
}

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true, { antialias: true, adaptToDeviceRatio: true });

const createScene = () => {
  updateLoadingProgress(30, "Configurando iluminación PBR y sombras dinámicas...");
  const scene = new Scene(engine);
  scene.clearColor = new Color3(0.52, 0.72, 0.95);

  scene.collisionsEnabled = true;
  scene.gravity = new Vector3(0, -9.81 / 60, 0);

  // ==========================================
  // 1. ILUMINACIÓN PBR Y SOMBRAS DINÁMICAS (SHADOW GENERATOR)
  // ==========================================
  const sunLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
  sunLight.intensity = 0.65;
  sunLight.groundColor = new Color3(0.2, 0.22, 0.25);

  const dirSun = new DirectionalLight("dirSun", new Vector3(-0.55, -1, 0.35), scene);
  dirSun.intensity = 1.4;
  dirSun.position = new Vector3(30, 50, -20);

  // Generador de Sombras en Tiempo Real con Suavizado
  const shadowGenerator = new ShadowGenerator(2048, dirSun);
  shadowGenerator.usePercentageCloserFiltering = true;
  shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  shadowGenerator.bias = 0.0015;

  const garageLight = new PointLight("garageLight", new Vector3(0, 7, -3), scene);
  garageLight.diffuse = new Color3(1, 0.96, 0.9);
  garageLight.intensity = 0.85;
  garageLight.range = 35;

  const carSpotLight = new PointLight("carSpotLight", new Vector3(0, 4.5, -4), scene);
  carSpotLight.diffuse = new Color3(0.92, 0.96, 1.0);
  carSpotLight.intensity = 0.75;
  carSpotLight.range = 12;

  // Librería de Materiales PBR
  updateLoadingProgress(45, "Generando texturas de fibra de carbono y celdas solares...");
  const pbrLibrary = createPBRMaterialLibrary(scene);

  // ==========================================
  // 2. SISTEMA DE CÁMARAS CINEMÁTICAS
  // ==========================================
  // Cámara 1: FPS en Taller
  const cameraFPS = new UniversalCamera("playerCamera", new Vector3(0, 1.8, -10), scene);
  cameraFPS.keysUp = [87, 38];
  cameraFPS.keysDown = [83, 40];
  cameraFPS.keysLeft = [65, 37];
  cameraFPS.keysRight = [68, 39];
  cameraFPS.speed = 0.35;
  cameraFPS.angularSensibility = 2500;
  cameraFPS.checkCollisions = true;
  cameraFPS.applyGravity = true;
  cameraFPS.ellipsoid = new Vector3(0.6, 0.88, 0.6);

  // Cámara 2: Orbital de Inspección 360°
  const cameraOrbit = new ArcRotateCamera("orbitCamera", -Math.PI / 2, Math.PI / 3, 5.5, new Vector3(0, 0.9, -4), scene);
  cameraOrbit.lowerRadiusLimit = 1.8;
  cameraOrbit.upperRadiusLimit = 14.0;
  cameraOrbit.wheelPrecision = 40;
  cameraOrbit.checkCollisions = true;

  // Cámara 3: Follow Camera Exterior (Chase Cam)
  const cameraTrack = new FollowCamera("trackCamera", new Vector3(0, 3, -10), scene);
  cameraTrack.radius = 6.8;
  cameraTrack.heightOffset = 2.2;
  cameraTrack.rotationOffset = 180;
  cameraTrack.cameraAcceleration = 0.12;
  cameraTrack.maxCameraSpeed = 35;

  // Cámara 4: Cockpit (Primera persona dentro del monoplaza)
  const cameraCockpit = new UniversalCamera("cockpitCamera", new Vector3(0, 0.65, 0.1), scene);
  cameraCockpit.fov = 1.25;

  let modoCamara = "fps"; // 'fps', 'orbit', 'track', 'cockpit'
  scene.activeCamera = cameraFPS;
  cameraFPS.attachControl(canvas, true);

  const setCamaraMode = (mode) => {
    cameraFPS.detachControl();
    cameraOrbit.detachControl();
    cameraTrack.detachControl();
    cameraCockpit.detachControl();

    modoCamara = mode;
    if (mode === "orbit") {
      scene.activeCamera = cameraOrbit;
      cameraOrbit.attachControl(canvas, true);
    } else if (mode === "track") {
      scene.activeCamera = cameraTrack;
      cameraTrack.attachControl(canvas, true);
    } else if (mode === "cockpit") {
      scene.activeCamera = cameraCockpit;
    } else {
      scene.activeCamera = cameraFPS;
      cameraFPS.attachControl(canvas, true);
    }
    actualizarUI();
  };

  const toggleCamara = () => {
    if (enModoPista) {
      if (modoCamara === "track") setCamaraMode("cockpit");
      else if (modoCamara === "cockpit") setCamaraMode("orbit");
      else setCamaraMode("track");
    } else {
      if (modoCamara === "fps") setCamaraMode("orbit");
      else setCamaraMode("fps");
    }
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Shift") cameraFPS.speed = 0.7;
    if (e.key === "c" || e.key === "C") toggleCamara();
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") cameraFPS.speed = 0.35;
  });

  const highlightLayer = new HighlightLayer("hl", scene);
  highlightLayer.innerGlow = true;
  highlightLayer.outerGlow = true;

  // ==========================================
  // 3. ESTRUCTURA DEL TALLER Y CIRCUITO PROFESIONAL
  // ==========================================
  updateLoadingProgress(60, "Construyendo circuito con pianos, asfalto y vallas de seguridad...");

  // Piso Taller Pulido con reflejos
  const pisoTaller = MeshBuilder.CreateBox("pisoTaller", { width: 22, height: 0.2, depth: 22 }, scene);
  pisoTaller.position = new Vector3(0, -0.1, 0);
  pisoTaller.material = pbrLibrary.carbon;
  pisoTaller.receiveShadows = true;
  pisoTaller.checkCollisions = true;

  const matPared = new StandardMaterial("matPared", scene);
  matPared.diffuseColor = new Color3(0.85, 0.88, 0.92);

  const matParedAcento = new StandardMaterial("matParedAcento", scene);
  matParedAcento.diffuseColor = new Color3(0.08, 0.25, 0.55);

  const paredFondo = MeshBuilder.CreateBox("paredFondo", { width: 22, height: 6, depth: 0.3 }, scene);
  paredFondo.position = new Vector3(0, 3, -11);
  paredFondo.material = matParedAcento;
  paredFondo.receiveShadows = true;
  paredFondo.checkCollisions = true;

  const paredIzq = MeshBuilder.CreateBox("paredIzq", { width: 0.3, height: 6, depth: 22 }, scene);
  paredIzq.position = new Vector3(-11, 3, 0);
  paredIzq.material = matPared;
  paredIzq.receiveShadows = true;
  paredIzq.checkCollisions = true;

  const paredDer = MeshBuilder.CreateBox("paredDer", { width: 0.3, height: 6, depth: 22 }, scene);
  paredDer.position = new Vector3(11, 3, 0);
  paredDer.material = matPared;
  paredDer.receiveShadows = true;
  paredDer.checkCollisions = true;

  // Portón del taller animado
  const porton = MeshBuilder.CreateBox("porton", { width: 8, height: 4.8, depth: 0.2 }, scene);
  const posCerradoY = 2.4;
  const posAbiertoY = 6.8;
  porton.position = new Vector3(0, posCerradoY, 11);
  porton.material = pbrLibrary.metal;
  porton.receiveShadows = true;
  porton.checkCollisions = true;
  shadowGenerator.addShadowCaster(porton);

  // Tarima de ensamble
  const tarima = MeshBuilder.CreateBox("tarimaPiezas", { width: 7, height: 0.15, depth: 7 }, scene);
  tarima.position = new Vector3(6.5, 0.075, 4);
  tarima.material = pbrLibrary.metal;
  tarima.receiveShadows = true;

  // Banco de trabajo central donde reposa el chasis
  const bancoCentral = MeshBuilder.CreateBox("bancoCentral", { width: 2.2, height: 0.2, depth: 4.2 }, scene);
  bancoCentral.position = new Vector3(0, 0.1, -4);
  bancoCentral.material = pbrLibrary.metal;
  bancoCentral.receiveShadows = true;

  // ==========================================
  // CIRCUITO COMPLETO DE PRUEBAS EXTERIOR
  // ==========================================
  const matPasto = new StandardMaterial("matPasto", scene);
  matPasto.diffuseColor = new Color3(0.22, 0.48, 0.24);

  const pisoExterior = MeshBuilder.CreateGround("pisoExterior", { width: 450, height: 450 }, scene);
  pisoExterior.position = new Vector3(0, -0.05, 140);
  pisoExterior.material = matPasto;
  pisoExterior.receiveShadows = true;
  pisoExterior.checkCollisions = true;

  // Pista de Asfalto con Textura PBR y Marcas
  const pistaAsfalto = MeshBuilder.CreateGround("pistaAsfalto", { width: 14, height: 320 }, scene);
  pistaAsfalto.position = new Vector3(0, 0.02, 160);
  pistaAsfalto.material = pbrLibrary.asfalto;
  pistaAsfalto.receiveShadows = true;
  pistaAsfalto.checkCollisions = true;

  // Pianos (Kerbs) rojo y blanco a los costados
  const kerbIzq = MeshBuilder.CreateBox("kerbIzq", { width: 1.2, height: 0.08, depth: 320 }, scene);
  kerbIzq.position = new Vector3(-7.6, 0.04, 160);
  kerbIzq.material = pbrLibrary.kerb;
  kerbIzq.receiveShadows = true;

  const kerbDer = MeshBuilder.CreateBox("kerbDer", { width: 1.2, height: 0.08, depth: 320 }, scene);
  kerbDer.position = new Vector3(7.6, 0.04, 160);
  kerbDer.material = pbrLibrary.kerb;
  kerbDer.receiveShadows = true;

  // Arco de Meta / Salida de Competición
  const arcoMeta = MeshBuilder.CreateBox("arcoMetaViga", { width: 18, height: 0.8, depth: 1.0 }, scene);
  arcoMeta.position = new Vector3(0, 5.5, 30);
  arcoMeta.material = pbrLibrary.metal;
  shadowGenerator.addShadowCaster(arcoMeta);

  const posteMetaIzq = MeshBuilder.CreateCylinder("posteMetaIzq", { diameter: 0.4, height: 5.5 }, scene);
  posteMetaIzq.position = new Vector3(-8.5, 2.75, 30);
  posteMetaIzq.material = pbrLibrary.metal;
  shadowGenerator.addShadowCaster(posteMetaIzq);

  const posteMetaDer = MeshBuilder.CreateCylinder("posteMetaDer", { diameter: 0.4, height: 5.5 }, scene);
  posteMetaDer.position = new Vector3(8.5, 2.75, 30);
  posteMetaDer.material = pbrLibrary.metal;
  shadowGenerator.addShadowCaster(posteMetaDer);

  // ==========================================
  // 4. MONOPLAZA SOLAR 3D REALISTA CON SUSPENSIÓN Y PILOTO
  // ==========================================
  updateLoadingProgress(75, "Ensamblando modelo mecatrónico del monoplaza y cabina...");
  const carRoot = new TransformNode("carRoot", scene);
  carRoot.position = new Vector3(0, 0.35, -4);
  cameraTrack.lockedTarget = carRoot;
  cameraCockpit.parent = carRoot;

  // Sub-nodo con cabeceo y balanceo de suspensión (Pitch & Roll reactivo)
  const carChassisBody = new TransformNode("carChassisBody", scene);
  carChassisBody.parent = carRoot;

  // 1. Piloto de Competición con Casco Aerodinámico en Cabina
  const pilotoGroup = new TransformNode("pilotoGroup", scene);
  pilotoGroup.parent = carChassisBody;
  pilotoGroup.position = new Vector3(0, 0.28, 0.1);

  const casco = MeshBuilder.CreateSphere("cascoPiloto", { diameterX: 0.34, diameterY: 0.42, diameterZ: 0.38 }, scene);
  casco.position = new Vector3(0, 0.35, 0);
  casco.parent = pilotoGroup;
  casco.material = pbrLibrary.carroceria;
  shadowGenerator.addShadowCaster(casco);

  // Visera de iridio dorado
  const visera = MeshBuilder.CreateBox("viseraCasco", { width: 0.28, height: 0.12, depth: 0.1 }, scene);
  visera.position = new Vector3(0, 0.35, 0.16);
  visera.parent = pilotoGroup;
  visera.material = pbrLibrary.copper;

  // Cuerpo y mono de competición del piloto
  const cuerpoPiloto = MeshBuilder.CreateBox("cuerpoPiloto", { width: 0.46, height: 0.55, depth: 0.35 }, scene);
  cuerpoPiloto.position = new Vector3(0, 0.05, -0.05);
  cuerpoPiloto.parent = pilotoGroup;
  cuerpoPiloto.material = pbrLibrary.carbon;

  // Volante monoplaza con pantalla telemétrica LED
  const volanteMesh = MeshBuilder.CreateBox("volanteRacing", { width: 0.32, height: 0.18, depth: 0.04 }, scene);
  volanteMesh.position = new Vector3(0, 0.32, 0.45);
  volanteMesh.parent = carChassisBody;
  volanteMesh.material = pbrLibrary.carbon;

  // Faros LED Delanteros Funcionales
  const faroIzq = MeshBuilder.CreateBox("faroIzq", { width: 0.18, height: 0.08, depth: 0.05 }, scene);
  faroIzq.position = new Vector3(-0.55, 0.2, 1.85);
  faroIzq.parent = carChassisBody;
  faroIzq.material = pbrLibrary.ledFaro;

  const faroDer = MeshBuilder.CreateBox("faroDer", { width: 0.18, height: 0.08, depth: 0.05 }, scene);
  faroDer.position = new Vector3(0.55, 0.2, 1.85);
  faroDer.parent = carChassisBody;
  faroDer.material = pbrLibrary.ledFaro;

  // Luces de Freno Traseras Funcionales
  const luzFreno = MeshBuilder.CreateBox("luzFrenoTrasera", { width: 0.8, height: 0.06, depth: 0.05 }, scene);
  luzFreno.position = new Vector3(0, 0.32, -1.85);
  luzFreno.parent = carChassisBody;
  luzFreno.material = pbrLibrary.ledFreno;

  // Carrocería Aerodinámica Concept Car con PBR Clear Coat
  const carroceriaConceptMesh = MeshBuilder.CreateBox("carroceriaConcept", { width: 1.48, height: 0.46, depth: 3.9 }, scene);
  carroceriaConceptMesh.position = new Vector3(0, 0.45, 0);
  carroceriaConceptMesh.parent = carChassisBody;
  carroceriaConceptMesh.material = pbrLibrary.carroceria;
  carroceriaConceptMesh.receiveShadows = true;
  shadowGenerator.addShadowCaster(carroceriaConceptMesh);
  carroceriaConceptMesh.setEnabled(false);

  // Cúpula / Parabrisas Transparente (Canopy)
  const canopyMesh = MeshBuilder.CreateSphere("canopyVidrio", { diameterX: 0.65, diameterY: 0.55, diameterZ: 1.4 }, scene);
  canopyMesh.position = new Vector3(0, 0.55, 0.15);
  canopyMesh.parent = carChassisBody;
  canopyMesh.material = pbrLibrary.vidrio;

  // Sistema de partículas para derrape de neumáticos
  const tireSmokePS = createTireSmokeParticleSystem(scene, carRoot);

  // Herramientas y piezas de seguridad en taller
  const piezasExtra = createSafetyAndTools(scene, {
    spacing: 3.5,
    columns: 4,
    scale: 0.85
  });
  const piecesMap = (piezasExtra instanceof Map) ? piezasExtra : (piezasExtra?.pieces || new Map());
  piecesMap.forEach((node, name) => {
    node.position.addInPlace(new Vector3(-6.2, 0, -4.5));
    node.getChildMeshes().forEach(m => {
      shadowGenerator.addShadowCaster(m);
      m.metadata = {
        esHerramienta: true,
        name: name,
        label: node.metadata?.label || name,
        category: node.metadata?.category || "herramienta"
      };
    });
  });

  // ==========================================
  // COMPONENTES 3D MECATRÓNICOS MODULARES
  // ==========================================
  const componentesVehiculo = [];
  const defsPiezas = [
    { id: "c1-01", nombre: "Chasis Tubular y Monocasco", masa: 45, cdA: 0.04, pot: 0, bat: 0, posAlm: new Vector3(4.5, 0.2, 2.0), posRel: new Vector3(0, 0, 0) },
    { id: "c1-06", nombre: "Asiento de Competición y Arnés", masa: 12, cdA: 0.01, pot: 0, bat: 0, posAlm: new Vector3(6.0, 0.2, 2.0), posRel: new Vector3(0, 0.3, -0.2) },
    { id: "c5-01", nombre: "Eje Delantero con Manguetas", masa: 14, cdA: 0.02, pot: 0, bat: 0, posAlm: new Vector3(7.5, 0.2, 2.0), posRel: new Vector3(0, 0.1, 1.3) },
    { id: "c5-04", nombre: "Eje Trasero y Soporte Corona", masa: 16, cdA: 0.02, pot: 0, bat: 0, posAlm: new Vector3(4.5, 0.2, 3.5), posRel: new Vector3(0, 0.1, -1.3) },
    { id: "c5-05", nombre: "Ruedas Delanteras de Baja Fricción", masa: 18, cdA: 0.03, pot: 0, bat: 0, posAlm: new Vector3(6.0, 0.2, 3.5), posRel: new Vector3(0, 0.15, 1.3), esRueda: true, ruedaTipo: "delantera" },
    { id: "c5-06", nombre: "Ruedas Traseras Motrices", masa: 18, cdA: 0.03, pot: 0, bat: 0, posAlm: new Vector3(7.5, 0.2, 3.5), posRel: new Vector3(0, 0.15, -1.3), esRueda: true, ruedaTipo: "trasera" },
    { id: "c4-06", nombre: "Pack de Baterías LiFePO4 5.2 kWh", masa: 55, cdA: 0.01, pot: 0, bat: 5.2, posAlm: new Vector3(4.5, 0.2, 5.0), posRel: new Vector3(0, 0.25, -0.4) },
    { id: "c4-01", nombre: "Sistema BMS y Sensores de Celda", masa: 4, cdA: 0.005, pot: 0, bat: 0, posAlm: new Vector3(6.0, 0.2, 5.0), posRel: new Vector3(0, 0.45, -0.4) },
    { id: "c4-02", nombre: "Seguidor de Máxima Potencia (MPPT)", masa: 6, cdA: 0.005, pot: 0, bat: 0, posAlm: new Vector3(7.5, 0.2, 5.0), posRel: new Vector3(0, 0.4, 0.5) },
    { id: "c3-01", nombre: "Motor Eléctrico BLDC 3.8 kW", masa: 22, cdA: 0.01, pot: 0, bat: 0, posAlm: new Vector3(4.5, 0.2, 6.5), posRel: new Vector3(0, 0.25, -1.1) },
    { id: "c3-03", nombre: "Inversor Trifásico y Transmisión", masa: 10, cdA: 0.01, pot: 0, bat: 0, posAlm: new Vector3(6.0, 0.2, 6.5), posRel: new Vector3(0, 0.4, -0.9) },
    { id: "c1-03", nombre: "Estructura Portapaneles Aerodinámica", masa: 20, cdA: 0.02, pot: 0, bat: 0, posAlm: new Vector3(7.5, 0.2, 6.5), posRel: new Vector3(0, 0.75, 0) },
    { id: "c2-01", nombre: "Arreglo Celdas Fotovoltaicas 4m²", masa: 18, cdA: -0.01, pot: 950, bat: 0, posAlm: new Vector3(9.0, 0.2, 3.5), posRel: new Vector3(0, 0.85, 0) },
    { id: "c6-04", nombre: "Instrumentación y Telemetría CAN", masa: 8, cdA: 0.005, pot: 0, bat: 0, posAlm: new Vector3(9.0, 0.2, 5.0), posRel: new Vector3(0, 0.55, 0.5) }
  ];

  defsPiezas.forEach((d) => {
    let nodoPieza = null;
    try {
      nodoPieza = createSolarPart(scene, d.id, { labels: false });
    } catch (e) {
      console.warn("Fallback procedural para pieza:", d.id);
    }
    if (!nodoPieza) {
      nodoPieza = MeshBuilder.CreateBox("fallback_" + d.id, { width: 0.8, height: 0.4, depth: 0.8 }, scene);
      nodoPieza.material = pbrLibrary.metal;
    }

    nodoPieza.position.copyFrom(d.posAlm);
    nodoPieza.parent = null;

    const meshes = nodoPieza.getChildMeshes ? nodoPieza.getChildMeshes() : [nodoPieza];
    meshes.forEach((m) => {
      m.metadata = { idPieza: d.id, nombre: d.nombre, fase: "Fase E (Ingeniería)" };
      m.receiveShadows = true;
      shadowGenerator.addShadowCaster(m);

      if (d.id === "c2-01") m.material = pbrLibrary.solar;
      else if (d.id.startsWith("c5-05") || d.id.startsWith("c5-06")) m.material = pbrLibrary.goma;
      else if (d.id === "c3-01" || d.id === "c3-03") m.material = pbrLibrary.copper;
      else if (d.id === "c1-01") m.material = pbrLibrary.metal;
    });

    componentesVehiculo.push({
      id: d.id,
      nombre: d.nombre,
      fase: "Fase E (Ingeniería)",
      nodo: nodoPieza,
      montado: false,
      posAlmacen: d.posAlm.clone(),
      posRelativaAlCarro: d.posRel.clone(),
      rotFinal: Vector3.Zero(),
      masa: d.masa,
      deltaCdA: d.cdA,
      potenciaSolar: d.pot,
      capacidadBat: d.bat,
      esRueda: !!d.esRueda,
      ruedaTipo: d.ruedaTipo || null
    });
  });

  // ==========================================
  // 5. MOTOR FÍSICO Y GESTOR STEAM
  // ==========================================
  const physics = new SolarVehiclePhysics();
  let enModoPista = false;

  // ==========================================
  // GESTOR DE PERSISTENCIA Y PROGRESO (AUTOGUARDADO / JSON / CSV)
  // ==========================================
  const progressMgr = new ProgressManager();

  const steam = new SteamManager({
    onStateChange: () => actualizarUI(),
    onCarroceriaChange: (concept, cdA, colorHex) => {
      physics.setBodyworkCdA(cdA);
      pbrLibrary.carroceria.albedoColor = Color3.FromHexString(colorHex);
      casco.material.albedoColor = Color3.FromHexString(colorHex);
      carroceriaConceptMesh.setEnabled(true);
      if (concept === "bullet") {
        carroceriaConceptMesh.scaling.set(0.88, 0.85, 1.15);
      } else if (concept === "catamaran") {
        carroceriaConceptMesh.scaling.set(1.22, 0.78, 1.0);
      } else {
        carroceriaConceptMesh.scaling.set(1.0, 1.0, 1.0);
      }
      actualizarUI();
    },
    onBmsChange: (vMax, vMin, regenRatio) => {
      physics.setBmsConfig(vMax, vMin, regenRatio);
      actualizarUI();
    },
    onSolarChange: (irrad, angleDeg, cellTemp) => {
      physics.setSolarEnvironment(irrad, angleDeg, cellTemp);
      dirSun.direction = new Vector3(
        -Math.cos((angleDeg * Math.PI) / 180),
        -Math.sin((angleDeg * Math.PI) / 180),
        0.35
      );
      actualizarUI();
    }
  });

  // Restaurar automáticamente el estado de ensamblaje guardado previamente (Persistencia en Recarga)
  const savedAssembly = progressMgr.loadFromStorage();
  if (savedAssembly) {
    progressMgr.applyState(savedAssembly, componentesVehiculo, steam, physics, carChassisBody);
  }

  // ==========================================
  // 6. LÓGICA DE ENSAMBLAJE Y ANIMACIÓN INTERACTIVA
  // ==========================================
  let animando = false;

  const montarPieza = (index) => {
    if (steam.isTeacherMode) {
      alert("⚠️ Modo Profesor activo: Solo lectura habilitada.");
      return;
    }
    if (index < 0 || index >= componentesVehiculo.length) return;
    const p = componentesVehiculo[index];
    if (p.montado || animando) return;

    vehicleAudio.playAssemblyClick();
    animando = true;
    p.nodo.parent = carChassisBody;

    Animation.CreateAndStartAnimation(
      "posAnim_" + p.id,
      p.nodo,
      "position",
      60,
      25,
      p.nodo.position.clone(),
      p.posRelativaAlCarro,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
      null,
      () => {
        p.montado = true;
        animando = false;
        highlightLayer.addMesh(p.nodo.getChildMeshes ? p.nodo.getChildMeshes()[0] : p.nodo, Color3.Green());
        setTimeout(() => highlightLayer.removeAllMeshes(), 600);

        const montadas = componentesVehiculo.filter(c => c.montado).length;
        if (montadas >= componentesVehiculo.length) {
          steam.unlockNextPhase("E");
        }
        progressMgr.saveToStorage(componentesVehiculo, steam, physics, true);
        actualizarUI();
      }
    );
  };

  const desmontarPieza = (index) => {
    if (steam.isTeacherMode) return;
    if (index < 0 || index >= componentesVehiculo.length) return;
    const p = componentesVehiculo[index];
    if (!p.montado || animando) return;

    vehicleAudio.playAssemblyClick();
    animando = true;
    p.nodo.parent = null;

    Animation.CreateAndStartAnimation(
      "posAnim_" + p.id,
      p.nodo,
      "position",
      60,
      25,
      p.nodo.position.clone(),
      p.posAlmacen,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
      null,
      () => {
        p.montado = false;
        animando = false;
        progressMgr.saveToStorage(componentesVehiculo, steam, physics, true);
        actualizarUI();
      }
    );
  };

  const montarSiguiente = () => {
    if (animando || steam.isTeacherMode) return;
    const siguiente = componentesVehiculo.find(c => !c.montado);
    if (siguiente) {
      montarPieza(componentesVehiculo.indexOf(siguiente));
    }
  };

  const desarmarTodo = () => {
    if (steam.isTeacherMode) return;
    steam.confirmReset(() => {
      componentesVehiculo.forEach((p, idx) => {
        if (p.montado) desmontarPieza(idx);
      });
      setTimeout(() => {
        progressMgr.saveToStorage(componentesVehiculo, steam, physics, true);
      }, 500);
    });
  };

  // Clic interactivo
  scene.onPointerDown = (evt, pickResult) => {
    vehicleAudio.init(); // Iniciar contexto de audio con la primera interacción del usuario
    if (pickResult.hit && pickResult.pickedMesh) {
      const nombreMesh = pickResult.pickedMesh.name;
      if (nombreMesh === "porton") {
        togglePorton();
        return;
      }
      let meta = pickResult.pickedMesh.metadata;
      if (!meta && pickResult.pickedMesh.parent) {
        meta = pickResult.pickedMesh.parent.metadata;
      }
      if (meta && meta.esHerramienta) {
        const cat = meta.category === "seguridad" ? "🦺 Seguridad" : "🔧 Herramienta";
        const tooltip = document.getElementById("tooltip-guia");
        if (tooltip) tooltip.innerText = `${cat}: ${meta.label || meta.name} (Lista para usar)`;
        highlightLayer.removeAllMeshes();
        highlightLayer.addMesh(pickResult.pickedMesh, Color3.Yellow());
        setTimeout(() => highlightLayer.removeAllMeshes(), 800);
        return;
      }
      if (meta && meta.idPieza) {
        const idx = componentesVehiculo.findIndex(c => c.id === meta.idPieza);
        if (idx !== -1) {
          if (!componentesVehiculo[idx].montado) montarPieza(idx);
          else desmontarPieza(idx);
        }
      }
    }
  };

  // Portón del taller
  let portonAbierto = false;
  let animandoPorton = false;
  const togglePorton = () => {
    if (animandoPorton) return;
    animandoPorton = true;
    const anim = new Animation("animPorton", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys([
      { frame: 0, value: porton.position.y },
      { frame: 30, value: portonAbierto ? posCerradoY : posAbiertoY }
    ]);
    porton.animations = [anim];
    scene.beginAnimation(porton, 0, 30, false, 1.0, () => {
      portonAbierto = !portonAbierto;
      animandoPorton = false;
      actualizarUI();
    });
  };

  // ==========================================
  // 7. CONTROLES Y TELEMETRÍA EN PISTA
  // ==========================================
  const keyState = {};
  window.addEventListener("keydown", (e) => {
    vehicleAudio.init();
    keyState[e.key.toLowerCase()] = true;
    keyState[e.code] = true;

    if (e.key === "e" || e.key === "E") togglePorton();
    if (e.key === "f" || e.key === "F") montarSiguiente();
    if (e.key === "t" || e.key === "T") toggleModoPista();
    if (e.key === "r" || e.key === "R") {
      physics.resetVehicle(new Vector3(0, 0.35, enModoPista ? 20 : -4));
    }
  });

  window.addEventListener("keyup", (e) => {
    keyState[e.key.toLowerCase()] = false;
    keyState[e.code] = false;
  });

  const toggleModoPista = () => {
    vehicleAudio.init();
    enModoPista = !enModoPista;
    if (enModoPista) {
      if (!portonAbierto) togglePorton();
      physics.resetVehicle(new Vector3(0, 0.35, 20));
      carRoot.position.set(0, 0.35, 20);
      carRoot.rotation.set(0, 0, 0);
      setCamaraMode("track");
    } else {
      physics.resetVehicle(new Vector3(0, 0.35, -4));
      carRoot.position.set(0, 0.35, -4);
      carRoot.rotation.set(0, 0, 0);
      setCamaraMode("fps");
    }
    actualizarUI();
  };

  // ==========================================
  // 8. DASHBOARD PROFESIONAL DE TELEMETRÍA (UI/UX)
  // ==========================================
  const uiContainer = document.createElement("div");
  uiContainer.id = "solar-app-container";
  uiContainer.innerHTML = `
    <style>
      #solar-app-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #fff;
        user-select: none;
      }
      .steam-top-bar {
        position: absolute;
        top: 15px;
        left: 20px;
        right: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        pointer-events: auto;
      }
      .steam-phases-nav {
        display: flex;
        gap: 8px;
        background: rgba(10, 14, 22, 0.88);
        backdrop-filter: blur(12px);
        padding: 6px 14px;
        border-radius: 30px;
        border: 1px solid rgba(80, 150, 255, 0.35);
        box-shadow: 0 8px 25px rgba(0,0,0,0.5);
      }
      .steam-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.08);
        color: #a0aec0;
        border: 1px solid transparent;
        transition: all 0.2s ease;
      }
      .steam-pill:hover { background: rgba(0, 122, 255, 0.35); color: #fff; }
      .steam-pill.unlocked { color: #5ac8fa; }
      .steam-pill.completed { background: rgba(48, 209, 88, 0.2); color: #30d158; border-color: rgba(48, 209, 88, 0.4); }
      .steam-pill.active { border-color: #ffd60a; color: #ffd60a; font-weight: 700; box-shadow: 0 0 12px rgba(255, 214, 10, 0.35); }
      .steam-pill:focus-visible { outline: 2px solid #5ac8fa; outline-offset: 2px; }

      .top-right-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .badge-role {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        transition: all 0.2s;
      }
            .autosave-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(10, 20, 30, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(80, 200, 120, 0.4);
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        color: #72d5a3;
      }
      .autosave-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #30d158;
        box-shadow: 0 0 8px #30d158;
        display: inline-block;
      }
      .autosave-dot.saving {
        background: #ffd60a;
        box-shadow: 0 0 8px #ffd60a;
      }
      .btn-storage {
        background: rgba(18, 28, 44, 0.9);
        backdrop-filter: blur(10px);
        color: #ffffff;
        border: 1px solid rgba(90, 160, 255, 0.35);
        border-radius: 20px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s ease;
      }
      .btn-storage:hover {
        background: rgba(0, 122, 255, 0.45);
        border-color: #5ac8fa;
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
      }
      .btn-storage:focus-visible {
        outline: 2px solid #5ac8fa;
        outline-offset: 2px;
      }
      .badge-role.teacher {
        background: linear-gradient(90deg, #ff9500, #ff3b30);
        border-color: #ff9500;
      }

      /* Panel de Telemetría Estilo Cockpit / Motec */
      .panel-telemetria {
        position: absolute;
        top: 75px;
        right: 20px;
        width: 330px;
        background: rgba(10, 14, 22, 0.92);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(80, 150, 255, 0.4);
        border-radius: 16px;
        padding: 16px 20px;
        pointer-events: auto;
        box-shadow: 0 15px 40px rgba(0,0,0,0.65);
      }
      .telem-title {
        font-size: 14px;
        font-weight: 700;
        color: #5ac8fa;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        border-bottom: 1px solid rgba(255,255,255,0.12);
        padding-bottom: 6px;
      }
      /* Barra de LEDs de RPM */
      .rpm-led-bar {
        display: flex;
        gap: 3px;
        height: 6px;
        margin-bottom: 12px;
      }
      .rpm-led {
        flex: 1;
        background: rgba(255,255,255,0.12);
        border-radius: 2px;
        transition: background 0.1s;
      }
      .rpm-led.lit-green { background: #30d158; box-shadow: 0 0 6px #30d158; }
      .rpm-led.lit-yellow { background: #ffd60a; box-shadow: 0 0 6px #ffd60a; }
      .rpm-led.lit-red { background: #ff453a; box-shadow: 0 0 6px #ff453a; }

      .telem-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 5px 0;
        font-size: 13px;
      }
      .telem-label { color: #a0aec0; }
      .telem-val { font-weight: 700; color: #fff; }
      .telem-unit { color: #5ac8fa; font-size: 11px; margin-left: 3px; }

      /* G-Meter y Flujo de Energía */
      .g-meter-box {
        display: flex;
        justify-content: space-between;
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 8px 12px;
        margin-top: 10px;
        font-size: 12px;
      }

      /* Barra de Controles Inferior */
      .bottom-control-bar {
        position: absolute;
        bottom: 25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(12, 16, 24, 0.94);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 35px;
        padding: 8px 22px;
        display: flex;
        gap: 12px;
        pointer-events: auto;
        box-shadow: 0 10px 35px rgba(0,0,0,0.7);
      }
      .btn-action {
        background: rgba(45, 55, 72, 0.85);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        padding: 8px 18px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .btn-action:hover { background: #007aff; border-color: #5ac8fa; transform: translateY(-1px); }
      .btn-action:focus-visible { outline: 2px solid #5ac8fa; outline-offset: 2px; }
      .btn-action.pista { background: #ff9500; color: #000; font-weight: 700; }
      .btn-action.danger { background: rgba(235, 87, 87, 0.2); border-color: #eb5757; color: #ff8080; }
      .btn-action.danger:hover { background: #eb5757; color: #fff; }

      .tooltip-info {
        position: absolute;
        bottom: 85px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 15, 25, 0.92);
        border: 1px solid rgba(90, 200, 250, 0.4);
        border-radius: 8px;
        padding: 8px 20px;
        font-size: 12px;
        color: #e2e8f0;
        pointer-events: none;
      }
    </style>

    <!-- Barra Superior STEAM -->
    <div class="steam-top-bar">
      <div class="steam-phases-nav">
        <button id="pill-M" class="steam-pill" tabindex="0">📐 M: Matemáticas</button>
        <button id="pill-S" class="steam-pill" tabindex="0">☀️ S: Ciencia</button>
        <button id="pill-E" class="steam-pill" tabindex="0">🛠️ E: Ingeniería</button>
        <button id="pill-T" class="steam-pill" tabindex="0">💻 T: Tecnología</button>
        <button id="pill-A" class="steam-pill" tabindex="0">🎨 A: Arte</button>
      </div>

      <div class="top-right-actions">
        <div id="autosave-status" class="autosave-pill" title="El avance de ensamblaje se guarda automáticamente en tu navegador">
          <span class="autosave-dot saved"></span>
          <span id="autosave-text">Progreso guardado</span>
        </div>
        <button id="btn-export-json" class="btn-storage" title="Guardar y descargar copia de seguridad (.JSON)" tabindex="0">💾 Guardar (.JSON)</button>
        <button id="btn-export-csv" class="btn-storage" title="Exportar reporte técnico de piezas (.CSV para Excel)" tabindex="0">📊 Exportar (.CSV)</button>
        <button id="btn-import-json" class="btn-storage" title="Restaurar progreso desde un archivo .JSON previo" tabindex="0">📂 Cargar (.JSON)</button>
        <input type="file" id="input-import-json" accept=".json,application/json" style="display:none;" />
        <button id="btn-toggle-role" class="badge-role" tabindex="0">👨‍🎓 Modo Alumno</button>
        <button id="btn-lang-toggle" class="badge-role" tabindex="0">🌐 ES</button>
      </div>
    </div>

    <!-- Panel de Telemetría Profesional -->
    <div class="panel-telemetria">
      <div class="telem-title">
        <span id="ui-mode-label">Taller Solar 3D</span>
        <span id="telem-speed" style="color: #30d158; font-size: 16px;">0.0 km/h</span>
      </div>

      <!-- Barra LED de Tacómetro -->
      <div id="rpm-leds" class="rpm-led-bar">
        ${Array.from({ length: 12 }).map((_, i) => `<div class="rpm-led" data-idx="${i}"></div>`).join('')}
      </div>

      <div class="telem-row">
        <span class="telem-label">Potencia Motor:</span>
        <span><span id="telem-motor-pow" class="telem-val">0</span><span class="telem-unit">W</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">Régimen Rotor:</span>
        <span><span id="telem-motor-rpm" class="telem-val">0</span><span class="telem-unit">RPM</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">Aporte Solar (P_s):</span>
        <span><span id="telem-solar" class="telem-val" style="color: #ffd60a;">0</span><span class="telem-unit">W</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">Batería (SoC):</span>
        <span><span id="telem-soc" class="telem-val" style="color: #30d158;">88.0</span><span class="telem-unit">%</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">Tensión de Pack:</span>
        <span><span id="telem-voltage" class="telem-val">96.0</span><span class="telem-unit">V</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">Freno Regenerativo:</span>
        <span id="telem-regen-status" class="telem-val" style="color: #88a0c0;">INACTIVO</span>
      </div>
      <div class="telem-row">
        <span class="telem-label">Arrastre (Cd·A):</span>
        <span><span id="telem-cda" class="telem-val">0.118</span><span class="telem-unit">m²</span></span>
      </div>

      <div class="g-meter-box">
        <span>Fuerza G Long: <b id="g-long">0.00 g</b></span>
        <span>G Lateral: <b id="g-lat">0.00 g</b></span>
      </div>
      <div class="g-meter-box" style="margin-top: 6px;">
        <span>Temp Pack: <b id="temp-bat" style="color: #5ac8fa;">27.5 °C</b></span>
        <span>Temp Motor: <b id="temp-mot" style="color: #ffd60a;">30.0 °C</b></span>
      </div>
    </div>

    <!-- Barra Inferior de Controles -->
    <div class="bottom-control-bar">
      <button id="btn-instalar" class="btn-action" tabindex="0">➕ Instalar Pieza (F)</button>
      <button id="btn-pista" class="btn-action pista" tabindex="0">🏎️ Conducir en Pista (T)</button>
      <button id="btn-camara" class="btn-action" tabindex="0">🎥 Vista Cámara (C)</button>
      <button id="btn-porton" class="btn-action" tabindex="0">🚪 Portón (E)</button>
      <button id="btn-desarmar" class="btn-action danger" tabindex="0">🗑️ Desarmar Todo</button>
    </div>

    <div id="tooltip-guia" class="tooltip-info">
      Presiona [F] para ensamblar piezas o [T] para conducir en el circuito de pruebas con física real.
    </div>
  `;
  document.body.appendChild(uiContainer);

  // Enlaces de eventos
  document.getElementById("pill-M").addEventListener("click", () => steam.openPhaseModal("M"));
  document.getElementById("pill-S").addEventListener("click", () => steam.openPhaseModal("S"));
  document.getElementById("pill-E").addEventListener("click", () => steam.openPhaseModal("E"));
  document.getElementById("pill-T").addEventListener("click", () => steam.openPhaseModal("T"));
  document.getElementById("pill-A").addEventListener("click", () => steam.openPhaseModal("A"));

  document.getElementById("btn-toggle-role").addEventListener("click", () => {
    steam.setTeacherMode(!steam.isTeacherMode);
    const btn = document.getElementById("btn-toggle-role");
    if (steam.isTeacherMode) {
      btn.innerText = "👨‍🏫 Modo Profesor (Lectura)";
      btn.classList.add("teacher");
    } else {
      btn.innerText = "👨‍🎓 Modo Alumno";
      btn.classList.remove("teacher");
    }
  });

  document.getElementById("btn-lang-toggle").addEventListener("click", () => {
    const cur = getLanguage();
    const next = cur === "es" ? "en" : "es";
    setLanguage(next);
    document.getElementById("btn-lang-toggle").innerText = `🌐 ${next.toUpperCase()}`;
    actualizarUI();
  });

  document.getElementById("btn-instalar").addEventListener("click", montarSiguiente);
  document.getElementById("btn-pista").addEventListener("click", toggleModoPista);
  document.getElementById("btn-camara").addEventListener("click", toggleCamara);
  document.getElementById("btn-porton").addEventListener("click", togglePorton);
  document.getElementById("btn-desarmar").addEventListener("click", desarmarTodo);

  const actualizarUI = () => {
    const phases = ["M", "S", "E", "T", "A"];
    phases.forEach(p => {
      const btn = document.getElementById(`pill-${p}`);
      if (!btn) return;
      btn.classList.remove("active", "unlocked", "completed");
      if (steam.progress[p].completed) btn.classList.add("completed");
      else if (steam.progress[p].unlocked) btn.classList.add("unlocked");
      if (steam.currentPhase === p) btn.classList.add("active");
    });

    const modeLabel = document.getElementById("ui-mode-label");
    if (modeLabel) {
      modeLabel.innerText = enModoPista ? "🏁 Circuito de Pruebas" : "🛠️ Taller Solar 3D";
      modeLabel.style.color = enModoPista ? "#ff9500" : "#5ac8fa";
    }

    const pistaBtn = document.getElementById("btn-pista");
    if (pistaBtn) {
      pistaBtn.innerText = enModoPista ? "🛠️ Volver al Taller (T)" : "🏎️ Conducir en Pista (T)";
    }

    const camBtn = document.getElementById("btn-camara");
    if (camBtn) {
      if (modoCamara === "cockpit") camBtn.innerText = "🏎️ Cámara Cockpit (C)";
      else if (modoCamara === "track") camBtn.innerText = "🎥 Persecución Exterior (C)";
      else if (modoCamara === "orbit") camBtn.innerText = "🔍 Inspección 360° (C)";
      else camBtn.innerText = "🚶 1ª Persona Taller (C)";
    }
  };

  // ==========================================
  // 9. BUCLE DE FÍSICA AVANZADA, AUDIO Y RENDER EN TIEMPO REAL
  // ==========================================
  let lastTime = performance.now();

  scene.registerBeforeRender(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (enModoPista) {
      let throttle = 0;
      let brake = 0;
      let steer = 0;

      if (keyState["w"] || keyState["arrowup"]) throttle = 1.0;
      if (keyState["s"] || keyState["arrowdown"]) brake = 1.0;
      if (keyState["a"] || keyState["arrowleft"]) steer = -0.36;
      if (keyState["d"] || keyState["arrowright"]) steer = 0.36;
      if (keyState[" "]) brake = 1.0;

      // Actualizar simulación física
      physics.setInputs(throttle, brake, steer);
      const telem = physics.update(dt);

      // Trasladar y rotar el vehículo en la pista
      carRoot.position.x = physics.position.x;
      carRoot.position.z = physics.position.z;
      carRoot.rotation.y = physics.headingAngle;

      // Suspensión reactiva: Cabeceo (pitch) al acelerar/frenar y Balanceo (roll) en curvas
      carChassisBody.rotation.x = physics.pitchAngle;
      carChassisBody.rotation.z = physics.rollAngle;

      // Rotación angular de ruedas
      const wheelAngSpeed = (physics.velocity / physics.wheelRadius) * dt;
      componentesVehiculo.forEach(c => {
        if (c.montado && c.esRueda) {
          c.nodo.rotation.x += wheelAngSpeed;
          if (c.ruedaTipo === "delantera") {
            c.nodo.rotation.y = physics.steeringAngle;
          }
        }
      });

      // Efecto lumínico de freno
      if (brake > 0.05) {
        luzFreno.material.emissiveColor = new Color3(1.0, 0.0, 0.0);
        luzFreno.scaling.set(1.1, 1.2, 1.1);
      } else {
        luzFreno.material.emissiveColor = new Color3(0.4, 0.0, 0.0);
        luzFreno.scaling.set(1.0, 1.0, 1.0);
      }

      // Partículas de humo al derrapar
      if (physics.lateralSlip > 0.35 && physics.velocity > 3) {
        if (!tireSmokePS.isStarted()) tireSmokePS.start();
      } else {
        if (tireSmokePS.isStarted()) tireSmokePS.stop();
      }

      // Actualizar Audio Sintético
      vehicleAudio.update(telem, physics.lateralSlip);

      // Actualizar Telemetría en HUD
      document.getElementById("telem-speed").innerText = `${telem.speedKmh.toFixed(1)} km/h`;
      document.getElementById("telem-motor-pow").innerText = telem.motorPowerW.toString();
      document.getElementById("telem-motor-rpm").innerText = telem.motorRpm.toString();
      document.getElementById("telem-solar").innerText = telem.solarPowerW.toString();
      document.getElementById("telem-soc").innerText = telem.batterySoc.toFixed(1);
      document.getElementById("telem-voltage").innerText = telem.batteryVoltage.toFixed(1);
      document.getElementById("telem-cda").innerText = physics.cdA.toFixed(3);
      document.getElementById("g-long").innerText = `${telem.gForceLong >= 0 ? '+' : ''}${telem.gForceLong.toFixed(2)} g`;
      document.getElementById("g-lat").innerText = `${telem.gForceLat >= 0 ? '+' : ''}${telem.gForceLat.toFixed(2)} g`;
      document.getElementById("temp-bat").innerText = `${telem.batteryTempC.toFixed(1)} °C`;
      document.getElementById("temp-mot").innerText = `${telem.motorTempC.toFixed(1)} °C`;

      // Barra LED de Tacómetro
      const leds = document.querySelectorAll(".rpm-led");
      const litCount = Math.round((telem.motorRpm / 4500) * leds.length);
      leds.forEach((led, idx) => {
        led.className = "rpm-led";
        if (idx < litCount) {
          if (idx < 6) led.classList.add("lit-green");
          else if (idx < 9) led.classList.add("lit-yellow");
          else led.classList.add("lit-red");
        }
      });

      const regenLabel = document.getElementById("telem-regen-status");
      if (regenLabel) {
        if (telem.regenActive) {
          regenLabel.innerText = `RECUPERANDO (+${telem.regenPowerW} W)`;
          regenLabel.style.color = "#30d158";
        } else {
          regenLabel.innerText = "INACTIVO";
          regenLabel.style.color = "#88a0c0";
        }
      }

      // Verificación de Misión
      if (physics.missionSuccess) {
        physics.missionSuccess = false;
        steam.showMissionModal(true, telem, () => toggleModoPista());
      } else if (physics.missionFailed) {
        physics.missionFailed = false;
        steam.showMissionModal(false, telem, () => toggleModoPista());
      }
    }
  });

  actualizarUI();
  hideLoadingScreen();
  return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
