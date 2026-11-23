import { Exercise, MuscleGroup } from '../types';

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Pose paramétrica por ángulos globales (en grados, 0° = derecha, 90° = abajo, -90° = arriba, 180° = izquierda)
 * para un modelo biomecánico de cadena cinemática cerrada/conectada estilo OpenSim / OpenPose.
 * Garantiza matemáticamente que cada segmento nace exactamente del extremo del segmento padre.
 */
export interface PoseAngles {
  /** Posición de la pelvis (raíz de la cadena cinemática) */
  pelvis: Vec2;
  /** Ángulo del tronco desde pelvis hacia hombros */
  torso: number;
  /** Ángulo de la cabeza/cuello desde hombros */
  neck: number;
  /** Hombro -> Codo -> Muñeca (lado cercano / derecho) */
  rUpperArm: number;
  rForearm: number;
  /** Hombro -> Codo -> Muñeca (lado lejano / izquierdo) */
  lUpperArm: number;
  lForearm: number;
  /** Cadera -> Rodilla -> Tobillo -> Pie (lado cercano / derecho) */
  rThigh: number;
  rShank: number;
  rFoot: number;
  /** Cadera -> Rodilla -> Tobillo -> Pie (lado lejano / izquierdo) */
  lThigh: number;
  lShank: number;
  lFoot: number;
  /** Tipo de superficie de apoyo */
  surface: 'bed' | 'chair' | 'mat' | 'mat_quadruped';
  /** Desplazamiento opcional de rotación cervical visual (izq/der) */
  headTurn?: number;
}

export interface SolvedSkeleton {
  pelvis: Vec2;
  midSpine: Vec2;
  shoulder: Vec2;
  neckBase: Vec2;
  head: Vec2;
  rElbow: Vec2;
  rWrist: Vec2;
  lElbow: Vec2;
  lWrist: Vec2;
  rKnee: Vec2;
  rAnkle: Vec2;
  rToe: Vec2;
  lKnee: Vec2;
  lAnkle: Vec2;
  lToe: Vec2;
  surface: PoseAngles['surface'];
  headTurn: number;
}

/** Proporciones antropométricas (basadas en Winter 2009 / OpenSim gait2392, escala px para viewBox 340×210) */
const SEG = {
  torso: 66,
  neck: 18,
  upperArm: 38,
  forearm: 34,
  thigh: 52,
  shank: 48,
  foot: 18,
};

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function stepFrom(origin: Vec2, length: number, angleDeg: number): Vec2 {
  const r = rad(angleDeg);
  return {
    x: origin.x + Math.cos(r) * length,
    y: origin.y + Math.sin(r) * length,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpola ángulos por el camino más corto para evitar giros bruscos */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + 540) % 360) - 180;
  return a + diff * t;
}

export function interpolatePose(a: PoseAngles, b: PoseAngles, t: number): PoseAngles {
  return {
    pelvis: { x: lerp(a.pelvis.x, b.pelvis.x, t), y: lerp(a.pelvis.y, b.pelvis.y, t) },
    torso: lerpAngle(a.torso, b.torso, t),
    neck: lerpAngle(a.neck, b.neck, t),
    rUpperArm: lerpAngle(a.rUpperArm, b.rUpperArm, t),
    rForearm: lerpAngle(a.rForearm, b.rForearm, t),
    lUpperArm: lerpAngle(a.lUpperArm, b.lUpperArm, t),
    lForearm: lerpAngle(a.lForearm, b.lForearm, t),
    rThigh: lerpAngle(a.rThigh, b.rThigh, t),
    rShank: lerpAngle(a.rShank, b.rShank, t),
    rFoot: lerpAngle(a.rFoot, b.rFoot, t),
    lThigh: lerpAngle(a.lThigh, b.lThigh, t),
    lShank: lerpAngle(a.lShank, b.lShank, t),
    lFoot: lerpAngle(a.lFoot, b.lFoot, t),
    surface: a.surface,
    headTurn: lerp(a.headTurn ?? 0, b.headTurn ?? 0, t),
  };
}

