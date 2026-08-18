import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { Environment, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 3. THE CALIBRATION OBJECT (FACE MAPPING FIX)
// Change these numbers if the highlight appears on the wrong physical side!
// ==========================================
export const FACE_MAP = {
  top: 1,    // +Y axis
  bottom: 2, // -Y axis
  right: 3,  // +X axis
  left: 4,   // -X axis
  front: 5,  // +Z axis
  back: 6    // -Z axis
};

// Permanent, immutable physical locations on the cube
const FACE_TRANSFORMS = {
  top: { position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0] },
  bottom: { position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, Math.PI] },
  right: { position: [0.51, 0, 0], rotation: [0, Math.PI / 2, -Math.PI / 2] },
  left: { position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, Math.PI / 2] },
  front: { position: [0, 0, 0.51], rotation: [0, 0, 0] },
  back: { position: [0, 0, -0.51], rotation: [0, Math.PI, 0] }
};

const FONT_URL = "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf";

// ==========================================
// 1 & 2. THE RCA Z-FIGHTING & GUARANTEED GLOW FIX
// ==========================================
function GlowingOverlay({ faceKey, targetNumber, isRolling }) {
  const materialRef = useRef();
  
  // 4. EXACT VISIBILITY LOGIC
  const faceNumber = FACE_MAP[faceKey];
  const isWinner = !isRolling && targetNumber === faceNumber;

  useFrame(({ clock }) => {
    if (materialRef.current && isWinner) {
      // Smoothly pulse opacity
      materialRef.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 6) * 0.5;
    }
  });

  const transform = FACE_TRANSFORMS[faceKey];
  if (!transform) return null;

  return (
    <Text 
      position={transform.position} 
      rotation={transform.rotation} 
      fontSize={0.62} // Scaled up slightly
      fontWeight="900"
      outlineWidth={0.03}
      outlineColor="#fbbf24"
      font={FONT_URL}
      fontStyle="italic"
      visible={isWinner}
      renderOrder={999} // 1. Render extremely late (on top)
    >
      {faceNumber}
      {/* 2. Blown-out neon material ignoring shadows and depth buffer */}
      <meshBasicMaterial 
        ref={materialRef} 
        color={[5, 1.5, 0]} // Vibrant, blown-out Neon Amber [R, G, B] array scaling
        transparent 
        toneMapped={false} 
        depthTest={false} 
        depthWrite={false}
      />
    </Text>
  );
}

// --- PHYSICS FLOOR & INVISIBLE WALLS ---
function Floor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -1, 0],
    material: { restitution: 0.4, friction: 0.6 }
  }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial opacity={0.3} />
    </mesh>
  );
}

function InvisibleWalls() {
  // These walls form a tight invisible box around the center/top of the screen
  usePlane(() => ({ position: [0, 0, -2], rotation: [0, 0, 0] })); // Back wall
  usePlane(() => ({ position: [0, 0, 1], rotation: [0, -Math.PI, 0] })); // Front wall (moved slightly lower to prevent top clipping)
  usePlane(() => ({ position: [-1.8, 0, 0], rotation: [0, Math.PI / 2, 0] })); // Left wall
  usePlane(() => ({ position: [1.8, 0, 0], rotation: [0, -Math.PI / 2, 0] })); // Right wall
  usePlane(() => ({ position: [0, 3.5, 0], rotation: [Math.PI / 2, 0, 0] })); // Ceiling (physically blocks dice from reaching the top of the camera view)
  
  return null;
}

