'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import { Mesh, Points } from 'three';
import { Lobster } from './Lobster';

// Bubbles particle system
function Bubbles({ count = 50 }) {
  const ref = useRef<Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.01 + Math.random() * 0.005;
      positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.002;

      if (positions[i * 3 + 1] > 2) {
        positions[i * 3 + 1] = -2;
        positions[i * 3] = (Math.random() - 0.5) * 4;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#88ccff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Floating particles (dust/plankton)
function FloatingParticles({ count = 100 }) {
  const ref = useRef<Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#aaddff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// Tank glass walls (subtle)
function TankWalls() {
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#2a5a8c" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Sand/gravel texture on floor */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 5,
            -1.45,
            (Math.random() - 0.5) * 5
          ]}
        >
          <sphereGeometry args={[0.05 + Math.random() * 0.05, 6, 6]} />
          <meshStandardMaterial color="#3a6a9c" roughness={0.8} />
        </mesh>
      ))}

      {/* Decorative rocks */}
      <mesh position={[-2, -1.2, 1]}>
        <dodecahedronGeometry args={[0.3]} />
        <meshStandardMaterial color="#4a7aac" roughness={0.9} />
      </mesh>
      <mesh position={[2, -1.3, -1]}>
        <dodecahedronGeometry args={[0.25]} />
        <meshStandardMaterial color="#3a6a9c" roughness={0.9} />
      </mesh>
      <mesh position={[1.5, -1.35, 1.5]}>
        <dodecahedronGeometry args={[0.2]} />
        <meshStandardMaterial color="#5a8abc" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Seaweed
function Seaweed({ position }: { position: [number, number, number] }) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
  });

  return (
    <mesh ref={ref} position={position}>
      <capsuleGeometry args={[0.05, 0.8 + Math.random() * 0.4, 4, 8]} />
      <meshStandardMaterial color="#4d8a6d" roughness={0.8} />
    </mesh>
  );
}

// Main scene
function Scene({ enableZoom }: { enableZoom: boolean }) {
  return (
    <>
      {/* MUCH brighter lighting */}
      <ambientLight intensity={1.2} color="#88bbff" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={2}
        color="#ffffff"
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={1}
        color="#88ddff"
      />
      <pointLight position={[0, 3, 0]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-2, 0, 2]} intensity={0.8} color="#00ffaa" />
      <pointLight position={[2, 0, -2]} intensity={0.8} color="#00aaff" />

      {/* Lighter fog for underwater effect */}
      <fog attach="fog" args={['#1a4a7a', 5, 15]} />

      {/* Lobster */}
      <Float
        speed={1.5}
        rotationIntensity={0.2}
        floatIntensity={0.3}
      >
        <Lobster />
      </Float>

      {/* Environment */}
      <TankWalls />
      <Bubbles count={40} />
      <FloatingParticles count={80} />

      {/* Seaweed */}
      <Seaweed position={[-2.5, -1, -1]} />
      <Seaweed position={[-2.2, -1, -0.5]} />
      <Seaweed position={[2.5, -1, 0.5]} />
      <Seaweed position={[2.2, -1, 1]} />
      <Seaweed position={[-1, -1, 2]} />

      {/* Camera controls - zoom enabled on hover */}
      <OrbitControls
        enablePan={false}
        enableZoom={enableZoom}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export function Aquarium() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0.5, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(180deg, #1a4a7a 0%, #0a2a4a 100%)' }}
      >
        <Scene enableZoom={isHovered} />
      </Canvas>
    </div>
  );
}
