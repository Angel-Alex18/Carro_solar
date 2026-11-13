import { t, getLanguage } from "./i18n/index.js";

/**
 * Gestor del Flujo Pedagógico STEAM (M, S, E, T, A)
 * Maneja el desbloqueo progresivo, modales interactivos de cálculo,
 * autoguardado en localStorage, modo profesor y confirmaciones.
 */

const STORAGE_KEY = "carro_solar_steam_progress_v2";

export class SteamManager {
  constructor(options = {}) {
    this.onStateChange = options.onStateChange || (() => {});
    this.onCarroceriaChange = options.onCarroceriaChange || (() => {});
    this.onBmsChange = options.onBmsChange || (() => {});
    this.onSolarChange = options.onSolarChange || (() => {});

    // Estado de desbloqueo progresivo de las 5 fases
    this.progress = {
      M: { unlocked: true, completed: false, gearRatio: 4.2, wheelTorque: 290 },
      S: { unlocked: false, completed: false, irradiance: 1000, angleDeg: 65, cellTemp: 35 },
      E: { unlocked: false, completed: false, assembledCount: 0, totalCount: 14 },
      T: { unlocked: false, completed: false, vMax: 4.2, vMin: 2.8, regenRatio: 0.45 },
      A: { unlocked: false, completed: false, concept: "bullet", color: "#007aff", cdA: 0.118 }
    };

    this.currentPhase = "M";
    this.isTeacherMode = false;

    this.loadProgress();
    this.checkUrlTeacherMode();
  }

