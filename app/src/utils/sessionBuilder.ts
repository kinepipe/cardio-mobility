import { EXERCISES, POSTURE_META } from '../data/exercises';
import {
  ClinicalProfile,
  Exercise,
  MuscleGroup,
  Posture,
  SessionDuration,
  SessionStep,
} from '../types';

const GROUP_ORDER: MuscleGroup[] = [
  'cuello_hombros',
  'torax_columna',
  'caderas_pelvis',
  'rodillas_piernas',
  'tobillos_pies',
];

/**
 * Construye una sesión guiada automática segura respetando:
 * - Postura del día (acostado, sentado o suelo)
 * - Rotación de variantes A/B entre sesiones para alternar ejercicios por grupo muscular
 * - Perfil clínico: marcapasos/DAI <6 semanas (evita ejercicios con shoulderCaution=true)
 * - Adulto mayor (>=65): usa seniorDurationSec (35-40 s) y pausas más amplias
 */
export function buildSession(
  posture: Posture,
  duration: SessionDuration,
  profile: ClinicalProfile,
  preferredVariant: 'A' | 'B'
): { steps: SessionStep[]; exercises: Exercise[]; estimatedMinutes: number } {
  const postureExercises = EXERCISES.filter((e) => e.posture === posture);

  const pickSafe = (group: MuscleGroup, variant: 'A' | 'B'): Exercise | undefined => {
    const candidates = postureExercises.filter((e) => e.muscleGroup === group);
    const preferred = candidates.find((e) => e.variant === variant);
    const alternate = candidates.find((e) => e.variant !== variant);
    if (profile.recentDeviceUnder6Weeks) {
      if (preferred && !preferred.shoulderCaution) return preferred;
      if (alternate && !alternate.shoulderCaution) return alternate;
    }
    return preferred ?? alternate;
  };

  let selected: Exercise[] = [];

  if (duration === 'corta') {
    // 5 ejercicios: 1 por cada grupo muscular usando la variante del día (A o B)
    selected = GROUP_ORDER.map((g) => pickSafe(g, preferredVariant)).filter(Boolean) as Exercise[];
  } else if (duration === 'estandar') {
    // 7 ejercicios: los 5 grupos con variante del día + 2 variantes alternas (tórax y tobillos)
    const base = GROUP_ORDER.map((g) => pickSafe(g, preferredVariant)).filter(Boolean) as Exercise[];
    const altVariant: 'A' | 'B' = preferredVariant === 'A' ? 'B' : 'A';
    const extraGroups: MuscleGroup[] = ['torax_columna', 'tobillos_pies'];
    const extras = extraGroups
      .map((g) => pickSafe(g, altVariant))
      .filter((e): e is Exercise => Boolean(e) && !base.some((b) => b.id === e?.id));
    selected = [...base, ...extras];
  } else {
    // Completa: los 10 ejercicios de la postura alternando A y B por grupo muscular
    const altVariant: 'A' | 'B' = preferredVariant === 'A' ? 'B' : 'A';
    for (const g of GROUP_ORDER) {
      const first = pickSafe(g, preferredVariant);
      const second = pickSafe(g, altVariant);
      if (first) selected.push(first);
      if (second && second.id !== first?.id) {
        if (!profile.recentDeviceUnder6Weeks || !second.shoulderCaution) {
          selected.push(second);
        }
      }
    }
  }

  // Ordenar por fase fisiológica: calentamiento -> principal -> enfriamiento
  const phaseRank = { calentamiento: 0, principal: 1, enfriamiento: 2 };
  selected.sort((a, b) => phaseRank[a.phase] - phaseRank[b.phase]);

  const steps: SessionStep[] = [
    {
      id: 'prep_start',
      kind: 'prep',
      phase: 'calentamiento',
      title: `Prepárate en posición: ${POSTURE_META[posture].label}`,
      subtitle: 'Acomoda tu postura, relaja los hombros y respira suave. Recuerda nunca aguantar el aire.',
      durationSec: 12,
      voicePrompt: `Comenzamos tu sesión segura en posición ${POSTURE_META[posture].short}. Acomódate sin apuro y respira suave por la nariz y la boca.`,
    },
  ];

  const repsPerExercise = duration === 'corta' ? 1 : 2;

  selected.forEach((ex, exIdx) => {
    const workSec = profile.isOlderAdult ? ex.seniorDurationSec : ex.defaultDurationSec;
    const restSec = profile.isOlderAdult ? ex.restSec + 5 : ex.restSec;

    for (let r = 1; r <= repsPerExercise; r++) {
      steps.push({
        id: `${ex.id}_rep_${r}`,
        kind: 'exercise',
        phase: ex.phase,
        title: ex.name,
        subtitle: ex.breathingCue,
        durationSec: workSec,
        exercise: ex,
        repIndex: r,
        totalReps: repsPerExercise,
        voicePrompt:
          r === 1
            ? `${ex.name}. ${ex.steps[0]} ${ex.breathingCue}`
            : `Segunda repetición de ${ex.name}. Mantén la exhalación continua y sin dolor.`,
      });

      const isLastOverall = exIdx === selected.length - 1 && r === repsPerExercise;
      if (!isLastOverall) {
        steps.push({
          id: `${ex.id}_rest_${r}`,
          kind: 'rest',
          phase: ex.phase,
          title: 'Pausa y respiración tranquila',
          subtitle:
            r < repsPerExercise
              ? 'Descansa unos segundos antes de la siguiente repetición.'
              : `Siguiente ejercicio: ${selected[exIdx + 1]?.name ?? 'Enfriamiento'}. Muévete lento.`,
          durationSec: restSec,
          exercise: selected[exIdx + (r < repsPerExercise ? 0 : 1)],
          voicePrompt:
            r < repsPerExercise
              ? 'Pausa. Respira tranquilo y relaja.'
              : `Descansa unos segundos. A continuación haremos ${selected[exIdx + 1]?.name ?? 'el cierre'}.`,
        });
      }
    }
  });

  // Cierre y transición postural lenta (protección contra hipotensión ortostática)
  steps.push({
    id: 'cooldown_watch',
    kind: 'cooldown_watch',
    phase: 'enfriamiento',
    title: 'Recuperación y transición lenta',
    subtitle: POSTURE_META[posture].transitionTip,
    durationSec: 30,
    voicePrompt: `Excelente trabajo. Tómate estos 30 segundos para respirar tranquilo antes de incorporarte despacio. ${POSTURE_META[posture].transitionTip}`,
  });

  const totalSec = steps.reduce((acc, s) => acc + s.durationSec, 0);
  return {
    steps,
    exercises: selected,
    estimatedMinutes: Math.max(1, Math.round(totalSec / 60)),
  };
}

