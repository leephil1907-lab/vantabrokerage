'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * WebGL hero object: a slowly rotating "market latitude" wireframe globe with
 * a shader-lit core and a field of orbiting price particles. Purely decorative —
 * no data is encoded here, so nothing on screen can be mistaken for a quote.
 *
 * Loaded only through `next/dynamic` (see hero-scene.tsx) so three.js never
 * enters the main bundle, and skipped entirely when WebGL is missing or the
 * visitor has reduced motion enabled.
 */

function coreColor(hex: string, intensity: number) {
  const c = new THREE.Color(hex);
  return c.multiplyScalar(intensity);
}

function Globe() {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const points = useMemo(() => {
    const count = 520;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const lime = new THREE.Color('#c8f751');
    const emerald = new THREE.Color('#2ee6a8');
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere, biased so the "equator" reads denser like a globe.
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      const radius = 1.62 + (i % 7 === 0 ? 0.16 : 0);
      positions.set([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius], i * 3);
      const mixed = lime.clone().lerp(emerald, (i % 11) / 11);
      colors.set([mixed.r, mixed.g, mixed.b], i * 3);
    }
    return { positions, colors };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.09;
      group.current.rotation.x = -0.22 + Math.sin(t * 0.22) * 0.06;
    }
    if (shell.current) {
      (shell.current.material as THREE.MeshBasicMaterial).opacity = 0.07 + Math.sin(t * 0.8) * 0.02;
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * 0.16;
    }
  });

  const scale = size.width < 520 ? 1.06 : 1.22;

  return (
    <group ref={group} scale={scale}>
      {/* Latitude / longitude wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.SphereGeometry(1.5, 26, 18)]} />
        <lineBasicMaterial color={coreColor('#4d7c4a', 1)} transparent opacity={0.16} />
      </lineSegments>

      {/* Glow shell */}
      <mesh ref={shell} scale={1.055}>
        <sphereGeometry args={[1.5, 48, 32]} />
        <meshBasicMaterial color={coreColor('#c8f751', 0.5)} transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Dark core so back-side lines read as depth */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.36, 1]} />
        <meshStandardMaterial color="#0b1210" roughness={0.35} metalness={0.6} wireframe transparent opacity={0.55} />
      </mesh>

      {/* Price particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[points.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.032} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Equatorial ring */}
      <mesh rotation={[Math.PI / 2.35, 0, 0]}>
        <torusGeometry args={[2.02, 0.004, 8, 160]} />
        <meshBasicMaterial color="#c8f751" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2.9, 0.7, 0]}>
        <torusGeometry args={[1.86, 0.003, 8, 140]} />
        <meshBasicMaterial color="#2ee6a8" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Rig() {
  const { camera, pointer } = useThree();
  useFrame(() => {
    camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.03;
    camera.position.y += (-pointer.y * 0.32 + 0.1 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroCanvas() {
  const [ready, setReady] = useState(false);
  return (
    <div className="h-full w-full" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        camera={{ position: [0, 0.1, 4.4], fov: 42 }}
        onCreated={() => setReady(true)}
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms ease' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} color="#d9ffb0" />
        <pointLight position={[-4, -2, -3]} intensity={1.4} color="#2ee6a8" />
        <Globe />
        <Rig />
      </Canvas>
    </div>
  );
}
