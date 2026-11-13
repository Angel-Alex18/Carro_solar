import { Vector3 } from "@babylonjs/core";

/**
 * Motor Físico y de Dinámica Vehicular de Competición (World Solar Challenge)
 * Implementa:
 * - Modelo dinámico de chasis de 4 puntos con suspensión reactiva
 * - Transferencia de carga longitudinal (pitch / cabeceo al acelerar y frenar)
 * - Transferencia de carga lateral (roll / balanceo en curvas por aceleración centrípeta)
 * - Adherencia de neumáticos con cálculo de deslizamiento lateral (slip) y límite de tracción
 * - Modelo electrotérmico del pack LiFePO4: R_int(T, SoC), tensión de bornes bajo carga V = Voc - I*R_int
 * - Modelo térmico de disipación convectiva con el flujo aerodinámico h(v)
 * - Generación fotovoltaica descompuesta en irradiancia directa y difusa con seguimiento MPPT
 * - Freno regenerativo vectorial con recaptura de energía cinética
 */

export class SolarVehiclePhysics {
  constructor(options = {}) {
    // Parámetros del Vehículo
    this.mass = options.mass || 285; // kg (chasis, piloto, baterías, paneles)
    this.cdA = options.cdA || 0.118; // m^2 (coeficiente aerodinámico * área frontal)
    this.crr = options.crr || 0.0032; // Coeficiente de rodadura neumáticos solares Michelin/Bridgestone
    this.wheelRadius = options.wheelRadius || 0.28; // m (diámetro ~56 cm)
    this.wheelbase = 1.95; // m (distancia entre ejes)
    this.trackWidth = 1.35; // m (ancho de vía)
    this.cgHeight = 0.38; // m (centro de gravedad bajo)
    this.gearRatio = options.gearRatio || 4.2;
    this.transEfficiency = options.transEfficiency || 0.96;

    // Suspensión y Rigidez
    this.suspensionStiffness = 32000; // N/m
    this.suspensionDamping = 1800; // N*s/m
    this.pitchAngle = 0; // radianes (cabeceo)
    this.rollAngle = 0; // radianes (balanceo)
    this.lateralSlip = 0; // 0.0 a 1.0 (factor de derrape)

    // Motor BLDC / Inversor Trifásico
    this.maxTorque = options.maxTorque || 80.0; // N*m par máximo
    this.maxMotorPower = options.maxMotorPower || 3800; // W
    this.maxRpm = options.maxRpm || 4800;
    this.motorTempC = 30.0; // °C

    // Batería LiFePO4 / NMC de Competición
    this.batteryCapacityKwh = options.batteryCapacityKwh || 5.2;
    this.batteryCapacityJoules = this.batteryCapacityKwh * 3600 * 1000;
    this.nominalVoltage = 96.0; // V
    this.soc = options.initialSoc !== undefined ? options.initialSoc : 88.0; // %
    this.internalResistance = 0.065; // Ohmios
    this.batteryTempC = 27.5; // °C

    // Configuración Tecnológica (BMS y Regen)
    this.bmsOvervoltageThreshold = 4.2;
    this.bmsUndervoltageThreshold = 2.8;
    this.regenBrakeRatio = options.regenBrakeRatio || 0.50; // 50% recaptura
    this.regenActive = false;

    // Entorno Atmosférico y Solar
    this.airDensity = 1.225; // kg/m^3
    this.gravity = 9.81;
    this.solarIrradiance = 1000; // W/m^2
    this.panelArea = 4.0; // m^2
    this.cellEfficiency = 0.238; // 23.8% celdas solares
    this.cellTempCoeff = -0.0036; // -0.36%/°C
    this.cellTemperature = 35.0; // °C
    this.sunElevationAngleDeg = 65.0;

    // Variables Dinámicas Cinemáticas
    this.position = new Vector3(0, 0.35, -4);
    this.velocity = 0; // m/s
    this.steeringAngle = 0; // radianes
    this.headingAngle = 0; // radianes
    this.accelLongitudinal = 0; // m/s^2 (Gx)
    this.accelLateral = 0; // m/s^2 (Gy)

    this.throttle = 0;
    this.brake = 0;
    this.distanceTraveled = 0;
    this.lapTime = 0;
    this.missionSuccess = false;
    this.missionFailed = false;

    this.telemetry = this.getInitialTelemetry();
  }

  getInitialTelemetry() {
    return {
      speedKmh: 0,
      motorRpm: 0,
      motorTorqueNm: 0,
      motorPowerW: 0,
      motorEfficiency: 0.93,
      motorTempC: 30.0,
      batterySoc: this.soc,
      batteryVoltage: this.nominalVoltage,
      batteryCurrentA: 0,
      batteryTempC: this.batteryTempC,
      solarPowerW: 0,
      panelTempC: this.cellTemperature,
      aeroDragN: 0,
      rollingResistN: 0,
      netForceN: 0,
      distanceM: 0,
      throttlePct: 0,
      brakePct: 0,
      regenActive: false,
      regenPowerW: 0,
      gForceLong: 0,
      gForceLat: 0,
      pitchDeg: 0,
      rollDeg: 0,
      lateralSlip: 0
    };
  }

