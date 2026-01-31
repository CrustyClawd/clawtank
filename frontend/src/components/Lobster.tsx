'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, Mesh, Vector3, MathUtils } from 'three';

interface ActivityState {
  current: string;
  position: { x: number; z: number; name: string };
  description: string;
}

const MOVE_SPEED = 0.8; // Units per second
const ROTATION_SPEED = 3; // Radians per second
const ARRIVAL_THRESHOLD = 0.1; // How close is "arrived"

// Price reactivity thresholds
const PUMP_THRESHOLD = 50; // 50% up = excited
const MEGA_PUMP_THRESHOLD = 100; // 100% up = VERY excited
const DUMP_THRESHOLD = -50; // 50% down = sad

interface LobsterProps {
  priceChange?: number;
}

export function Lobster({ priceChange = 0 }: LobsterProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF('/models/lobster.glb');
  const { actions, names } = useAnimations(animations, groupRef);

  // Activity and movement state
  const [activity, setActivity] = useState<ActivityState | null>(null);
  const [targetPos] = useState(() => new Vector3(0, 0, 0));
  const [currentPos] = useState(() => new Vector3(0, 0, 0));
  const [isMoving, setIsMoving] = useState(false);
  const [targetRotation, setTargetRotation] = useState(0);
  const currentAnimation = useRef<string>('idle');

  // Price reactivity state
  const circleAngle = useRef(0);
  const isPumping = priceChange >= PUMP_THRESHOLD;
  const isMegaPumping = priceChange >= MEGA_PUMP_THRESHOLD;
  const isDumping = priceChange <= DUMP_THRESHOLD;

  // Find animation actions
  const getAnimation = useCallback((name: string) => {
    const lowerName = name.toLowerCase();
    // Try exact match first, then case-insensitive
    return actions[name] ||
           actions[name.charAt(0).toUpperCase() + name.slice(1)] ||
           Object.entries(actions).find(([key]) => key.toLowerCase().includes(lowerName))?.[1] ||
           null;
  }, [actions]);

  // Switch animation
  const playAnimation = useCallback((name: string) => {
    if (currentAnimation.current === name) return;

    const newAction = getAnimation(name);
    const oldAction = getAnimation(currentAnimation.current);

    if (newAction) {
      if (oldAction) {
        oldAction.fadeOut(0.3);
      }
      newAction.reset().fadeIn(0.3).play();
      currentAnimation.current = name;
    }
  }, [getAnimation]);

  // Remove any floor/plane geometry from the model
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        const name = child.name.toLowerCase();
        if (name.includes('floor') || name.includes('plane') || name.includes('ground') || name.includes('platform') || name.includes('base')) {
          child.visible = false;
        }
        if (child.geometry) {
          const box = child.geometry.boundingBox;
          if (box) {
            const height = box.max.y - box.min.y;
            const width = box.max.x - box.min.x;
            const depth = box.max.z - box.min.z;
            if (height < 0.1 && width > 1 && depth > 1) {
              child.visible = false;
            }
          }
        }
      }
    });
  }, [scene]);

  // Start idle animation on mount
  useEffect(() => {
    console.log('Available animations:', names);
    const idleAction = getAnimation('idle');
    if (idleAction) {
      idleAction.reset().fadeIn(0.5).play();
      currentAnimation.current = 'idle';
    }

    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, names, getAnimation]);

  // Fetch activity state periodically
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity');
        if (res.ok) {
          const data = await res.json();
          setActivity(data);
          // Update target position
          if (data.position) {
            targetPos.set(data.position.x, 0, data.position.z);
          }
        }
      } catch (e) {
        console.error('Failed to fetch activity:', e);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [targetPos]);

  // Movement and animation frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // PRICE REACTIVITY: When pumping, run in circles!
    if (isPumping) {
      // Calculate circle speed based on pump intensity
      const circleSpeed = isMegaPumping ? 4 : 2; // Radians per second
      const circleRadius = isMegaPumping ? 1.5 : 1; // Circle size

      // Update angle
      circleAngle.current += circleSpeed * delta;

      // Move in a circle
      const circleX = Math.sin(circleAngle.current) * circleRadius;
      const circleZ = Math.cos(circleAngle.current) * circleRadius;

      groupRef.current.position.x = circleX;
      groupRef.current.position.z = circleZ;
      currentPos.set(circleX, 0, circleZ);

      // Face the direction of movement (tangent to circle)
      groupRef.current.rotation.y = circleAngle.current + Math.PI / 2;

      // Play walk animation fast
      if (currentAnimation.current !== 'walk') {
        playAnimation('walk');
      }

      // Excited bobbing - faster and higher
      const bobSpeed = isMegaPumping ? 3 : 2;
      const bobHeight = isMegaPumping ? 0.15 : 0.1;
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * bobSpeed)) * bobHeight;

      return; // Skip normal movement when pumping
    }

    // When dumping, move very slowly and look sad
    const speedMultiplier = isDumping ? 0.3 : 1;

    const distance = currentPos.distanceTo(targetPos);

    if (distance > ARRIVAL_THRESHOLD) {
      // We need to move
      if (!isMoving) {
        setIsMoving(true);
        playAnimation('walk');
      }

      // Calculate direction to target
      const direction = new Vector3()
        .subVectors(targetPos, currentPos)
        .normalize();

      // Calculate target rotation (face movement direction)
      const newTargetRotation = Math.atan2(direction.x, direction.z);
      setTargetRotation(newTargetRotation);

      // Smoothly rotate toward target
      const currentRotation = groupRef.current.rotation.y;
      const rotationDiff = MathUtils.euclideanModulo(
        newTargetRotation - currentRotation + Math.PI,
        Math.PI * 2
      ) - Math.PI;

      groupRef.current.rotation.y += Math.sign(rotationDiff) *
        Math.min(Math.abs(rotationDiff), ROTATION_SPEED * delta * speedMultiplier);

      // Move toward target
      const moveAmount = Math.min(MOVE_SPEED * delta * speedMultiplier, distance);
      currentPos.add(direction.multiplyScalar(moveAmount));

      groupRef.current.position.x = currentPos.x;
      groupRef.current.position.z = currentPos.z;
    } else {
      // We've arrived
      if (isMoving) {
        setIsMoving(false);
        playAnimation('idle');
      }
    }

    // Add subtle bobbing motion (slower when dumping)
    const bobMultiplier = isDumping ? 0.3 : 1;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 * bobMultiplier) * 0.05;

    // Add subtle idle sway when not moving (droopy when dumping)
    if (!isMoving) {
      if (isDumping) {
        // Droopy head-down look
        groupRef.current.rotation.x = 0.1;
      } else {
        groupRef.current.rotation.x = 0;
      }
      groupRef.current.rotation.y += Math.sin(state.clock.elapsedTime * 0.2) * 0.002;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} scale={1} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/lobster.glb');
