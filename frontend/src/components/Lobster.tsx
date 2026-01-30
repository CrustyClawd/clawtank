'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, Mesh } from 'three';

export function Lobster() {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF('/models/lobster.glb');
  const { actions, names } = useAnimations(animations, groupRef);

  // Remove any floor/plane geometry from the model
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        const name = child.name.toLowerCase();
        // Hide floor, plane, ground, or platform meshes
        if (name.includes('floor') || name.includes('plane') || name.includes('ground') || name.includes('platform') || name.includes('base')) {
          child.visible = false;
        }
        // Also check geometry - if it's a large flat plane, hide it
        if (child.geometry) {
          const box = child.geometry.boundingBox;
          if (box) {
            const height = box.max.y - box.min.y;
            const width = box.max.x - box.min.x;
            const depth = box.max.z - box.min.z;
            // If very flat and wide, it's probably a floor
            if (height < 0.1 && width > 1 && depth > 1) {
              child.visible = false;
            }
          }
        }
      }
    });
  }, [scene]);

  // Start the idle animation on mount
  useEffect(() => {
    // Log available animations for debugging
    console.log('Available animations:', names);

    // Try to find and play idle animation
    const idleAction = actions['idle'] || actions['Idle'] || actions[names[0]];
    if (idleAction) {
      idleAction.reset().fadeIn(0.5).play();
    }

    return () => {
      // Cleanup animations on unmount
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, names]);

  // Add subtle floating motion on top of the rig animation
  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle bobbing
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    // Slight rotation
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} scale={1} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/lobster.glb');