/** Cinemática Directa (Forward Kinematics): garantiza 100% de conexión articular */
export function solveForwardKinematics(p: PoseAngles): SolvedSkeleton {
  const pelvis = p.pelvis;
  const midSpine = stepFrom(pelvis, SEG.torso * 0.5, p.torso);
  const shoulder = stepFrom(pelvis, SEG.torso, p.torso);
  const neckBase = stepFrom(shoulder, 5, p.neck);
  const head = stepFrom(shoulder, SEG.neck + 8, p.neck);

  const rElbow = stepFrom(shoulder, SEG.upperArm, p.rUpperArm);
  const rWrist = stepFrom(rElbow, SEG.forearm, p.rForearm);
  const lElbow = stepFrom(shoulder, SEG.upperArm, p.lUpperArm);
  const lWrist = stepFrom(lElbow, SEG.forearm, p.lForearm);

  const rKnee = stepFrom(pelvis, SEG.thigh, p.rThigh);
  const rAnkle = stepFrom(rKnee, SEG.shank, p.rShank);
  const rToe = stepFrom(rAnkle, SEG.foot, p.rFoot);

  const lKnee = stepFrom(pelvis, SEG.thigh, p.lThigh);
  const lAnkle = stepFrom(lKnee, SEG.shank, p.lShank);
  const lToe = stepFrom(lAnkle, SEG.foot, p.lFoot);

  return {
    pelvis,
    midSpine,
    shoulder,
    neckBase,
    head,
    rElbow,
    rWrist,
    lElbow,
    lWrist,
    rKnee,
    rAnkle,
    rToe,
    lKnee,
    lAnkle,
    lToe,
    surface: p.surface,
    headTurn: p.headTurn ?? 0,
  };
}

// =========================================================================
// POSES BASE ANATÓMICAMENTE ANCLADAS (Cama, Silla, Colchoneta)
// =========================================================================

/** Acostado en cama (pelvis y piernas apoyadas sobre colchón y=150; cabeza elevada en almohada) */
const BASE_SUPINE_EXTENDED: PoseAngles = {
  pelvis: { x: 160, y: 142 },
  torso: 184, // ligeramente elevada hacia almohada (cabeza nunca bajo el corazón)
  neck: 196,
  rUpperArm: 8,
  rForearm: 2,
  lUpperArm: 12,
  lForearm: 5,
  rThigh: 1,
  rShank: 1,
  rFoot: -82,
  lThigh: 3,
  lShank: 2,
  lFoot: -80,
  surface: 'bed',
  headTurn: 0,
};

/** Acostado con rodillas flexionadas (hook-lying) */
const BASE_SUPINE_BENT: PoseAngles = {
  ...BASE_SUPINE_EXTENDED,
  rThigh: -36,
  rShank: 42,
  rFoot: 2,
  lThigh: -32,
  lShank: 38,
  lFoot: 2,
};

/** Sentado erguido en silla (isquiones en y=126, pies apoyados en suelo y=176) */
const BASE_SEATED: PoseAngles = {
  pelvis: { x: 146, y: 126 },
  torso: -90,
  neck: -90,
  rUpperArm: 74,
  rForearm: 16,
  lUpperArm: 80,
  lForearm: 22,
  rThigh: 2,
  rShank: 88,
  rFoot: 0,
  lThigh: 6,
  lShank: 92,
  lFoot: 0,
  surface: 'chair',
  headTurn: 0,
};

/** Sentado en colchoneta sobre cojín con piernas extendidas */
const BASE_MAT_SEATED: PoseAngles = {
  pelvis: { x: 124, y: 156 },
  torso: -84,
  neck: -86,
  rUpperArm: 108,
  rForearm: 88,
  lUpperArm: 112,
  lForearm: 92,
  rThigh: 1,
  rShank: 1,
  rFoot: -80,
  lThigh: 4,
  lShank: 2,
  lFoot: -78,
  surface: 'mat',
  headTurn: 0,
};

/** Acostado en colchoneta con almohada y rodillas dobladas */
const BASE_MAT_SUPINE_BENT: PoseAngles = {
  ...BASE_SUPINE_BENT,
  pelvis: { x: 158, y: 154 },
  surface: 'mat',
};

/** Cuatro apoyos (tabletop) con cabeza SIEMPRE neutra y nivelada (nunca bajo corazón) */
const BASE_MAT_QUADRUPED: PoseAngles = {
  pelvis: { x: 186, y: 114 },
  torso: 180,
  neck: 180,
  rUpperArm: 90,
  rForearm: 90,
  lUpperArm: 94,
  lForearm: 90,
  rThigh: 92,
  rShank: 2,
  rFoot: 10,
  lThigh: 96,
  lShank: 4,
  lFoot: 10,
  surface: 'mat_quadruped',
  headTurn: 0,
};

