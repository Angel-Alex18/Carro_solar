/**
 * Gestor de Persistencia y Exportación / Importación (JSON y CSV)
 * Proyecto Carro Solar STEAM
 *
 * Funcionalidades:
 * 1. Autoguardado automático en localStorage del estado de ensamblaje y fases STEAM.
 * 2. Carga automática al abrir/recargar la página (no se pierde ningún avance).
 * 3. Exportación a archivo .json (copia de seguridad completa del vehículo).
 * 4. Exportación a archivo .csv (reporte técnico para análisis en hojas de cálculo / Excel).
 * 5. Importación desde archivo .json con restauración inmediata en el visor 3D.
 */

const STORAGE_KEY_ASSEMBLY = "carro_solar_assembly_progress_v3";

export class ProgressManager {
  constructor(options = {}) {
    this.options = options;
    this.lastSaved = null;
    this.toastTimer = null;
  }

  /**
   * Obtiene la estructura completa del estado actual
   */
  getStateSnapshot(componentesVehiculo, steam, physics) {
    const piezasSnapshot = componentesVehiculo.map(p => ({
      id: p.id,
      nombre: p.nombre,
      montado: !!p.montado,
      fase: p.fase || "Fase E (Ingeniería)",
      masa: p.masa || 0,
      deltaCdA: p.deltaCdA || 0,
      potenciaSolar: p.potenciaSolar || 0,
      capacidadBat: p.capacidadBat || 0,
      esRueda: !!p.esRueda,
      ruedaTipo: p.ruedaTipo || null
    }));

    const montadas = piezasSnapshot.filter(p => p.montado);
    const montadasCount = montadas.length;
    const totalCount = piezasSnapshot.length;
    const porcentaje = totalCount > 0 ? Math.round((montadasCount / totalCount) * 100) : 0;

    // Calcular totales actuales
    const masaTotal = piezasSnapshot
      .filter(p => p.montado)
      .reduce((acc, p) => acc + (p.masa || 0), 65); // 65kg base (piloto y fluidos)

    const potSolarTotal = piezasSnapshot
      .filter(p => p.montado)
      .reduce((acc, p) => acc + (p.potenciaSolar || 0), 0);

    const batTotal = piezasSnapshot
      .filter(p => p.montado)
      .reduce((acc, p) => acc + (p.capacidadBat || 0), 0);

    return {
      version: "3.0",
      app: "Simulador Carro Solar STEAM",
      guardadoEn: new Date().toISOString(),
      timestamp: Date.now(),
      armado: {
        totalPiezas: totalCount,
        piezasMontadas: montadasCount,
        porcentajeArmado: porcentaje,
        idsMontadas: montadas.map(p => p.id),
        piezas: piezasSnapshot
      },
      metricasVehiculo: {
        masaTotalKg: masaTotal,
        potenciaSolarW: potSolarTotal,
        capacidadBateriaKwh: batTotal,
        cdA: physics ? Number(physics.cdA.toFixed(3)) : 0.118
      },
      steam: {
        currentPhase: steam ? steam.currentPhase : "M",
        progress: steam ? steam.progress : null
      }
    };
  }

  /**
   * Guarda el estado actual en localStorage
   */
  saveToStorage(componentesVehiculo, steam, physics, notify = true) {
    if (typeof localStorage === "undefined") return false;
    try {
      const data = this.getStateSnapshot(componentesVehiculo, steam, physics);
      localStorage.setItem(STORAGE_KEY_ASSEMBLY, JSON.stringify(data));
      this.lastSaved = Date.now();

      // Sincronizar también con el almacenamiento propio de SteamManager si está disponible
      if (steam && typeof steam.saveProgress === "function") {
        steam.saveProgress();
      }

      this.updateAutosaveUI(true);
      if (notify) {
        this.showToast("💾 Progreso guardado automáticamente");
      }
      return true;
    } catch (e) {
      console.warn("[ProgressManager] Error guardando en localStorage:", e);
      return false;
    }
  }

