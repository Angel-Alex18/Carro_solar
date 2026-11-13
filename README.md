# Simulador Educativo de Vehículo Solar de Carreras 🏎️☀️

Plataforma interactiva 3D desarrollada con **Babylon.js** y **Vite** para el aprendizaje, diseño, ensamblaje modular y simulación en tiempo real de un monoplaza solar de alta eficiencia bajo el marco formativo **STEAM**.

---

## 🎯 Arquitectura por Fases STEAM

El simulador implementa 5 fases progresivas de desbloqueo:

1. **M (Matemáticas):** Dimensionamiento de la relación de transmisión (engranajes), balance de potencia motriz y resistencia longitudinal.
2. **S (Ciencia):** Laboratorio de energía solar fotovoltaica (ángulo de radiación, irradiancia, temperatura de celda y Ley de Ohm).
3. **E (Ingeniería):** Taller de ensamblaje mecatrónico 3D interactivo con uso de herramientas de seguridad y secuencia técnica.
4. **T (Tecnología):** Calibración del Sistema de Gestión de Batería (BMS), algoritmos de protección y control de freno regenerativo.
5. **A (Arte y Diseño):** Personalización aerodinámica (variación dinámica del coeficiente $C_d \cdot A$) y acabados de carrocería.

---

## 🚀 Despliegue y Ejecución Local (100% Offline)

El proyecto funciona completamente sin conexión a internet, utilizando las librerías oficiales de Babylon.js empaquetadas de forma local vía npm.

### Prerrequisitos
- Node.js (versión 18 o superior recomendada)
- npm o pnpm

### Pasos de Instalación y Ejecución

```bash
# 1. Clonar o ingresar a la carpeta del proyecto
cd Carro_solar

# 2. Instalar dependencias locales
npm install

# 3. Iniciar el servidor de desarrollo local
npm run dev

# 4. Compilar para producción (archivos optimizados en /dist)
npm run build

# 5. Previsualizar la compilación de producción
npm run preview
```

Abre tu navegador en `http://localhost:5173` (o el puerto indicado por Vite).

---

## 🎮 Controles en Modo Simulación / Pista

| Tecla / Control | Acción |
| :--- | :--- |
| **W** / **Flecha Arriba** | Acelerar (Tracción motriz) |
| **S** / **Flecha Abajo** | Frenar (Freno mecánico + regenerativo) |
| **A** / **Flecha Izquierda** | Girar ruedas a la izquierda |
| **D** / **Flecha Derecha** | Girar ruedas a la derecha |
| **Espacio** | Freno de emergencia |
| **R** | Reiniciar posición del vehículo |
| **C** | Alternar vista de cámara (Taller / Conducción / Aérea) |

---

## 📊 Telemetría y Física en Tiempo Real

El motor de simulación calcula dinámicamente:
- **Ecuación de movimiento:** $\frac{dv}{dt} = \frac{F_{\text{trac}} - (F_{\text{rr}} + F_{\text{aero}})}{m}$
- **Arrastre aerodinámico:** $F_{\text{aero}} = \frac{1}{2} \rho C_d A v^2$
- **Generación solar:** $P_{\text{solar}} = G \cdot A_{\text{panel}} \cdot \eta_{\text{celda}} \cdot \cos(\theta)$
- **Batería:** Integración de corriente por método de Coulomb counting y curva de circuito abierto.
- **Freno regenerativo:** Conversión de energía cinética en carga hacia el pack de baterías.

---

## 👥 Equipo de Desarrollo

- **Angel Alexander Muñoz Rios** — Project Manager (2530226)
- **Alejandro Daniel Hernández Muñiz** — Desarrollador 3D (2530326)
- **Nehemías Jefte Garcia Lopez** — Desarrollador de Lógica (2530378)
- **Jese Garza Lugo** — Desarrollador de Interfaz UI (2530104)

---
*Desarrollado con Babylon.js, WebGL y Vite.*