/**
 * Biblioteca cinemática exacta para los 30 ejercicios de Cardio Mobility.
 * Cada par [start, end] produce un movimiento biomecánico limpio, realista y conectado.
 */
export const EXERCISE_POSES: Record<string, { start: PoseAngles; end: PoseAngles }> = {
  // === ACOSTADO (10) ===
  sup_cuello_a: {
    start: { ...BASE_SUPINE_EXTENDED, neck: 192, headTurn: -6 },
    end: { ...BASE_SUPINE_EXTENDED, neck: 204, headTurn: 6 },
  },
  sup_cuello_b: {
    start: { ...BASE_SUPINE_EXTENDED, rUpperArm: 10, rForearm: 2, lUpperArm: 14, lForearm: 6 },
    end: { ...BASE_SUPINE_EXTENDED, rUpperArm: -28, rForearm: -18, lUpperArm: -22, lForearm: -14 },
  },
  sup_torax_a: {
    start: { ...BASE_SUPINE_BENT, rUpperArm: 30, rForearm: -38, lUpperArm: 22, lForearm: -18 },
    end: { ...BASE_SUPINE_BENT, torso: 187, rUpperArm: 26, rForearm: -44, lUpperArm: 18, lForearm: -26 },
  },
  sup_torax_b: {
    start: { ...BASE_SUPINE_BENT, rThigh: -40, rShank: 46, lThigh: -36, lShank: 42 },
    end: { ...BASE_SUPINE_BENT, rThigh: -20, rShank: 24, lThigh: -16, lShank: 20 },
  },
  sup_cadera_a: {
    start: { ...BASE_SUPINE_BENT },
    end: { ...BASE_SUPINE_BENT, rThigh: -115, rShank: 12, rUpperArm: -18, rForearm: -42 },
  },
  sup_cadera_b: {
    start: { ...BASE_SUPINE_BENT },
    end: { ...BASE_SUPINE_BENT, rThigh: -18, rShank: 24, lThigh: -14, lShank: 20 },
  },
  sup_rodilla_a: {
    start: { ...BASE_SUPINE_EXTENDED },
    end: { ...BASE_SUPINE_EXTENDED, rThigh: -46, rShank: 54, rFoot: 4 },
  },
  sup_rodilla_b: {
    start: { ...BASE_SUPINE_EXTENDED, rThigh: -22, rShank: 26, lThigh: -36, lShank: 42 },
    end: { ...BASE_SUPINE_EXTENDED, rThigh: -20, rShank: -16, rFoot: -92, lThigh: -36, lShank: 42 },
  },
  sup_tobillo_a: {
    start: { ...BASE_SUPINE_EXTENDED, rFoot: -102, lFoot: -98 },
    end: { ...BASE_SUPINE_EXTENDED, rFoot: -36, lFoot: -34 },
  },
  sup_tobillo_b: {
    start: { ...BASE_SUPINE_EXTENDED, rFoot: -96, lFoot: -52 },
    end: { ...BASE_SUPINE_EXTENDED, rFoot: -48, lFoot: -94 },
  },

  // === SENTADO (10) ===
  sen_cuello_a: {
    start: { ...BASE_SEATED, neck: -102, headTurn: -4 },
    end: { ...BASE_SEATED, neck: -78, headTurn: 4 },
  },
  sen_cuello_b: {
    start: { ...BASE_SEATED, rUpperArm: 78, rForearm: 18 },
    end: { ...BASE_SEATED, rUpperArm: 102, rForearm: 24, torso: -94 },
  },
  sen_torax_a: {
    start: { ...BASE_SEATED, torso: -84, rUpperArm: 74, rForearm: 20 },
    end: { ...BASE_SEATED, torso: -96, rUpperArm: 112, rForearm: 38, lUpperArm: 106, lForearm: 34 },
  },
  sen_torax_b: {
    start: { ...BASE_SEATED, rUpperArm: 62, rForearm: -12, lUpperArm: 68, lForearm: -4, headTurn: -5 },
    end: { ...BASE_SEATED, torso: -94, rUpperArm: 48, rForearm: -24, lUpperArm: 84, lForearm: 16, headTurn: 5 },
  },
  sen_cadera_a: {
    start: { ...BASE_SEATED },
    end: { ...BASE_SEATED, rThigh: -26, rShank: 88, rFoot: 0 },
  },
  sen_cadera_b: {
    start: { ...BASE_SEATED },
    end: { ...BASE_SEATED, rThigh: -14, rShank: 74, rFoot: -6 },
  },
  sen_rodilla_a: {
    start: { ...BASE_SEATED },
    end: { ...BASE_SEATED, rThigh: -4, rShank: -2, rFoot: -84 },
  },
  sen_rodilla_b: {
    start: { ...BASE_SEATED, rThigh: 26, rShank: 26, rFoot: -62 },
    end: { ...BASE_SEATED, torso: -76, neck: -78, rThigh: 26, rShank: 26, rFoot: -78 },
  },
  sen_tobillo_a: {
    start: { ...BASE_SEATED, rFoot: -24, lFoot: -22 },
    end: { ...BASE_SEATED, rFoot: 22, lFoot: 20 },
  },
  sen_tobillo_b: {
    start: { ...BASE_SEATED, rThigh: -6, rShank: 66, rFoot: -36 },
    end: { ...BASE_SEATED, rThigh: -6, rShank: 66, rFoot: 20 },
  },

  // === SUELO / COLCHONETA (10) ===
  sue_cuello_a: {
    start: { ...BASE_MAT_SEATED, neck: -74 },
    end: { ...BASE_MAT_SEATED, neck: -94, torso: -90 },
  },
  sue_cuello_b: {
    start: { ...BASE_MAT_SUPINE_BENT, rUpperArm: 12, rForearm: 4 },
    end: { ...BASE_MAT_SUPINE_BENT, rUpperArm: -54, rForearm: -48 },
  },
  sue_torax_a: {
    start: { ...BASE_MAT_QUADRUPED, torso: 176, neck: 184 },
    end: { ...BASE_MAT_QUADRUPED, torso: 190, neck: 172 },
  },
  sue_torax_b: {
    start: { ...BASE_MAT_SEATED, rUpperArm: 72, rForearm: 38 },
    end: { ...BASE_MAT_SEATED, torso: -74, neck: -78, rUpperArm: -18, rForearm: -12 },
  },
  sue_cadera_a: {
    start: { ...BASE_MAT_SUPINE_BENT },
    end: { ...BASE_MAT_SUPINE_BENT, pelvis: { x: 158, y: 136 }, torso: 168, rThigh: -18, rShank: 54, lThigh: -16, lShank: 52 },
  },
  sue_cadera_b: {
    start: { ...BASE_MAT_SUPINE_BENT },
    end: { ...BASE_MAT_SUPINE_BENT, rThigh: -58, rShank: 28, rFoot: -20 },
  },
  sue_rodilla_a: {
    start: { ...BASE_MAT_SEATED },
    end: { ...BASE_MAT_SEATED, rThigh: -44, rShank: 54, rFoot: 4 },
  },
  sue_rodilla_b: {
    start: { ...BASE_MAT_SUPINE_BENT },
    end: { ...BASE_MAT_SUPINE_BENT, rThigh: -88, rShank: -74, rFoot: -160, rUpperArm: -28, rForearm: -52 },
  },
  sue_tobillo_a: {
    start: { ...BASE_MAT_SEATED, rFoot: -102, lFoot: -98 },
    end: { ...BASE_MAT_SEATED, rFoot: -34, lFoot: -32 },
  },
  sue_tobillo_b: {
    start: { ...BASE_MAT_SEATED, rFoot: -96, lFoot: -52 },
    end: { ...BASE_MAT_SEATED, rFoot: -48, lFoot: -94 },
  },
};

export function getActiveJoints(group: MuscleGroup): Array<keyof SolvedSkeleton> {
  switch (group) {
    case 'cuello_hombros':
      return ['head', 'shoulder', 'rElbow'];
    case 'torax_columna':
      return ['shoulder', 'midSpine', 'pelvis'];
    case 'caderas_pelvis':
      return ['pelvis', 'rKnee'];
    case 'rodillas_piernas':
      return ['rKnee', 'rAnkle'];
    case 'tobillos_pies':
      return ['rAnkle', 'rToe'];
  }
}

export function getExercisePosePair(exercise: Exercise): { start: PoseAngles; end: PoseAngles } {
  return (
    EXERCISE_POSES[exercise.id] ?? {
      start: BASE_SEATED,
      end: BASE_SEATED,
    }
  );
}
