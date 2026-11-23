import { MuscleGroup } from '../types';

/**
 * Grados de libertad (DOF) articulares 3D en grados, siguiendo convención anatómica OpenSim:
 * - X: flexión (+) / extensión (-) en plano sagital
 * - Y: rotación axial izquierda (+) / derecha (-)
 * - Z: abducción / inclinación lateral
 */
export interface Pose3D {
  /** Posición raíz de la pelvis en metros (Y = altura sobre el suelo y=0) */
  pelvisPos: [number, number, number];
  /** Rotación global de la pelvis [rx, ry, rz] en grados */
  pelvisRot: [number, number, number];
  /** Columna lumbar/torácica [flex/ext, rotAxial, inclLat] */
  spine: [number, number, number];
  /** Cuello y cabeza [flex/ext, rotAxial, inclLat] */
  neck: [number, number, number];
  /** Hombros [flex, rot, abd] */
  rShoulder: [number, number, number];
  lShoulder: [number, number, number];
  /** Flexión de codo (0 = extendido, + = flexionado) */
  rElbow: number;
  lElbow: number;
  /** Caderas [flex(+), rot, abd(+ afuera)] */
  rHip: [number, number, number];
  lHip: [number, number, number];
  /** Flexión de rodilla (0 = extendida, + = flexionada atrás) */
  rKnee: number;
  lKnee: number;
  /** Tobillos [dorsiflex(+)/plantar(-), inversión/eversión] */
  rAnkle: [number, number];
  lAnkle: [number, number];
  /** Escenario de apoyo 3D */
  scene: 'bed' | 'chair' | 'mat';
  /** Si true, anima en círculo continuo (tobillos/hombros) en vez de ida y vuelta lineal */
  circular?: 'rAnkle' | 'bothAnkles' | 'bothShoulders';
}

const SUPINE_BASE: Pose3D = {
  pelvisPos: [0, 0.56, 0],
  pelvisRot: [-90, 0, 0], // acostado boca arriba mirando hacia +Y (techo)
  spine: [4, 0, 0],
  neck: [14, 0, 0], // cabeza levemente elevada sobre almohada (nunca bajo el corazón)
  rShoulder: [4, 0, 12],
  lShoulder: [4, 0, 12],
  rElbow: 10,
  lElbow: 10,
  rHip: [2, 0, 5],
  lHip: [2, 0, 5],
  rKnee: 4,
  lKnee: 4,
  rAnkle: [0, 0],
  lAnkle: [0, 0],
  scene: 'bed',
};

const SUPINE_BENT: Pose3D = {
  ...SUPINE_BASE,
  rHip: [58, 0, 6],
  lHip: [58, 0, 6],
  rKnee: 108,
  lKnee: 108,
  rAnkle: [-36, 0],
  lAnkle: [-36, 0],
};

const SEATED_BASE: Pose3D = {
  pelvisPos: [0, 0.48, -0.04],
  pelvisRot: [0, 0, 0],
  spine: [0, 0, 0],
  neck: [0, 0, 0],
  rShoulder: [18, 0, 10],
  lShoulder: [18, 0, 10],
  rElbow: 68,
  lElbow: 68,
  rHip: [88, 0, 6],
  lHip: [88, 0, 6],
  rKnee: 88,
  lKnee: 88,
  rAnkle: [0, 0],
  lAnkle: [0, 0],
  scene: 'chair',
};

const MAT_SEATED_BASE: Pose3D = {
  pelvisPos: [0, 0.14, -0.05],
  pelvisRot: [0, 0, 0],
  spine: [-4, 0, 0],
  neck: [0, 0, 0],
  rShoulder: [-20, 0, 18],
  lShoulder: [-20, 0, 18],
  rElbow: 16,
  lElbow: 16,
  rHip: [86, 0, 8],
  lHip: [86, 0, 8],
  rKnee: 6,
  lKnee: 6,
  rAnkle: [0, 0],
  lAnkle: [0, 0],
  scene: 'mat',
};

const MAT_SUPINE_BENT: Pose3D = {
  ...SUPINE_BENT,
  pelvisPos: [0, 0.12, 0],
  scene: 'mat',
};

const MAT_QUADRUPED_BASE: Pose3D = {
  pelvisPos: [0, 0.44, -0.22],
  pelvisRot: [88, 0, 0],
  spine: [0, 0, 0],
  neck: [-6, 0, 0], // cabeza siempre neutra/nivelada, nunca bajo el nivel del corazón
  rShoulder: [88, 0, 4],
  lShoulder: [88, 0, 4],
  rElbow: 6,
  lElbow: 6,
  rHip: [90, 0, 6],
  lHip: [90, 0, 6],
  rKnee: 92,
  lKnee: 92,
  rAnkle: [-45, 0],
  lAnkle: [-45, 0],
  scene: 'mat',
};

