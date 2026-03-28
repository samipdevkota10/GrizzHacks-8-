"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function Orb({
  position,
  color,
  speed,
  size,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  size: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    meshRef.current.position.y = position[1] + Math.sin(t) * 0.5;
    meshRef.current.position.x = position[0] + Math.cos(t * 0.7) * 0.3;
  });

  return (
    <Float speed={speed * 2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

function GlowRing({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    ref.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[1.8, 0.02, 16, 100]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.4} />
    </mesh>
  );
}

function Scene() {
  const orbs = useMemo(
    () => [
      { position: [-3, 1, -2] as [number, number, number], color: "#4F8EF7", speed: 0.4, size: 1.2 },
      { position: [3.5, -1, -3] as [number, number, number], color: "#A78BFA", speed: 0.3, size: 0.9 },
      { position: [0, 2, -4] as [number, number, number], color: "#00D26A", speed: 0.5, size: 0.6 },
      { position: [-2, -2, -5] as [number, number, number], color: "#4F8EF7", speed: 0.35, size: 0.45 },
      { position: [2, 0.5, -1.5] as [number, number, number], color: "#7C3AED", speed: 0.45, size: 0.35 },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#4F8EF7" />
      <pointLight position={[-5, -3, 3]} intensity={0.5} color="#A78BFA" />
      <GlowRing position={[0, 0, -3]} color="#4F8EF7" />
      {orbs.map((orb, i) => (
        <Orb key={i} {...orb} />
      ))}
    </>
  );
}

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
