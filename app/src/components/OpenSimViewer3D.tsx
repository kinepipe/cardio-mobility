import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MUSCLE_GROUP_META, POSTURE_META } from '../data/exercises';
import { Exercise } from '../types';
import { OPENSIM_POSES_3D, Pose3D } from '../utils/opensimPoses3D';

interface Props {
  exercise: Exercise;
  height?: number;
}

type CamPreset = 'threeQuarter' | 'front' | 'side';

const DEG = Math.PI / 180;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export const OpenSimViewer3D: React.FC<Props> = ({ exercise, height = 270 }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [camPreset, setCamPreset] = useState<CamPreset>('threeQuarter');
  const camAnglesRef = useRef<{ azimuth: number; polar: number; radius: number }>({
    azimuth: 0.72,
    polar: 1.15,
    radius: 2.05,
  });

  useEffect(() => {
    if (camPreset === 'threeQuarter') {
      camAnglesRef.current = { azimuth: 0.72, polar: 1.15, radius: 2.05 };
    } else if (camPreset === 'front') {
      camAnglesRef.current = { azimuth: 0.0, polar: 1.25, radius: 2.0 };
    } else {
      camAnglesRef.current = { azimuth: Math.PI / 2, polar: 1.25, radius: 2.05 };
    }
  }, [camPreset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const h = height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfaf8f5);

    const camera = new THREE.PerspectiveCamera(38, width / h, 0.1, 20);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Iluminación clínica cálida
    const hemi = new THREE.HemisphereLight(0xffffff, 0xdbeafe, 0.95);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfffbeb, 0.95);
    dir.position.set(2.4, 3.8, 2.2);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);

    const rim = new THREE.DirectionalLight(0x99f6e4, 0.45);
    rim.position.set(-2.5, 2.0, -2.0);
    scene.add(rim);

    // Suelo + cuadrícula biomecánica sutil
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshStandardMaterial({ color: 0xf5f3ef, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(5, 20, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = 0.002;
    scene.add(grid);

    // Materiales estilo OpenSim
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xe7e1d5, roughness: 0.55, metalness: 0.05 });
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.6 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.65 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.35 });
    const activeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.5 });

    const mg = exercise.muscleGroup;
    const jMat = (target: Exercise['muscleGroup']) => (mg === target ? activeMat : jointMat);

    // === ESCENARIO 3D (Cama, Silla o Colchoneta) ===
    const posePair = OPENSIM_POSES_3D[exercise.id] ?? OPENSIM_POSES_3D.sen_cuello_a;
    const sceneType = posePair.start.scene;

    if (sceneType === 'bed') {
      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.46, 2.05),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 })
      );
      mattress.position.set(0, 0.23, 0.12);
      mattress.receiveShadow = true;
      scene.add(mattress);

      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.11, 0.32),
        new THREE.MeshStandardMaterial({ color: 0xccfbf1, roughness: 0.85 })
      );
      pillow.position.set(0, 0.51, -0.66);
      pillow.receiveShadow = true;
      scene.add(pillow);
    } else if (sceneType === 'chair') {
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.46), chairMat);
      seat.position.set(0, 0.42, 0.02);
      seat.receiveShadow = true;
      scene.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.05), chairMat);
      back.position.set(0, 0.67, -0.19);
      scene.add(back);

      [
        [-0.2, -0.18],
        [0.2, -0.18],
        [-0.2, 0.2],
        [0.2, 0.2],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 10), chairMat);
        leg.position.set(lx, 0.21, lz);
        scene.add(leg);
      });
    } else {
      const mat = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.035, 1.95),
        new THREE.MeshStandardMaterial({ color: 0x99f6e4, roughness: 0.9 })
      );
      mat.position.set(0, 0.018, 0.1);
      mat.receiveShadow = true;
      scene.add(mat);

      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.07, 0.34),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85 })
      );
      cushion.position.set(0, 0.06, -0.62);
      scene.add(cushion);
    }

    // === CONSTRUCCIÓN JERÁRQUICA 3D DEL ESQUELETO OPENSIM (ZERO DESACOPLE) ===
    const makeLimb = (len: number, rTop: number, rBot: number, mat: THREE.Material) => {
      const geo = new THREE.CylinderGeometry(rTop, rBot, len, 14);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = -len / 2; // nace en el origen del grupo padre y baja a -len
      mesh.castShadow = true;
      return mesh;
    };

    const makeJoint = (radius: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), mat);
      m.castShadow = true;
      return m;
    };

    // Raíz: Pelvis
    const pelvisGroup = new THREE.Group();
    scene.add(pelvisGroup);

    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.16), legMat);
    pelvisMesh.castShadow = true;
    pelvisGroup.add(pelvisMesh);
    pelvisGroup.add(makeJoint(0.052, jMat('caderas_pelvis')));

    // Columna + Tórax
    const spineGroup = new THREE.Group();
    spineGroup.position.set(0, 0.06, 0);
    pelvisGroup.add(spineGroup);

    const lumbar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.18, 14), boneMat);
    lumbar.position.y = 0.09;
    lumbar.castShadow = true;
    spineGroup.add(lumbar);
    spineGroup.add(makeJoint(0.046, jMat('torax_columna')));

    const thorax = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.115, 0.3, 16), torsoMat);
    thorax.scale.set(1.15, 1, 0.72);
    thorax.position.y = 0.31;
    thorax.castShadow = true;
    spineGroup.add(thorax);

    // Cuello y Cabeza
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 0.47, 0);
    spineGroup.add(neckGroup);

    const neckCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.1, 12), boneMat);
    neckCyl.position.y = 0.05;
    neckGroup.add(neckCyl);
    neckGroup.add(makeJoint(0.042, jMat('cuello_hombros')));

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 20), headMat);
    headMesh.position.y = 0.17;
    headMesh.castShadow = true;
    neckGroup.add(headMesh);

    // Nariz / indicador facial para ver claramente la rotación cervical
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.05, 10), torsoMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.165, 0.11);
    neckGroup.add(nose);

    // Brazos (Derecho e Izquierdo)
    const buildArm = (side: 1 | -1) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.19, 0.42, 0);
      spineGroup.add(shoulder);
      shoulder.add(makeJoint(0.044, jMat('cuello_hombros')));
      shoulder.add(makeLimb(0.28, 0.038, 0.032, torsoMat));

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.28, 0);
      shoulder.add(elbow);
      elbow.add(makeJoint(0.034, boneMat));
      elbow.add(makeLimb(0.25, 0.031, 0.025, boneMat));

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), headMat);
      hand.position.set(0, -0.26, 0);
      elbow.add(hand);

      return { shoulder, elbow };
    };

    const rArm = buildArm(-1);
    const lArm = buildArm(1);

    // Piernas (Derecha e Izquierda)
    const buildLeg = (side: 1 | -1) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.1, -0.04, 0);
      pelvisGroup.add(hip);
      hip.add(makeJoint(0.048, jMat('caderas_pelvis')));
      hip.add(makeLimb(0.41, 0.056, 0.044, legMat));

      const knee = new THREE.Group();
      knee.position.set(0, -0.41, 0);
      hip.add(knee);
      knee.add(makeJoint(0.044, jMat('rodillas_piernas')));
      knee.add(makeLimb(0.39, 0.042, 0.032, legMat));

      const ankle = new THREE.Group();
      ankle.position.set(0, -0.39, 0);
      knee.add(ankle);
      ankle.add(makeJoint(0.036, jMat('tobillos_pies')));

      // Pie anatómico (talón + antepié hacia +Z)
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.045, 0.19), torsoMat);
      foot.position.set(0, -0.025, 0.06);
      foot.castShadow = true;
      ankle.add(foot);

      return { hip, knee, ankle };
    };

    const rLeg = buildLeg(-1);
    const lLeg = buildLeg(1);

    const applyPose = (p: Pose3D, elapsedSec: number) => {
      pelvisGroup.position.set(p.pelvisPos[0], p.pelvisPos[1], p.pelvisPos[2]);
      pelvisGroup.rotation.set(p.pelvisRot[0] * DEG, p.pelvisRot[1] * DEG, p.pelvisRot[2] * DEG);

      spineGroup.rotation.set(p.spine[0] * DEG, p.spine[1] * DEG, p.spine[2] * DEG);
      neckGroup.rotation.set(p.neck[0] * DEG, p.neck[1] * DEG, p.neck[2] * DEG);

      let rSh = [...p.rShoulder] as [number, number, number];
      let lSh = [...p.lShoulder] as [number, number, number];
      let rAnk = [...p.rAnkle] as [number, number];
      let lAnk = [...p.lAnkle] as [number, number];

      if (p.circular === 'bothShoulders') {
        const w = (elapsedSec / 3.2) * Math.PI * 2;
        rSh = [18 + Math.cos(w) * 18, 0, 14 + Math.sin(w) * 12];
        lSh = [18 + Math.cos(w) * 18, 0, 14 + Math.sin(w) * 12];
      } else if (p.circular === 'bothAnkles') {
        const w = (elapsedSec / 3.0) * Math.PI * 2;
        rAnk = [Math.sin(w) * 24, Math.cos(w) * 20];
        lAnk = [Math.sin(w) * 24, -Math.cos(w) * 20];
      } else if (p.circular === 'rAnkle') {
        const w = (elapsedSec / 3.0) * Math.PI * 2;
        rAnk = [Math.sin(w) * 24, Math.cos(w) * 22];
      }

      // Hombros: flexión es -X en Three.js porque el brazo apunta hacia -Y
      rArm.shoulder.rotation.set(-rSh[0] * DEG, rSh[1] * DEG, -rSh[2] * DEG);
      lArm.shoulder.rotation.set(-lSh[0] * DEG, -lSh[1] * DEG, lSh[2] * DEG);
      rArm.elbow.rotation.set(-p.rElbow * DEG, 0, 0);
      lArm.elbow.rotation.set(-p.lElbow * DEG, 0, 0);

      // Caderas: flexión hacia +Z es -X
      rLeg.hip.rotation.set(-p.rHip[0] * DEG, p.rHip[1] * DEG, -p.rHip[2] * DEG);
      lLeg.hip.rotation.set(-p.lHip[0] * DEG, -p.lHip[1] * DEG, p.lHip[2] * DEG);
      // Rodilla: flexión hacia atrás es +X
      rLeg.knee.rotation.set(p.rKnee * DEG, 0, 0);
      lLeg.knee.rotation.set(p.lKnee * DEG, 0, 0);
      // Tobillo: dorsiflexión (+) es -X
      rLeg.ankle.rotation.set(-rAnk[0] * DEG, 0, rAnk[1] * DEG);
      lLeg.ankle.rotation.set(-lAnk[0] * DEG, 0, -lAnk[1] * DEG);
    };

    // Interacción táctil / mouse para girar 360°
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      camAnglesRef.current.azimuth -= dx * 0.009;
      camAnglesRef.current.polar = Math.max(0.45, Math.min(1.48, camAnglesRef.current.polar - dy * 0.007));
    };
    const onUp = () => {
      dragging = false;
    };

    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    // ResizeObserver para responsividad real
    const ro = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    // Loop de animación 60 fps sincronizado con ritmo respiratorio lento (5.5 s)
    let raf = 0;
    const t0 = performance.now();
    const targetY = sceneType === 'chair' ? 0.72 : sceneType === 'bed' ? 0.56 : 0.38;

    const animateLoop = (now: number) => {
      const elapsed = (now - t0) / 1000;
      const t = 0.5 - 0.5 * Math.cos((elapsed / 5.5) * Math.PI * 2);

      const curPose: Pose3D = {
        pelvisPos: lerp3(posePair.start.pelvisPos, posePair.end.pelvisPos, t),
        pelvisRot: lerp3(posePair.start.pelvisRot, posePair.end.pelvisRot, t),
        spine: lerp3(posePair.start.spine, posePair.end.spine, t),
        neck: lerp3(posePair.start.neck, posePair.end.neck, t),
        rShoulder: lerp3(posePair.start.rShoulder, posePair.end.rShoulder, t),
        lShoulder: lerp3(posePair.start.lShoulder, posePair.end.lShoulder, t),
        rElbow: lerp(posePair.start.rElbow, posePair.end.rElbow, t),
        lElbow: lerp(posePair.start.lElbow, posePair.end.lElbow, t),
        rHip: lerp3(posePair.start.rHip, posePair.end.rHip, t),
        lHip: lerp3(posePair.start.lHip, posePair.end.lHip, t),
        rKnee: lerp(posePair.start.rKnee, posePair.end.rKnee, t),
        lKnee: lerp(posePair.start.lKnee, posePair.end.lKnee, t),
        rAnkle: [lerp(posePair.start.rAnkle[0], posePair.end.rAnkle[0], t), lerp(posePair.start.rAnkle[1], posePair.end.rAnkle[1], t)],
        lAnkle: [lerp(posePair.start.lAnkle[0], posePair.end.lAnkle[0], t), lerp(posePair.start.lAnkle[1], posePair.end.lAnkle[1], t)],
        scene: posePair.start.scene,
        circular: posePair.start.circular,
      };

      applyPose(curPose, elapsed);

      const { azimuth, polar, radius } = camAnglesRef.current;
      camera.position.set(
        radius * Math.sin(polar) * Math.sin(azimuth),
        targetY + radius * Math.cos(polar),
        radius * Math.sin(polar) * Math.cos(azimuth)
      );
      camera.lookAt(0, targetY, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animateLoop);
    };
    raf = requestAnimationFrame(animateLoop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      renderer.dispose();
    };
  }, [exercise.id, exercise.muscleGroup, height]);

  return (
    <div className="visual-frame" style={{ padding: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <span className="badge">{POSTURE_META[exercise.posture].label}</span>
        <span className="badge badge-warn">
          {MUSCLE_GROUP_META[exercise.muscleGroup].label} · 3D OpenSim
        </span>
      </div>

      <div
        ref={mountRef}
        style={{
          width: '100%',
          height,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1.5px solid #E2E8F0',
          background: '#FAF8F5',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
          Arrastra con el dedo para girar 360° · <span style={{ color: '#D97706' }}>● Zona activa</span>
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(
            [
              ['threeQuarter', '3/4'],
              ['front', 'Frente'],
              ['side', 'Lateral'],
            ] as [CamPreset, string][]
          ).map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCamPreset(id)}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: camPreset === id ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                background: camPreset === id ? '#CCFBF1' : '#FFFFFF',
                color: camPreset === id ? '#115E59' : '#475569',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
