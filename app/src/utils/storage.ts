import { ClinicalProfile, Posture, ReminderConfig, SessionRecord } from '../types';

const KEYS = {
  PROFILE: 'cm_profile_v1',
  HISTORY: 'cm_history_v1',
  REMINDERS: 'cm_reminders_v1',
  ROTATION: 'cm_rotation_v1',
};

export const DEFAULT_PROFILE: ClinicalProfile = {
  recentDeviceUnder6Weeks: false,
  usesBetaBlockers: false,
  isOlderAdult: false,
  largeText: false,
  audioEnabled: true,
};

export const DEFAULT_REMINDERS: ReminderConfig[] = [
  {
    id: 'rem_morning',
    label: 'Pausa de Movilidad Segura (Mañana)',
    time: '10:00',
    days: [1, 2, 3, 4, 5],
    posture: 'sentado',
    enabled: false,
  },
  {
    id: 'rem_afternoon',
    label: 'Movilidad Suave de Tarde',
    time: '17:30',
    days: [1, 3, 5],
    posture: 'acostado',
    enabled: false,
  },
];

export function loadProfile(): ClinicalProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: ClinicalProfile): void {
  try {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // ignore storage quota errors
  }
}

export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendHistory(record: SessionRecord): SessionRecord[] {
  const next = [record, ...loadHistory()].slice(0, 60);
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function loadReminders(): ReminderConfig[] {
  try {
    const raw = localStorage.getItem(KEYS.REMINDERS);
    return raw ? JSON.parse(raw) : DEFAULT_REMINDERS;
  } catch {
    return DEFAULT_REMINDERS;
  }
}

export function saveReminders(reminders: ReminderConfig[]): void {
  try {
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  } catch {
    // ignore
  }
}

/** Alterna automáticamente Variante A / B por postura entre sesiones */
export function getNextVariantForPosture(posture: Posture): 'A' | 'B' {
  try {
    const raw = localStorage.getItem(KEYS.ROTATION);
    const map: Record<string, 'A' | 'B'> = raw ? JSON.parse(raw) : {};
    return map[posture] === 'A' ? 'B' : 'A';
  } catch {
    return 'A';
  }
}

export function markVariantCompleted(posture: Posture, variant: 'A' | 'B'): void {
  try {
    const raw = localStorage.getItem(KEYS.ROTATION);
    const map: Record<string, 'A' | 'B'> = raw ? JSON.parse(raw) : {};
    map[posture] = variant;
    localStorage.setItem(KEYS.ROTATION, JSON.stringify(map));
  } catch {
    // ignore
  }
}

