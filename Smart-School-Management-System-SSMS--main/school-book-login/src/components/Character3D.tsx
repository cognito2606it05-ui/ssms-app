import { Component, ReactNode, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

/**
 * Character3D
 * -----------
 * Renders a real, production-grade rigged/sculpted GLB character (exported
 * from Tripo) with cinematic lighting, soft shadows and an environment for
 * PBR reflections. If the model has baked animation clips they play; if not
 * the character is given a lively idle (breathing, sway, gentle turn) while
 * the surrounding container is pushed into place.
 *
 * Drop the exported model at:  public/models/character.glb
 * (until then, the SVG cartoon fallback is shown automatically).
 */

export interface Character3DProps {
  role: string;
  accent: string;
  accentDeep: string;
  hair: string;
}

const MODEL_URL = '/models/character.glb';
const TARGET_HEIGHT = 3.0; // world units the model is normalised to

function Model({ accent }: { accent: string }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);

  // Skeleton-aware clone so repeated mounts (per role) are independent of the
  // cached scene AND any rig/skinning survives the copy.
  const cloned = useMemo(() => cloneSkeleton(scene) as THREE.Group, [scene]);
  const { actions, names } = useAnimations(animations, group);
  const [scale, setScale] = useState(1);

  // Normalise size, centre on X/Z, plant feet on the ground; enable shadows.
  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    setScale(TARGET_HEIGHT / maxDim);
    cloned.position.set(-center.x, -box.min.y, -center.z);
    cloned.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 0.9;
      }
    });
  }, [cloned]);

  // Play a baked clip if the model ships with one (e.g. a Tripo walk/idle).
  useEffect(() => {
    if (!names.length) return;
    const a = actions[names[0]];
    a?.reset().fadeIn(0.4).play();
    return () => { a?.fadeOut(0.3); };
  }, [actions, names]);

  // Lively idle + slow ¾ turn so the viewer reads it as 3D.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = -1.5 + Math.sin(t * 1.4) * 0.04;       // breathing bob
      group.current.rotation.y = -0.35 + Math.sin(t * 0.5) * 0.28;      // gentle turn
      group.current.rotation.z = Math.sin(t * 1.1) * 0.015;             // subtle sway
    }
    if (inner.current) {
      const breath = 1 + Math.sin(t * 1.4) * 0.012;
      inner.current.scale.set(breath, 1 / breath, breath);              // chest breathing
    }
  });

  return (
    <group ref={group} position={[0, -1.5, 0]}>
      <group ref={inner} scale={scale}>
        <primitive object={cloned} />
      </group>
      {/* accent bounce light close to the character */}
      <pointLight position={[-1.5, 0.5, 1.5]} intensity={3} color={accent} distance={6} />
    </group>
  );
}

function Scene({ accent }: { accent: string }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#ffffff', '#b6c2d4', 0.55]} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.7} color={accent} />

      <Suspense fallback={null}>
        <Model accent={accent} />
      </Suspense>

      <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={8} blur={2.4} far={4} resolution={1024} color="#0b1220" />

      {/* offline-safe environment built from light cards (no CDN HDRI) */}
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, 2]} scale={[8, 4, 1]} color="#ffffff" />
        <Lightformer intensity={1.2} position={[-4, 1, 2]} scale={[3, 6, 1]} color="#dce6f5" />
        <Lightformer intensity={1.4} position={[4, 1, 1]} scale={[3, 6, 1]} color={accent} />
      </Environment>
    </>
  );
}

/* Error boundary -> gracefully render the SVG fallback (missing model / no WebGL). */
class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function Character3D({ accent, fallback }: Character3DProps & { fallback: ReactNode }) {
  // Probe for the model first so a missing file falls back cleanly to the SVG
  // instead of leaving the Suspense boundary hanging.
  const [status, setStatus] = useState<'checking' | 'ok' | 'missing'>('checking');
  useEffect(() => {
    let alive = true;
    fetch(MODEL_URL, { method: 'HEAD' })
      .then((r) => alive && setStatus(r.ok ? 'ok' : 'missing'))
      .catch(() => alive && setStatus('missing'));
    return () => { alive = false; };
  }, []);

  if (status !== 'ok') return <div className="drop-shadow-2xl">{fallback}</div>;

  return (
    <CanvasBoundary fallback={<div className="drop-shadow-2xl">{fallback}</div>}>
      <div style={{ width: 380, height: 460 }}>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          camera={{ position: [0, 0.3, 5.6], fov: 34 }}
        >
          <Scene accent={accent} />
        </Canvas>
      </div>
    </CanvasBoundary>
  );
}
