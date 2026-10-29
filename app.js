import {
  Engine,
  Scene,
  UniversalCamera,
  Vector3,
  Color3,
  HemisphericLight,
  PointLight,
  StandardMaterial,
  MeshBuilder,
  Animation
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
  scene.gravity = new Vector3(0, -9.81 / 60, 0); // Gravedad terrestre adaptada al framerate

  // ==========================================
  // 2. CÁMARA EN PRIMERA PERSONA (CAMINAR)
  // ==========================================
  // Inicia adentro del garaje, a la altura de los ojos (Y = 1.75m)
  const camera = new UniversalCamera("playerCamera", new Vector3(0, 1.75, -5), scene);
  camera.attachControl(canvas, true);

  // Controles tipo FPS: W, A, S, D y flechas
  camera.keysUp = [87, 38];       // W, Arriba
  camera.keysDown = [83, 40];     // S, Abajo
  camera.keysLeft = [65, 37];     // A, Izquierda
  camera.keysRight = [68, 39];    // D, Derecha

  // Propiedades del jugador
  camera.speed = 0.35;
  camera.angularSensibility = 2500; // Sensibilidad del mouse
  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera.ellipsoid = new Vector3(0.6, 0.88, 0.6); // Tamaño del cuerpo del jugador (cápsula de choque)

  // Bloqueo del cursor al hacer clic (Pointer Lock) para controlar como un juego FPS
  canvas.addEventListener("click", () => {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    if (canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  });

  // Correr con la tecla SHIFT
  window.addEventListener("keydown", (e) => {
    if (e.key === "Shift") camera.speed = 0.65;
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") camera.speed = 0.35;
  });

  // ==========================================
  // 3. ILUMINACIÓN
  // ==========================================
  const sunLight = new HemisphericLight("sunLight", new Vector3(0, 1, 0), scene);
  sunLight.intensity = 0.7;

  // Foco de luz cálida dentro del garaje
  const garageLight = new PointLight("garageLight", new Vector3(0, 5, -2), scene);
  garageLight.diffuse = new Color3(1, 0.95, 0.85);
  garageLight.intensity = 0.9;
  garageLight.range = 25;

  // ==========================================
  // 4. MATERIALES
  // ==========================================
  const matPared = new StandardMaterial("matPared", scene);
  matPared.diffuseColor = new Color3(0.75, 0.75, 0.78);

  const matPisoGarage = new StandardMaterial("matPisoGarage", scene);
  matPisoGarage.diffuseColor = new Color3(0.28, 0.28, 0.3);

  const matPisoExterior = new StandardMaterial("matPisoExterior", scene);
  matPisoExterior.diffuseColor = new Color3(0.15, 0.15, 0.15); // Asfalto calle

  const matPorton = new StandardMaterial("matPorton", scene);
  matPorton.diffuseColor = new Color3(0.85, 0.35, 0.12); // Naranja llamativo

  const matMarco = new StandardMaterial("matMarco", scene);
  matMarco.diffuseColor = new Color3(0.1, 0.1, 0.1);

  // ==========================================
  // 5. ESTRUCTURA DEL GARAJE
  // ==========================================
  const ancho = 14;
  const alto = 6;
  const prof = 18;
  const zGarage = -3;

  // Suelo del Garaje
  const pisoGarage = MeshBuilder.CreateGround("pisoGarage", { width: ancho, height: prof }, scene);
  pisoGarage.position = new Vector3(0, 0, zGarage);
  pisoGarage.material = matPisoGarage;
  pisoGarage.checkCollisions = true;

  // Suelo exterior (carretera para salir a caminar)
  const pisoExterior = MeshBuilder.CreateGround("pisoExterior", { width: 50, height: 60 }, scene);
  pisoExterior.position = new Vector3(0, 0, 36);
  pisoExterior.material = matPisoExterior;
  pisoExterior.checkCollisions = true;

  // Pared Izquierda
  const paredIzq = MeshBuilder.CreateBox("paredIzq", { width: 0.5, height: alto, depth: prof }, scene);
  paredIzq.position = new Vector3(-ancho / 2, alto / 2, zGarage);
  paredIzq.material = matPared;
  paredIzq.checkCollisions = true;

  // Pared Derecha
  const paredDer = MeshBuilder.CreateBox("paredDer", { width: 0.5, height: alto, depth: prof }, scene);
  paredDer.position = new Vector3(ancho / 2, alto / 2, zGarage);
  paredDer.material = matPared;
  paredDer.checkCollisions = true;

  // Pared Trasera
  const paredFondo = MeshBuilder.CreateBox("paredFondo", { width: ancho, height: alto, depth: 0.5 }, scene);
  paredFondo.position = new Vector3(0, alto / 2, zGarage - prof / 2);
  paredFondo.material = matPared;
  paredFondo.checkCollisions = true;

  // Techo
  const techo = MeshBuilder.CreateBox("techo", { width: ancho, height: 0.4, depth: prof }, scene);
  techo.position = new Vector3(0, alto, zGarage);
  techo.material = matPared;
  techo.checkCollisions = true;

  // ==========================================
  // 6. FACHADA Y PORTÓN GRANDE LEVADIZO
  // ==========================================
  const anchoPorton = 8.5;
  const altoPorton = 4.5;
  const zEntrada = zGarage + prof / 2;

  // Dintel superior
  const dintel = MeshBuilder.CreateBox("dintel", { width: ancho, height: alto - altoPorton, depth: 0.5 }, scene);
  dintel.position = new Vector3(0, altoPorton + (alto - altoPorton) / 2, zEntrada);
  dintel.material = matPared;
  dintel.checkCollisions = true;

  // Columna frontal izquierda
  const colIzq = MeshBuilder.CreateBox("colIzq", { width: (ancho - anchoPorton) / 2, height: altoPorton, depth: 0.5 }, scene);
  colIzq.position = new Vector3(-(anchoPorton / 2 + (ancho - anchoPorton) / 4), altoPorton / 2, zEntrada);
  colIzq.material = matPared;
  colIzq.checkCollisions = true;

  // Columna frontal derecha
  const colDer = MeshBuilder.CreateBox("colDer", { width: (ancho - anchoPorton) / 2, height: altoPorton, depth: 0.5 }, scene);
  colDer.position = new Vector3((anchoPorton / 2 + (ancho - anchoPorton) / 4), altoPorton / 2, zEntrada);
  colDer.material = matPared;
  colDer.checkCollisions = true;

  // Marcos metálicos guía
  const marcoIzq = MeshBuilder.CreateBox("marcoIzq", { width: 0.25, height: altoPorton, depth: 0.6 }, scene);
  marcoIzq.position = new Vector3(-anchoPorton / 2, altoPorton / 2, zEntrada);
  marcoIzq.material = matMarco;

  const marcoDer = MeshBuilder.CreateBox("marcoDer", { width: 0.25, height: altoPorton, depth: 0.6 }, scene);
  marcoDer.position = new Vector3(anchoPorton / 2, altoPorton / 2, zEntrada);
  marcoDer.material = matMarco;

  // Portón con colisión
  const porton = MeshBuilder.CreateBox("porton", { width: anchoPorton - 0.1, height: altoPorton, depth: 0.2 }, scene);
  const posCerradoY = altoPorton / 2;
  const posAbiertoY = altoPorton + altoPorton / 2 - 0.2; // Sube al dintel
  porton.position = new Vector3(0, posCerradoY, zEntrada);
  porton.material = matPorton;
  porton.checkCollisions = true;

  // Lógica de apertura/cierre
  let portonAbierto = false;
  let animando = false;

  const togglePorton = () => {
    if (animando) return;
    animando = true;

    const anim = new Animation(
      "animPorton",
      "position.y",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: porton.position.y },
      { frame: 30, value: portonAbierto ? posCerradoY : posAbiertoY }
    ];
    anim.setKeys(keys);

    porton.animations = [anim];
    scene.beginAnimation(porton, 0, 30, false, 1.0, () => {
      portonAbierto = !portonAbierto;
      animando = false;
    });
  };

  // Abrir/cerrar con la tecla E
  window.addEventListener("keydown", (e) => {
    if (e.key === "e" || e.key === "E") {
      togglePorton();
    }
  });

  // Abrir/cerrar con clic directo sobre el portón
  scene.onPointerDown = (evt, pickResult) => {
    if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.name === "porton") {
      togglePorton();
    }
  };

  // Zona amarilla marcada en el suelo (donde se armará el carro solar)
  const zonaCarro = MeshBuilder.CreateGround("zonaCarro", { width: 3.5, height: 6 }, scene);
  zonaCarro.position = new Vector3(0, 0.02, -2);
  const matZona = new StandardMaterial("matZona", scene);
  matZona.diffuseColor = new Color3(0.9, 0.75, 0.1);
  zonaCarro.material = matZona;

  return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});