import {
  PBRMaterial,
  StandardMaterial,
  Color3,
  Color4,
  DynamicTexture,
  ParticleSystem,
  Vector3,
  Texture
} from "@babylonjs/core";

/**
 * Gestor de Materiales PBR y Texturas Procedurales Fotorrealistas (100% Offline)
 * Genera mapas de textura en memoria mediante HTML5 Canvas para:
 * - Fibra de carbono trenzada 3K
 * - Celdas solares de silicio monocristalino con busbars
 * - Asfalto de competición y pianos de circuito
 * - Discos de freno perforados de alto rendimiento
 */

// 1. Textura Procedural de Fibra de Carbono 3K
export function createCarbonFiberTexture(scene, size = 128) {
  const dt = new DynamicTexture("carbon_fiber_proc", { width: size, height: size }, scene, true);
  const ctx = dt.getContext();

  ctx.fillStyle = "#181a1e";
  ctx.fillRect(0, 0, size, size);

  const step = 16;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const isEven = ((x / step) + (y / step)) % 2 === 0;
      const grad = ctx.createLinearGradient(x, y, x + step, y + step);
      if (isEven) {
        grad.addColorStop(0, "#2a2d34");
        grad.addColorStop(0.5, "#151619");
        grad.addColorStop(1, "#363a43");
      } else {
        grad.addColorStop(0, "#1c1e22");
        grad.addColorStop(0.5, "#2d3038");
        grad.addColorStop(1, "#181a1d");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, step, step);
    }
  }

  dt.uScale = 8;
  dt.vScale = 8;
  dt.update();
  return dt;
}

// 2. Textura Procedural de Celdas Fotovoltaicas con Busbars
export function createSolarCellTexture(scene, size = 256) {
  const dt = new DynamicTexture("solar_cell_proc", { width: size, height: size }, scene, true);
  const ctx = dt.getContext();

  // Fondo azul oscuro monocristalino profundo
  const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size);
  grad.addColorStop(0, "#081d4a");
  grad.addColorStop(1, "#030a1c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Micro-rejilla de dedos colectores (fingers)
  ctx.strokeStyle = "rgba(180, 210, 255, 0.35)";
  ctx.lineWidth = 1;
  const numFingers = 24;
  const stepF = size / numFingers;
  for (let x = 0; x <= size; x += stepF) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  // Barras colectoras principales (5 Busbars plateadas)
  ctx.fillStyle = "#d0d8e8";
  const busbars = [0.15, 0.32, 0.5, 0.68, 0.85];
  busbars.forEach(pos => {
    const y = pos * size;
    ctx.fillRect(0, y - 2, size, 4);
  });

  // Borde de celda pseudocuadrada
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, size - 4, size - 4);

  dt.uScale = 4;
  dt.vScale = 4;
  dt.update();
  return dt;
}

// 3. Textura Procedural de Asfalto con Granulometría y Huella
export function createAsphaltTexture(scene, size = 256) {
  const dt = new DynamicTexture("asphalt_proc", { width: size, height: size }, scene, true);
  const ctx = dt.getContext();

  ctx.fillStyle = "#1e2024";
  ctx.fillRect(0, 0, size, size);

  // Ruido de grava y árido
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.max(15, Math.min(60, 32 + noise));
    data[i + 1] = Math.max(15, Math.min(60, 34 + noise));
    data[i + 2] = Math.max(15, Math.min(65, 38 + noise));
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  dt.uScale = 20;
  dt.vScale = 50;
  dt.update();
  return dt;
}

// 4. Textura Procedural de Pianos de Circuito (Kerbs)
export function createKerbTexture(scene, size = 128) {
  const dt = new DynamicTexture("kerb_proc", { width: size, height: size }, scene, true);
  const ctx = dt.getContext();

  const stripeW = size / 4;
  for (let x = 0; x < size; x += stripeW) {
    const isRed = (x / stripeW) % 2 === 0;
    ctx.fillStyle = isRed ? "#d62828" : "#f0f2f5";
    ctx.fillRect(x, 0, stripeW, size);
  }

  dt.uScale = 1;
  dt.vScale = 24;
  dt.update();
  return dt;
}

