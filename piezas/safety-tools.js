// Piezas 3D de Seguridad y Herramientas para Auto Solar
// Babylon.js 9+ | JavaScript ES Modules | Sin CDN ni frameworks
//
// Uso:
// import { createSafetyAndTools } from "./safety-tools.js";
// const piezas = createSafetyAndTools(scene);
// piezas.get("jaula_seguridad").position.set(0, 0, 0);
//
// Cada pieza es un TransformNode independiente. Sus meshes hijos se mueven juntos.

import {
  TransformNode,
  MeshBuilder,
  Vector3,
  Color3,
  StandardMaterial,
  DynamicTexture
} from "@babylonjs/core";

export function createSafetyAndTools(scene, options = {}) {
  const spacing = options.spacing ?? 4.2;
  const columns = options.columns ?? 4;
  const scale = options.scale ?? 1;
  const pieces = new Map();

  const mats = {};
  function material(name, color, metallic = 0) {
    const m = new StandardMaterial(name, scene);
    m.diffuseColor = Color3.FromHexString(color);
    m.specularColor = new Color3(0.25, 0.25, 0.25);
    m.specularPower = 64;
    m.metallic = metallic;
    mats[name] = m;
    return m;
  }

  const metal = material("pieza_metal", "#AEB8C2", 0.65);
  const darkMetal = material("metal_oscuro", "#303840", 0.55);
  const black = material("negro_goma", "#17191C");
  const red = material("rojo_seguridad", "#D62828");
  const yellow = material("amarillo_seguridad", "#F4C430");
  const orange = material("naranja", "#F07822");
  const blue = material("azul_equipo", "#245A9A");
  const green = material("verde", "#24965A");
  const white = material("blanco", "#E8E8E8");
  const glass = material("pantalla", "#8CC7D9");
  const copper = material("cobre", "#B87333", 0.5);
  const fabric = material("cinta_arnes", "#252B35");
  const skin = material("guante", "#E5B84B");

  function root(name) {
    const node = new TransformNode(name, scene);
    node.scaling.setAll(scale);
    return node;
  }
  function box(parent, name, w, h, d, pos, mat, opts = {}) {
    const mesh = MeshBuilder.CreateBox(name, {
      width: w, height: h, depth: d,
      ...(opts.bevel ? { bevel: true } : {})
    }, scene);
    mesh.position.copyFrom(pos);
    mesh.material = mat;
    mesh.parent = parent;
    return mesh;
  }
  function cylinder(parent, name, diameter, height, pos, mat, tess = 20) {
    const mesh = MeshBuilder.CreateCylinder(name, {
      diameter, height, tessellation: tess
    }, scene);
    mesh.position.copyFrom(pos);
    mesh.material = mat;
    mesh.parent = parent;
    return mesh;
  }
  function sphere(parent, name, diameter, pos, mat) {
    const mesh = MeshBuilder.CreateSphere(name, { diameter, segments: 12 }, scene);
    mesh.position.copyFrom(pos);
    mesh.material = mat;
    mesh.parent = parent;
    return mesh;
  }
  function tube(parent, name, points, radius, mat) {
    const mesh = MeshBuilder.CreateTube(name, {
      path: points.map(p => new Vector3(p[0], p[1], p[2])),
      radius, tessellation: 10, cap: MeshBuilder.CAP_ALL
    }, scene);
    mesh.material = mat;
    mesh.parent = parent;
    return mesh;
  }
  function add(name, label, builder, category) {
    const node = root(name);
    builder(node);
    node.metadata = { name, label, category, author: "Nehemias", type: "procedural-3d" };
    const index = pieces.size;
    node.position.set((index % columns) * spacing, 0, Math.floor(index / columns) * spacing);
    pieces.set(name, node);
    return node;
  }
  function labelPlate(parent, text, color = white) {
    // Placa física sencilla; el nombre también queda disponible en metadata.
    box(parent, "placa_nombre", 1.15, 0.12, 0.48, new Vector3(0, 0.08, 0.82), darkMetal);
    box(parent, "placa_texto_base", 0.88, 0.025, 0.28, new Vector3(0, 0.16, 0.82), color);
  }

  // 7. SEGURIDAD

  add("jaula_seguridad", "Estructura de seguridad", p => {
    // Bastidor tubular tipo jaula antivuelco, a escala de exhibición.
    const r = 0.075;
    tube(p, "arco_trasero", [[-0.95,0.1,-0.55],[-0.95,1.65,-0.55],[-0.75,1.9,-0.55],[0.75,1.9,-0.55],[0.95,1.65,-0.55],[0.95,0.1,-0.55]], r, metal);
    tube(p, "arco_delantero", [[-0.95,0.1,0.65],[-0.95,1.35,0.65],[-0.75,1.55,0.65],[0.75,1.55,0.65],[0.95,1.35,0.65],[0.95,0.1,0.65]], r, metal);
    tube(p, "barra_lateral_izq", [[-0.95,0.85,-0.55],[-0.95,0.85,0.65]], r, metal);
    tube(p, "barra_lateral_der", [[0.95,0.85,-0.55],[0.95,0.85,0.65]], r, metal);
    tube(p, "refuerzo_diagonal_izq", [[-0.95,1.55,-0.55],[0,0.2,0.65]], r*0.75, darkMetal);
    tube(p, "refuerzo_diagonal_der", [[0.95,1.55,-0.55],[0,0.2,0.65]], r*0.75, darkMetal);
    box(p, "base_jaula", 2.05, 0.12, 1.45, new Vector3(0,0.05,0.05), darkMetal);
  }, "seguridad");

  add("arnes_cuatro_puntos", "Cinturón / arnés de cuatro puntos", p => {
    // Cintas anchas, hebilla central y anclajes.
    box(p, "respaldo_asiento", 1.05, 1.35, 0.18, new Vector3(0,0.75,-0.35), black);
    tube(p, "cinta_hombro_izq", [[-0.38,1.48,-0.22],[-0.25,0.9,0.05],[-0.12,0.35,0.28]], 0.075, fabric);
    tube(p, "cinta_hombro_der", [[0.38,1.48,-0.22],[0.25,0.9,0.05],[0.12,0.35,0.28]], 0.075, fabric);
    tube(p, "cinta_cadera_izq", [[-0.48,0.42,-0.05],[-0.15,0.32,0.25]], 0.075, red);
    tube(p, "cinta_cadera_der", [[0.48,0.42,-0.05],[0.15,0.32,0.25]], 0.075, red);
    box(p, "hebilla", 0.3, 0.22, 0.12, new Vector3(0,0.3,0.35), metal);
    box(p, "boton_hebilla", 0.13, 0.08, 0.035, new Vector3(0,0.31,0.42), red);
    for (const x of [-0.42,0.42]) cylinder(p,"anclaje",0.16,0.1,new Vector3(x,0.12,-0.1),metal);
  }, "seguridad");

  add("proteccion_habitaculo", "Elementos de protección del habitáculo", p => {
    box(p, "piso_habitaculo", 2.0, 0.12, 1.7, new Vector3(0,0.08,0), darkMetal);
    box(p, "mamparo_delantero", 1.9, 1.15, 0.12, new Vector3(0,0.65,0.78), metal);
    box(p, "panel_lateral_izq", 0.12, 0.85, 1.5, new Vector3(-0.92,0.48,0), blue);
    box(p, "panel_lateral_der", 0.12, 0.85, 1.5, new Vector3(0.92,0.48,0), blue);
    box(p, "reposacabezas", 0.75, 0.48, 0.18, new Vector3(0,1.25,-0.55), black);
    box(p, "protector_pies", 1.35, 0.18, 0.48, new Vector3(0,0.22,0.9), yellow);
    tube(p, "borde_protector", [[-0.95,0.95,0.78],[0.95,0.95,0.78]], 0.045, red);
  }, "seguridad");

  add("corte_emergencia", "Sistema de corte de emergencia", p => {
    box(p, "caja_interruptor", 0.9, 0.48, 0.55, new Vector3(0,0.25,0), yellow);
    cylinder(p, "base_boton", 0.42, 0.18, new Vector3(0,0.58,0), darkMetal);
    cylinder(p, "boton_rojo", 0.32, 0.22, new Vector3(0,0.76,0), red);
    box(p, "protector_boton", 0.78, 0.08, 0.72, new Vector3(0,0.88,0), yellow);
    tube(p, "cable_rojo", [[0.42,0.25,0],[0.85,0.25,0],[1.05,0.08,0]], 0.045, red);
    tube(p, "cable_negro", [[-0.42,0.25,0],[-0.85,0.25,0],[-1.05,0.08,0]], 0.045, black);
  }, "seguridad");

  add("extintor_senalizacion", "Extintor y señalización", p => {
    cylinder(p, "cuerpo_extintor", 0.62, 1.55, new Vector3(-0.45,0.85,0), red);
    cylinder(p, "cuello_extintor", 0.25, 0.18, new Vector3(-0.45,1.7,0), metal);
    tube(p, "manguera_extintor", [[-0.3,1.65,0],[-0.05,1.8,0],[0.08,1.35,0]], 0.055, black);
    box(p, "manija_extintor", 0.42, 0.12, 0.16, new Vector3(-0.45,1.86,0), darkMetal);
    box(p, "etiqueta_extintor", 0.42, 0.48, 0.035, new Vector3(-0.45,0.9,0.32), white);
    box(p, "senal_triangular", 0.85, 0.08, 0.72, new Vector3(0.85,0.65,0), yellow);
    cylinder(p, "base_senal", 0.12, 0.08, new Vector3(0.85,0.25,0), darkMetal);
    // Símbolo visual de advertencia en forma de triángulo.
    tube(p, "borde_senal", [[0.45,0.45,0.4],[1.25,0.45,0.4],[0.85,1.15,0.4],[0.45,0.45,0.4]], 0.045, red);
  }, "seguridad");

  // 8. HERRAMIENTAS Y CONSUMIBLES

  add("multimetro", "Multímetro", p => {
    box(p, "cuerpo_multimetro", 0.95, 1.45, 0.28, new Vector3(0,0.78,0), yellow);
    box(p, "pantalla_multimetro", 0.7, 0.42, 0.035, new Vector3(0,1.15,0.16), glass);
    cylinder(p, "selector", 0.38, 0.1, new Vector3(0,0.68,0.2), darkMetal);
    sphere(p, "punto_selector", 0.09, new Vector3(0.1,0.72,0.27), white);
    for (const x of [-0.25,0.25]) cylinder(p,"entrada_punta",0.12,0.12,new Vector3(x,0.18,0.18),darkMetal);
    tube(p, "punta_roja", [[0.25,0.18,0.2],[0.55,-0.05,0.45],[0.75,0.55,0.55]], 0.025, red);
    tube(p, "punta_negra", [[-0.25,0.18,0.2],[-0.55,-0.05,0.45],[-0.75,0.55,0.55]], 0.025, black);
  }, "herramientas");

  add("pinza_amperimetrica", "Pinza amperimétrica", p => {
    box(p, "mango_pinza", 0.72, 1.0, 0.28, new Vector3(0,0.48,0), yellow);
    box(p, "pantalla_pinza", 0.52, 0.3, 0.035, new Vector3(0,0.78,0.16), glass);
    cylinder(p, "selector_pinza", 0.28, 0.09, new Vector3(0,0.35,0.18), darkMetal);
    // Mordaza en forma de arco abierto.
    tube(p, "mordaza", [[-0.3,0.92,0],[-0.45,1.35,0],[-0.2,1.68,0],[0.2,1.68,0],[0.45,1.35,0],[0.3,0.92,0]], 0.09, darkMetal);
    tube(p, "cable_prueba", [[-0.2,0.05,0],[-0.45,-0.2,0.25],[-0.65,0.2,0.4]], 0.025, red);
  }, "herramientas");

  add("equipo_soldadura", "Equipo de soldadura", p => {
    box(p, "maquina_soldar", 1.2, 0.95, 0.75, new Vector3(0,0.55,0), blue);
    box(p, "panel_soldadora", 0.72, 0.42, 0.04, new Vector3(0,0.65,0.4), darkMetal);
    for (const x of [-0.22,0.22]) cylinder(p,"perilla_soldadora",0.13,0.09,new Vector3(x,0.68,0.45),yellow);
    cylinder(p, "rueda_izq", 0.28, 0.12, new Vector3(-0.42,0.12,0.25), black);
    cylinder(p, "rueda_der", 0.28, 0.12, new Vector3(0.42,0.12,0.25), black);
    tube(p, "cable_electrodo", [[0.52,0.65,0.05],[0.9,0.4,0.1],[1.1,0.1,0.25]], 0.045, black);
    tube(p, "porta_electrodo", [[1.1,0.1,0.25],[1.35,0.18,0.25],[1.48,0.05,0.25]], 0.07, darkMetal);
    tube(p, "cable_masa", [[-0.52,0.4,0],[-0.9,0.1,-0.1],[-1.1,0.05,-0.2]], 0.04, red);
  }, "herramientas");

  add("crimpadora_terminales", "Crimpadora de terminales", p => {
    tube(p, "mango_izq", [[-0.12,0.35,0],[-0.35,0.05,0],[-0.65,-0.55,0]], 0.095, black);
    tube(p, "mango_der", [[0.12,0.35,0],[0.35,0.05,0],[0.65,-0.55,0]], 0.095, red);
    cylinder(p, "eje_crimpadora", 0.28, 0.22, new Vector3(0,0.4,0), metal);
    box(p, "mandibula_izq", 0.2, 0.42, 0.22, new Vector3(-0.16,0.72,0), darkMetal);
    box(p, "mandibula_der", 0.2, 0.42, 0.22, new Vector3(0.16,0.72,0), darkMetal);
    box(p, "mordaza_terminal", 0.22, 0.12, 0.25, new Vector3(0,0.94,0), copper);
  }, "herramientas");

  add("juego_llaves_destornilladores", "Juego de llaves y destornilladores", p => {
    // Llaves combinadas alineadas.
    for (let i=0; i<4; i++) {
      const x = -0.75 + i*0.42;
      tube(p, "llave_mango_"+i, [[x,0.15,0],[x,1.0,0]], 0.055, metal);
      cylinder(p, "boca_llave_"+i, 0.24-i*0.025, 0.08, new Vector3(x,1.08,0), metal);
      cylinder(p, "anillo_llave_"+i, 0.18-i*0.02, 0.08, new Vector3(x,0.08,0), metal);
    }
    // Dos destornilladores con mango y varilla.
    for (let i=0; i<2; i++) {
      const x = 0.75 + i*0.38;
      cylinder(p, "mango_destornillador_"+i, 0.2, 0.48, new Vector3(x,0.3,0.18), red);
      tube(p, "varilla_destornillador_"+i, [[x,0.54,0.18],[x,1.22,0.18]], 0.035, metal);
    }
  }, "herramientas");

  add("taladro_brocas", "Taladro y brocas", p => {
    box(p, "cuerpo_taladro", 0.65, 0.55, 1.05, new Vector3(0,0.9,-0.1), blue);
    box(p, "bateria_taladro", 0.48, 0.42, 0.45, new Vector3(0,0.38,-0.1), darkMetal);
    box(p, "empuñadura", 0.28, 0.7, 0.32, new Vector3(0,0.38,0.2), black);
    cylinder(p, "portabrocas", 0.28, 0.38, new Vector3(0,0.9,0.62), metal);
    cylinder(p, "broca_principal", 0.055, 0.65, new Vector3(0,0.9,1.08), darkMetal);
    for (let i=0; i<4; i++) {
      const x = -0.75 + i*0.35;
      cylinder(p, "broca_"+i, 0.045+i*0.008, 0.9-i*0.1, new Vector3(x,0.48,0.65), metal);
    }
  }, "herramientas");

  add("equipo_proteccion_personal", "Equipo de protección personal", p => {
    // Casco.
    sphere(p, "casco", 0.95, new Vector3(-0.55,1.05,0), yellow);
    box(p, "visera_casco", 0.95, 0.12, 0.42, new Vector3(-0.55,0.68,0.18), yellow);
    // Gafas.
    box(p, "lente_izq", 0.42, 0.28, 0.12, new Vector3(0.55,1.15,0.12), glass);
    box(p, "lente_der", 0.42, 0.28, 0.12, new Vector3(1.02,1.15,0.12), glass);
    tube(p, "puente_gafas", [[0.76,1.15,0.18],[0.81,1.15,0.18]], 0.04, darkMetal);
    // Guantes.
    sphere(p, "guante_izq", 0.42, new Vector3(-0.55,0.25,0.3), skin);
    sphere(p, "guante_der", 0.42, new Vector3(0.05,0.25,0.3), skin);
    for (let i=0; i<4; i++) {
      tube(p, "dedo_guante_"+i, [[-0.68+i*0.09,0.28,0.35],[-0.72+i*0.09,0.05,0.4]], 0.045, skin);
    }
    // Botas de seguridad.
    box(p, "bota_izq", 0.55, 0.32, 0.85, new Vector3(0.55,0.18,-0.25), black);
    box(p, "bota_der", 0.55, 0.32, 0.85, new Vector3(1.18,0.18,-0.25), black);
  }, "herramientas");

  // Evita que el conjunto se quede sin referencias y permite recorrerlo fácilmente.
  return pieces;
}
