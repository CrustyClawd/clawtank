'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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

// Rock cluster decoration
function RockCluster({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Rock position={[0, 0, 0]} scale={1.5} color="#5a6a7a" />
      <Rock position={[0.25, -0.05, 0.15]} scale={1} color="#6a7a8a" />
      <Rock position={[-0.2, -0.08, 0.1]} scale={0.8} color="#4a5a6a" />
      <Rock position={[0.1, 0.1, -0.15]} scale={0.6} color="#7a8a9a" />
    </group>
  );
}

// Seaweed (short)
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

// Kelp (tall wavy plant with multiple segments)
function Kelp({ position, height = 2 }: { position: [number, number, number], height?: number }) {
  const groupRef = useRef<any>(null);
  const segments = Math.floor(height * 4);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child: any, i: number) => {
      const wave = Math.sin(state.clock.elapsedTime * 1.5 + i * 0.5 + position[0]) * 0.15 * (i / segments);
      child.rotation.z = wave;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: segments }).map((_, i) => (
        <mesh key={i} position={[0, i * 0.25, 0]}>
          <capsuleGeometry args={[0.03 - i * 0.002, 0.25, 4, 8]} />
          <meshStandardMaterial
            color={i < segments / 2 ? "#2d5a3d" : "#4d8a5d"}
            roughness={0.7}
          />
        </mesh>
      ))}
      {/* Kelp leaves/fronds */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={`leaf-${i}`} position={[0.1, height * 0.3 + i * 0.4, 0]} rotation={[0, 0, 0.5]}>
          <planeGeometry args={[0.3, 0.15]} />
          <meshStandardMaterial color="#3d7a4d" roughness={0.8} side={2} />
        </mesh>
      ))}
    </group>
  );
}

// Brain Coral
function BrainCoral({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#e8a87c" roughness={0.9} />
      </mesh>
      {/* Grooves */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 4, 0]}>
          <torusGeometry args={[0.2, 0.02, 8, 16]} />
          <meshStandardMaterial color="#c88a5c" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Branching Coral
function BranchingCoral({ position, color = "#ff6b8a" }: { position: [number, number, number], color?: string }) {
  return (
    <group position={position}>
      {/* Main trunk */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.3, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Branches */}
      {[
        { pos: [0.08, 0.25, 0], rot: [0, 0, 0.5] },
        { pos: [-0.08, 0.28, 0.05], rot: [0, 0, -0.4] },
        { pos: [0.05, 0.35, -0.05], rot: [0.3, 0, 0.3] },
        { pos: [-0.05, 0.32, 0], rot: [-0.2, 0, -0.5] },
        { pos: [0, 0.4, 0.08], rot: [0.5, 0, 0] },
      ].map((branch, i) => (
        <mesh key={i} position={branch.pos as [number, number, number]} rotation={branch.rot as [number, number, number]}>
          <cylinderGeometry args={[0.015, 0.025, 0.2, 6]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
      {/* Tips */}
      {[
        [0.12, 0.35, 0],
        [-0.12, 0.38, 0.08],
        [0.08, 0.48, -0.08],
        [-0.08, 0.45, 0],
        [0, 0.52, 0.12],
      ].map((pos, i) => (
        <mesh key={`tip-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} emissive={color} emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// Tube Coral / Anemone
function TubeCoral({ position, color = "#9b59b6" }: { position: [number, number, number], color?: string }) {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child: any, i: number) => {
      child.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
    });
  });

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2;
        const radius = 0.08;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius]}>
            <cylinderGeometry args={[0.015, 0.02, 0.2, 8]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        );
      })}
      {/* Center */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.15, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

// Rock/Stone
function Rock({ position, scale = 1, color = "#5a6a7a" }: { position: [number, number, number], scale?: number, color?: string }) {
  const rotation: [number, number, number] = [
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  ];
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color={color} roughness={0.95} metalness={0.1} />
    </mesh>
  );
}

// Sandy floor with scattered pebbles - extends infinitely
function SandyFloor() {
  const pebbles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 5.5,
        -1.48 + Math.random() * 0.05,
        (Math.random() - 0.5) * 5.5
      ] as [number, number, number],
      scale: 0.02 + Math.random() * 0.04,
      color: ['#8a9aaa', '#7a8a9a', '#6a7a8a', '#9aaaba'][Math.floor(Math.random() * 4)]
    }));
  }, []);

  return (
    <group>
      {/* Main sand floor - extended to appear infinite */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#c4a574" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Pebbles */}
      {pebbles.map((pebble, i) => (
        <mesh key={i} position={pebble.position} scale={pebble.scale}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial color={pebble.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Main scene
function Scene({ enableZoom, priceChange = 0 }: { enableZoom: boolean; priceChange?: number }) {
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

      {/* Raise entire scene to center in frame */}
      <group position={[0, 1.2, 0]}>
        {/* Lobster - on the sandy floor */}
        <group position={[0, -1.3, 0]}>
          <Lobster priceChange={priceChange} />
        </group>

        {/* Environment */}
        <SandyFloor />
      <Bubbles count={40} />
      <FloatingParticles count={80} />

      {/* Rock clusters */}
      <RockCluster position={[-2, -1.3, 1.5]} />
      <RockCluster position={[2.2, -1.35, -1]} />
      <Rock position={[1.8, -1.4, 1.8]} scale={1.2} color="#5a6a7a" />
      <Rock position={[-1.5, -1.38, -1.8]} scale={1} color="#6a7a8a" />
      <Rock position={[0.5, -1.42, 2]} scale={0.8} color="#4a5a6a" />

      {/* Kelp forest (back) */}
      <Kelp position={[-2.5, -1.5, -2]} height={2.5} />
      <Kelp position={[-2, -1.5, -2.2]} height={2} />
      <Kelp position={[-1.5, -1.5, -1.8]} height={2.2} />
      <Kelp position={[2, -1.5, -2]} height={2.3} />
      <Kelp position={[2.5, -1.5, -1.8]} height={1.8} />

      {/* Coral garden */}
      <BrainCoral position={[-1.8, -1.35, 0.5]} scale={1.2} />
      <BrainCoral position={[1.5, -1.38, 1]} scale={0.8} />
      <BranchingCoral position={[-1, -1.5, 1.5]} color="#ff6b8a" />
      <BranchingCoral position={[0.8, -1.5, 1.8]} color="#ff8c5a" />
      <BranchingCoral position={[-2.2, -1.5, 0]} color="#ff5a8a" />
      <TubeCoral position={[1.2, -1.5, 0.5]} color="#9b59b6" />
      <TubeCoral position={[-0.5, -1.5, 2]} color="#8e44ad" />
      <TubeCoral position={[2, -1.5, 0]} color="#a855f7" />

        {/* Seaweed scattered around */}
        <Seaweed position={[-2.5, -1.1, -1]} />
        <Seaweed position={[-2.2, -1.1, -0.5]} />
        <Seaweed position={[2.5, -1.1, 0.5]} />
        <Seaweed position={[2.2, -1.1, 1]} />
        <Seaweed position={[-1, -1.1, 2]} />
        <Seaweed position={[0, -1.1, -2]} />
        <Seaweed position={[1, -1.1, -1.8]} />
      </group>

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

export function Aquarium({ priceChange = 0 }: { priceChange?: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(180deg, #1a4a7a 0%, #0a2a4a 100%)' }}
      >
        <Scene enableZoom={isHovered} priceChange={priceChange} />
      </Canvas>
    </div>
  );
}