  /**
   * Carga el estado guardado desde localStorage
   */
  loadFromStorage() {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSEMBLY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[ProgressManager] Error leyendo de localStorage:", e);
      return null;
    }
  }

  /**
   * Aplica un estado guardado sobre el conjunto de piezas y la escena 3D
   */
  applyState(state, componentesVehiculo, steam, physics, carChassisBody) {
    if (!state || !state.armado) return false;

    const idsMontadas = new Set(
      state.armado.idsMontadas ||
      (state.armado.piezas ? state.armado.piezas.filter(p => p.montado).map(p => p.id) : [])
    );

    // Restaurar cada pieza
    componentesVehiculo.forEach(p => {
      const debeEstarMontada = idsMontadas.has(p.id);
      if (debeEstarMontada) {
        p.montado = true;
        if (p.nodo) {
          p.nodo.parent = carChassisBody;
          p.nodo.position.copyFrom(p.posRelativaAlCarro);
          p.nodo.rotation.set(0, 0, 0);
        }
      } else {
        p.montado = false;
        if (p.nodo) {
          p.nodo.parent = null;
          p.nodo.position.copyFrom(p.posAlmacen);
          p.nodo.rotation.set(0, 0, 0);
        }
      }
    });

    // Restaurar estado de STEAM
    if (steam && state.steam) {
      if (state.steam.progress) {
        steam.progress = { ...steam.progress, ...state.steam.progress };
      }
      if (state.steam.currentPhase) {
        steam.currentPhase = state.steam.currentPhase;
      }
    }

    // Verificar si todas las piezas quedaron montadas para desbloquear Fase E
    const montadasCount = componentesVehiculo.filter(c => c.montado).length;
    if (steam && montadasCount >= componentesVehiculo.length) {
      if (steam.progress && steam.progress["E"]) {
        steam.progress["E"].completed = true;
        if (steam.progress["T"]) steam.progress["T"].unlocked = true;
      }
    }

    this.updateAutosaveUI(true);
    return true;
  }

  /**
   * Descarga el progreso actual en un archivo .JSON
   */
  exportJson(componentesVehiculo, steam, physics) {
    const data = this.getStateSnapshot(componentesVehiculo, steam, physics);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `carro_solar_progreso_${fecha}.json`;
    this.triggerDownload(blob, nombreArchivo);
    this.showToast("📄 Archivo JSON exportado correctamente");
  }

  /**
   * Descarga el progreso actual en formato .CSV compatible con Excel (con BOM UTF-8)
   */
  exportCsv(componentesVehiculo, steam, physics) {
    const data = this.getStateSnapshot(componentesVehiculo, steam, physics);
    const sep = ";"; // Separador estándar para hojas de cálculo en español y Europa
    const lines = [];

    // Cabecera de la tabla de componentes
    lines.push(["ID_Pieza", "Nombre", "Estado", "Fase_STEAM", "Masa_kg", "Potencia_Solar_W", "Capacidad_Bat_kWh", "Delta_CdA", "Es_Rueda", "Tipo_Rueda"].join(sep));

    // Filas de cada componente
    data.armado.piezas.forEach(p => {
      const fila = [
        `"${p.id}"`,
        `"${p.nombre}"`,
        `"${p.montado ? "Montado" : "En Anaquel"}"`,
        `"${p.fase}"`,
        p.masa,
        p.potenciaSolar,
        p.capacidadBat,
        p.deltaCdA,
        p.esRueda ? "Sí" : "No",
        `"${p.ruedaTipo || "N/A"}"`
      ];
      lines.push(fila.join(sep));
    });

    // Espacio separador
    lines.push("");
    lines.push(["--- RESUMEN TECNICO DEL MONOPLAZA ---", "", "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Total de Piezas del Vehiculo", data.armado.totalPiezas, "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Piezas Ensambladas", data.armado.piezasMontadas, "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Porcentaje de Ensamblaje", `${data.armado.porcentajeArmado}%`, "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Masa Total Estimada (kg)", data.metricasVehiculo.masaTotalKg, "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Potencia Solar Pico (W)", data.metricasVehiculo.potenciaSolarW, "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Capacidad de Bateria (kWh)", data.metricasVehiculo.capacidadBateriaKwh, "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Coeficiente Aerodinamico (Cd*A m2)", data.metricasVehiculo.cdA, "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Fase STEAM Actual", data.steam ? `Fase ${data.steam.currentPhase}` : "N/A", "", "", "", "", "", "", "", ""].join(sep));
    lines.push(["Fecha de Guardado", `"${new Date().toLocaleString()}"`, "", "", "", "", "", "", "", ""].join(sep));

    const csvContent = "\uFEFF" + lines.join("\r\n"); // UTF-8 BOM para apertura perfecta en Excel
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `carro_solar_progreso_${fecha}.csv`;
    this.triggerDownload(blob, nombreArchivo);
    this.showToast("📊 Archivo CSV exportado correctamente");
  }

  /**
   * Carga e interpreta un archivo JSON subido por el usuario
   */
  importFromJsonFile(file, onLoaded, onError) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || (!parsed.armado && !parsed.idsMontadas && !Array.isArray(parsed))) {
          throw new Error("El archivo no tiene el formato válido de progreso de Carro Solar.");
        }
        if (typeof onLoaded === "function") {
          onLoaded(parsed);
        }
        this.showToast("✅ Progreso importado exitosamente desde JSON");
      } catch (err) {
        console.error("[ProgressManager] Error al importar JSON:", err);
        if (typeof onError === "function") {
          onError(err);
        } else {
          alert("Error al leer el archivo JSON: " + err.message);
        }
      }
    };
    reader.onerror = (err) => {
      alert("Error de lectura del archivo local.");
    };
    reader.readAsText(file, "UTF-8");
  }

  /**
   * Disparador auxiliar de descarga en navegador
   */
  triggerDownload(blob, filename) {
    if (typeof document === "undefined") return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  }

  /**
   * Actualiza el indicador visual de autoguardado en la barra superior
   */
  updateAutosaveUI(isSaved = true) {
    if (typeof document === "undefined") return;
    const textEl = document.getElementById("autosave-text");
    const dotEl = document.querySelector(".autosave-dot");
    if (textEl && dotEl) {
      if (isSaved) {
        textEl.innerText = "Progreso guardado";
        dotEl.classList.add("saved");
        dotEl.classList.remove("saving");
      } else {
        textEl.innerText = "Guardando...";
        dotEl.classList.remove("saved");
        dotEl.classList.add("saving");
      }
    }
  }

  /**
   * Mensaje flotante tipo Toast
   */
  showToast(message) {
    if (typeof document === "undefined") return;
    let toast = document.getElementById("progress-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "progress-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 85px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(10, 20, 35, 0.94);
        border: 1px solid rgba(80, 200, 120, 0.6);
        color: #ffffff;
        padding: 10px 22px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.3px;
        backdrop-filter: blur(12px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      `;
      document.body.appendChild(toast);
    }

    toast.innerText = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 2500);
  }
}