// --- BASE MODEL & OVERLAYS ---
const DiceVisuals = React.forwardRef(({ targetNumber, isRolling }, ref) => {
  return (
    <group ref={ref}>
      {/* 1. Base Model Preservation */}
      <RoundedBox args={[1, 1, 1]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#1a1512" roughness={0.1} metalness={0.5} />
      </RoundedBox>

      {/* The non-glowing default numbers printed on the dice */}
      <Text position={FACE_TRANSFORMS.top.position} rotation={FACE_TRANSFORMS.top.rotation} fontSize={0.6} color="#ffffff" font={FONT_URL} fontStyle="italic" fontWeight="900" outlineWidth={0.02} outlineColor="#999999">{FACE_MAP.top}</Text>
      <Text position={FACE_TRANSFORMS.bottom.position} rotation={FACE_TRANSFORMS.bottom.rotation} fontSize={0.6} color="#ffffff" font={FONT_URL} fontStyle="italic" fontWeight="900" outlineWidth={0.02} outlineColor="#999999">{FACE_MAP.bottom}</Text>
      <Text position={FACE_TRANSFORMS.right.position} rotation={FACE_TRANSFORMS.right.rotation} fontSize={0.6} color="#ffffff" font={FONT_URL} fontStyle="italic" fontWeight="900" outlineWidth={0.02} outlineColor="#999999">{FACE_MAP.right}</Text>
      <Text position={FACE_TRANSFORMS.left.position} rotation={FACE_TRANSFORMS.left.rotation} fontSize={0.6} color="#ffffff" font={FONT_URL} fontStyle="italic" fontWeight="900" outlineWidth={0.02} outlineColor="#999999">{FACE_MAP.left}</Text>
      <Text position={FACE_TRANSFORMS.front.position} rotation={FACE_TRANSFORMS.front.rotation} fontSize={0.6} color="#ffffff" font={FONT_URL} fontStyle="italic" fontWeight="900" outlineWidth={0.02} outlineColor="#999999">{FACE_MAP.front}</Text>
      <Text position={FACE_TRANSFORMS.back.position} rotation={FACE_TRANSFORMS.back.rotation} fontSize={0.6} color="#ffffff" font={FONT_URL} fontStyle="italic" fontWeight="900" outlineWidth={0.02} outlineColor="#999999">{FACE_MAP.back}</Text>

      {/* 2. The 6-Face Static Overlay Strategy */}
      <GlowingOverlay faceKey="top" targetNumber={targetNumber} isRolling={isRolling} />
      <GlowingOverlay faceKey="bottom" targetNumber={targetNumber} isRolling={isRolling} />
      <GlowingOverlay faceKey="right" targetNumber={targetNumber} isRolling={isRolling} />
      <GlowingOverlay faceKey="left" targetNumber={targetNumber} isRolling={isRolling} />
      <GlowingOverlay faceKey="front" targetNumber={targetNumber} isRolling={isRolling} />
      <GlowingOverlay faceKey="back" targetNumber={targetNumber} isRolling={isRolling} />
    </group>
  );
});

// --- PHYSICS ENGINE ---
function DicePhysics({ targetNumber, isRolling, onRollComplete, computedArgs }) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: [0, 2, 0],
    args: computedArgs,
    material: { restitution: 0.6, friction: 0.3 },
    linearDamping: 0.2,
    angularDamping: 0.2,
  }));

  const velocity = useRef([0, 0, 0]);
  const angularVelocity = useRef([0, 0, 0]);
  const quaternion = useRef([0, 0, 0, 1]);
  const rollStartTime = useRef(0);

  useEffect(() => {
    const unsubV = api.velocity.subscribe((v) => (velocity.current = v));
    const unsubAV = api.angularVelocity.subscribe((v) => (angularVelocity.current = v));
    const unsubQ = api.quaternion.subscribe((q) => (quaternion.current = q));
    return () => { unsubV(); unsubAV(); unsubQ(); };
  }, [api]);

  useEffect(() => {
    if (isRolling) {
      rollStartTime.current = Date.now();
      
      const startX = (Math.random() - 0.5) * 2;
      const startZ = (Math.random() - 0.5) * 2;
      
      api.quaternion.set(Math.random(), Math.random(), Math.random(), Math.random());
      // Spawn lower to avoid hitting the top of the camera FOV
      api.position.set(startX, 1, startZ);
      
      // Reduce the upward throw velocity so it doesn't fly out the top of the screen
      api.velocity.set((Math.random() - 0.5) * 5, 2 + Math.random() * 2, (Math.random() - 0.5) * 5);
      api.angularVelocity.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
    }
  }, [isRolling, api]);

  useFrame(() => {
    if (!isRolling) return;
    
    // Prevent false positives on frame 1: Must roll for at least 1.5s
    if (Date.now() - rollStartTime.current < 1500) return;

    let isAligned = true;

    if (targetNumber) {
      const currentQ = new THREE.Quaternion(...quaternion.current);
      
      // Dynamic torque mapping based on calibration object
      const faceVectors = {
        [FACE_MAP.top]: new THREE.Vector3(0, 1, 0),
        [FACE_MAP.bottom]: new THREE.Vector3(0, -1, 0),
        [FACE_MAP.right]: new THREE.Vector3(1, 0, 0),
        [FACE_MAP.left]: new THREE.Vector3(-1, 0, 0),
        [FACE_MAP.front]: new THREE.Vector3(0, 0, 1),
        [FACE_MAP.back]: new THREE.Vector3(0, 0, -1),
      };

      const targetLocalUp = faceVectors[targetNumber];
      if (targetLocalUp) {
        const currentWorldUp = targetLocalUp.clone().applyQuaternion(currentQ);
        const desiredWorldUp = new THREE.Vector3(0, 1, 0);

        let torqueAxis = currentWorldUp.clone().cross(desiredWorldUp);
        let error = torqueAxis.length();
        const dot = currentWorldUp.dot(desiredWorldUp);

        if (dot < -0.9) {
          torqueAxis = new THREE.Vector3(1, 0, 0);
          error = 1;
        }

        const speed = new THREE.Vector3(...velocity.current).length();
        const correctiveStrength = speed < 2 ? 40 : 10; 

        if (error > 0.05) {
          api.applyTorque([
            torqueAxis.x * correctiveStrength, 
            torqueAxis.y * correctiveStrength, 
            torqueAxis.z * correctiveStrength
          ]);
        }
        
        if (speed < 0.1 && error > 0.2) {
           api.velocity.set((Math.random() - 0.5) * 2, 3, (Math.random() - 0.5) * 2);
           api.angularVelocity.set(torqueAxis.x * 10, torqueAxis.y * 10, torqueAxis.z * 10);
        }

        if (dot < 0.95) {
          isAligned = false;
        }
      }
    }

    const vSpeed = new THREE.Vector3(...velocity.current).length();
    const aSpeed = new THREE.Vector3(...angularVelocity.current).length();

    if (vSpeed < 0.05 && aSpeed < 0.05 && isAligned) {
      onRollComplete(targetNumber);
    }
  });

  return (
    <mesh ref={ref}>
       <DiceVisuals targetNumber={targetNumber} isRolling={isRolling} />
    </mesh>
  );
}