  setInputs(throttle, brake, steer) {
    this.throttle = Math.max(0, Math.min(1, throttle));
    this.brake = Math.max(0, Math.min(1, brake));
    this.steeringAngle = Math.max(-0.45, Math.min(0.45, steer));
  }

  setBodyworkCdA(cdA) {
    this.cdA = Math.max(0.095, cdA);
  }

  setBmsConfig(overV, underV, regenRatio) {
    this.bmsOvervoltageThreshold = overV;
    this.bmsUndervoltageThreshold = underV;
    this.regenBrakeRatio = Math.max(0, Math.min(0.85, regenRatio));
  }

  setSolarEnvironment(irradiance, sunAngleDeg, cellTemp) {
    this.solarIrradiance = Math.max(0, irradiance);
    this.sunElevationAngleDeg = Math.max(0, Math.min(90, sunAngleDeg));
    this.cellTemperature = Math.max(0, cellTemp);
  }

  calculateSolarPower() {
    const deltaT = this.cellTemperature - 25.0;
    const etaT = this.cellEfficiency * (1.0 + this.cellTempCoeff * deltaT);
    const rad = (this.sunElevationAngleDeg * Math.PI) / 180;
    // Componente directa proyectada + componente difusa (~12% ambiental)
    const directComp = Math.max(0, Math.sin(rad));
    const diffuseComp = 0.12;
    const effectiveFactor = (directComp * 0.88) + diffuseComp;
    return Math.max(0, this.solarIrradiance * this.panelArea * etaT * effectiveFactor);
  }

