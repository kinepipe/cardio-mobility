export type Posture = 'acostado' | 'sentado' | 'suelo';

export type MuscleGroup =
  | 'cuello_hombros'
  | 'torax_columna'
  | 'caderas_pelvis'
  | 'rodillas_piernas'
  | 'tobillos_pies';

export type SessionDuration = 'corta' | 'estandar' | 'completa';

export type SessionPhase = 'calentamiento' | 'principal' | 'enfriamiento';

export interface Exercise {
  id: string;
  name: string;
  posture: Posture;
  muscleGroup: MuscleGroup;
  variant: 'A' | 'B';
  phase: SessionPhase;
  /** True si implica elevación de brazo/hombro > 60-90° (se adapta si hay marcapasos/DAI < 6 semanas) */
  shoulderCaution: boolean;
  /** Duración base de cada repetición/tramo en segundos (adulto estándar) */
  defaultDurationSec: number;
  /** Duración recomendada en adultos mayores (>=65 años) según ACSM */
  seniorDurationSec: number;
  /** Número de repeticiones/series del tramo */
  reps: number;
  /** Pausa de recuperación entre repeticiones/ejercicios en segundos */
  restSec: number;
  /** Consigna verbal y visual de respiración continua (anti-Valsalva) */
  breathingCue: string;
  /** Instrucciones escritas claras paso a paso */
  steps: string[];
  /** Nota de seguridad cardiovascular específica */
  safetyNote: string;
  /** Beneficio clínico */
  clinicalBenefit: string;
  /** Ruta relativa a la ilustración clínica paso a paso */
  image: string;
}

export interface ClinicalProfile {
  /** Marcapasos o DAI implantado hace menos de 6 semanas */
  recentDeviceUnder6Weeks: boolean;
  /** Toma betabloqueantes (controlar por Borg CR10 y prueba del habla, no por FC teórica) */
  usesBetaBlockers: boolean;
  /** Adulto mayor (>=65 años): ajusta estiramientos a 30-45 s y pausas más amplias */
  isOlderAdult: boolean;
  /** Texto grande para mejor legibilidad */
  largeText: boolean;
  /** Voz guiada y tonos activados */
  audioEnabled: boolean;
}

export interface ReminderConfig {
  id: string;
  label: string;
  time: string; // HH:mm
  days: number[]; // 0=Dom .. 6=Sab
  posture: Posture;
  enabled: boolean;
}

export interface SessionRecord {
  id: string;
  dateISO: string;
  posture: Posture;
  duration: SessionDuration;
  completedExercises: number;
  totalMinutes: number;
  borgScore: number | null;
  stoppedBySymptom: boolean;
  variantUsed: 'A' | 'B';
}

export interface SessionStep {
  id: string;
  kind: 'prep' | 'exercise' | 'rest' | 'transition' | 'cooldown_watch';
  phase: SessionPhase;
  title: string;
  subtitle: string;
  durationSec: number;
  exercise?: Exercise;
  repIndex?: number;
  totalReps?: number;
  voicePrompt: string;
}

