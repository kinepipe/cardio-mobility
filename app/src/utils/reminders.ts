import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { POSTURE_META } from '../data/exercises';
import { ReminderConfig } from '../types';

const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * Sincroniza recordatorios con notificaciones locales nativas de Android (Capacitor)
 * cuando corre como APK, o solicita permiso Web Notifications en navegador.
 */
export async function syncNativeReminders(reminders: ReminderConfig[]): Promise<{
  mode: 'native' | 'web';
  granted: boolean;
  scheduledCount: number;
}> {
  const active = reminders.filter((r) => r.enabled && r.days.length > 0);

  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.requestPermissions();
    const granted = perm.display === 'granted';
    if (!granted) return { mode: 'native', granted: false, scheduledCount: 0 };

    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const toSchedule = [];
    let notifId = 1000;
    for (const rem of active) {
      const [hour, minute] = rem.time.split(':').map(Number);
      for (const day of rem.days) {
        // Capacitor weekday: 1=Domingo .. 7=Sábado
        toSchedule.push({
          id: notifId++,
          title: 'Cardio Mobility — Pausa Segura',
          body: `${rem.label} (${POSTURE_META[rem.posture].short}). Recuerda respirar suave sin aguantar el aire.`,
          schedule: {
            on: { weekday: day + 1, hour, minute },
            repeats: true,
            allowWhileIdle: true,
          },
        });
      }
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }
    return { mode: 'native', granted: true, scheduledCount: toSchedule.length };
  }

  // Fallback navegador / PWA
  let granted = false;
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      granted = true;
    } else if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      granted = res === 'granted';
    }
  }
  return { mode: 'web', granted, scheduledCount: active.length };
}

/**
 * Genera y descarga un archivo .ics recurrente con alarma nativa del teléfono
 * (respaldo 100% confiable para iOS/Android aunque la PWA esté cerrada).
 */
export function downloadReminderICS(rem: ReminderConfig): void {
  const [hour, minute] = rem.time.split(':').map(Number);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  if (start.getTime() < now.getTime()) {
    start.setDate(start.getDate() + 1);
  }
  const end = new Date(start.getTime() + 15 * 60000);

  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(
      d.getHours()
    ).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;

  const byDay = (rem.days.length ? rem.days : [1, 2, 3, 4, 5]).map((d) => ICS_DAYS[d]).join(',');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cardio Mobility//Movilidad Segura//ES',
    'BEGIN:VEVENT',
    `UID:${rem.id}@cardiomobility.local`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
    `SUMMARY:Cardio Mobility — ${rem.label}`,
    `DESCRIPTION:Sesión guiada de movilidad segura en posición ${POSTURE_META[rem.posture].label}. Exhala continuamente y evita aguantar la respiración.`,
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Hora de tu pausa segura de movilidad (${POSTURE_META[rem.posture].short}).`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CardioMobility_${rem.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

