import {
  Engine,
  Scene,
  UniversalCamera,
  ArcRotateCamera,
  Vector3,
  Color3,
  HemisphericLight,
  PointLight,
  StandardMaterial,
  MeshBuilder,
  Animation,
  HighlightLayer
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { createSafetyAndTools } from "./piezas/safety-tools.js";
import {
  createSolarPart,
  createAllSolarParts,
  SOLAR_PARTS_META,
  SOLAR_CATEGORIES
} from "./piezas/solar-piezas.js";

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true);

const createScene = () => {
  const scene = new Scene(engine);
  scene.clearColor = new Color3(0.55, 0.75, 0.95); // Cielo

  // ==========================================
  // 1. FÍSICAS BÁSICAS Y COLISIONES
  // ==========================================
  scene.collisionsEnabled = true;
  scene.gravity = new Vector3(0, -9.81 / 60, 0);

  // ==========================================
  // 2. SISTEMA DE CÁMARAS (PRIMERA PERSONA Y ORBITAL DE INSPECCIÓN)
  // ==========================================
  const cameraFPS = new UniversalCamera("playerCamera", new Vector3(0, 1.8, -10), scene);
  cameraFPS.keysUp = [87, 38];       // W / Flecha Arriba
  cameraFPS.keysDown = [83, 40];     // S / Flecha Abajo
  cameraFPS.keysLeft = [65, 37];     // A / Flecha Izquierda
  cameraFPS.keysRight = [68, 39];    // D / Flecha Derecha
  cameraFPS.speed = 0.35;
  cameraFPS.angularSensibility = 2500;
  cameraFPS.checkCollisions = true;
  cameraFPS.applyGravity = true;
  cameraFPS.ellipsoid = new Vector3(0.6, 0.88, 0.6);

  const cameraOrbit = new ArcRotateCamera("orbitCamera", -Math.PI / 2, Math.PI / 3, 5.5, new Vector3(0, 0.9, -4), scene);
  cameraOrbit.lowerRadiusLimit = 2.0;
  cameraOrbit.upperRadiusLimit = 12.0;
  cameraOrbit.wheelPrecision = 40;
  cameraOrbit.checkCollisions = true;

  let modoOrbital = false;
  scene.activeCamera = cameraFPS;
  cameraFPS.attachControl(canvas, true);

  const toggleCamara = () => {
    modoOrbital = !modoOrbital;
    if (modoOrbital) {
      cameraFPS.detachControl();
      scene.activeCamera = cameraOrbit;
      cameraOrbit.attachControl(canvas, true);
    } else {
      cameraOrbit.detachControl();
      scene.activeCamera = cameraFPS;
      cameraFPS.attachControl(canvas, true);
    }
    actualizarUI();
  };

  // Correr con SHIFT y cambiar cámara con C
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
  // 3. ILUMINACIÓN AVANZADA DE TALLER
  // ==========================================
  const sunLight = new HemisphericLight("sunLight", new Vector3(0, 1, 0), scene);
  sunLight.intensity = 0.65;

  const garageLight = new PointLight("garageLight", new Vector3(0, 7, -3), scene);
  garageLight.diffuse = new Color3(1, 0.96, 0.9);
  garageLight.intensity = 0.9;
  garageLight.range = 35;

  // Foco cenital sobre el carro solar
  const carSpotLight = new PointLight("carSpotLight", new Vector3(0, 4.5, -4), scene);
  carSpotLight.diffuse = new Color3(0.85, 0.95, 1.0);
  carSpotLight.intensity = 1.2;
  carSpotLight.range = 15;

  // Luz para la tarima de repuestos
  const benchSpot = new PointLight("benchSpot", new Vector3(5.5, 3.5, -4), scene);
  benchSpot.diffuse = new Color3(1.0, 0.85, 0.65);
  benchSpot.intensity = 0.8;
  benchSpot.range = 10;

  // ==========================================
  // 4. MATERIALES
  // ==========================================
  const matPared = new StandardMaterial("matPared", scene);
  matPared.diffuseColor = new Color3(0.72, 0.73, 0.76);

  const matPisoGarage = new StandardMaterial("matPisoGarage", scene);
  matPisoGarage.diffuseColor = new Color3(0.24, 0.25, 0.28);
  matPisoGarage.specularColor = new Color3(0.15, 0.15, 0.15);

  const matPisoExterior = new StandardMaterial("matPisoExterior", scene);
  matPisoExterior.diffuseColor = new Color3(0.14, 0.14, 0.14);

  const matPorton = new StandardMaterial("matPorton", scene);
  matPorton.diffuseColor = new Color3(0.85, 0.35, 0.12);

  const matMarco = new StandardMaterial("matMarco", scene);
  matMarco.diffuseColor = new Color3(0.1, 0.1, 0.1);

  const matPista = new StandardMaterial("matPista", scene);
  matPista.diffuseColor = new Color3(0.12, 0.12, 0.12);

  const matLineaCentral = new StandardMaterial("matLineaCentral", scene);
  matLineaCentral.diffuseColor = new Color3(0.9, 0.9, 0.1);

  const matBanco = new StandardMaterial("matBanco", scene);
  matBanco.diffuseColor = new Color3(0.2, 0.2, 0.22);

  const matCajaHerramientas = new StandardMaterial("matCajaHerramientas", scene);
  matCajaHerramientas.diffuseColor = new Color3(0.75, 0.1, 0.1);

  const matMetalCromado = new StandardMaterial("matMetalCromado", scene);
  matMetalCromado.diffuseColor = new Color3(0.85, 0.85, 0.9);
  matMetalCromado.specularColor = new Color3(1, 1, 1);

  const matMangoDestornillador = new StandardMaterial("matMangoDestornillador", scene);
  matMangoDestornillador.diffuseColor = new Color3(0.1, 0.7, 0.2);

  const matMangoPinza = new StandardMaterial("matMangoPinza", scene);
  matMangoPinza.diffuseColor = new Color3(0.15, 0.15, 0.15);

  const matGato = new StandardMaterial("matGato", scene);
  matGato.diffuseColor = new Color3(0.1, 0.5, 0.8);

  const matCaballete = new StandardMaterial("matCaballete", scene);
  matCaballete.diffuseColor = new Color3(0.9, 0.7, 0.05);

  const matTarimaRepuestos = new StandardMaterial("matTarimaRepuestos", scene);
  matTarimaRepuestos.diffuseColor = new Color3(0.18, 0.18, 0.2);

  // Materiales de alta fidelidad para el Vehículo Solar
  const matFibraCarbono = new StandardMaterial("matFibraCarbono", scene);
  matFibraCarbono.diffuseColor = new Color3(0.12, 0.12, 0.13);
  matFibraCarbono.specularColor = new Color3(0.3, 0.3, 0.35);

  const matChasisTubular = new StandardMaterial("matChasisTubular", scene);
  matChasisTubular.diffuseColor = new Color3(0.25, 0.45, 0.85);
  matChasisTubular.specularColor = new Color3(0.6, 0.6, 0.7);

  const matSuspensionAluminio = new StandardMaterial("matSuspensionAluminio", scene);
  matSuspensionAluminio.diffuseColor = new Color3(0.85, 0.2, 0.2);
  matSuspensionAluminio.specularColor = new Color3(0.9, 0.9, 0.9);

  const matResorteAmortiguador = new StandardMaterial("matResorteAmortiguador", scene);
  matResorteAmortiguador.diffuseColor = new Color3(1.0, 0.8, 0.0);
  matResorteAmortiguador.specularColor = new Color3(0.8, 0.8, 0.8);

  const matNeumatico = new StandardMaterial("matNeumatico", scene);
  matNeumatico.diffuseColor = new Color3(0.08, 0.08, 0.08);

  const matRinAero = new StandardMaterial("matRinAero", scene);
  matRinAero.diffuseColor = new Color3(0.75, 0.75, 0.8);

  const matMotorBLDC = new StandardMaterial("matMotorBLDC", scene);
  matMotorBLDC.diffuseColor = new Color3(0.7, 0.4, 0.15);
  matMotorBLDC.specularColor = new Color3(0.9, 0.7, 0.4);

  const matBateriaLiFePO4 = new StandardMaterial("matBateriaLiFePO4", scene);
  matBateriaLiFePO4.diffuseColor = new Color3(0.15, 0.75, 0.35);

  const matElectronica = new StandardMaterial("matElectronica", scene);
  matElectronica.diffuseColor = new Color3(0.15, 0.15, 0.18);

  const matCableadoAltoVoltaje = new StandardMaterial("matCableadoAltoVoltaje", scene);
  matCableadoAltoVoltaje.diffuseColor = new Color3(0.95, 0.45, 0.05);

  const matCarroceriaAero = new StandardMaterial("matCarroceriaAero", scene);
  matCarroceriaAero.diffuseColor = new Color3(0.92, 0.93, 0.95);
  matCarroceriaAero.specularColor = new Color3(0.8, 0.85, 0.9);

  const matPanelSolar = new StandardMaterial("matPanelSolar", scene);
  matPanelSolar.diffuseColor = new Color3(0.04, 0.12, 0.28);
  matPanelSolar.specularColor = new Color3(0.7, 0.85, 1.0);

  const matCupulaCanopy = new StandardMaterial("matCupulaCanopy", scene);
  matCupulaCanopy.diffuseColor = new Color3(0.1, 0.3, 0.5);
  matCupulaCanopy.alpha = 0.45;

  // ==========================================
  // 5. ESTRUCTURA DEL TALLER Y PISTA EXTERIOR
  // ==========================================
  const ancho = 22;
  const alto = 8;
  const prof = 26;
  const zGarage = -5;

  const pisoGarage = MeshBuilder.CreateGround("pisoGarage", { width: ancho, height: prof }, scene);
  pisoGarage.position = new Vector3(0, 0, zGarage);
  pisoGarage.material = matPisoGarage;
  pisoGarage.checkCollisions = true;

  const pisoExterior = MeshBuilder.CreateGround("pisoExterior", { width: 300, height: 300 }, scene);
  pisoExterior.position = new Vector3(0, -0.01, 100);
  pisoExterior.material = matPisoExterior;
  pisoExterior.checkCollisions = true;

  const paredIzq = MeshBuilder.CreateBox("paredIzq", { width: 0.5, height: alto, depth: prof }, scene);
  paredIzq.position = new Vector3(-ancho / 2, alto / 2, zGarage);
  paredIzq.material = matPared;
  paredIzq.checkCollisions = true;

  const paredDer = MeshBuilder.CreateBox("paredDer", { width: 0.5, height: alto, depth: prof }, scene);
  paredDer.position = new Vector3(ancho / 2, alto / 2, zGarage);
  paredDer.material = matPared;
  paredDer.checkCollisions = true;

  const paredFondo = MeshBuilder.CreateBox("paredFondo", { width: ancho, height: alto, depth: 0.5 }, scene);
  paredFondo.position = new Vector3(0, alto / 2, zGarage - prof / 2);
  paredFondo.material = matPared;
  paredFondo.checkCollisions = true;

  const techo = MeshBuilder.CreateBox("techo", { width: ancho, height: 0.4, depth: prof }, scene);
  techo.position = new Vector3(0, alto, zGarage);
  techo.material = matPared;
  techo.checkCollisions = true;

  const anchoPorton = 12;
  const altoPorton = 6;
  const zEntrada = zGarage + prof / 2;

  const dintel = MeshBuilder.CreateBox("dintel", { width: ancho, height: alto - altoPorton, depth: 0.5 }, scene);
  dintel.position = new Vector3(0, altoPorton + (alto - altoPorton) / 2, zEntrada);
  dintel.material = matPared;
  dintel.checkCollisions = true;

  const colIzq = MeshBuilder.CreateBox("colIzq", { width: (ancho - anchoPorton) / 2, height: altoPorton, depth: 0.5 }, scene);
  colIzq.position = new Vector3(-(anchoPorton / 2 + (ancho - anchoPorton) / 4), altoPorton / 2, zEntrada);
  colIzq.material = matPared;
  colIzq.checkCollisions = true;

  const colDer = MeshBuilder.CreateBox("colDer", { width: (ancho - anchoPorton) / 2, height: altoPorton, depth: 0.5 }, scene);
  colDer.position = new Vector3((anchoPorton / 2 + (ancho - anchoPorton) / 4), altoPorton / 2, zEntrada);
  colDer.material = matPared;
  colDer.checkCollisions = true;

  const marcoIzq = MeshBuilder.CreateBox("marcoIzq", { width: 0.25, height: altoPorton, depth: 0.6 }, scene);
  marcoIzq.position = new Vector3(-anchoPorton / 2, altoPorton / 2, zEntrada);
  marcoIzq.material = matMarco;

  const marcoDer = MeshBuilder.CreateBox("marcoDer", { width: 0.25, height: altoPorton, depth: 0.6 }, scene);
  marcoDer.position = new Vector3(anchoPorton / 2, altoPorton / 2, zEntrada);
  marcoDer.material = matMarco;

  const porton = MeshBuilder.CreateBox("porton", { width: anchoPorton - 0.1, height: altoPorton, depth: 0.2 }, scene);
  const posCerradoY = altoPorton / 2;
  const posAbiertoY = altoPorton + (alto - altoPorton) / 2 + altoPorton / 2;
  porton.position = new Vector3(0, posCerradoY, zEntrada);
  porton.material = matPorton;
  porton.checkCollisions = true;

  const largoCalle = 200;
  const anchoCalle = 14;
  const callePrincipal = MeshBuilder.CreateGround("callePrincipal", { width: anchoCalle, height: largoCalle }, scene);
  callePrincipal.position = new Vector3(0, 0.01, zEntrada + largoCalle / 2);
  callePrincipal.material = matPista;
  callePrincipal.checkCollisions = true;

  const lineaCalle = MeshBuilder.CreateBox("lineaCalle", { width: 0.35, height: 0.02, depth: largoCalle - 2 }, scene);
  lineaCalle.position = new Vector3(0, 0.02, zEntrada + largoCalle / 2);
  lineaCalle.material = matLineaCentral;

  // ==========================================
  // 6. BANCO DE TRABAJO Y ESTACIÓN CENTRAL
  // ==========================================
  const bancoTrabajo = MeshBuilder.CreateBox("bancoTrabajo", { width: 2, height: 1.0, depth: 8 }, scene);
  bancoTrabajo.position = new Vector3(-ancho / 2 + 1.2, 0.5, -3);
  bancoTrabajo.material = matBanco;
  bancoTrabajo.checkCollisions = true;

  const cajonera = MeshBuilder.CreateBox("cajoneraHerramientas", { width: 1.5, height: 1.2, depth: 2 }, scene);
  cajonera.position = new Vector3(-ancho / 2 + 1.2, 0.6, -8);
  cajonera.material = matCajaHerramientas;
  cajonera.checkCollisions = true;

  const llave = MeshBuilder.CreateBox("herramienta_llave", { width: 0.15, height: 0.05, depth: 1.0 }, scene);
  llave.position = new Vector3(-ancho / 2 + 1.2, 1.05, -5);
  llave.material = matMetalCromado;

  const ratchetCuerpo = MeshBuilder.CreateBox("herramienta_ratchet", { width: 0.2, height: 0.06, depth: 1.1 }, scene);
  ratchetCuerpo.position = new Vector3(-ancho / 2 + 1.2, 1.05, -3.5);
  ratchetCuerpo.material = matMetalCromado;

  const destornilladorMango = MeshBuilder.CreateCylinder("herramienta_destornillador", { diameter: 0.12, height: 0.6 }, scene);
  destornilladorMango.rotation.x = Math.PI / 2;
  destornilladorMango.position = new Vector3(-ancho / 2 + 1.2, 1.05, -2);
  destornilladorMango.material = matMangoDestornillador;

  const pinzas = MeshBuilder.CreateBox("herramienta_pinzas", { width: 0.3, height: 0.08, depth: 0.9 }, scene);
  pinzas.position = new Vector3(-ancho / 2 + 1.2, 1.05, -0.5);
  pinzas.material = matMangoPinza;

  const gatoHidraulico = MeshBuilder.CreateBox("gatoHidraulico", { width: 0.8, height: 0.3, depth: 1.5 }, scene);
  gatoHidraulico.position = new Vector3(3.2, 0.15, -1.5);
  gatoHidraulico.material = matGato;
  gatoHidraulico.checkCollisions = true;

  // Caballetes del vehículo
  const zCarro = -4.0;
  const caballeteDel = MeshBuilder.CreateBox("caballeteDel", { width: 1.6, height: 0.25, depth: 0.3 }, scene);
  caballeteDel.position = new Vector3(0, 0.125, zCarro + 1.1);
  caballeteDel.material = matCaballete;

  const caballeteTras = MeshBuilder.CreateBox("caballeteTras", { width: 1.6, height: 0.25, depth: 0.3 }, scene);
  caballeteTras.position = new Vector3(0, 0.125, zCarro - 1.1);
  caballeteTras.material = matCaballete;

  // Tarima de Repuestos
  const xTarima = 6.0;
  const tarimaRepuestos = MeshBuilder.CreateBox("tarimaRepuestos", { width: 3.5, height: 0.4, depth: 8.0 }, scene);
  tarimaRepuestos.position = new Vector3(xTarima, 0.2, zCarro);
  tarimaRepuestos.material = matTarimaRepuestos;
  tarimaRepuestos.checkCollisions = true;

  // ==========================================
  // 7. SUBSISTEMAS PROCEDURALES DEL VEHÍCULO
  // ==========================================
  const posCarroBase = new Vector3(0, 0.35, zCarro);
  const componentesVehiculo = [];

  // ==========================================
  // 7.5. PIEZAS DE SEGURIDAD Y HERRAMIENTAS (safety-tools.js)
  // ==========================================
  const piezasExtra = createSafetyAndTools(scene, {
    spacing: 2.2,
    columns: 4,
    scale: 0.85
  });

  const origenX = -8.5;
  const origenZ = -13.5;
  let contadorExtra = 0;
  for (const [nombre, nodo] of piezasExtra) {
    const col = contadorExtra % 4;
    const fila = Math.floor(contadorExtra / 4);
    nodo.position.set(origenX + col * 2.2, 0.02, origenZ + fila * 2.2);
    contadorExtra++;

    nodo.getChildMeshes().forEach((m) => {
      m.isPickable = true;
      m.metadata = {
        esHerramienta: true,
        id: nombre,
        ...(nodo.metadata || {})
      };
    });
  }

  const registrarPieza = (config) => {
    const nodo = config.mesh;
    nodo.position = config.posAlmacen.clone();
    nodo.rotation = config.rotAlmacen ? config.rotAlmacen.clone() : Vector3.Zero();

    const hijos = nodo.getChildMeshes ? nodo.getChildMeshes() : [nodo];
    hijos.forEach((m) => {
      m.isPickable = true;
      m.metadata = { idPieza: config.id, ...(m.metadata || {}) };
    });

    componentesVehiculo.push({
      ...config,
      nodo,
      montado: false,
      posFinal: config.posCarro.clone(),
      rotFinal: config.rotCarro ? config.rotCarro.clone() : Vector3.Zero()
    });
  };

  // ========================================================
  // COMPONENTES IMPORTADOS DE /piezas/solar-piezas.js
  // ========================================================
  // 1. Chasis tubular
  registrarPieza({
    id: "c1-01",
    nombre: "1.1 · Chasis / Estructura Portante",
    fase: "Fase 1: Estructura Principal",
    descripcion: "Bastidor spaceframe con arco de seguridad y bandeja portante.",
    masa: 35.0,
    deltaCdA: 0.04,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c1-01", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima, 0.45, zCarro - 2.8),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.1, posCarroBase.z),
    vectorExplosion: new Vector3(0, 0, 0)
  });

  // 2. Asiento y arnés de 5 puntos
  registrarPieza({
    id: "c1-06",
    nombre: "1.6 · Asiento y Arnés de Sujeción",
    fase: "Fase 1: Estructura Principal",
    descripcion: "Asiento bucket con rieles de ajuste y arnés de 5 puntos de seguridad.",
    masa: 12.0,
    deltaCdA: 0.02,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c1-06", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima + 0.8, 0.45, zCarro - 1.4),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.2, posCarroBase.z - 0.2),
    vectorExplosion: new Vector3(0, 0.35, 0)
  });

  // 3. Volante de competición
  registrarPieza({
    id: "c5-01",
    nombre: "5.1 · Volante de Competición",
    fase: "Fase 1: Estructura Principal",
    descripcion: "Volante de 3 radios con quick-release y aro antideslizante.",
    masa: 2.5,
    deltaCdA: 0.01,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c5-01", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima - 0.8, 0.45, zCarro - 1.4),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.42, posCarroBase.z + 0.35),
    vectorExplosion: new Vector3(0, 0.45, 0.2)
  });

  // 4. Suspensión de doble horquilla
  registrarPieza({
    id: "c5-04",
    nombre: "5.4 · Sistema de Suspensión Pushrod",
    fase: "Fase 2: Suspensión y Dirección",
    descripcion: "Esquina con doble horquilla, mangueta, buje y pushrod hacia torreta.",
    masa: 16.0,
    deltaCdA: 0.02,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c5-04", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima - 0.8, 0.45, zCarro),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.15, posCarroBase.z + 0.95),
    vectorExplosion: new Vector3(0, 0, 0.5)
  });

  // 5. Amortiguadores coilover
  registrarPieza({
    id: "c5-05",
    nombre: "5.5 · Amortiguadores y Resortes",
    fase: "Fase 2: Suspensión y Dirección",
    descripcion: "Monoamortiguador coilover con vástago cromado y copelas.",
    masa: 7.0,
    deltaCdA: 0.01,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c5-05", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima + 0.8, 0.45, zCarro),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.25, posCarroBase.z + 0.8),
    vectorExplosion: new Vector3(0, 0.3, 0.4)
  });

  // 6. Frenos de disco ventilados
  registrarPieza({
    id: "c5-06",
    nombre: "5.6 · Sistema de Frenos",
    fase: "Fase 2: Suspensión y Dirección",
    descripcion: "Disco ventilado perforado con cáliper deportivo y latiguillo hidráulico.",
    masa: 6.5,
    deltaCdA: 0.005,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c5-06", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima, 0.45, zCarro),
    posCarro: new Vector3(posCarroBase.x + 0.45, posCarroBase.y + 0.12, posCarroBase.z + 0.95),
    vectorExplosion: new Vector3(0.5, 0, 0.2)
  });

  // 7. Ruedas solares
  registrarPieza({
    id: "c4-06",
    nombre: "4.6 · Ruedas Solares de Alta Presión",
    fase: "Fase 3: Tren Motriz y Ruedas",
    descripcion: "Rin monocasco de baja inercia y neumático de bajísima rodadura (Crr = 0.003).",
    masa: 14.0,
    deltaCdA: 0.015,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c4-06", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima + 0.8, 0.45, zCarro + 1.3),
    posCarro: new Vector3(posCarroBase.x + 0.52, posCarroBase.y + 0.15, posCarroBase.z + 0.95),
    vectorExplosion: new Vector3(0.7, 0, 0)
  });

  // 8. Motor de tracción BLDC
  registrarPieza({
    id: "c4-01",
    nombre: "4.1 · Motor Eléctrico de Tracción",
    fase: "Fase 3: Tren Motriz y Ruedas",
    descripcion: "Motor síncrono BLDC con aletas de refrigeración y sensor Hall integrado.",
    masa: 18.0,
    deltaCdA: 0.01,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c4-01", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima - 0.8, 0.45, zCarro + 1.3),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.18, posCarroBase.z - 1.1),
    vectorExplosion: new Vector3(0, 0, -0.6)
  });

  // 9. Controlador / Inversor de motor
  registrarPieza({
    id: "c4-02",
    nombre: "4.2 · Controlador del Motor",
    fase: "Fase 3: Tren Motriz y Ruedas",
    descripcion: "Inversor de potencia trifásico con >98% de rendimiento.",
    masa: 8.5,
    deltaCdA: 0.0,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c4-02", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima, 0.45, zCarro + 1.3),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.32, posCarroBase.z - 0.9),
    vectorExplosion: new Vector3(0, 0.3, -0.3)
  });

  // 10. Batería de tracción Li-ion
  registrarPieza({
    id: "c3-01",
    nombre: "3.1 · Batería de Tracción Li-Ion",
    fase: "Fase 4: Almacenamiento y Gestión",
    descripcion: "Pack modular 5.0 kWh con celdas 18650 y busbars de cobre.",
    masa: 28.0,
    deltaCdA: 0.0,
    potenciaSolar: 0,
    capacidadBat: 5.0,
    mesh: createSolarPart(scene, "c3-01", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima + 0.8, 0.45, zCarro + 2.5),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.12, posCarroBase.z - 0.5),
    vectorExplosion: new Vector3(0, -0.25, 0)
  });

  // 11. BMS y MPPT
  registrarPieza({
    id: "c3-03",
    nombre: "3.3 · Controlador MPPT Solar",
    fase: "Fase 4: Almacenamiento y Gestión",
    descripcion: "Controlador MPPT con aletas disipadoras y algoritmo P&O.",
    masa: 6.0,
    deltaCdA: 0.0,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c3-03", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima - 0.8, 0.45, zCarro + 2.5),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.35, posCarroBase.z - 0.65),
    vectorExplosion: new Vector3(0, 0.35, -0.2)
  });

  // 12. Carrocería aerodinámica
  registrarPieza({
    id: "c1-03",
    nombre: "1.3 · Paneles de Carrocería Composite",
    fase: "Fase 5: Carrocería Aerodinámica",
    descripcion: "Carenado aerodinámico optimizado CFD con bajísimo arrastre.",
    masa: 25.0,
    deltaCdA: -0.12,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c1-03", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima, 1.2, zCarro - 1.2),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.05, posCarroBase.z),
    vectorExplosion: new Vector3(0, 0.6, 0)
  });

  // 13. Celdas solares
  registrarPieza({
    id: "c2-01",
    nombre: "2.1 · Celdas Fotovoltaicas Monocristalinas",
    fase: "Fase 6: Sistema Solar y Telemetría",
    descripcion: "Arreglo de silicio monocristalino SunPower de alta eficiencia (1200 W pico).",
    masa: 11.0,
    deltaCdA: 0.002,
    potenciaSolar: 1200,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c2-01", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima, 1.2, zCarro + 0.6),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.58, posCarroBase.z),
    vectorExplosion: new Vector3(0, 0.9, 0)
  });

  // 14. Telemetría e instrumentación
  registrarPieza({
    id: "c6-04",
    nombre: "6.4 · Instrumentación y Telemetría",
    fase: "Fase 6: Sistema Solar y Telemetría",
    descripcion: "Pantalla con velocidad, SOC, potencia solar y módulo telemétrico.",
    masa: 4.5,
    deltaCdA: 0.005,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: createSolarPart(scene, "c6-04", { scale: 1.0 }),
    posAlmacen: new Vector3(xTarima, 1.2, zCarro + 2.2),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.46, posCarroBase.z + 0.2),
    vectorExplosion: new Vector3(0, 0.7, 0.2)
  });

  // ==========================================
  // 8. LÓGICA DE ENSAMBLAJE Y ANIMACIONES
  // ==========================================
  let estadoExplosion = false;
  let animando = false;

  const animarTransformacion = (nodo, posDestino, rotDestino, callback) => {
    const fps = 60;
    const frames = 30;

    Animation.CreateAndStartAnimation(
      "posAnim_" + nodo.name,
      nodo,
      "position",
      fps,
      frames,
      nodo.position.clone(),
      posDestino,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
      null,
      () => {
        if (callback) callback();
      }
    );

    if (rotDestino) {
      Animation.CreateAndStartAnimation(
        "rotAnim_" + nodo.name,
        nodo,
        "rotation",
        fps,
        frames,
        nodo.rotation.clone(),
        rotDestino,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
    }
  };

  const montarPieza = (index) => {
    if (index < 0 || index >= componentesVehiculo.length) return;
    const p = componentesVehiculo[index];
    if (p.montado) return;

    animando = true;
    animarTransformacion(p.nodo, p.posFinal, p.rotFinal, () => {
      p.montado = true;
      animando = false;
      highlightLayer.addMesh(p.nodo.getChildMeshes ? p.nodo.getChildMeshes()[0] : p.nodo, Color3.Green());
      setTimeout(() => {
        highlightLayer.removeAllMeshes();
      }, 700);
      actualizarUI();
    });
  };

  const desmontarPieza = (index) => {
    if (index < 0 || index >= componentesVehiculo.length) return;
    const p = componentesVehiculo[index];
    if (!p.montado) return;

    animando = true;
    animarTransformacion(p.nodo, p.posAlmacen, p.rotAlmacen || Vector3.Zero(), () => {
      p.montado = false;
      animando = false;
      actualizarUI();
    });
  };

  const montarSiguiente = () => {
    if (animando) return;
    const siguiente = componentesVehiculo.find((c) => !c.montado);
    if (siguiente) {
      const idx = componentesVehiculo.indexOf(siguiente);
      montarPieza(idx);
    }
  };

  const desmontarUltima = () => {
    if (animando) return;
    for (let i = componentesVehiculo.length - 1; i >= 0; i--) {
      if (componentesVehiculo[i].montado) {
        desmontarPieza(i);
        break;
      }
    }
  };

  const alternarVistaExplosionada = () => {
    if (animando) return;
    estadoExplosion = !estadoExplosion;

    componentesVehiculo.forEach((p) => {
      if (!p.montado) return;
      let posMeta = p.posFinal.clone();
      if (estadoExplosion) {
        posMeta.addInPlace(p.vectorExplosion);
      }
      animarTransformacion(p.nodo, posMeta, p.rotFinal);
    });

    actualizarUI();
  };

  // Clic interactivo sobre la escena
  scene.onPointerDown = (evt, pickResult) => {
    if (pickResult.hit && pickResult.pickedMesh) {
      const nombreMesh = pickResult.pickedMesh.name;
      
      if (nombreMesh === "porton") {
        togglePorton();
        return;
      }

      if (nombreMesh.startsWith("herramienta_")) {
        usarHerramienta(nombreMesh);
        return;
      }

      if (nombreMesh === "gatoHidraulico") {
        const animGato = new Animation("animGato", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        animGato.setKeys([
          { frame: 0, value: 0.15 },
          { frame: 15, value: 0.35 },
          { frame: 30, value: 0.15 }
        ]);
        pickResult.pickedMesh.animations = [animGato];
        scene.beginAnimation(pickResult.pickedMesh, 0, 30, false, 1.0);
        return;
      }

      let meta = pickResult.pickedMesh.metadata;
      if (meta && meta.esHerramienta) {
        const cat = meta.category === "seguridad" ? "🦺 Seguridad" : "🔧 Herramienta";
        const label = meta.label || meta.name || "Equipo";
        const tooltip = document.getElementById("tooltip-guia");
        if (tooltip) tooltip.innerText = `${cat}: ${label} (Disponible en taller)`;
        highlightLayer.removeAllMeshes();
        highlightLayer.addMesh(pickResult.pickedMesh, Color3.Yellow());
        setTimeout(() => highlightLayer.removeAllMeshes(), 1000);
        return;
      }
      if (!meta && pickResult.pickedMesh.parent) {
        meta = pickResult.pickedMesh.parent.metadata;
      }

      if (meta && meta.idPieza) {
        const idx = componentesVehiculo.findIndex((c) => c.id === meta.idPieza);
        if (idx !== -1) {
          const comp = componentesVehiculo[idx];
          if (!comp.montado) {
            montarPieza(idx);
          } else {
            desmontarPieza(idx);
          }
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

  const usarHerramienta = (nombreHerramienta) => {
    let meshAAnimar = scene.getMeshByName(nombreHerramienta);
    if (!meshAAnimar) return;

    const animUso = new Animation("animUso", "rotation.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    animUso.setKeys([
      { frame: 0, value: meshAAnimar.rotation.y },
      { frame: 15, value: meshAAnimar.rotation.y + Math.PI * 2 },
      { frame: 30, value: meshAAnimar.rotation.y }
    ]);

    meshAAnimar.animations = [animUso];
    scene.beginAnimation(meshAAnimar, 0, 30, false, 1.0);
  };

  // Teclado
  window.addEventListener("keydown", (e) => {
    if (e.key === "e" || e.key === "E") togglePorton();
    if (e.key === "f" || e.key === "F" || e.code === "Space") {
      e.preventDefault();
      montarSiguiente();
    }
    if (e.key === "z" || e.key === "Z") desmontarUltima();
    if (e.key === "x" || e.key === "X") alternarVistaExplosionada();
  });

  // ==========================================
  // 9. PANEL DE TELEMETRÍA Y HUD EN VIVO
  // ==========================================
  const contenedorUI = document.createElement("div");
  contenedorUI.id = "solar-workshop-ui";
  contenedorUI.innerHTML = `
    <style>
      #solar-workshop-ui {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #ffffff;
      }
      .panel-hud {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 320px;
        background: rgba(18, 22, 30, 0.88);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(80, 150, 255, 0.35);
        border-radius: 12px;
        padding: 18px;
        pointer-events: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      .hud-title {
        font-size: 16px;
        font-weight: 700;
        color: #5ac8fa;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(255,255,255,0.15);
        padding-bottom: 8px;
        margin-bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .kpi-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 7px 0;
        font-size: 13px;
      }
      .kpi-label { color: #a0aec0; }
      .kpi-value { font-weight: 700; color: #ffffff; }
      .kpi-unit { color: #5ac8fa; font-size: 11px; margin-left: 3px; }
      .progreso-barra-bg {
        width: 100%;
        height: 10px;
        background: rgba(255,255,255,0.12);
        border-radius: 5px;
        overflow: hidden;
        margin: 12px 0 6px 0;
      }
      .progreso-barra-fill {
        height: 100%;
        background: linear-gradient(90deg, #30d158, #007aff);
        width: 0%;
        transition: width 0.3s ease;
      }
      .panel-controles {
        position: absolute;
        bottom: 25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(18, 22, 30, 0.9);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 30px;
        padding: 8px 18px;
        display: flex;
        gap: 10px;
        pointer-events: auto;
        box-shadow: 0 8px 25px rgba(0,0,0,0.6);
      }
      .btn-workshop {
        background: rgba(45, 55, 72, 0.9);
        color: #ffffff;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .btn-workshop:hover {
        background: #007aff;
        border-color: #5ac8fa;
        transform: translateY(-1px);
      }
      .btn-workshop.activo {
        background: #ff9500;
        color: #000;
        font-weight: 700;
      }
      .tooltip-info {
        position: absolute;
        bottom: 85px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 15, 25, 0.85);
        border: 1px solid rgba(90, 200, 250, 0.3);
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 12px;
        color: #e2e8f0;
        pointer-events: none;
      }
    </style>

    <div class="panel-hud">
      <div class="hud-title">
        <span>Taller Solar Telemetría</span>
        <span id="hud-porcentaje" style="color: #30d158; font-size: 14px;">0%</span>
      </div>

      <div class="progreso-barra-bg">
        <div id="hud-barra" class="progreso-barra-fill"></div>
      </div>
      <div id="hud-fase-texto" style="font-size: 11px; color: #718096; margin-bottom: 12px;">Fase: Esperando ensamblaje</div>

      <div class="kpi-row">
        <span class="kpi-label">Masa Total (m):</span>
        <span><span id="kpi-masa" class="kpi-value">0</span><span class="kpi-unit">kg</span></span>
      </div>
      <div class="kpi-row">
        <span class="kpi-label">Potencia Solar Pico (Ps):</span>
        <span><span id="kpi-potencia" class="kpi-value" style="color: #ffd60a;">0</span><span class="kpi-unit">W</span></span>
      </div>
      <div class="kpi-row">
        <span class="kpi-label">Capacidad Batería (Ecap):</span>
        <span><span id="kpi-bateria" class="kpi-value" style="color: #30d158;">0.0</span><span class="kpi-unit">kWh</span></span>
      </div>
      <div class="kpi-row">
        <span class="kpi-label">Arrastre Aerodinámico (Cd·A):</span>
        <span><span id="kpi-cda" class="kpi-value">0.85</span><span class="kpi-unit">m²</span></span>
      </div>
      <div class="kpi-row">
        <span class="kpi-label">Velocidad Crucero Est.:</span>
        <span><span id="kpi-velocidad" class="kpi-value" style="color: #5ac8fa;">0</span><span class="kpi-unit">km/h</span></span>
      </div>
      <div class="kpi-row">
        <span class="kpi-label">Límite Vuelco Lateral (acorr):</span>
        <span><span id="kpi-vuelco" class="kpi-value">--</span><span class="kpi-unit">g</span></span>
      </div>
    </div>

    <div class="panel-controles">
      <button id="btn-montar" class="btn-workshop">➕ Montar Pieza (F)</button>
      <button id="btn-desmontar" class="btn-workshop">➖ Desmontar (Z)</button>
      <button id="btn-explosion" class="btn-workshop">💥 Vista Explosionada (X)</button>
      <button id="btn-camara" class="btn-workshop">🎥 Cambiar Cámara (C)</button>
      <button id="btn-porton" class="btn-workshop">🚪 Portón (E)</button>
    </div>

    <div id="tooltip-guia" class="tooltip-info">
      Haz clic en las piezas de la tarima derecha o presiona [F] para ensamblar el carro solar.
    </div>
  `;
  document.body.appendChild(contenedorUI);

  document.getElementById("btn-montar").addEventListener("click", montarSiguiente);
  document.getElementById("btn-desmontar").addEventListener("click", desmontarUltima);
  document.getElementById("btn-explosion").addEventListener("click", alternarVistaExplosionada);
  document.getElementById("btn-camara").addEventListener("click", toggleCamara);
  document.getElementById("btn-porton").addEventListener("click", togglePorton);

  const actualizarUI = () => {
    const montadas = componentesVehiculo.filter((c) => c.montado);
    const total = componentesVehiculo.length;
    const porcentaje = Math.round((montadas.length / total) * 100);

    let masaTotal = 0;
    let cdA = 0.85;
    let potenciaPico = 0;
    let bateriaKwh = 0;

    montadas.forEach((p) => {
      masaTotal += p.masa;
      cdA += p.deltaCdA;
      potenciaPico += p.potenciaSolar;
      bateriaKwh += p.capacidadBat;
    });

    cdA = Math.max(0.095, cdA);

    let velocidadCrucero = 0;
    if (potenciaPico > 0 && masaTotal > 0) {
      const rho = 1.225;
      const Crr = 0.003;
      const g = 9.81;
      let vEst = 15;
      for (let step = 0; step < 10; step++) {
        const pReq = 0.5 * cdA * rho * Math.pow(vEst, 3) + Crr * masaTotal * g * vEst;
        vEst = vEst * Math.pow(potenciaPico / Math.max(pReq, 10), 0.33);
      }
      velocidadCrucero = Math.min(130, Math.round(vEst * 3.6));
    }

    const trackWidth = 1.4;
    const f = trackWidth / 2;
    const h = 0.45;
    const acorr = (f / h).toFixed(2);

    document.getElementById("hud-porcentaje").innerText = `${porcentaje}%`;
    document.getElementById("hud-barra").style.width = `${porcentaje}%`;
    document.getElementById("kpi-masa").innerText = masaTotal.toString();
    document.getElementById("kpi-potencia").innerText = potenciaPico.toString();
    document.getElementById("kpi-bateria").innerText = bateriaKwh.toFixed(1);
    document.getElementById("kpi-cda").innerText = cdA.toFixed(3);
    document.getElementById("kpi-velocidad").innerText = velocidadCrucero.toString();
    document.getElementById("kpi-vuelco").innerText = montadas.length > 3 ? acorr : "--";

    const btnExplosion = document.getElementById("btn-explosion");
    if (estadoExplosion) {
      btnExplosion.classList.add("activo");
    } else {
      btnExplosion.classList.remove("activo");
    }

    const btnCamara = document.getElementById("btn-camara");
    btnCamara.innerText = modoOrbital ? "🚶 Vista 1ª Persona (C)" : "🔍 Vista Inspección 360° (C)";

    const siguiente = componentesVehiculo.find((c) => !c.montado);
    const txtFase = document.getElementById("hud-fase-texto");
    if (siguiente) {
      txtFase.innerText = `${siguiente.fase}: Siguiente -> ${siguiente.nombre}`;
    } else {
      txtFase.innerText = "¡Vehículo Solar 100% Ensamblado y Listo para Pista!";
    }
  };

  // ==========================================
  // 10. BUCLE DE RENDER Y POSICIÓN DINÁMICA
  // ==========================================
  scene.registerBeforeRender(() => {
    pisoExterior.position.x = scene.activeCamera.position.x;
    pisoExterior.position.z = scene.activeCamera.position.z + 50;
  });

  actualizarUI();
  return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});