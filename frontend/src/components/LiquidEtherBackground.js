// src/components/LiquidEtherBackground.js
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';
import { Leva, useControls } from 'leva';

function AnimatedSphere() {
  const ref = useRef();
  
  // Kontrol untuk mengubah properti animasi secara real-time
  const { color, distort, speed, roughness } = useControls('Animation Controls', {
    color: '#0a192f',
    distort: 0.5,
    speed: 2,
    roughness: 0.1,
  });

  // Animasi per frame
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = Math.sin(state.clock.elapsedTime / 2) * 2;
      ref.current.rotation.y = state.clock.elapsedTime / 4;
    }
  });

  return (
    <Sphere ref={ref} args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={distort} // Seberapa banyak distorsi
        speed={speed} // Kecepatan animasi
        roughness={roughness} // Tingkat kekasaran permukaan
      />
    </Sphere>
  );
}

export default function LiquidEtherBackground() {
  return (
    <div className="liquid-ether-canvas-container">
      {/* Kontrol Leva untuk tuning animasi */}
      <Leva collapsed /> 
      
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <AnimatedSphere />
      </Canvas>
    </div>
  );
}