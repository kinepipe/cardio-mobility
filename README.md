---
title: "Cardio Mobility — Guía Segura de Movilidad Cardiovascular (Android APK + PWA)"
document_type: "documentacion-tecnica"
date: "2026-11-23"
---

# Cardio Mobility — Movilidad Segura Basada en Evidencia

Aplicación móvil 100% offline (sin servidores) diseñada para personas con riesgo cardiovascular elevado o función cardíaca reducida, basada en guías internacionales (ESC, AHA/ACC, ACSM, AACVPR y ASSOBRAFIR 2025).

## Características Principales

- **30 ejercicios seguros** organizados en **3 posturas** (*Acostado/Cama*, *Sentado en silla* y *Suelo/Colchoneta*) × **5 grupos musculares** × **2 variantes rotativas (A y B)** que se alternan automáticamente entre sesiones.
- **Seguridad cardiovascular integrada:**
  - Chequeo previo de **banderas rojas** (contraindicaciones absolutas) antes de iniciar.
  - Perfil clínico local opcional: filtro para **marcapasos/DAI reciente (< 6 semanas)**, **uso de betabloqueantes** (Borg CR10 + Prueba del Habla) y **adulto mayor (≥ 65 años)**.
  - Botón rojo permanente de **detención inmediata por síntomas** con protocolo ante mareo ortostático.
- **Temporizador automático con voz en español** (`SpeechSynthesis`), tonos suaves anti-sobresalto, recordatorio de **exhalación continua (anti-Valsalva)** y pantalla siempre encendida (`WakeLock`).
- **Recordatorios de movilidad:** notificaciones locales nativas en Android APK (`@capacitor/local-notifications`) + descarga de calendario `.ics` recurrente en 1 toque.
- **Totalmente responsiva** y con botón rápido de **letra grande** para adultos mayores.

---

## Cómo probarla en tu computador

```bash
cd "E:\DEVELOPER\CARDIO MOVILITY\app"
npm run dev
```

## Cómo obtener el archivo `.apk` instalable para Android (sin servidores)

### Opción 1 (Recomendada, sin instalar Android Studio): GitHub Actions
1. Sube la carpeta `E:\DEVELOPER\CARDIO MOVILITY\` a un repositorio de GitHub (puede ser privado).
2. Ve a la pestaña **Actions** → **Build Cardio Mobility Android APK** → **Run workflow**.
3. En ~2 minutos descarga el artefacto **`CardioMobility-Android-APK`** (`app-debug.apk`) listo para enviar por WhatsApp/Drive e instalar en cualquier teléfono Android.

### Opción 2 (Local en Windows)
Si instalas JDK 17/21 y Android SDK (`ANDROID_HOME`):
```bash
cd "E:\DEVELOPER\CARDIO MOVILITY\app"
npm run cap:sync
cd android
.\gradlew.bat assembleDebug
```
El APK quedará en `app\android\app\build\outputs\apk\debug\app-debug.apk`.

---

## Ilustraciones Clínicas Paso a Paso (`app/public/exercises/`)

La app incluye ilustraciones clínicas SVG paso a paso (2 fases animadas) para los 30 ejercicios. Además, el componente `ExerciseVisual.tsx` detecta automáticamente si colocas imágenes `.png` en `app/public/exercises/` con los IDs oficiales (`sup_cuello_a.png` … `sue_tobillo_b.png`), reemplazando la vista SVG sin modificar código.

