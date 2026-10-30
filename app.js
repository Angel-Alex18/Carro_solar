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

  const registrarPieza = (config) => {
    const nodo = config.mesh;
    nodo.position = config.posAlmacen.clone();
    nodo.rotation = config.rotAlmacen ? config.rotAlmacen.clone() : Vector3.Zero();

    const hijos = nodo.getChildMeshes ? nodo.getChildMeshes() : [nodo];
    hijos.forEach((m) => {
      m.isPickable = true;
      m.metadata = { idPieza: config.id };
    });

    componentesVehiculo.push({
      ...config,
      nodo,
      montado: false,
      posFinal: config.posCarro.clone(),
      rotFinal: config.rotCarro ? config.rotCarro.clone() : Vector3.Zero()
    });
  };

  // 1. Chasis Tubular y Celda de Seguridad
  const mallaChasis = MeshBuilder.CreateBox("chasis_tubos_base", { width: 0.85, height: 0.12, depth: 3.2 }, scene);
  mallaChasis.material = matChasisTubular;

  const tuboLatIzq = MeshBuilder.CreateCylinder("tuboLatIzq", { diameter: 0.06, height: 3.2 }, scene);
  tuboLatIzq.rotation.x = Math.PI / 2;
  tuboLatIzq.position.x = -0.42;
  tuboLatIzq.parent = mallaChasis;
  tuboLatIzq.material = matChasisTubular;

  const tuboLatDer = MeshBuilder.CreateCylinder("tuboLatDer", { diameter: 0.06, height: 3.2 }, scene);
  tuboLatDer.rotation.x = Math.PI / 2;
  tuboLatDer.position.x = 0.42;
  tuboLatDer.parent = mallaChasis;
  tuboLatDer.material = matChasisTubular;

  const arcoSeguridad = MeshBuilder.CreateTorus("arcoSeguridad", { diameter: 0.7, thickness: 0.06, tessellation: 24 }, scene);
  arcoSeguridad.position = new Vector3(0, 0.45, 0.1);
  arcoSeguridad.rotation.x = Math.PI / 2;
  arcoSeguridad.parent = mallaChasis;
  arcoSeguridad.material = matChasisTubular;

  registrarPieza({
    id: "chasis",
    nombre: "Chasis Tubular y Celda de Seguridad",
    fase: "Fase 1: Estructura Principal",
    descripcion: "Estructura espacial ultraligera en fibra de carbono y aleación aeronáutica con arco antivuelco.",
    masa: 35.0,
    deltaCdA: 0.04,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaChasis,
    posAlmacen: new Vector3(xTarima, 0.7, zCarro - 2.5),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.1, posCarroBase.z),
    vectorExplosion: new Vector3(0, 0, 0)
  });

  // 2. Cockpit y Asiento de Competición
  const mallaCockpit = MeshBuilder.CreateBox("cockpit_asiento", { width: 0.48, height: 0.65, depth: 0.5 }, scene);
  mallaCockpit.material = matFibraCarbono;

  const respaldo = MeshBuilder.CreateBox("respaldo", { width: 0.46, height: 0.65, depth: 0.1 }, scene);
  respaldo.position = new Vector3(0, 0.35, -0.22);
  respaldo.rotation.x = -0.2;
  respaldo.parent = mallaCockpit;
  respaldo.material = matFibraCarbono;

  const volanteColumna = MeshBuilder.CreateCylinder("volanteCol", { diameter: 0.04, height: 0.5 }, scene);
  volanteColumna.position = new Vector3(0, 0.25, 0.35);
  volanteColumna.rotation.x = 0.6;
  volanteColumna.parent = mallaCockpit;
  volanteColumna.material = matMetalCromado;

  const volanteAro = MeshBuilder.CreateTorus("volanteAro", { diameter: 0.28, thickness: 0.035, tessellation: 16 }, scene);
  volanteAro.position = new Vector3(0, 0.45, 0.5);
  volanteAro.rotation.x = 0.6;
  volanteAro.parent = mallaCockpit;
  volanteAro.material = matChasisTubular;

  registrarPieza({
    id: "cockpit",
    nombre: "Cockpit, Asiento de Carrera y Dirección",
    fase: "Fase 1: Estructura Principal",
    descripcion: "Cabina del piloto ergonómica con volante tipo F1 y display de telemetría.",
    masa: 12.0,
    deltaCdA: 0.02,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaCockpit,
    posAlmacen: new Vector3(xTarima + 0.8, 0.7, zCarro - 1.0),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.2, posCarroBase.z + 0.1),
    vectorExplosion: new Vector3(0, 0.4, 0)
  });

  // 3. Suspensión Delantera Pushrod
  const mallaSuspDel = MeshBuilder.CreateBox("susp_del_base", { width: 1.4, height: 0.08, depth: 0.2 }, scene);
  mallaSuspDel.material = matSuspensionAluminio;

  const brazoIzqSup = MeshBuilder.CreateCylinder("brazoIzqSup", { diameter: 0.03, height: 0.5 }, scene);
  brazoIzqSup.rotation.z = Math.PI / 3;
  brazoIzqSup.position = new Vector3(-0.55, 0.1, 0);
  brazoIzqSup.parent = mallaSuspDel;
  brazoIzqSup.material = matSuspensionAluminio;

  const brazoDerSup = MeshBuilder.CreateCylinder("brazoDerSup", { diameter: 0.03, height: 0.5 }, scene);
  brazoDerSup.rotation.z = -Math.PI / 3;
  brazoDerSup.position = new Vector3(0.55, 0.1, 0);
  brazoDerSup.parent = mallaSuspDel;
  brazoDerSup.material = matSuspensionAluminio;

  const coiloverIzq = MeshBuilder.CreateCylinder("coiloverIzq", { diameter: 0.06, height: 0.3 }, scene);
  coiloverIzq.position = new Vector3(-0.35, 0.15, 0);
  coiloverIzq.rotation.z = -0.4;
  coiloverIzq.parent = mallaSuspDel;
  coiloverIzq.material = matResorteAmortiguador;

  const coiloverDer = MeshBuilder.CreateCylinder("coiloverDer", { diameter: 0.06, height: 0.3 }, scene);
  coiloverDer.position = new Vector3(0.35, 0.15, 0);
  coiloverDer.rotation.z = 0.4;
  coiloverDer.parent = mallaSuspDel;
  coiloverDer.material = matResorteAmortiguador;

  registrarPieza({
    id: "suspension_delantera",
    nombre: "Suspensión Delantera Pushrod (Doble Horquilla)",
    fase: "Fase 2: Suspensión y Dirección",
    descripcion: "Geometría de alta rigidez torsional (3°/g) con amortiguadores ajustables para optimizar el vuelco.",
    masa: 16.0,
    deltaCdA: 0.02,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaSuspDel,
    posAlmacen: new Vector3(xTarima - 0.7, 0.6, zCarro - 1.0),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.1, posCarroBase.z + 1.1),
    vectorExplosion: new Vector3(0, 0, 0.6)
  });

  // 4. Ruedas Delanteras Aerodinámicas
  const mallaRuedasDel = MeshBuilder.CreateBox("conjunto_ruedas_del", { width: 0.1, height: 0.1, depth: 0.1 }, scene);
  mallaRuedasDel.isVisible = false;

  const ruedaIzqMesh = MeshBuilder.CreateCylinder("ruedaIzqMesh", { diameter: 0.56, height: 0.12, tessellation: 24 }, scene);
  ruedaIzqMesh.rotation.z = Math.PI / 2;
  ruedaIzqMesh.position = new Vector3(-0.72, 0, 0);
  ruedaIzqMesh.parent = mallaRuedasDel;
  ruedaIzqMesh.material = matNeumatico;

  const rinIzqMesh = MeshBuilder.CreateCylinder("rinIzqMesh", { diameter: 0.42, height: 0.125, tessellation: 20 }, scene);
  rinIzqMesh.rotation.z = Math.PI / 2;
  rinIzqMesh.position = new Vector3(-0.72, 0, 0);
  rinIzqMesh.parent = mallaRuedasDel;
  rinIzqMesh.material = matRinAero;

  const ruedaDerMesh = MeshBuilder.CreateCylinder("ruedaDerMesh", { diameter: 0.56, height: 0.12, tessellation: 24 }, scene);
  ruedaDerMesh.rotation.z = Math.PI / 2;
  ruedaDerMesh.position = new Vector3(0.72, 0, 0);
  ruedaDerMesh.parent = mallaRuedasDel;
  ruedaDerMesh.material = matNeumatico;

  const rinDerMesh = MeshBuilder.CreateCylinder("rinDerMesh", { diameter: 0.42, height: 0.125, tessellation: 20 }, scene);
  rinDerMesh.rotation.z = Math.PI / 2;
  rinDerMesh.position = new Vector3(0.72, 0, 0);
  rinDerMesh.parent = mallaRuedasDel;
  rinDerMesh.material = matRinAero;

  registrarPieza({
    id: "ruedas_delanteras",
    nombre: "Ruedas Delanteras de Baja Fricción (Crr = 0.003)",
    fase: "Fase 3: Tren Motriz y Ruedas",
    descripcion: "Neumáticos solares de competición con rines aerodinámicos lenticulares.",
    masa: 14.0,
    deltaCdA: 0.015,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaRuedasDel,
    posAlmacen: new Vector3(xTarima + 0.8, 0.6, zCarro + 0.5),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.1, posCarroBase.z + 1.1),
    vectorExplosion: new Vector3(0.6, 0, 0)
  });

  // 5. Rueda Trasera Motriz con Motor In-Wheel BLDC
  const mallaRuedaTrasBLDC = MeshBuilder.CreateBox("conjunto_rueda_tras", { width: 0.1, height: 0.1, depth: 0.1 }, scene);
  mallaRuedaTrasBLDC.isVisible = false;

  const ruedaTrasMesh = MeshBuilder.CreateCylinder("ruedaTrasMesh", { diameter: 0.56, height: 0.14, tessellation: 24 }, scene);
  ruedaTrasMesh.rotation.z = Math.PI / 2;
  ruedaTrasMesh.position = new Vector3(0, 0, 0);
  ruedaTrasMesh.parent = mallaRuedaTrasBLDC;
  ruedaTrasMesh.material = matNeumatico;

  const motorHub = MeshBuilder.CreateCylinder("motorHub", { diameter: 0.40, height: 0.15, tessellation: 24 }, scene);
  motorHub.rotation.z = Math.PI / 2;
  motorHub.position = new Vector3(0, 0, 0);
  motorHub.parent = mallaRuedaTrasBLDC;
  motorHub.material = matMotorBLDC;

  registrarPieza({
    id: "motor_bldc_trasero",
    nombre: "Motor Eléctrico de Cubo de Rueda (BLDC Hub Motor)",
    fase: "Fase 3: Tren Motriz y Ruedas",
    descripcion: "Motor trifásico síncrono de imanes permanentes integrado al eje con 96% de eficiencia de crucero.",
    masa: 18.0,
    deltaCdA: 0.01,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaRuedaTrasBLDC,
    posAlmacen: new Vector3(xTarima - 0.7, 0.6, zCarro + 0.5),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.1, posCarroBase.z - 1.2),
    vectorExplosion: new Vector3(0, 0, -0.7)
  });

  // 6. Banco de Baterías LiFePO4 (5.0 kWh)
  const mallaBateria = MeshBuilder.CreateBox("pack_baterias", { width: 0.72, height: 0.18, depth: 0.85 }, scene);
  mallaBateria.material = matBateriaLiFePO4;

  const bmsCaja = MeshBuilder.CreateBox("bmsCaja", { width: 0.25, height: 0.08, depth: 0.25 }, scene);
  bmsCaja.position = new Vector3(0, 0.12, 0.2);
  bmsCaja.parent = mallaBateria;
  bmsCaja.material = matElectronica;

  registrarPieza({
    id: "bateria_pack",
    nombre: "Banco de Baterías LiFePO4 de Alta Densidad",
    fase: "Fase 4: Sistema Energético y Electrónica",
    descripcion: "Pack modular de 5.0 kWh ubicado en la base para descender el Centro de Gravedad (h = 0.42 m).",
    masa: 28.0,
    deltaCdA: 0.0,
    potenciaSolar: 0,
    capacidadBat: 5.0,
    mesh: mallaBateria,
    posAlmacen: new Vector3(xTarima + 0.8, 0.6, zCarro + 2.0),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.1, posCarroBase.z - 0.45),
    vectorExplosion: new Vector3(0, -0.3, 0)
  });

  // 7. Electrónica de Potencia, Inversor y MPPT
  const mallaElectronica = MeshBuilder.CreateBox("modulo_potencia", { width: 0.6, height: 0.15, depth: 0.4 }, scene);
  mallaElectronica.material = matElectronica;

  for (let i = -2; i <= 2; i++) {
    const aleta = MeshBuilder.CreateBox(`aleta_${i}`, { width: 0.55, height: 0.04, depth: 0.02 }, scene);
    aleta.position = new Vector3(0, 0.09, i * 0.06);
    aleta.parent = mallaElectronica;
    aleta.material = matSuspensionAluminio;
  }

  registrarPieza({
    id: "inversor_mppt",
    nombre: "Inversor y Controladores MPPT (Perturb & Observe)",
    fase: "Fase 4: Sistema Energético y Electrónica",
    descripcion: "Electrónica de potencia con seguimiento del Punto de Máxima Potencia y >98% de eficiencia.",
    masa: 9.0,
    deltaCdA: 0.0,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaElectronica,
    posAlmacen: new Vector3(xTarima - 0.7, 0.6, zCarro + 2.0),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.25, posCarroBase.z - 0.85),
    vectorExplosion: new Vector3(0, 0.35, -0.3)
  });

  // 8. Fondo Plano Aerodinámico y Difusor
  const mallaFondoPlano = MeshBuilder.CreateBox("fondo_plano_chasis", { width: 1.5, height: 0.06, depth: 3.8 }, scene);
  mallaFondoPlano.material = matFibraCarbono;

  const difusorTrasero = MeshBuilder.CreateBox("difusorTrasero", { width: 1.3, height: 0.04, depth: 0.8 }, scene);
  difusorTrasero.position = new Vector3(0, 0.06, -1.6);
  difusorTrasero.rotation.x = -0.15;
  difusorTrasero.parent = mallaFondoPlano;
  difusorTrasero.material = matFibraCarbono;

  registrarPieza({
    id: "fondo_plano",
    nombre: "Belly Pan y Difusor Aerodinámico Inferior",
    fase: "Fase 5: Carrocería Aerodinámica",
    descripcion: "Suelo liso sellado para suprimir vórtices de interferencia y efecto suelo laminar (y+ < 1).",
    masa: 15.0,
    deltaCdA: -0.05,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaFondoPlano,
    posAlmacen: new Vector3(xTarima, 0.6, zCarro + 3.2),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y - 0.02, posCarroBase.z),
    vectorExplosion: new Vector3(0, -0.45, 0)
  });

  // 9. Carrocería Superior Aerodinámica (Aeroshell)
  const mallaAeroshell = MeshBuilder.CreateBox("aeroshell_superior", { width: 1.65, height: 0.35, depth: 4.2 }, scene);
  mallaAeroshell.material = matCarroceriaAero;

  const pontonIzq = MeshBuilder.CreateBox("pontonIzq", { width: 0.3, height: 0.35, depth: 4.0 }, scene);
  pontonIzq.position = new Vector3(-0.85, -0.05, 0);
  pontonIzq.parent = mallaAeroshell;
  pontonIzq.material = matCarroceriaAero;

  const pontonDer = MeshBuilder.CreateBox("pontonDer", { width: 0.3, height: 0.35, depth: 4.0 }, scene);
  pontonDer.position = new Vector3(0.85, -0.05, 0);
  pontonDer.parent = mallaAeroshell;
  pontonDer.material = matCarroceriaAero;

  registrarPieza({
    id: "carroceria_superior",
    nombre: "Carrocería Superior Monocasco (Cd = 0.11)",
    fase: "Fase 5: Carrocería Aerodinámica",
    descripcion: "Diseño optimizado en CFD con modelo SST k-omega para flujo laminar continuo.",
    masa: 22.0,
    deltaCdA: -0.08,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaAeroshell,
    posAlmacen: new Vector3(xTarima, 1.4, zCarro - 2.5),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.45, posCarroBase.z),
    vectorExplosion: new Vector3(0, 0.75, 0)
  });

  // 10. Matriz Fotovoltaica SunPower (1200 W Pico)
  const mallaMatrizSolar = MeshBuilder.CreateBox("matriz_solar_placa", { width: 1.55, height: 0.03, depth: 3.4 }, scene);
  mallaMatrizSolar.material = matPanelSolar;

  for (let z = -1.4; z <= 1.4; z += 0.45) {
    const divisorFila = MeshBuilder.CreateBox(`divSolar_${z}`, { width: 1.54, height: 0.032, depth: 0.015 }, scene);
    divisorFila.position = new Vector3(0, 0.005, z);
    divisorFila.parent = mallaMatrizSolar;
    divisorFila.material = matMetalCromado;
  }

  registrarPieza({
    id: "matriz_solar",
    nombre: "Arreglo Fotovoltaico SunPower (1200 W Pico)",
    fase: "Fase 6: Generación Solar y Acabados",
    descripcion: "Celdas de silicio monocristalino de alta eficiencia (24.2%) con recubrimiento térmico CHT.",
    masa: 11.0,
    deltaCdA: 0.002,
    potenciaSolar: 1200,
    capacidadBat: 0,
    mesh: mallaMatrizSolar,
    posAlmacen: new Vector3(xTarima, 1.6, zCarro),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.65, posCarroBase.z - 0.2),
    vectorExplosion: new Vector3(0, 1.15, 0)
  });

  // 11. Cúpula del Habitáculo (Canopy)
  const mallaCanopy = MeshBuilder.CreateSphere("canopy_cupula", { diameterX: 0.65, diameterY: 0.45, diameterZ: 1.2, segments: 16 }, scene);
  mallaCanopy.material = matCupulaCanopy;

  registrarPieza({
    id: "canopy",
    nombre: "Cúpula Aerodinámica de Policarbonato",
    fase: "Fase 6: Generación Solar y Acabados",
    descripcion: "Canopy óptico curvado para visibilidad del piloto con mínima resistencia de estela.",
    masa: 6.0,
    deltaCdA: 0.008,
    potenciaSolar: 0,
    capacidadBat: 0,
    mesh: mallaCanopy,
    posAlmacen: new Vector3(xTarima, 1.5, zCarro + 2.5),
    posCarro: new Vector3(posCarroBase.x, posCarroBase.y + 0.72, posCarroBase.z + 0.7),
    vectorExplosion: new Vector3(0, 0.9, 0.3)
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