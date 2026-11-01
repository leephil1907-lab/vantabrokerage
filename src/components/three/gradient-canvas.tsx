'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Animated champagne-gold gradient mesh (GLSL fragment shader on a single
 * full-bleed plane). Purely decorative ambience for inner-page heroes —
 * cheap value-noise FBM, no textures, low DPR cap, `low-power` GPU hint.
 * Loaded only through `next/dynamic` (see shader-hero.tsx).
 */

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uPointer;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = dot(hash2(i), f);
  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.5 + 0.5;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.55;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += amp * vnoise(p);
    p = rot * p * 2.05 + vec2(13.7, 7.3);
    amp *= 0.5;
  }
  return v;
}

void main() {
  float t = uTime * 0.05;
  vec2 uv = vUv;
  vec2 q = uv * 1.7 + vec2(t, -t * 0.65) + uPointer * 0.12;

  float n1 = fbm(q);
  float n2 = fbm(q + n1 * 1.25 + vec2(3.1, 1.7) + t * 0.4);

  // Obsidian base, bronze mid-blooms, champagne highlights.
  vec3 base = vec3(0.039, 0.033, 0.026);
  vec3 bronze = vec3(0.42, 0.31, 0.14);
  vec3 gold = vec3(0.87, 0.75, 0.52);

  vec3 col = base;
  col += bronze * smoothstep(0.32, 0.86, n1) * 0.5;
  col += gold * pow(smoothstep(0.52, 0.95, n2), 2.0) * 0.42;

  // Keep the left side dark so hero copy stays readable.
  col *= smoothstep(0.0, 0.72, uv.x) * 0.85 + 0.15;
  // Soft top/bottom vignette.
  float vig = smoothstep(1.25, 0.3, length((uv - vec2(0.55, 0.5)) * vec2(1.0, 1.6)));
  col *= vig;
  // Film grain.
  col += (hash2(uv * vec2(1973.0, 927.0) + fract(uTime)).x - 0.5) * 0.014;

  gl_FragColor = vec4(col, 1.0);
}
`;

function Mesh() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPointer: { value: new THREE.Vector2(0, 0) } }),
    [],
  );
  useFrame((state, delta) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    const p = mat.current.uniforms.uPointer.value as THREE.Vector2;
    // Damped pointer drift for a liquid feel.
    p.x = THREE.MathUtils.damp(p.x, pointer.x, 1.6, delta);
    p.y = THREE.MathUtils.damp(p.y, pointer.y, 1.6, delta);
  });
  return (
    <mesh scale={[9, 5.4, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} depthWrite={false} />
    </mesh>
  );
}

export default function GradientCanvas() {
  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1, 1.4]}
        gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 2], fov: 50 }}
        style={{ background: '#0d0b08' }}
      >
        <Mesh />
      </Canvas>
    </div>
  );
}