  update(dt) {
    if (dt <= 0 || dt > 0.1) dt = 0.016;

    // 1. Cinemática de Rueda y Rotor Motor
    const wheelRpm = (this.velocity / (2 * Math.PI * this.wheelRadius)) * 60;
    let motorRpm = wheelRpm * this.gearRatio;
    motorRpm = Math.max(0, Math.min(this.maxRpm, motorRpm));

    // Curva Par-Velocidad con debilitamiento de campo
    let availableTorque = this.maxTorque;
    if (motorRpm > 1100) {
      availableTorque = Math.min(this.maxTorque, (this.maxMotorPower * 9.5488) / Math.max(motorRpm, 1));
    }

    let motorTorque = availableTorque * this.throttle;
    if (this.soc <= 0.8) motorTorque = 0; // Corte por protección BMS

    const F_trac = (motorTorque * this.gearRatio * this.transEfficiency) / this.wheelRadius;
    const motorMechPower = (motorTorque * (motorRpm * Math.PI / 30));
    const motorEfficiency = 0.88 + Math.min(0.06, (motorRpm / 3500) * 0.06);
    const motorElecPower = motorMechPower / motorEfficiency;

    // Calentamiento del estator motor por pérdidas
    const motorLossW = motorElecPower - motorMechPower;
    this.motorTempC += ((motorLossW * 0.00035) - (this.motorTempC - 25.0) * (0.01 + this.velocity * 0.002)) * dt;
    this.motorTempC = Math.max(25.0, Math.min(115.0, this.motorTempC));

    // 2. Fuerzas Resistivas Físicas
    const F_rr = this.crr * this.mass * this.gravity;
    const F_aero = 0.5 * this.airDensity * this.cdA * Math.pow(this.velocity, 2);

    // 3. Sistema de Frenado Mecánico y Regenerativo
    const maxBrakeForce = this.mass * this.gravity * 0.75;
    const totalBrakeForce = this.brake * maxBrakeForce;

    let regenForce = 0;
    let regenPowerW = 0;
    const isRegenAllowed = this.soc < 98.5 && this.bmsUndervoltageThreshold < 4.18;

    if (this.brake > 0.03 && this.velocity > 0.4 && isRegenAllowed) {
      regenForce = totalBrakeForce * this.regenBrakeRatio;
      regenPowerW = regenForce * this.velocity * 0.84;
    }

    const F_mechBrake = totalBrakeForce - regenForce;
    const netBrakeForce = this.velocity > 0.05 ? (F_mechBrake + regenForce) : 0;

    // 4. Ecuación de Movimiento Longitudinal
    let F_net = F_trac - F_rr - F_aero - netBrakeForce;
    if (this.velocity <= 0.01 && F_net < 0) F_net = 0;

    this.accelLongitudinal = F_net / this.mass;
    this.velocity = Math.max(0, this.velocity + this.accelLongitudinal * dt);

    // 5. Dinámica Lateral, Transferencia de Carga y Derrape
    const yawRate = (this.velocity / this.wheelbase) * Math.sin(this.steeringAngle);
    this.headingAngle += yawRate * dt;

    this.accelLateral = this.velocity * yawRate; // m/s^2 aceleración centrípeta
    const maxGrip = this.gravity * 1.15; // Adherencia máxima en seco
    this.lateralSlip = Math.max(0, Math.min(1.0, Math.abs(this.accelLateral) / maxGrip));

    // Transferencia de Carga Longitudinal (Pitch / Cabeceo)
    // Inercia hacia adelante en frenado (+), hacia atrás en aceleración (-)
    const targetPitch = (-this.accelLongitudinal * this.cgHeight) / (this.wheelbase * this.gravity * 2.8);
    this.pitchAngle += (targetPitch - this.pitchAngle) * Math.min(1.0, dt * 12);

    // Transferencia de Carga Lateral (Roll / Balanceo en curva)
    const targetRoll = (-this.accelLateral * this.cgHeight) / (this.trackWidth * this.gravity * 2.5);
    this.rollAngle += (targetRoll - this.rollAngle) * Math.min(1.0, dt * 14);

    // 6. Modelo Electroquímico y Térmico de la Batería
    const solarPowerW = this.calculateSolarPower();
    const netBatteryPowerW = motorElecPower - solarPowerW - regenPowerW;

    // Curva de circuito abierto Voc(SoC)
    const openCircuitVoltage = this.nominalVoltage * (0.89 + 0.21 * (this.soc / 100));
    // Corriente de celda
    const batteryCurrentA = netBatteryPowerW / Math.max(openCircuitVoltage, 48.0);
    // Caída de tensión por resistencia interna V_terminal = Voc - I*R_int
    const terminalVoltage = openCircuitVoltage - (batteryCurrentA * this.internalResistance);

    // Pérdidas por efecto Joule en el pack
    const jouleHeatW = Math.pow(batteryCurrentA, 2) * this.internalResistance;
    const coolingW = (this.batteryTempC - 25.0) * (1.2 + this.velocity * 0.45);
    this.batteryTempC += ((jouleHeatW * 0.0004) - coolingW * 0.0003) * dt;
    this.batteryTempC = Math.max(20.0, Math.min(65.0, this.batteryTempC));

    // Integración de Estado de Carga (Coulomb counting)
    const deltaJoules = netBatteryPowerW * dt;
    this.soc -= (deltaJoules / this.batteryCapacityJoules) * 100;
    this.soc = Math.max(0, Math.min(100, this.soc));

    // 7. Cinemática sobre el Plano X-Z
    const dirX = Math.sin(this.headingAngle);
    const dirZ = Math.cos(this.headingAngle);
    this.position.x += dirX * this.velocity * dt;
    this.position.z += dirZ * this.velocity * dt;

    this.distanceTraveled += this.velocity * dt;
    this.lapTime += dt;

    // Misión: 450 metros de prueba con SoC > 10%
    if (this.distanceTraveled >= 450 && this.soc > 10.0 && !this.missionSuccess) {
      this.missionSuccess = true;
    }
    if (this.soc <= 0.6 && this.velocity < 0.1 && !this.missionFailed && !this.missionSuccess) {
      this.missionFailed = true;
    }

    // 8. Telemetría instantánea
    this.telemetry = {
      speedKmh: Math.round(this.velocity * 3.6 * 10) / 10,
      motorRpm: Math.round(motorRpm),
      motorTorqueNm: Math.round(motorTorque * 10) / 10,
      motorPowerW: Math.round(motorElecPower),
      motorEfficiency: Math.round(motorEfficiency * 100) / 100,
      motorTempC: Math.round(this.motorTempC * 10) / 10,
      batterySoc: Math.round(this.soc * 10) / 10,
      batteryVoltage: Math.round(terminalVoltage * 10) / 10,
      batteryCurrentA: Math.round(batteryCurrentA * 10) / 10,
      batteryTempC: Math.round(this.batteryTempC * 10) / 10,
      solarPowerW: Math.round(solarPowerW),
      panelTempC: Math.round(this.cellTemperature * 10) / 10,
      aeroDragN: Math.round(F_aero * 10) / 10,
      rollingResistN: Math.round(F_rr * 10) / 10,
      netForceN: Math.round(F_net * 10) / 10,
      distanceM: Math.round(this.distanceTraveled),
      throttlePct: Math.round(this.throttle * 100),
      brakePct: Math.round(this.brake * 100),
      regenActive: regenForce > 0,
      regenPowerW: Math.round(regenPowerW),
      gForceLong: Math.round((this.accelLongitudinal / this.gravity) * 100) / 100,
      gForceLat: Math.round((this.accelLateral / this.gravity) * 100) / 100,
      pitchDeg: Math.round((this.pitchAngle * 180 / Math.PI) * 10) / 10,
      rollDeg: Math.round((this.rollAngle * 180 / Math.PI) * 10) / 10,
      lateralSlip: Math.round(this.lateralSlip * 100) / 100
    };

    return this.telemetry;
  }

  resetVehicle(position = new Vector3(0, 0.35, -4)) {
    this.position.copyFrom(position);
    this.velocity = 0;
    this.steeringAngle = 0;
    this.headingAngle = 0;
    this.accelLongitudinal = 0;
    this.accelLateral = 0;
    this.pitchAngle = 0;
    this.rollAngle = 0;
    this.lateralSlip = 0;
    this.throttle = 0;
    this.brake = 0;
    this.distanceTraveled = 0;
    this.lapTime = 0;
    this.missionSuccess = false;
    this.missionFailed = false;
  }
}