export function createPBRMaterialLibrary(scene) {
  const materials = {};

  // Texturas procedurales base
  const carbonTex = createCarbonFiberTexture(scene);
  const solarTex = createSolarCellTexture(scene);
  const asphaltTex = createAsphaltTexture(scene);
  const kerbTex = createKerbTexture(scene);

  materials.textures = {
    carbon: carbonTex,
    solar: solarTex,
    asphalt: asphaltTex,
    kerb: kerbTex
  };

  // 1. Chasis Tubular de Aluminio Aeronáutico
  const pbrMetal = new PBRMaterial("pbr_metal_aluminio", scene);
  pbrMetal.metallic = 0.95;
  pbrMetal.roughness = 0.22;
  pbrMetal.albedoColor = new Color3(0.85, 0.88, 0.92);
  pbrMetal.environmentIntensity = 0.9;
  materials.metal = pbrMetal;

  // 2. Monocasco de Fibra de Carbono
  const pbrCarbon = new PBRMaterial("pbr_fibra_carbono", scene);
  pbrCarbon.metallic = 0.35;
  pbrCarbon.roughness = 0.38;
  pbrCarbon.albedoTexture = carbonTex;
  pbrCarbon.clearCoat.isEnabled = true;
  pbrCarbon.clearCoat.intensity = 0.6;
  pbrCarbon.clearCoat.roughness = 0.15;
  materials.carbon = pbrCarbon;

  // 3. Pintura Automotriz de Competición con Laca Transparente (Clear Coat PBR)
  const pbrCarroceria = new PBRMaterial("pbr_carroceria_concept", scene);
  pbrCarroceria.metallic = 0.88;
  pbrCarroceria.roughness = 0.14;
  pbrCarroceria.albedoColor = new Color3(0.06, 0.42, 0.92);
  pbrCarroceria.clearCoat.isEnabled = true;
  pbrCarroceria.clearCoat.intensity = 1.0;
  pbrCarroceria.clearCoat.roughness = 0.04;
  materials.carroceria = pbrCarroceria;

  // 4. Celdas Solares de Silicio Monocristalino
  const pbrSolar = new PBRMaterial("pbr_celdas_solares", scene);
  pbrSolar.metallic = 0.45;
  pbrSolar.roughness = 0.12;
  pbrSolar.albedoTexture = solarTex;
  pbrSolar.emissiveColor = new Color3(0.02, 0.06, 0.18);
  pbrSolar.clearCoat.isEnabled = true;
  pbrSolar.clearCoat.intensity = 0.95;
  materials.solar = pbrSolar;

  // 5. Cobre de Alta Conductividad (Inversor & Estator)
  const pbrCopper = new PBRMaterial("pbr_cobre", scene);
  pbrCopper.metallic = 0.98;
  pbrCopper.roughness = 0.24;
  pbrCopper.albedoColor = new Color3(0.92, 0.48, 0.28);
  materials.copper = pbrCopper;

  // 6. Neumáticos Solares de Baja Resistencia
  const pbrGoma = new PBRMaterial("pbr_goma_neumaticos", scene);
  pbrGoma.metallic = 0.02;
  pbrGoma.roughness = 0.88;
  pbrGoma.albedoColor = new Color3(0.07, 0.07, 0.08);
  materials.goma = pbrGoma;

  // 7. Cúpula Aerodinámica / Parabrisas
  const pbrVidrio = new PBRMaterial("pbr_parabrisas", scene);
  pbrVidrio.metallic = 0.05;
  pbrVidrio.roughness = 0.04;
  pbrVidrio.alpha = 0.35;
  pbrVidrio.albedoColor = new Color3(0.85, 0.92, 0.98);
  pbrVidrio.clearCoat.isEnabled = true;
  pbrVidrio.clearCoat.intensity = 1.0;
  materials.vidrio = pbrVidrio;

  // 8. Asfalto de Competición
  const pbrAsfalto = new PBRMaterial("pbr_asfalto", scene);
  pbrAsfalto.metallic = 0.05;
  pbrAsfalto.roughness = 0.92;
  pbrAsfalto.albedoTexture = asphaltTex;
  materials.asfalto = pbrAsfalto;

  // 9. Pianos de Circuito (Kerbs)
  const pbrKerb = new PBRMaterial("pbr_kerb", scene);
  pbrKerb.metallic = 0.1;
  pbrKerb.roughness = 0.65;
  pbrKerb.albedoTexture = kerbTex;
  materials.kerb = pbrKerb;

  // 10. Luces LED
  const pbrLedRojo = new StandardMaterial("mat_led_freno", scene);
  pbrLedRojo.emissiveColor = new Color3(1.0, 0.05, 0.02);
  pbrLedRojo.diffuseColor = new Color3(0.8, 0.0, 0.0);
  materials.ledFreno = pbrLedRojo;

  const pbrLedFaro = new StandardMaterial("mat_led_faro", scene);
  pbrLedFaro.emissiveColor = new Color3(0.9, 0.95, 1.0);
  pbrLedFaro.diffuseColor = new Color3(0.8, 0.85, 0.9);
  materials.ledFaro = pbrLedFaro;

  return materials;
}

