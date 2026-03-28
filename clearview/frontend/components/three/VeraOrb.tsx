"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

function AnimatedSphere({ speaking }: { speaking?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = t * 0.3;
    meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
  });

  return (
    <Float speed={speaking ? 6 : 2} rotationIntensity={0.3} floatIntensity={speaking ? 1.2 : 0.5}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#A78BFA"
          roughness={0.15}
          metalness={0.9}
          distort={speaking ? 0.5 : 0.25}
          speed={speaking ? 5 : 2}
          emissive="#7C3AED"
          emissiveIntensity={0.4}
        />
      </mesh>
    </Float>
  );
}

export function VeraOrb({
  size = 40,
  speaking = false,
}: {
  size?: number;
  speaking?: boolean;
}) {
  return (
    <div style={{ width: size, height: size }} className="rounded-full overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 3]} intensity={1} color="#A78BFA" />
        <pointLight position={[-2, -1, 2]} intensity={0.5} color="#4F8EF7" />
        <AnimatedSphere speaking={speaking} />
      </Canvas>
    </div>
  );
}
