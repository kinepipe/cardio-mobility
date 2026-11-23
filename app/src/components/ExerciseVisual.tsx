import React, { useEffect, useState } from 'react';
import { Exercise } from '../types';
import { OpenSimViewer3D } from './OpenSimViewer3D';

interface Props {
  exercise: Exercise;
  activePhase?: 1 | 2;
  height?: number;
}

/**
 * Muestra la ilustración PNG si existe en public/exercises/<id>.png;
 * de lo contrario renderiza el visor anatómico 3D interactivo estilo OpenSim (Three.js).
 */
export const ExerciseVisual: React.FC<Props> = ({ exercise, height = 270 }) => {
  const [imgAvailable, setImgAvailable] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const probe = new Image();
    probe.onload = () => {
      if (active) setImgAvailable(true);
    };
    probe.onerror = () => {
      if (active) setImgAvailable(false);
    };
    probe.src = exercise.image;
    return () => {
      active = false;
    };
  }, [exercise.image]);

  if (imgAvailable) {
    return (
      <div className="visual-frame">
        <img src={exercise.image} alt={exercise.name} />
      </div>
    );
  }

  return <OpenSimViewer3D exercise={exercise} height={height} />;
};