export const OPENSIM_POSES_3D: Record<string, { start: Pose3D; end: Pose3D }> = {
  // === ACOSTADO EN CAMA (10) ===
  sup_cuello_a: {
    start: { ...SUPINE_BASE, neck: [14, -36, 0] },
    end: { ...SUPINE_BASE, neck: [14, 36, 0] },
  },
  sup_cuello_b: {
    start: { ...SUPINE_BASE, rShoulder: [4, 0, 12], lShoulder: [4, 0, 12] },
    end: { ...SUPINE_BASE, rShoulder: [36, 0, 26], lShoulder: [36, 0, 26], rElbow: 18, lElbow: 18 },
  },
  sup_torax_a: {
    start: { ...SUPINE_BENT, rShoulder: [14, 0, 18], lShoulder: [10, 0, 14], rElbow: 85, lElbow: 75, spine: [3, 0, 0] },
    end: { ...SUPINE_BENT, rShoulder: [22, 0, 22], lShoulder: [18, 0, 18], rElbow: 90, lElbow: 80, spine: [10, 0, 0] },
  },
  sup_torax_b: {
    start: { ...SUPINE_BENT, pelvisRot: [-90, 0, -24], spine: [4, 22, 0] },
    end: { ...SUPINE_BENT, pelvisRot: [-90, 0, 24], spine: [4, -22, 0] },
  },
  sup_cadera_a: {
    start: { ...SUPINE_BENT },
    end: { ...SUPINE_BENT, rHip: [112, 0, 6], rKnee: 118, rShoulder: [42, 0, 12], lShoulder: [42, 0, 12], rElbow: 52, lElbow: 52 },
  },
  sup_cadera_b: {
    start: { ...SUPINE_BENT, rHip: [58, 0, 6], lHip: [58, 0, 6] },
    end: { ...SUPINE_BENT, rHip: [56, -24, 38], lHip: [56, 24, 38], rKnee: 108, lKnee: 108 },
  },
  sup_rodilla_a: {
    start: { ...SUPINE_BASE },
    end: { ...SUPINE_BASE, rHip: [58, 0, 6], rKnee: 108, rAnkle: [-36, 0] },
  },
  sup_rodilla_b: {
    start: { ...SUPINE_BASE, rHip: [24, 0, 5], rKnee: 46, lHip: [58, 0, 6], lKnee: 108 },
    end: { ...SUPINE_BASE, rHip: [22, 0, 5], rKnee: 4, rAnkle: [16, 0], lHip: [58, 0, 6], lKnee: 108 },
  },
  sup_tobillo_a: {
    start: { ...SUPINE_BASE, rAnkle: [26, 0], lAnkle: [26, 0] },
    end: { ...SUPINE_BASE, rAnkle: [-34, 0], lAnkle: [-34, 0] },
  },
  sup_tobillo_b: {
    start: { ...SUPINE_BASE, circular: 'bothAnkles' },
    end: { ...SUPINE_BASE, circular: 'bothAnkles' },
  },

  // === SENTADO EN SILLA (10) ===
  sen_cuello_a: {
    start: { ...SEATED_BASE, neck: [0, 0, -24] },
    end: { ...SEATED_BASE, neck: [0, 0, 24] },
  },
  sen_cuello_b: {
    start: { ...SEATED_BASE, circular: 'bothShoulders' },
    end: { ...SEATED_BASE, circular: 'bothShoulders' },
  },
  sen_torax_a: {
    start: { ...SEATED_BASE, spine: [6, 0, 0], rShoulder: [22, 0, 10], lShoulder: [22, 0, 10] },
    end: { ...SEATED_BASE, spine: [-10, 0, 0], rShoulder: [-22, 0, 22], lShoulder: [-22, 0, 22], rElbow: 82, lElbow: 82 },
  },
  sen_torax_b: {
    start: { ...SEATED_BASE, spine: [0, -32, 0], neck: [0, -18, 0], rShoulder: [30, 0, 10], lShoulder: [30, 0, 10], rElbow: 96, lElbow: 96 },
    end: { ...SEATED_BASE, spine: [0, 32, 0], neck: [0, 18, 0], rShoulder: [30, 0, 10], lShoulder: [30, 0, 10], rElbow: 96, lElbow: 96 },
  },
  sen_cadera_a: {
    start: { ...SEATED_BASE, rHip: [110, 0, 6], lHip: [88, 0, 6] },
    end: { ...SEATED_BASE, rHip: [88, 0, 6], lHip: [110, 0, 6] },
  },
  sen_cadera_b: {
    start: { ...SEATED_BASE, rHip: [88, 0, 6], lHip: [88, 0, 6] },
    end: { ...SEATED_BASE, rHip: [88, -14, 34], lHip: [88, 0, 6] },
  },
  sen_rodilla_a: {
    start: { ...SEATED_BASE },
    end: { ...SEATED_BASE, rHip: [90, 0, 6], rKnee: 6, rAnkle: [10, 0] },
  },
  sen_rodilla_b: {
    start: { ...SEATED_BASE, rHip: [62, 0, 6], rKnee: 6, rAnkle: [18, 0], spine: [0, 0, 0] },
    end: { ...SEATED_BASE, rHip: [62, 0, 6], rKnee: 6, rAnkle: [26, 0], spine: [18, 0, 0], neck: [-14, 0, 0] },
  },
  sen_tobillo_a: {
    start: { ...SEATED_BASE, rAnkle: [22, 0], lAnkle: [22, 0] },
    end: { ...SEATED_BASE, rAnkle: [-24, 0], lAnkle: [-24, 0] },
  },
  sen_tobillo_b: {
    start: { ...SEATED_BASE, rHip: [94, 0, 6], rKnee: 68, circular: 'rAnkle' },
    end: { ...SEATED_BASE, rHip: [94, 0, 6], rKnee: 68, circular: 'rAnkle' },
  },

  // === SUELO / COLCHONETA (10) ===
  sue_cuello_a: {
    start: { ...MAT_SEATED_BASE, neck: [12, 0, 0], spine: [4, 0, 0] },
    end: { ...MAT_SEATED_BASE, neck: [-10, 0, 0], spine: [-6, 0, 0] },
  },
  sue_cuello_b: {
    start: {
      ...MAT_SUPINE_BENT,
      pelvisRot: [-90, 0, 86],
      rShoulder: [62, 0, 12],
      lShoulder: [62, 0, 12],
      rElbow: 16,
      lElbow: 24,
    },
    end: {
      ...MAT_SUPINE_BENT,
      pelvisRot: [-90, 0, 86],
      spine: [0, -34, 0],
      rShoulder: [48, 0, 68],
      lShoulder: [62, 0, 12],
      rElbow: 18,
      lElbow: 24,
    },
  },
  sue_torax_a: {
    start: { ...MAT_QUADRUPED_BASE, spine: [-14, 0, 0], neck: [-12, 0, 0] },
    end: { ...MAT_QUADRUPED_BASE, spine: [22, 0, 0], neck: [6, 0, 0] },
  },
  sue_torax_b: {
    start: { ...MAT_SEATED_BASE, spine: [0, 0, -20], rShoulder: [18, 0, 58], rElbow: 18, lShoulder: [-10, 0, 26] },
    end: { ...MAT_SEATED_BASE, spine: [0, 0, 20], lShoulder: [18, 0, 58], lElbow: 18, rShoulder: [-10, 0, 26] },
  },
  sue_cadera_a: {
    start: { ...MAT_SUPINE_BENT },
    end: {
      ...MAT_SUPINE_BENT,
      pelvisPos: [0, 0.24, 0.02],
      pelvisRot: [-76, 0, 0],
      rHip: [36, 0, 6],
      lHip: [36, 0, 6],
      rKnee: 96,
      lKnee: 96,
    },
  },
  sue_cadera_b: {
    start: { ...MAT_SUPINE_BENT },
    end: { ...MAT_SUPINE_BENT, rHip: [74, -42, 34], rKnee: 102, lHip: [58, 0, 6], lKnee: 108 },
  },
  sue_rodilla_a: {
    start: { ...MAT_SEATED_BASE, rHip: [86, 0, 8], rKnee: 6 },
    end: { ...MAT_SEATED_BASE, rHip: [118, 0, 8], rKnee: 96 },
  },
  sue_rodilla_b: {
    start: { ...MAT_SUPINE_BENT, rHip: [82, 0, 6], rKnee: 84, rShoulder: [48, 0, 12], lShoulder: [48, 0, 12], rElbow: 40, lElbow: 40 },
    end: { ...MAT_SUPINE_BENT, rHip: [82, 0, 6], rKnee: 18, rAnkle: [16, 0], rShoulder: [48, 0, 12], lShoulder: [48, 0, 12], rElbow: 40, lElbow: 40 },
  },
  sue_tobillo_a: {
    start: { ...MAT_SEATED_BASE, rAnkle: [26, 0], lAnkle: [26, 0] },
    end: { ...MAT_SEATED_BASE, rAnkle: [-34, 0], lAnkle: [-34, 0] },
  },
  sue_tobillo_b: {
    start: { ...MAT_SEATED_BASE, rAnkle: [0, -28], lAnkle: [0, 28] },
    end: { ...MAT_SEATED_BASE, rAnkle: [0, 28], lAnkle: [0, -28] },
  },
};

export function getHighlightRegion(group: MuscleGroup): MuscleGroup {
  return group;
}