// --- DYNAMIC BOUNDING BOX CALCULATOR ---
function DiceBody({ targetNumber, isRolling, onRollComplete }) {
  const visualRef = useRef();
  const [computedArgs, setComputedArgs] = useState(null);

  useEffect(() => {
    if (visualRef.current) {
      const box = new THREE.Box3().setFromObject(visualRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const finalX = size.x > 0.1 ? size.x : 1;
      const finalY = size.y > 0.1 ? size.y : 1;
      const finalZ = size.z > 0.1 ? size.z : 1;

      setComputedArgs([finalX, finalY, finalZ]);
    }
  }, []);

  if (!computedArgs) {
    return (
      <group ref={visualRef} position={[0, -1000, 0]}>
        <DiceVisuals targetNumber={targetNumber} isRolling={isRolling} />
      </group>
    );
  }

  return (
    <DicePhysics 
      computedArgs={computedArgs} 
      targetNumber={targetNumber} 
      isRolling={isRolling} 
      onRollComplete={onRollComplete} 
    />
  );
}

// --- MAIN WRAPPER ---
export default function Dice3D({ targetNumber, isRolling, onRollComplete }) {
  return (
    <div className="w-full h-48 sm:h-64 relative">
      <Canvas shadows camera={{ position: [0, 5, 8], fov: 25 }}>
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[5, 10, 5]} 
          castShadow 
          intensity={2.0} 
          color="#ffeedd"
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#f59e0b" />
        
        <Physics gravity={[0, -20, 0]}>
          <Floor />
          <InvisibleWalls />
          <DiceBody 
            targetNumber={targetNumber} 
            isRolling={isRolling} 
            onRollComplete={onRollComplete} 
          />
        </Physics>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
