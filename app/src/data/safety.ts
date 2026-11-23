export interface RedFlagItem {
  id: string;
  label: string;
  detail: string;
}

/**
 * Contraindicaciones absolutas y alertas de empeoramiento antes de iniciar sesión
 * Basado en guías ESC, AHA/ACC, AACVPR y ACSM (documentación clínica de Cardio Mobility).
 */
export const PRE_SESSION_RED_FLAGS: RedFlagItem[] = [
  {
    id: 'chest_pain',
    label: 'Dolor, opresión o ardor en el pecho',
    detail: 'Dolor en reposo o angina inestable en los últimos días.',
  },
  {
    id: 'dyspnea',
    label: 'Falta de aire en reposo o que empeoró estos días',
    detail: 'Dificultad respiratoria nueva o mayor que lo habitual.',
  },
  {
    id: 'dizziness',
    label: 'Mareo, aturdimiento o sensación de desmayo',
    detail: 'Incluye mareo al ponerse de pie o visión borrosa.',
  },
  {
    id: 'weight_edema',
    label: 'Aumento rápido de peso (≥1,8 kg en 1–3 días) o hinchazón nueva',
    detail: 'Signo de retención de líquidos o descompensación.',
  },
  {
    id: 'fever_acute',
    label: 'Fiebre, infección activa o palpitaciones fuertes no controladas',
    detail: 'Incluye presión arterial muy alta en reposo (≥180/110 mmHg).',
  },
];

export const STOP_NOW_SYMPTOMS: string[] = [
  'Dolor, presión o molestia en el pecho, mandíbula o brazo izquierdo.',
  'Falta de aire intensa o que impide hablar con normalidad.',
  'Mareo, aturdimiento, visión borrosa o sudor frío.',
  'Palpitaciones rápidas/irregulares o fatiga extrema súbita.',
];

export const BORG_CR10_GUIDE = [
  { level: 1, label: 'Muy suave', safe: true },
  { level: 2, label: 'Suave (ideal calentamiento)', safe: true },
  { level: 3, label: 'Moderado suave (zona objetivo)', safe: true },
  { level: 4, label: 'Algo fuerte (límite seguro movilidad)', safe: true },
  { level: 5, label: 'Fuerte (reducir ritmo)', safe: false },
];

export const EVIDENCE_SUMMARY = [
  {
    title: 'Prescripción de Movilidad y Flexibilidad (ACSM / Rehabilitación Cardíaca)',
    text: 'Trabajar los principales grupos músculo-tendinosos al menos 2–3 días por semana (idealmente a diario), hasta tensión leve sin dolor, manteniendo 10–30 s (30–60 s en adultos mayores) con 2–4 repeticiones tras calentamiento gradual.',
  },
  {
    title: 'Control Hemodinámico y Anti-Valsalva (ESC / AHA / AACVPR)',
    text: 'Nunca contener la respiración durante el movimiento: exhalar suavemente o contar en voz alta evita picos de presión arterial y rebote taquicárdico. Realizar transiciones posturales lentas y nunca colocar la cabeza por debajo del nivel del corazón.',
  },
  {
    title: 'Betabloqueantes, Escala de Borg y Prueba del Habla',
    text: 'Los betabloqueantes atenúan la frecuencia cardíaca, por lo que el esfuerzo debe guiarse por la escala de Borg CR10 (objetivo 2–4) y la Prueba del Habla (poder mantener una conversación breve sin jadear).',
  },
  {
    title: 'Marcapasos o DAI reciente (< 6 semanas)',
    text: 'Evitar elevar el codo/brazo afectado por encima del nivel del hombro (60°–90°) durante las primeras 4–6 semanas, manteniendo movilidad suave bajo ese rango para prevenir rigidez de hombro sin traccionar electrodos.',
  },
];