export function createLocalParticleTexture(scene, size = 64) {
  const dynamicTexture = new DynamicTexture("local_particle_tex", { width: size, height: size }, scene, false);
  const ctx = dynamicTexture.getContext();

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.25, "rgba(120, 210, 255, 0.85)");
  gradient.addColorStop(0.65, "rgba(40, 140, 255, 0.25)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fill();

  dynamicTexture.hasAlpha = true;
  dynamicTexture.update();
  return dynamicTexture;
}

export function createTireSmokeParticleSystem(scene, emitterMesh) {
  const ps = new ParticleSystem("smoke_tire", 100, scene);
  ps.particleTexture = createLocalParticleTexture(scene, 64);
  ps.emitter = emitterMesh;
  ps.minEmitBox = new Vector3(-0.1, 0, -0.1);
  ps.maxEmitBox = new Vector3(0.1, 0.05, 0.1);
  ps.color1 = new Color4(0.8, 0.8, 0.8, 0.4);
  ps.color2 = new Color4(0.6, 0.6, 0.6, 0.2);
  ps.colorDead = new Color4(0.4, 0.4, 0.4, 0.0);
  ps.minSize = 0.2;
  ps.maxSize = 0.6;
  ps.minLifeTime = 0.3;
  ps.maxLifeTime = 0.8;
  ps.emitRate = 25;
  ps.gravity = new Vector3(0, 0.5, 0);
  ps.direction1 = new Vector3(-0.5, 0.5, -1);
  ps.direction2 = new Vector3(0.5, 1.0, -1);
  ps.minEmitPower = 0.5;
  ps.maxEmitPower = 1.5;
  return ps;
}

export function createLocalSparkSystem(scene, emitterMesh) {
  const ps = new ParticleSystem("sparks_local", 150, scene);
  ps.particleTexture = createLocalParticleTexture(scene, 64);
  ps.emitter = emitterMesh;
  ps.minEmitBox = new Vector3(-0.05, 0, -0.05);
  ps.maxEmitBox = new Vector3(0.05, 0.05, 0.05);
  ps.color1 = new Color4(1.0, 0.85, 0.2, 1.0);
  ps.color2 = new Color4(1.0, 0.35, 0.05, 1.0);
  ps.colorDead = new Color4(0.2, 0.1, 0.1, 0.0);
  ps.minSize = 0.03;
  ps.maxSize = 0.1;
  ps.minLifeTime = 0.15;
  ps.maxLifeTime = 0.5;
  ps.emitRate = 40;
  ps.gravity = new Vector3(0, -9.81, 0);
  ps.direction1 = new Vector3(-1, 2, -1);
  ps.direction2 = new Vector3(1, 3, 1);
  ps.minEmitPower = 1;
  ps.maxEmitPower = 3;
  return ps;
}