  checkUrlTeacherMode() {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("role") === "teacher" || urlParams.get("modo") === "profesor") {
        this.isTeacherMode = true;
      }
    }
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.progress) this.progress = { ...this.progress, ...data.progress };
        if (data.currentPhase) this.currentPhase = data.currentPhase;
      }
    } catch (e) {
      console.warn("No se pudo cargar el progreso desde localStorage:", e);
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        progress: this.progress,
        currentPhase: this.currentPhase,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Error guardando progreso en localStorage:", e);
    }
  }

  setTeacherMode(enabled) {
    this.isTeacherMode = enabled;
    this.onStateChange();
  }

  unlockNextPhase(currentKey) {
    const sequence = ["M", "S", "E", "T", "A"];
    const idx = sequence.indexOf(currentKey);
    if (idx !== -1) {
      this.progress[currentKey].completed = true;
      if (idx + 1 < sequence.length) {
        const nextKey = sequence[idx + 1];
        this.progress[nextKey].unlocked = true;
        this.currentPhase = nextKey;
      }
      this.saveProgress();
      this.onStateChange();
    }
  }

  openPhaseModal(phaseKey) {
    // Si la fase está bloqueada y no estamos en modo profesor, mostrar alerta
    if (!this.progress[phaseKey].unlocked && !this.isTeacherMode) {
      alert(`⚠️ La fase ${phaseKey} está bloqueada. Debes completar las fases STEAM previas.`);
      return;
    }

    this.currentPhase = phaseKey;

    switch (phaseKey) {
      case "M":
        this.renderMathModal();
        break;
      case "S":
        this.renderScienceModal();
        break;
      case "E":
        // La fase E corresponde al taller 3D de ensamblaje
        this.renderEngineeringBanner();
        break;
      case "T":
        this.renderTechModal();
        break;
      case "A":
        this.renderArtModal();
        break;
    }
  }

  // ==========================================
  // MODAL FASE M: MATEMÁTICAS (Engranes y Par)
  // ==========================================
  renderMathModal() {
    this.removeExistingModal();
    const modal = document.createElement("div");
    modal.id = "steam-modal-overlay";
    modal.className = "steam-overlay";
    modal.innerHTML = `
      <div class="steam-modal-card">
        <div class="modal-header">
          <h2>📐 Fase M: Matemáticas - Relación de Transmisión</h2>
          <button id="modal-close-btn" class="close-x">&times;</button>
        </div>
        <p class="modal-intro">
          Calcula la relación de reducción <i>N</i> para que el motor BLDC entregue el par suficiente para vencer la resistencia a la rodadura y acelerar el monoplaza.
        </p>
        <div class="calc-box">
          <div class="calc-row">
            <label>Relación de Transmisión (N = d_corona / d_piñón):</label>
            <input type="range" id="input-gear-ratio" min="2.0" max="8.0" step="0.1" value="${this.progress.M.gearRatio}" />
            <span id="val-gear-ratio" class="highlight-val">${this.progress.M.gearRatio} : 1</span>
          </div>
          <div class="calc-results">
            <div class="kpi-mini">
              <span>Par en Ruedas (τ_w = τ_m · N · η):</span>
              <b id="calc-wheel-torque">0 N·m</b>
            </div>
            <div class="kpi-mini">
              <span>Velocidad Máxima Teórica (v_max):</span>
              <b id="calc-vmax">0 km/h</b>
            </div>
            <div class="kpi-mini">
              <span>Fuerza de Tracción Disponible:</span>
              <b id="calc-ftrac">0 N</b>
            </div>
          </div>
          <div id="math-feedback" class="feedback-msg">Ajusta la relación para obtener al menos 250 N·m en rueda y v_max > 70 km/h.</div>
        </div>
        <div class="modal-footer">
          <button id="btn-valida-math" class="btn-primary" ${this.isTeacherMode ? 'disabled title="Modo Profesor (Lectura)"' : ''}>
            ${this.progress.M.completed ? 'Actualizar y Continuar' : 'Validar Cálculo y Desbloquear Fase S'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const slider = document.getElementById("input-gear-ratio");
    const valText = document.getElementById("val-gear-ratio");
    const resTorque = document.getElementById("calc-wheel-torque");
    const resVmax = document.getElementById("calc-vmax");
    const resFtrac = document.getElementById("calc-ftrac");
    const feedback = document.getElementById("math-feedback");

    const updateCalc = () => {
      const N = parseFloat(slider.value);
      valText.innerText = `${N.toFixed(1)} : 1`;
      const motorTorque = 75; // N*m
      const eta = 0.96;
      const r = 0.28; // radio rueda
      const wheelTorque = motorTorque * N * eta;
      const F_trac = wheelTorque / r;
      const maxMotorRpm = 4500;
      const wheelRpm = maxMotorRpm / N;
      const vmax = (wheelRpm * 2 * Math.PI * r * 60) / 1000;

      resTorque.innerText = `${Math.round(wheelTorque)} N·m`;
      resVmax.innerText = `${Math.round(vmax)} km/h`;
      resFtrac.innerText = `${Math.round(F_trac)} N`;

      if (wheelTorque >= 250 && vmax >= 70) {
        feedback.className = "feedback-msg success";
        feedback.innerText = "✓ Excelente: Balance óptimo entre torque de aceleración y velocidad crucero en recta.";
      } else if (wheelTorque < 250) {
        feedback.className = "feedback-msg warning";
        feedback.innerText = "⚠️ Par en rueda insuficiente para arranque o pendientes suaves. Aumenta N.";
      } else {
        feedback.className = "feedback-msg warning";
        feedback.innerText = "⚠️ Reducción muy corta; la velocidad máxima queda restringida por debajo de 70 km/h.";
      }
    };

    slider.addEventListener("input", updateCalc);
    updateCalc();

    document.getElementById("modal-close-btn").addEventListener("click", () => this.removeExistingModal());
    document.getElementById("btn-valida-math").addEventListener("click", () => {
      this.progress.M.gearRatio = parseFloat(slider.value);
      this.unlockNextPhase("M");
      this.removeExistingModal();
    });
  }

  // ==========================================
  // MODAL FASE S: CIENCIA (Laboratorio Fotovoltaico)
  // ==========================================
  renderScienceModal() {
    this.removeExistingModal();
    const modal = document.createElement("div");
    modal.id = "steam-modal-overlay";
    modal.className = "steam-overlay";
    modal.innerHTML = `
      <div class="steam-modal-card">
        <div class="modal-header">
          <h2>☀️ Fase S: Ciencia - Laboratorio Fotovoltaico</h2>
          <button id="modal-close-btn" class="close-x">&times;</button>
        </div>
        <p class="modal-intro">
          Analiza el efecto del ángulo de elevación solar y la temperatura de operación sobre la potencia generada por el arreglo de 4 m² de celdas monocristalinas.
        </p>
        <div class="calc-box">
          <div class="calc-row">
            <label>Irradiancia Solar Incidente (G):</label>
            <input type="range" id="input-irradiance" min="200" max="1200" step="25" value="${this.progress.S.irradiance}" />
            <span id="val-irradiance" class="highlight-val">${this.progress.S.irradiance} W/m²</span>
          </div>
          <div class="calc-row">
            <label>Ángulo de Elevación Solar (θ):</label>
            <input type="range" id="input-sun-angle" min="15" max="90" step="1" value="${this.progress.S.angleDeg}" />
            <span id="val-sun-angle" class="highlight-val">${this.progress.S.angleDeg}°</span>
          </div>
          <div class="calc-row">
            <label>Temperatura de Celdas (T_celda):</label>
            <input type="range" id="input-cell-temp" min="15" max="75" step="1" value="${this.progress.S.cellTemp}" />
            <span id="val-cell-temp" class="highlight-val">${this.progress.S.cellTemp} °C</span>
          </div>
          <div class="calc-results">
            <div class="kpi-mini">
              <span>Eficiencia Efectiva (η_T):</span>
              <b id="calc-eta-solar">0 %</b>
            </div>
            <div class="kpi-mini">
              <span>Potencia Solar Cosechada (P_s):</span>
              <b id="calc-solar-harvest" style="color: #ffd60a;">0 W</b>
            </div>
            <div class="kpi-mini">
              <span>Corriente Fotovoltaica Equivalente (a 96V):</span>
              <b id="calc-solar-amps">0 A</b>
            </div>
          </div>
          <div id="science-feedback" class="feedback-msg">Ajusta los parámetros para obtener al menos 650 W de aporte solar.</div>
        </div>
        <div class="modal-footer">
          <button id="btn-valida-science" class="btn-primary" ${this.isTeacherMode ? 'disabled title="Modo Profesor (Lectura)"' : ''}>
            ${this.progress.S.completed ? 'Actualizar y Continuar' : 'Validar y Desbloquear Fase E (Ingeniería)'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const sIrrad = document.getElementById("input-irradiance");
    const sAngle = document.getElementById("input-sun-angle");
    const sTemp = document.getElementById("input-cell-temp");
    const vIrrad = document.getElementById("val-irradiance");
    const vAngle = document.getElementById("val-sun-angle");
    const vTemp = document.getElementById("val-cell-temp");
    const resEta = document.getElementById("calc-eta-solar");
    const resPow = document.getElementById("calc-solar-harvest");
    const resAmps = document.getElementById("calc-solar-amps");
    const feedback = document.getElementById("science-feedback");

    const updateScience = () => {
      const G = parseFloat(sIrrad.value);
      const theta = parseFloat(sAngle.value);
      const temp = parseFloat(sTemp.value);

      vIrrad.innerText = `${G} W/m²`;
      vAngle.innerText = `${theta}°`;
      vTemp.innerText = `${temp} °C`;

      const etaRef = 0.235;
      const gamma = -0.0038;
      const etaT = etaRef * (1 + gamma * (temp - 25));
      const rad = (theta * Math.PI) / 180;
      const area = 4.0;
      const pSolar = G * area * etaT * Math.sin(rad);
      const amps = pSolar / 96.0;

      resEta.innerText = `${(etaT * 100).toFixed(2)} %`;
      resPow.innerText = `${Math.round(pSolar)} W`;
      resAmps.innerText = `${amps.toFixed(2)} A`;

      this.onSolarChange(G, theta, temp);

      if (pSolar >= 650) {
        feedback.className = "feedback-msg success";
        feedback.innerText = "✓ Generación solar excelente: Celdas con alto rendimiento para alimentar el bus DC.";
      } else {
        feedback.className = "feedback-msg warning";
        feedback.innerText = "⚠️ Generación baja (<650 W). Aumenta irradiancia o ángulo solar, o reduce la temperatura.";
      }
    };

    sIrrad.addEventListener("input", updateScience);
    sAngle.addEventListener("input", updateScience);
    sTemp.addEventListener("input", updateScience);
    updateScience();

    document.getElementById("modal-close-btn").addEventListener("click", () => this.removeExistingModal());
    document.getElementById("btn-valida-science").addEventListener("click", () => {
      this.progress.S.irradiance = parseFloat(sIrrad.value);
      this.progress.S.angleDeg = parseFloat(sAngle.value);
      this.progress.S.cellTemp = parseFloat(sTemp.value);
      this.unlockNextPhase("S");
      this.removeExistingModal();
    });
  }

  // ==========================================
  // MODAL FASE E: INGENIERÍA (Banner informativo)
  // ==========================================
  renderEngineeringBanner() {
    this.removeExistingModal();
    const tooltip = document.getElementById("tooltip-guia");
    if (tooltip) {
      tooltip.innerText = "🛠️ Fase E (Ingeniería): Ensambla las 14 piezas en el banco de trabajo 3D o presiona [F].";
      tooltip.style.border = "1px solid #30d158";
    }
  }

  // ==========================================
  // MODAL FASE T: TECNOLOGÍA (BMS y Freno Regen)
  // ==========================================
  renderTechModal() {
    this.removeExistingModal();
    const modal = document.createElement("div");
    modal.id = "steam-modal-overlay";
    modal.className = "steam-overlay";
    modal.innerHTML = `
      <div class="steam-modal-card">
        <div class="modal-header">
          <h2>💻 Fase T: Tecnología - Programación BMS & Regen</h2>
          <button id="modal-close-btn" class="close-x">&times;</button>
        </div>
        <p class="modal-intro">
          Configura los parámetros de seguridad del Battery Management System (BMS) y la tasa de frenado regenerativo para recargar el pack LiFePO4 al desacelerar.
        </p>
        <div class="calc-box">
          <div class="calc-row">
            <label>Tensión Máxima de Celda (Corte por Sobrecarga):</label>
            <input type="range" id="input-bms-vmax" min="3.6" max="4.3" step="0.05" value="${this.progress.T.vMax}" />
            <span id="val-bms-vmax" class="highlight-val">${this.progress.T.vMax} V</span>
          </div>
          <div class="calc-row">
            <label>Tensión Mínima de Celda (Corte por Subtensión):</label>
            <input type="range" id="input-bms-vmin" min="2.4" max="3.2" step="0.05" value="${this.progress.T.vMin}" />
            <span id="val-bms-vmin" class="highlight-val">${this.progress.T.vMin} V</span>
          </div>
          <div class="calc-row">
            <label>Intensidad del Freno Regenerativo:</label>
            <input type="range" id="input-regen-ratio" min="0" max="80" step="5" value="${Math.round(this.progress.T.regenRatio * 100)}" />
            <span id="val-regen-ratio" class="highlight-val">${Math.round(this.progress.T.regenRatio * 100)} %</span>
          </div>
          <div class="calc-results">
            <div class="kpi-mini">
              <span>Energía Recuperable en Frenada:</span>
              <b id="calc-regen-kwh" style="color: #30d158;">~18 % extra</b>
            </div>
            <div class="kpi-mini">
              <span>Ventana Segura de Operación:</span>
              <b id="calc-bms-window">2.8V - 4.2V (Normal)</b>
            </div>
          </div>
          <div id="tech-feedback" class="feedback-msg">Configuración recomendada para celdas LiFePO4 / NMC de alta corriente.</div>
        </div>
        <div class="modal-footer">
          <button id="btn-valida-tech" class="btn-primary" ${this.isTeacherMode ? 'disabled title="Modo Profesor (Lectura)"' : ''}>
            ${this.progress.T.completed ? 'Actualizar y Continuar' : 'Guardar Firmware BMS y Desbloquear Fase A'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const sVmax = document.getElementById("input-bms-vmax");
    const sVmin = document.getElementById("input-bms-vmin");
    const sRegen = document.getElementById("input-regen-ratio");
    const vVmax = document.getElementById("val-bms-vmax");
    const vVmin = document.getElementById("val-bms-vmin");
    const vRegen = document.getElementById("val-regen-ratio");
    const resRegen = document.getElementById("calc-regen-kwh");
    const resWin = document.getElementById("calc-bms-window");
    const feedback = document.getElementById("tech-feedback");

    const updateTech = () => {
      const vmax = parseFloat(sVmax.value);
      const vmin = parseFloat(sVmin.value);
      const regen = parseInt(sRegen.value);

      vVmax.innerText = `${vmax.toFixed(2)} V`;
      vVmin.innerText = `${vmin.toFixed(2)} V`;
      vRegen.innerText = `${regen} %`;

      resRegen.innerText = `~${Math.round(regen * 0.35)}% autonomía recuperada`;
      resWin.innerText = `${vmin.toFixed(2)}V - ${vmax.toFixed(2)}V`;

      this.onBmsChange(vmax, vmin, regen / 100);

      if (vmax > 4.25) {
        feedback.className = "feedback-msg warning";
        feedback.innerText = "⚠️ Peligro: Tensión de corte >4.25V puede inducir degradación química acelerada.";
      } else if (vmin < 2.6) {
        feedback.className = "feedback-msg warning";
        feedback.innerText = "⚠️ Peligro: Tensión de corte <2.6V arriesga daño permanente por descarga profunda.";
      } else {
        feedback.className = "feedback-msg success";
        feedback.innerText = "✓ Configuración segura y óptima verificada por el estándar de seguridad automotriz.";
      }
    };

    sVmax.addEventListener("input", updateTech);
    sVmin.addEventListener("input", updateTech);
    sRegen.addEventListener("input", updateTech);
    updateTech();

    document.getElementById("modal-close-btn").addEventListener("click", () => this.removeExistingModal());
    document.getElementById("btn-valida-tech").addEventListener("click", () => {
      this.progress.T.vMax = parseFloat(sVmax.value);
      this.progress.T.vMin = parseFloat(sVmin.value);
      this.progress.T.regenRatio = parseInt(sRegen.value) / 100;
      this.unlockNextPhase("T");
      this.removeExistingModal();
    });
  }

  // ==========================================
  // MODAL FASE A: ARTE Y DISEÑO AERODINÁMICO
  // ==========================================
  renderArtModal() {
    this.removeExistingModal();
    const modal = document.createElement("div");
    modal.id = "steam-modal-overlay";
    modal.className = "steam-overlay";
    modal.innerHTML = `
      <div class="steam-modal-card">
        <div class="modal-header">
          <h2>🎨 Fase A: Arte - Carrocería Concept Car & Livery</h2>
          <button id="modal-close-btn" class="close-x">&times;</button>
        </div>
        <p class="modal-intro">
          Selecciona el perfil aerodinámico de la carrocería (impacta directamente en el Cd·A del vehículo) y personaliza la pintura PBR para la carrera.
        </p>
        <div class="calc-box">
          <div class="concept-selector">
            <div class="concept-option ${this.progress.A.concept === 'bullet' ? 'selected' : ''}" data-concept="bullet" data-cda="0.110">
              <b>🏎️ Bullet Concept</b>
              <p>Monoplaza estrecho ultra-aerodinámico.</p>
              <span class="cda-badge">Cd·A: 0.110 m²</span>
            </div>
            <div class="concept-option ${this.progress.A.concept === 'catamaran' ? 'selected' : ''}" data-concept="catamaran" data-cda="0.135">
              <b>🚤 Catamaran Concept</b>
              <p>Doble quilla con túnel de viento inferior.</p>
              <span class="cda-badge">Cd·A: 0.135 m²</span>
            </div>
            <div class="concept-option ${this.progress.A.concept === 'teardrop' ? 'selected' : ''}" data-concept="teardrop" data-cda="0.160">
              <b>💧 Teardrop Classic</b>
              <p>Perfil de gota de lágrima de alta estabilidad.</p>
              <span class="cda-badge">Cd·A: 0.160 m²</span>
            </div>
          </div>

          <div class="calc-row" style="margin-top: 15px;">
            <label>Color de Pintura PBR (Carrocería):</label>
            <input type="color" id="input-car-color" value="${this.progress.A.color}" />
            <span id="val-color-hex" class="highlight-val">${this.progress.A.color}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button id="btn-valida-art" class="btn-primary" ${this.isTeacherMode ? 'disabled title="Modo Profesor (Lectura)"' : ''}>
            ${this.progress.A.completed ? 'Aplicar Diseño y Cerrar' : 'Confirmar Diseño y Finalizar Metodología STEAM'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    let selectedConcept = this.progress.A.concept;
    let selectedCdA = this.progress.A.cdA;
    const colorInput = document.getElementById("input-car-color");
    const colorHex = document.getElementById("val-color-hex");

    const options = modal.querySelectorAll(".concept-option");
    options.forEach(opt => {
      opt.addEventListener("click", () => {
        options.forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        selectedConcept = opt.getAttribute("data-concept");
        selectedCdA = parseFloat(opt.getAttribute("data-cda"));
        this.onCarroceriaChange(selectedConcept, selectedCdA, colorInput.value);
      });
    });

    colorInput.addEventListener("input", (e) => {
      colorHex.innerText = e.target.value;
      this.onCarroceriaChange(selectedConcept, selectedCdA, e.target.value);
    });

    document.getElementById("modal-close-btn").addEventListener("click", () => this.removeExistingModal());
    document.getElementById("btn-valida-art").addEventListener("click", () => {
      this.progress.A.concept = selectedConcept;
      this.progress.A.cdA = selectedCdA;
      this.progress.A.color = colorInput.value;
      this.unlockNextPhase("A");
      this.removeExistingModal();
    });
  }

  // ==========================================
  // MODALES DE CONFIRMACIÓN Y RESULTADOS
  // ==========================================
  confirmReset(onConfirm) {
    this.removeExistingModal();
    const modal = document.createElement("div");
    modal.id = "steam-modal-overlay";
    modal.className = "steam-overlay";
    modal.innerHTML = `
      <div class="steam-modal-card confirm-card">
        <h3>⚠️ ¿Confirmar desarme completo?</h3>
        <p>Esta acción removerá todas las piezas ensambladas del monoplaza y las devolverá a los anaqueles de taller.</p>
        <div class="modal-buttons-row">
          <button id="btn-cancel-reset" class="btn-secondary">Cancelar</button>
          <button id="btn-confirm-reset" class="btn-danger">Sí, Desarmar Todo</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("btn-cancel-reset").addEventListener("click", () => this.removeExistingModal());
    document.getElementById("btn-confirm-reset").addEventListener("click", () => {
      this.removeExistingModal();
      onConfirm();
    });
  }

  showMissionModal(success, telemetry, onAction) {
    this.removeExistingModal();
    const modal = document.createElement("div");
    modal.id = "steam-modal-overlay";
    modal.className = "steam-overlay";
    modal.innerHTML = `
      <div class="steam-modal-card result-card ${success ? 'success' : 'fail'}">
        <h2>${success ? '🏆 ¡Misión Solar Cumplida!' : '❌ Misión No Superada'}</h2>
        <p>
          ${success
            ? 'El monoplaza solar completó con éxito el recorrido de prueba en pista manteniendo un balance energético positivo y alta estabilidad aerodinámica.'
            : 'El monoplaza agotó la carga de batería antes de completar el recorrido o sufrió pérdidas aerodinámicas elevadas.'
          }
        </p>
        <div class="telemetry-summary">
          <div>Distancia: <b>${telemetry.distanceM} m</b></div>
          <div>Velocidad Media: <b>${telemetry.speedKmh} km/h</b></div>
          <div>Batería Final (SoC): <b>${telemetry.batterySoc} %</b></div>
          <div>Energía Solar Recolectada: <b>${telemetry.solarPowerW} W</b></div>
        </div>
        <div class="modal-buttons-row">
          <button id="btn-result-action" class="btn-primary">Volver al Taller y Optimizar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("btn-result-action").addEventListener("click", () => {
      this.removeExistingModal();
      if (onAction) onAction();
    });
  }

  removeExistingModal() {
    const old = document.getElementById("steam-modal-overlay");
    if (old) old.remove();
  }
}
