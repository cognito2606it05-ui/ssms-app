import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Sparkles, 
  Smile, 
  Activity, 
  Volume2, 
  Palette, 
  RotateCcw, 
  Play, 
  HelpCircle,
  Award,
  Zap,
  Coffee,
  Compass,
  BookOpen,
  User,
  Scissors
} from 'lucide-react';

// ==========================================
// BONE RIG DEFINITION
// ==========================================
interface BoneDef {
  name: string;
  parent: number;
  pos: [number, number, number];
}

const BONE_DEFS: BoneDef[] = [
  { name: 'hips', parent: -1, pos: [0, 0, 0] },          // 0
  { name: 'spine', parent: 0, pos: [0, 0.35, 0] },        // 1
  { name: 'chest', parent: 1, pos: [0, 0.35, 0] },        // 2
  { name: 'neck', parent: 2, pos: [0, 0.18, 0] },          // 3
  { name: 'head', parent: 3, pos: [0, 0.15, 0] },         // 4
  
  { name: 'shoulder_L', parent: 2, pos: [-0.15, 0.15, 0] },// 5
  { name: 'upperarm_L', parent: 5, pos: [-0.2, 0, 0] },   // 6
  { name: 'forearm_L', parent: 6, pos: [-0.2, 0, 0] },    // 7
  { name: 'hand_L', parent: 7, pos: [-0.1, 0, 0] },       // 8
  
  { name: 'shoulder_R', parent: 2, pos: [0.15, 0.15, 0] }, // 9
  { name: 'upperarm_R', parent: 9, pos: [0.2, 0, 0] },    // 10
  { name: 'forearm_R', parent: 10, pos: [0.2, 0, 0] },   // 11
  { name: 'hand_R', parent: 11, pos: [0.1, 0, 0] },      // 12
  
  { name: 'thigh_L', parent: 0, pos: [-0.1, -0.05, 0] },  // 13
  { name: 'calf_L', parent: 13, pos: [0, -0.35, 0] },     // 14
  { name: 'foot_L', parent: 14, pos: [0, -0.35, 0] },     // 15
  
  { name: 'thigh_R', parent: 0, pos: [0.1, -0.05, 0] },   // 16
  { name: 'calf_R', parent: 16, pos: [0, -0.35, 0] },     // 17
  { name: 'foot_R', parent: 17, pos: [0, -0.35, 0] },     // 18
  
  // Hair ponytail bones for secondary jiggle
  { name: 'hair_1', parent: 4, pos: [0, 0.08, -0.15] },   // 19
  { name: 'hair_2', parent: 19, pos: [0, -0.12, -0.08] }, // 20
  { name: 'hair_3', parent: 20, pos: [0, -0.12, -0.08] }, // 21
];

// Helper to compute world positions of bones in bind pose
function getBoneWorldPositions(): THREE.Vector3[] {
  const worldPos: THREE.Vector3[] = [];
  const computePos = (idx: number, current: THREE.Vector3) => {
    const def = BONE_DEFS[idx];
    const pos = current.clone().add(new THREE.Vector3().fromArray(def.pos));
    worldPos[idx] = pos;
    BONE_DEFS.forEach((d, i) => {
      if (d.parent === idx) computePos(i, pos);
    });
  };
  const root = BONE_DEFS.findIndex(d => d.parent === -1);
  computePos(root, new THREE.Vector3(0, 0, 0));
  return worldPos;
}

// Distance from point to line segment
function getDistanceToSegment(v: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const ab = new THREE.Vector3().subVectors(b, a);
  const av = new THREE.Vector3().subVectors(v, a);
  const abLenSq = ab.lengthSq();
  if (abLenSq === 0) return v.distanceTo(a);
  
  let t = av.dot(ab) / abLenSq;
  t = Math.max(0, Math.min(1, t)); // clamp to segment
  
  const proj = a.clone().add(ab.multiplyScalar(t));
  return v.distanceTo(proj);
}

// Proximity skinned cylinder generator
function createSkinnedCylinder(
  boneStartIdx: number,
  boneEndIdx: number,
  radiusStart: number,
  radiusEnd: number,
  radialSegments: number,
  heightSegments: number,
  skeletonWorldPositions: THREE.Vector3[]
) {
  const pA = skeletonWorldPositions[boneStartIdx];
  const pB = skeletonWorldPositions[boneEndIdx];
  
  const boneVec = new THREE.Vector3().subVectors(pB, pA);
  const length = boneVec.length();
  
  const geom = new THREE.CylinderGeometry(
    radiusEnd,
    radiusStart,
    length,
    radialSegments,
    heightSegments,
    false // closed caps
  );
  
  // Shift origin to bottom of cylinder
  geom.translate(0, length / 2, 0);
  
  // Rotate to align cylinder Y-axis to bone vector
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, boneVec.clone().normalize());
  geom.applyQuaternion(quaternion);
  geom.translate(pA.x, pA.y, pA.z); // place it at start joint
  
  const positions = geom.attributes.position;
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i);
    
    // Compute distance to all bone segments
    const distances = BONE_DEFS.map((b, idx) => {
      const a = skeletonWorldPositions[idx];
      const childIdx = BONE_DEFS.findIndex(d => d.parent === idx);
      const bPos = childIdx !== -1 ? skeletonWorldPositions[childIdx] : a.clone().add(new THREE.Vector3(0, 0.08, 0));
      const dist = getDistanceToSegment(v, a, bPos);
      return { idx, dist };
    });
    
    // Sort and grab nearest 2 bones
    distances.sort((x, y) => x.dist - y.dist);
    const b0 = distances[0];
    const b1 = distances[1];
    
    const w0_raw = 1 / Math.max(0.0001, Math.pow(b0.dist, 3.5));
    const w1_raw = 1 / Math.max(0.0001, Math.pow(b1.dist, 3.5));
    const sum = w0_raw + w1_raw;
    
    skinIndices.push(b0.idx, b1.idx, 0, 0);
    skinWeights.push(w0_raw / sum, w1_raw / sum, 0, 0);
  }
  
  geom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  
  return geom;
}

// ==========================================
// PRESET CHARACTER DESCRIPTIONS
// ==========================================
interface CharacterPreset {
  name: string;
  role: string;
  description: string;
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
  hairStyle: 'spiky' | 'curly' | 'long' | 'ponytail' | 'short';
  headgear: 'none' | 'crown' | 'cap' | 'chefhat' | 'helmet' | 'wizard';
  handheld: 'none' | 'pointer' | 'shield' | 'clipboard' | 'wand' | 'books';
  glasses: 'none' | 'round' | 'square';
  backpack: boolean;
  accentColor: string;
}

const PRESETS: Record<string, CharacterPreset> = {
  student: {
    name: 'Leo',
    role: 'Student',
    description: 'Energetic campus student with a spiky hairstyle and backpack, ready for classes.',
    skinColor: '#ffd8b3',
    hairColor: '#4a3319',
    shirtColor: '#22c55e',
    pantsColor: '#475569',
    shoeColor: '#1e293b',
    hairStyle: 'spiky',
    headgear: 'cap',
    handheld: 'none',
    glasses: 'none',
    backpack: true,
    accentColor: '#22c55e',
  },
  teacher: {
    name: 'Clara',
    role: 'Teacher',
    description: 'Elegant mathematics teacher wearing specs and holding an educational pointer.',
    skinColor: '#ffe0c2',
    hairColor: '#1a1a1a',
    shirtColor: '#3b82f6',
    pantsColor: '#1e293b',
    shoeColor: '#0f172a',
    hairStyle: 'ponytail',
    headgear: 'none',
    handheld: 'pointer',
    glasses: 'round',
    backpack: false,
    accentColor: '#3b82f6',
  },
  admin: {
    name: 'Rex',
    role: 'Super Admin',
    description: 'The commanding system administrator, complete with a gold crown and shield.',
    skinColor: '#ffd2a1',
    hairColor: '#3b2314',
    shirtColor: '#ef4444',
    pantsColor: '#1e293b',
    shoeColor: '#b91c1c',
    hairStyle: 'short',
    headgear: 'crown',
    handheld: 'shield',
    glasses: 'none',
    backpack: false,
    accentColor: '#ef4444',
  },
  chef: {
    name: 'Pierre',
    role: 'Chef',
    description: 'Jolly canteen manager with a tall chef hat, specializing in delicious lunches.',
    skinColor: '#ffd8b3',
    hairColor: '#292524',
    shirtColor: '#f97316',
    pantsColor: '#78716c',
    shoeColor: '#44403c',
    hairStyle: 'curly',
    headgear: 'chefhat',
    handheld: 'none',
    glasses: 'none',
    backpack: false,
    accentColor: '#f97316',
  },
  wizard: {
    name: 'Merlin',
    role: 'Wizard',
    description: 'Mystical library archivist wielding a magical wand and a pointy wizard hat.',
    skinColor: '#ffd8b3',
    hairColor: '#e2e8f0',
    shirtColor: '#8b5cf6',
    pantsColor: '#4c1d95',
    shoeColor: '#1e1b4b',
    hairStyle: 'long',
    headgear: 'wizard',
    handheld: 'wand',
    glasses: 'square',
    backpack: false,
    accentColor: '#a78bfa',
  },
  astronaut: {
    name: 'Neil',
    role: 'Space Cadet',
    description: 'Futuristic explorer wearing a chrome space helmet and custom silver-white spacesuit.',
    skinColor: '#ffe4cc',
    hairColor: '#d97706',
    shirtColor: '#cbd5e1',
    pantsColor: '#94a3b8',
    shoeColor: '#64748b',
    hairStyle: 'short',
    headgear: 'helmet',
    handheld: 'clipboard',
    glasses: 'none',
    backpack: true,
    accentColor: '#06b6d4',
  }
};

// ==========================================
// SPEECH SYNTHESIS & VISEME SIMULATION DATA
// ==========================================
interface Viseme {
  mouthOpen: number;
  mouthSmile: number;
  mouthPucker: number;
  browRaise: number;
  headTiltX: number;
  headTiltY: number;
  name: string;
}

const VISEMES: Record<string, Viseme> = {
  idle: { mouthOpen: 0.0, mouthSmile: 0.6, mouthPucker: 0.0, browRaise: 0.0, headTiltX: 0, headTiltY: 0, name: 'idle' },
  A:    { mouthOpen: 0.85, mouthSmile: 0.5, mouthPucker: 0.0, browRaise: 0.15, headTiltX: 0.06, headTiltY: 0, name: 'A' },
  E:    { mouthOpen: 0.45, mouthSmile: 0.9, mouthPucker: 0.0, browRaise: 0.0, headTiltX: 0, headTiltY: 0.02, name: 'E' },
  O:    { mouthOpen: 0.65, mouthSmile: 0.1, mouthPucker: 0.85, browRaise: 0.1, headTiltX: 0.02, headTiltY: -0.02, name: 'O' },
  U:    { mouthOpen: 0.35, mouthSmile: 0.0, mouthPucker: 1.0, browRaise: 0.0, headTiltX: 0.02, headTiltY: -0.02, name: 'U' },
  F:    { mouthOpen: 0.12, mouthSmile: 0.4, mouthPucker: 0.3, browRaise: 0.0, headTiltX: 0, headTiltY: 0, name: 'F' },
  BMP:  { mouthOpen: 0.01, mouthSmile: 0.3, mouthPucker: 0.1, browRaise: -0.05, headTiltX: -0.03, headTiltY: 0, name: 'BMP' },
  SZ:   { mouthOpen: 0.22, mouthSmile: 0.7, mouthPucker: 0.1, browRaise: 0.05, headTiltX: 0, headTiltY: 0, name: 'SZ' }
};

interface QueuedViseme extends Viseme {
  time: number;
  duration: number;
}

// Convert character string to viseme sequence
function textToVisemes(text: string, startTime: number): QueuedViseme[] {
  const queue: QueuedViseme[] = [];
  const words = text.toLowerCase().split(/\s+/);
  let timeCursor = startTime;
  
  words.forEach(word => {
    // Clean punctuation
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (cleanWord.length === 0) {
      timeCursor += 0.15; // pause for punctuation
      return;
    }
    
    // Simple phonetic breakdown
    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];
      let viseme: Viseme = VISEMES.idle;
      let duration = 0.06; // default 60ms
      
      if (['a', 'h'].includes(char)) {
        viseme = VISEMES.A;
        duration = 0.08;
      } else if (['e', 'i', 'y'].includes(char)) {
        viseme = VISEMES.E;
        duration = 0.08;
      } else if (['o', 'w'].includes(char)) {
        viseme = VISEMES.O;
        duration = 0.10;
      } else if (['u', 'q'].includes(char)) {
        viseme = VISEMES.U;
        duration = 0.10;
      } else if (['f', 'v'].includes(char)) {
        viseme = VISEMES.F;
        duration = 0.07;
      } else if (['b', 'p', 'm'].includes(char)) {
        viseme = VISEMES.BMP;
        duration = 0.07;
      } else if (['s', 'z', 't', 'd', 'c', 'g', 'j', 'k', 'n', 'r', 'x'].includes(char)) {
        viseme = VISEMES.SZ;
        duration = 0.06;
      }
      
      queue.push({
        ...viseme,
        time: timeCursor,
        duration
      });
      timeCursor += duration;
    }
    timeCursor += 0.06; // Space between words
  });
  
  return queue;
}

// ==========================================
// SKIN-MESHING MODEL COMPONENT
// ==========================================
interface RigProps {
  custom: CharacterPreset;
  activeAnimation: string;
  activeEmotion: string;
  animSpeed: number;
  jiggleStrength: number;
  swayAmp: number;
  bounceAmp: number;
  stiffness: number;
  visemeQueue: QueuedViseme[];
  voiceActive: boolean;
  lipSyncFeedback: (open: number, smile: number, pucker: number, name: string) => void;
}

function RiggedCharacter({
  custom,
  activeAnimation,
  activeEmotion,
  animSpeed,
  jiggleStrength,
  swayAmp,
  bounceAmp,
  stiffness,
  visemeQueue,
  voiceActive,
  lipSyncFeedback
}: RigProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate world positions for our bind pose skeleton
  const bindWorldPositions = useMemo(() => getBoneWorldPositions(), []);
  
  // Instantiate skeleton bones
  const bones = useMemo(() => {
    const boneList: THREE.Bone[] = [];
    BONE_DEFS.forEach(def => {
      const bone = new THREE.Bone();
      bone.name = def.name;
      bone.position.set(def.pos[0], def.pos[1], def.pos[2]);
      boneList.push(bone);
    });
    // Build tree
    BONE_DEFS.forEach((def, i) => {
      if (def.parent !== -1) {
        boneList[def.parent].add(boneList[i]);
      }
    });
    return boneList;
  }, []);
  
  const skeleton = useMemo(() => new THREE.Skeleton(bones), [bones]);

  // Generate meshes with skinning weights
  const bodyGeometry = useMemo(() => {
    // Build a seamless unified body
    const parts = [
      createSkinnedCylinder(0, 1, 0.18, 0.16, 16, 8, bindWorldPositions), // Hips to Spine (Lower Torso)
      createSkinnedCylinder(1, 2, 0.16, 0.18, 16, 8, bindWorldPositions), // Spine to Chest (Upper Torso)
      createSkinnedCylinder(2, 3, 0.18, 0.08, 12, 4, bindWorldPositions), // Chest to Neck
      createSkinnedCylinder(3, 4, 0.08, 0.07, 12, 4, bindWorldPositions), // Neck to Head base
      
      // Arms Left
      createSkinnedCylinder(5, 6, 0.06, 0.06, 12, 4, bindWorldPositions), // Left Shoulder to Upper Arm
      createSkinnedCylinder(6, 7, 0.06, 0.05, 12, 6, bindWorldPositions), // Left Upper Arm to Forearm
      createSkinnedCylinder(7, 8, 0.05, 0.04, 12, 6, bindWorldPositions), // Left Forearm to Hand
      
      // Arms Right
      createSkinnedCylinder(9, 10, 0.06, 0.06, 12, 4, bindWorldPositions), // Right Shoulder to Upper Arm
      createSkinnedCylinder(10, 11, 0.06, 0.05, 12, 6, bindWorldPositions), // Right Upper Arm to Forearm
      createSkinnedCylinder(11, 12, 0.05, 0.04, 12, 6, bindWorldPositions), // Right Forearm to Hand
      
      // Legs Left
      createSkinnedCylinder(13, 14, 0.11, 0.09, 16, 8, bindWorldPositions), // Left Thigh to Calf
      createSkinnedCylinder(14, 15, 0.09, 0.07, 16, 8, bindWorldPositions), // Left Calf to Foot
      
      // Legs Right
      createSkinnedCylinder(16, 17, 0.11, 0.09, 16, 8, bindWorldPositions), // Right Thigh to Calf
      createSkinnedCylinder(17, 18, 0.09, 0.07, 16, 8, bindWorldPositions), // Right Calf to Foot
    ];
    
    // Merge into one single skinned buffer geometry using Three's merge utility
    const merged = new THREE.BufferGeometry();
    let totalPositions: number[] = [];
    let totalNormals: number[] = [];
    let totalUvs: number[] = [];
    let totalSkinIndex: number[] = [];
    let totalSkinWeight: number[] = [];
    let totalIndices: number[] = [];
    let vertexOffset = 0;
    
    parts.forEach(geom => {
      const posAttr = geom.attributes.position;
      const normAttr = geom.attributes.normal;
      const uvAttr = geom.attributes.uv;
      const skinIdxAttr = geom.attributes.skinIndex;
      const skinWgtAttr = geom.attributes.skinWeight;
      const indices = geom.index;
      
      for (let i = 0; i < posAttr.count; i++) {
        totalPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        totalNormals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
        totalUvs.push(uvAttr.getX(i), uvAttr.getY(i));
        totalSkinIndex.push(skinIdxAttr.getX(i), skinIdxAttr.getY(i), skinIdxAttr.getZ(i), skinIdxAttr.getW(i));
        totalSkinWeight.push(skinWgtAttr.getX(i), skinWgtAttr.getY(i), skinWgtAttr.getZ(i), skinWgtAttr.getW(i));
      }
      
      if (indices) {
        for (let i = 0; i < indices.count; i++) {
          totalIndices.push(indices.getX(i) + vertexOffset);
        }
      }
      
      vertexOffset += posAttr.count;
    });
    
    merged.setAttribute('position', new THREE.Float32BufferAttribute(totalPositions, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(totalNormals, 3));
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(totalUvs, 2));
    merged.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(totalSkinIndex, 4));
    merged.setAttribute('skinWeight', new THREE.Float32BufferAttribute(totalSkinWeight, 4));
    merged.setIndex(totalIndices);
    
    return merged;
  }, [bindWorldPositions]);

  // Procedural clothes geometries (modeled as outer layers bound to the exact same skeleton!)
  const clothesGeometries = useMemo(() => {
    // Shirt: covers hips, spine, chest and upper arms
    const shirtGeom = createSkinnedCylinder(1, 2, 0.185, 0.195, 16, 8, bindWorldPositions);
    // Pants: covers hips and thighs
    const pantsGeom = new THREE.BufferGeometry();
    const pantsParts = [
      createSkinnedCylinder(0, 1, 0.195, 0.185, 16, 4, bindWorldPositions),
      createSkinnedCylinder(13, 14, 0.125, 0.10, 16, 6, bindWorldPositions),
      createSkinnedCylinder(16, 17, 0.125, 0.10, 16, 6, bindWorldPositions)
    ];
    // manual merge
    let totalPositions: number[] = [];
    let totalNormals: number[] = [];
    let totalUvs: number[] = [];
    let totalSkinIndex: number[] = [];
    let totalSkinWeight: number[] = [];
    let totalIndices: number[] = [];
    let vertexOffset = 0;
    
    pantsParts.forEach(geom => {
      const posAttr = geom.attributes.position;
      const normAttr = geom.attributes.normal;
      const uvAttr = geom.attributes.uv;
      const skinIdxAttr = geom.attributes.skinIndex;
      const skinWgtAttr = geom.attributes.skinWeight;
      const indices = geom.index;
      for (let i = 0; i < posAttr.count; i++) {
        totalPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        totalNormals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
        totalUvs.push(uvAttr.getX(i), uvAttr.getY(i));
        totalSkinIndex.push(skinIdxAttr.getX(i), skinIdxAttr.getY(i), skinIdxAttr.getZ(i), skinIdxAttr.getW(i));
        totalSkinWeight.push(skinWgtAttr.getX(i), skinWgtAttr.getY(i), skinWgtAttr.getZ(i), skinWgtAttr.getW(i));
      }
      if (indices) {
        for (let i = 0; i < indices.count; i++) {
          totalIndices.push(indices.getX(i) + vertexOffset);
        }
      }
      vertexOffset += posAttr.count;
    });
    pantsGeom.setAttribute('position', new THREE.Float32BufferAttribute(totalPositions, 3));
    pantsGeom.setAttribute('normal', new THREE.Float32BufferAttribute(totalNormals, 3));
    pantsGeom.setAttribute('uv', new THREE.Float32BufferAttribute(totalUvs, 2));
    pantsGeom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(totalSkinIndex, 4));
    pantsGeom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(totalSkinWeight, 4));
    pantsGeom.setIndex(totalIndices);

    return { shirtGeom, pantsGeom };
  }, [bindWorldPositions]);

  // Refs for facial rig elements (added to head bone)
  const faceGroup = useRef<THREE.Group>(null);
  const leftEyeLid = useRef<THREE.Mesh>(null);
  const rightEyeLid = useRef<THREE.Mesh>(null);
  const leftPupil = useRef<THREE.Mesh>(null);
  const rightPupil = useRef<THREE.Mesh>(null);
  const leftBrow = useRef<THREE.Mesh>(null);
  const rightBrow = useRef<THREE.Mesh>(null);
  const mouth = useRef<THREE.Mesh>(null);

  // Secondary hair ponytail bones tracking
  const hairPhysics = useRef([
    { rotX: 0, rotY: 0, velX: 0, velY: 0 },
    { rotX: 0, rotY: 0, velX: 0, velY: 0 },
    { rotX: 0, rotY: 0, velX: 0, velY: 0 }
  ]);

  // Setup initial bindings
  useEffect(() => {
    if (bones.length > 0) {
      const headBone = bones.find(b => b.name === 'head');
      if (headBone && faceGroup.current && faceGroup.current.parent !== headBone) {
        headBone.add(faceGroup.current);
      }
    }
  }, [bones]);

  // Jiggle bone spring simulation variables
  const prevHipsPos = useRef(new THREE.Vector3());
  const prevHipsRot = useRef(new THREE.Euler());

  // ==========================================
  // R3F ANIMATION FRAME LOOP
  // ==========================================
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = animSpeed;
    const cycle = t * 6.5 * speed;

    // Reset bone transform targets
    bones.forEach(b => {
      if (!b.name.startsWith('hair')) {
        b.rotation.set(0, 0, 0);
      }
    });

    const hips = bones[0];
    const spine = bones[1];
    const chest = bones[2];
    const neck = bones[3];
    const head = bones[4];
    const shoulderL = bones[5];
    const upperarmL = bones[6];
    const forearmL = bones[7];
    const handL = bones[8];
    const shoulderR = bones[9];
    const upperarmR = bones[10];
    const forearmR = bones[11];
    const handR = bones[12];
    const thighL = bones[13];
    const calfL = bones[14];
    const footL = bones[15];
    const thighR = bones[16];
    const calfR = bones[17];
    const footR = bones[18];

    // Targets for face animation
    let targetMouthOpen = 0.0;
    let targetMouthSmile = 0.5; // Neutral smile
    let targetMouthPucker = 0.0;
    let targetBrowRaise = 0.0;
    let targetHeadTiltX = 0.0;
    let targetHeadTiltY = 0.0;
    let visemeName = 'idle';

    // 1. Emotion Base
    switch (activeEmotion) {
      case 'happy':
        targetMouthSmile = 0.9;
        targetBrowRaise = 0.2;
        break;
      case 'sad':
        targetMouthSmile = -0.3; // frown
        targetBrowRaise = -0.15;
        break;
      case 'angry':
        targetMouthSmile = -0.1;
        targetBrowRaise = -0.4;
        break;
      case 'excited':
        targetMouthSmile = 1.0;
        targetMouthOpen = 0.35;
        targetBrowRaise = 0.3;
        break;
      case 'surprised':
        targetMouthOpen = 0.7;
        targetMouthPucker = 0.55;
        targetBrowRaise = 0.5;
        break;
      case 'wink':
        targetMouthSmile = 0.8;
        targetBrowRaise = 0.1;
        break;
    }

    // 2. Real-Time Speech Viseme Queue Overrides
    if (voiceActive && visemeQueue.length > 0) {
      const activeVis = visemeQueue.find(v => t >= v.time && t <= v.time + v.duration);
      if (activeVis) {
        targetMouthOpen = activeVis.mouthOpen;
        targetMouthSmile = activeVis.mouthSmile;
        targetMouthPucker = activeVis.mouthPucker;
        targetBrowRaise = activeVis.browRaise;
        targetHeadTiltX = activeVis.headTiltX;
        targetHeadTiltY = activeVis.headTiltY;
        visemeName = activeVis.name;
      }
    }

    // Call state feedback
    lipSyncFeedback(targetMouthOpen, targetMouthSmile, targetMouthPucker, visemeName);

    // Lerp facial targets
    const kFace = 0.25; // face tracking responsiveness
    if (leftEyeLid.current && rightEyeLid.current) {
      const blinkCycle = Math.sin(t * 3) > 0.96 ? 0.05 : 1.0;
      const winkFactorL = activeEmotion === 'wink' ? 0.05 : 1.0;
      
      leftEyeLid.current.scale.y = THREE.MathUtils.lerp(leftEyeLid.current.scale.y, blinkCycle * winkFactorL, kFace);
      rightEyeLid.current.scale.y = THREE.MathUtils.lerp(rightEyeLid.current.scale.y, blinkCycle, kFace);
    }
    
    if (leftBrow.current && rightBrow.current) {
      const lBrowY = 0.12 + targetBrowRaise * 0.08;
      const rBrowY = 0.12 + targetBrowRaise * 0.08;
      leftBrow.current.position.y = THREE.MathUtils.lerp(leftBrow.current.position.y, lBrowY, kFace);
      rightBrow.current.position.y = THREE.MathUtils.lerp(rightBrow.current.position.y, rBrowY, kFace);
      
      const lRot = targetBrowRaise < 0 ? -0.22 : 0;
      const rRot = targetBrowRaise < 0 ? 0.22 : 0;
      leftBrow.current.rotation.z = THREE.MathUtils.lerp(leftBrow.current.rotation.z, lRot, kFace);
      rightBrow.current.rotation.z = THREE.MathUtils.lerp(rightBrow.current.rotation.z, rRot, kFace);
    }

    if (mouth.current) {
      const yScale = 0.04 + targetMouthOpen * 0.14;
      const xScale = 0.12 * (1.0 - targetMouthPucker * 0.35);
      
      mouth.current.scale.set(
        THREE.MathUtils.lerp(mouth.current.scale.x, xScale, kFace),
        THREE.MathUtils.lerp(mouth.current.scale.y, yScale, kFace),
        0.04
      );
      mouth.current.position.y = THREE.MathUtils.lerp(mouth.current.position.y, -0.06 + targetMouthSmile * 0.015, kFace);
    }

    if (leftPupil.current && rightPupil.current) {
      const eyeSaccadeX = Math.sin(t * 0.8) * 0.012 + Math.cos(t * 2.3) * 0.005;
      const eyeSaccadeY = Math.sin(t * 1.5) * 0.008;
      leftPupil.current.position.set(-0.08 + eyeSaccadeX, eyeSaccadeY, 0.162);
      rightPupil.current.position.set(0.08 + eyeSaccadeX, eyeSaccadeY, 0.162);
    }

    // ==========================================
    // SKELETAL ANIMATION STATES
    // ==========================================
    let hipsY = 0;
    let hipsZ = 0;
    let hipsTiltZ = 0;
    let hipsTiltY = 0;

    const bMult = bounceAmp;
    const sMult = swayAmp;

    if (activeAnimation === 'walk') {
      const sw = Math.sin(cycle);
      const swF = Math.sin(cycle + Math.PI);
      const swDouble = Math.sin(cycle * 2);

      thighL.rotation.x = sw * 0.58;
      calfL.rotation.x = Math.max(0, -sw) * 0.44 + 0.1;
      footL.rotation.x = sw * 0.12;

      thighR.rotation.x = swF * 0.58;
      calfR.rotation.x = Math.max(0, -swF) * 0.44 + 0.1;
      footR.rotation.x = swF * 0.12;

      hipsY = (swDouble * 0.04 - 0.02) * bMult;
      hipsTiltZ = sw * 0.065 * bMult;
      hipsTiltY = -sw * 0.12 * bMult;
      hipsZ = sw * 0.04 * sMult;

      spine.rotation.x = 0.08 - swDouble * 0.02;
      spine.rotation.y = sw * 0.08;
      chest.rotation.z = -sw * 0.03;

      upperarmL.rotation.x = swF * 0.42;
      upperarmL.rotation.z = -0.15 + swDouble * 0.04;
      forearmL.rotation.x = 0.2 + Math.max(0, swF) * 0.35;

      upperarmR.rotation.x = sw * 0.42;
      upperarmR.rotation.z = 0.15 - swDouble * 0.04;
      forearmR.rotation.x = 0.2 + Math.max(0, sw) * 0.35;

      head.rotation.x = -0.05 + swDouble * 0.02 + targetHeadTiltX;
      head.rotation.y = -sw * 0.04 + targetHeadTiltY;

    } else if (activeAnimation === 'run') {
      const sw = Math.sin(cycle * 1.25);
      const swF = Math.sin(cycle * 1.25 + Math.PI);
      const swDouble = Math.sin(cycle * 2.5);

      thighL.rotation.x = sw * 0.95;
      calfL.rotation.x = Math.max(0, -sw) * 0.98 + 0.2;
      footL.rotation.x = sw * 0.25;

      thighR.rotation.x = swF * 0.95;
      calfR.rotation.x = Math.max(0, -swF) * 0.98 + 0.2;
      footR.rotation.x = swF * 0.25;

      hipsY = (swDouble * 0.095 - 0.04) * bMult;
      hipsTiltZ = sw * 0.14 * bMult;
      hipsTiltY = -sw * 0.25 * bMult;
      hipsZ = sw * 0.08 * sMult;

      spine.rotation.x = 0.26 - swDouble * 0.04;
      spine.rotation.y = sw * 0.15;

      upperarmL.rotation.x = swF * 0.8 - 0.2;
      upperarmL.rotation.z = -0.25;
      forearmL.rotation.x = 1.15;

      upperarmR.rotation.x = sw * 0.8 - 0.2;
      upperarmR.rotation.z = 0.25;
      forearmR.rotation.x = 1.15;

      head.rotation.x = -0.12 + swDouble * 0.045 + targetHeadTiltX;
      head.rotation.y = -sw * 0.08 + targetHeadTiltY;

    } else if (activeAnimation === 'dance') {
      const sw = Math.sin(cycle * 0.8);
      const swF = Math.sin(cycle * 0.8 + Math.PI);
      const doubleSw = Math.sin(cycle * 1.6);
      
      hipsY = (Math.abs(doubleSw) * 0.1 - 0.05) * bMult;
      hipsZ = sw * 0.18 * sMult;
      hipsTiltZ = sw * 0.25;
      hips.rotation.y = doubleSw * 0.2;

      thighL.rotation.x = Math.abs(sw) * 0.5;
      calfL.rotation.x = 0.45;
      thighR.rotation.x = Math.abs(swF) * 0.5;
      calfR.rotation.x = 0.45;

      upperarmL.rotation.z = -0.5 - Math.abs(sw) * 1.0;
      upperarmL.rotation.x = Math.sin(cycle * 1.2) * 0.5;
      forearmL.rotation.x = 0.6 + Math.sin(cycle * 2.4) * 0.4;

      upperarmR.rotation.z = 0.5 + Math.abs(swF) * 1.0;
      upperarmR.rotation.x = Math.cos(cycle * 1.2) * 0.5;
      forearmR.rotation.x = 0.6 + Math.cos(cycle * 2.4) * 0.4;

      head.rotation.z = -sw * 0.15;
      head.rotation.y = doubleSw * 0.1 + targetHeadTiltY;
      head.rotation.x = targetHeadTiltX;

    } else if (activeAnimation === 'jump') {
      const jumpTime = (cycle * 0.25) % Math.PI;
      const isUp = jumpTime > Math.PI * 0.15 && jumpTime < Math.PI * 0.85;

      if (!isUp) {
        const crouch = Math.sin(jumpTime * 2) * 0.35;
        hipsY = -crouch * 0.25;
        thighL.rotation.x = crouch;
        thighR.rotation.x = crouch;
        calfL.rotation.x = crouch * 1.2;
        calfR.rotation.x = crouch * 1.2;
        
        upperarmL.rotation.x = -crouch * 0.8;
        upperarmR.rotation.x = -crouch * 0.8;
      } else {
        const height = Math.sin((jumpTime - Math.PI*0.15) / 0.7 * Math.PI) * 0.6;
        hipsY = height * bMult;
        
        thighL.rotation.x = -0.15;
        thighR.rotation.x = -0.15;
        calfL.rotation.x = 0.5;
        calfR.rotation.x = 0.5;

        upperarmL.rotation.z = -2.1;
        upperarmR.rotation.z = 2.1;
      }

    } else if (activeAnimation === 'wave') {
      const breathe = Math.sin(t * 2.2);
      hipsY = breathe * 0.015;
      spine.rotation.x = 0.02 + breathe * 0.01;
      
      upperarmR.rotation.z = 1.35 + breathe * 0.05;
      upperarmR.rotation.x = -0.2;
      forearmR.rotation.z = Math.sin(t * 12.0) * 0.35;

      upperarmL.rotation.z = -0.15 + breathe * 0.02;
      forearmL.rotation.x = 0.1;

      head.rotation.z = -0.05 + Math.sin(t * 2.2) * 0.03 + targetHeadTiltY;
      head.rotation.x = targetHeadTiltX;

    } else if (activeAnimation === 'sad') {
      const slowBreathe = Math.sin(t * 1.4);
      hipsY = -0.04 + slowBreathe * 0.01;
      hipsTiltZ = Math.sin(cycle * 0.5) * 0.04 * bMult;

      spine.rotation.x = 0.32;
      chest.rotation.x = 0.16;
      neck.rotation.x = 0.12;
      head.rotation.x = 0.22 + targetHeadTiltX;
      head.rotation.y = targetHeadTiltY;

      upperarmL.rotation.x = 0.2;
      upperarmL.rotation.z = -0.08;
      forearmL.rotation.x = 0.15;
      
      upperarmR.rotation.x = 0.2;
      upperarmR.rotation.z = 0.08;
      forearmR.rotation.x = 0.15;

      const sw = Math.sin(cycle * 0.5);
      thighL.rotation.x = sw * 0.25;
      thighR.rotation.x = -sw * 0.25;
      calfL.rotation.x = 0.22;
      calfR.rotation.x = 0.22;

    } else if (activeAnimation === 'stomp') {
      const tap = Math.sin(t * 16) > 0.6 ? 0.35 : 0;
      thighR.rotation.x = -tap;
      footR.rotation.x = tap * 0.5;

      upperarmL.rotation.set(-0.2, 0.4, -0.6);
      forearmL.rotation.set(1.4, 0.3, 0);
      upperarmR.rotation.set(-0.2, -0.4, 0.6);
      forearmR.rotation.set(1.4, -0.3, 0);

      const breathe = Math.sin(t * 4.5);
      hipsY = breathe * 0.01;
      head.rotation.x = 0.08 + breathe * 0.025 + targetHeadTiltX;
      head.rotation.y = targetHeadTiltY;

    } else if (activeAnimation === 'float') {
      const bounce = Math.sin(t * 1.5);
      hipsY = (0.2 + bounce * 0.16) * bMult;
      hips.rotation.x = Math.sin(t * 0.8) * 0.1;
      hips.rotation.y = Math.cos(t * 0.6) * 0.12;
      hips.rotation.z = Math.sin(t * 0.5) * 0.08;

      spine.rotation.x = -0.05 + Math.sin(t * 1.2) * 0.03;
      
      upperarmL.rotation.set(-0.3 + Math.sin(t*0.9)*0.15, -0.2, -0.3 + Math.cos(t*0.7)*0.1);
      forearmL.rotation.x = 0.3 + Math.sin(t*1.4)*0.15;

      upperarmR.rotation.set(-0.3 + Math.cos(t*0.9)*0.15, 0.2, 0.3 + Math.sin(t*0.7)*0.1);
      forearmR.rotation.x = 0.3 + Math.cos(t*1.4)*0.15;

      thighL.rotation.x = -0.2 + Math.sin(t*0.85)*0.12;
      calfL.rotation.x = 0.4 + Math.cos(t*0.7)*0.15;

      thighR.rotation.x = -0.2 + Math.cos(t*0.85)*0.12;
      calfR.rotation.x = 0.4 + Math.sin(t*0.7)*0.15;

      head.rotation.set(
        Math.sin(t * 0.6) * 0.08 + targetHeadTiltX,
        Math.cos(t * 0.5) * 0.08 + targetHeadTiltY,
        0
      );
    }

    hips.position.y = hipsY;
    hips.position.z = hipsZ;
    hips.rotation.z = hipsTiltZ;
    hips.rotation.y += hipsTiltY;

    // ==========================================
    // SECONDARY MOTION & PHYSICS (HAIR JIGGLE)
    // ==========================================
    const currHipsPos = hips.position.clone().applyMatrix4(hips.matrixWorld);
    const displacement = new THREE.Vector3().subVectors(currHipsPos, prevHipsPos.current);
    const jStrength = jiggleStrength * 1.4;

    const bonesHair = [bones[19], bones[20], bones[21]];
    
    bonesHair.forEach((hairBone, idx) => {
      const state = hairPhysics.current[idx];
      const forceX = -displacement.y * 3.5 - Math.sin(cycle) * 0.03 * jStrength;
      const forceY = -displacement.x * 2.8;

      const kSpring = 0.12 / (stiffness + 0.1);
      const cDamp = 0.82;

      const accelX = forceX - state.rotX * kSpring;
      const accelY = forceY - state.rotY * kSpring;

      state.velX = (state.velX + accelX) * cDamp;
      state.velY = (state.velY + accelY) * cDamp;

      state.rotX += state.velX * jStrength;
      state.rotY += state.velY * jStrength;

      state.rotX = THREE.MathUtils.clamp(state.rotX, -0.4, 0.4);
      state.rotY = THREE.MathUtils.clamp(state.rotY, -0.3, 0.3);

      hairBone.rotation.x = state.rotX;
      hairBone.rotation.y = state.rotY;
    });

    prevHipsPos.current.copy(currHipsPos);
  });

  return (
    <group ref={groupRef} position={[0, -0.85, 0]} scale={1.85}>
      <primitive object={bones[0]} />

      <skinnedMesh 
        geometry={bodyGeometry} 
        skeleton={skeleton}
        castShadow 
        receiveShadow
      >
        <meshPhysicalMaterial
          color={custom.skinColor}
          roughness={0.58}
          clearcoat={0.18}
          clearcoatRoughness={0.5}
          sheen={0.7}
          sheenColor={new THREE.Color('#ffb366')}
          sheenRoughness={0.75}
        />
      </skinnedMesh>

      <skinnedMesh 
        geometry={clothesGeometries.shirtGeom} 
        skeleton={skeleton}
        castShadow 
        receiveShadow
      >
        <meshPhysicalMaterial
          color={custom.shirtColor}
          roughness={0.65}
          sheen={0.4}
        />
      </skinnedMesh>

      <skinnedMesh 
        geometry={clothesGeometries.pantsGeom} 
        skeleton={skeleton}
        castShadow 
        receiveShadow
      >
        <meshPhysicalMaterial
          color={custom.pantsColor}
          roughness={0.75}
          sheen={0.3}
        />
      </skinnedMesh>

      <mesh position={[-0.1, -0.85, 0.08]} scale={[0.1, 0.09, 0.16]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={custom.shoeColor} roughness={0.4} />
      </mesh>
      <mesh position={[0.1, -0.85, 0.08]} scale={[0.1, 0.09, 0.16]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={custom.shoeColor} roughness={0.4} />
      </mesh>

      {custom.backpack && (
        <mesh position={[0, 0.22, -0.18]} scale={[0.24, 0.38, 0.15]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color={custom.accentColor} roughness={0.5} clearcoat={0.2} />
        </mesh>
      )}

      {custom.handheld === 'pointer' && (
        <mesh position={[-0.45, 0.25, 0.2]} rotation={[0.4, 0.5, 0.4]} scale={[0.015, 0.8, 0.015]} castShadow>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.6} />
        </mesh>
      )}

      {custom.handheld === 'wand' && (
        <mesh position={[-0.38, 0.22, 0.25]} rotation={[0.4, 0.4, 0.3]} scale={[0.02, 0.5, 0.02]} castShadow>
          <cylinderGeometry args={[0.5, 1, 1, 8]} />
          <meshPhysicalMaterial color="#312e81" roughness={0.2} emissive="#6366f1" emissiveIntensity={0.6} />
        </mesh>
      )}

      {custom.handheld === 'shield' && (
        <mesh position={[-0.42, 0.25, 0.2]} rotation={[0, 1.2, 0]} scale={[0.04, 0.4, 0.3]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={custom.accentColor} metalness={0.8} roughness={0.2} />
        </mesh>
      )}

      {custom.handheld === 'clipboard' && (
        <mesh position={[-0.4, 0.2, 0.25]} rotation={[0.6, 0.8, -0.2]} scale={[0.2, 0.28, 0.02]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#78716c" roughness={0.5} />
        </mesh>
      )}

      {custom.handheld === 'books' && (
        <mesh position={[-0.38, 0.18, 0.22]} rotation={[0.5, 0.5, 0.5]} scale={[0.18, 0.12, 0.24]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} />
        </mesh>
      )}

      <group ref={faceGroup} position={[0, 0, 0]}>
        <mesh scale={[0.25, 0.25, 0.25]} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={custom.skinColor}
            roughness={0.58}
            sheen={0.7}
            sheenColor={new THREE.Color('#ffb366')}
          />
        </mesh>

        <mesh position={[-0.08, 0.02, 0.18]} scale={[0.05, 0.055, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>
        <mesh position={[0.08, 0.02, 0.18]} scale={[0.05, 0.055, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>

        <mesh ref={leftPupil} position={[-0.08, 0.02, 0.202]} scale={[0.022, 0.025, 0.015]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#111827" roughness={0.1} />
        </mesh>
        <mesh ref={rightPupil} position={[0.08, 0.02, 0.202]} scale={[0.022, 0.025, 0.015]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#111827" roughness={0.1} />
        </mesh>

        <mesh ref={leftEyeLid} position={[-0.08, 0.05, 0.185]} scale={[0.054, 0.06, 0.04]}>
          <sphereGeometry args={[1, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={custom.skinColor} roughness={0.58} />
        </mesh>
        <mesh ref={rightEyeLid} position={[0.08, 0.05, 0.185]} scale={[0.054, 0.06, 0.04]}>
          <sphereGeometry args={[1, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={custom.skinColor} roughness={0.58} />
        </mesh>

        <mesh ref={leftBrow} position={[-0.08, 0.12, 0.21]} scale={[0.038, 0.012, 0.015]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={custom.hairColor} roughness={0.7} />
        </mesh>
        <mesh ref={rightBrow} position={[0.08, 0.12, 0.21]} scale={[0.038, 0.012, 0.015]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={custom.hairColor} roughness={0.7} />
        </mesh>

        <mesh position={[0, -0.01, 0.215]} scale={[0.024, 0.024, 0.024]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={custom.skinColor} roughness={0.5} />
        </mesh>

        <mesh ref={mouth} position={[0, -0.06, 0.20]} scale={[0.12, 0.04, 0.04]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#be123c" roughness={0.4} />
        </mesh>

        <mesh position={[-0.13, -0.04, 0.18]} scale={[0.025, 0.012, 0.01]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#f43f5e" transparent opacity={0.4} roughness={1.0} />
        </mesh>
        <mesh position={[0.13, -0.04, 0.18]} scale={[0.025, 0.012, 0.01]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#f43f5e" transparent opacity={0.4} roughness={1.0} />
        </mesh>

        {custom.glasses !== 'none' && (
          <group position={[0, 0.02, 0.21]} scale={0.068}>
            <mesh position={[-1.15, 0, 0]}>
              <ringGeometry args={[0.7, 0.8, 24]} />
              <meshStandardMaterial color="#1e293b" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[1.15, 0, 0]}>
              <ringGeometry args={[0.7, 0.8, 24]} />
              <meshStandardMaterial color="#1e293b" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0]} scale={[0.4, 0.06, 0.06]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </group>
        )}

        {custom.headgear === 'crown' && (
          <group position={[0, 0.24, 0]} rotation={[-0.12, 0, 0]} scale={0.24}>
            <mesh castShadow>
              <cylinderGeometry args={[0.9, 0.7, 0.4, 8, 1, true]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.15, 0.7]} scale={0.06}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" />
            </mesh>
            <mesh position={[-0.5, 0.15, 0.5]} scale={0.06}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" />
            </mesh>
            <mesh position={[0.5, 0.15, 0.5]} scale={0.06}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#22c55e" emissive="#22c55e" />
            </mesh>
          </group>
        )}

        {custom.headgear === 'cap' && (
          <group position={[0, 0.22, -0.04]} rotation={[-0.1, 0, 0]} scale={0.26}>
            <mesh castShadow>
              <sphereGeometry args={[1, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color={custom.accentColor} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.02, 0.5]} rotation={[0.15, 0, 0]} scale={[0.8, 0.06, 0.6]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={custom.accentColor} roughness={0.6} />
            </mesh>
          </group>
        )}

        {custom.headgear === 'chefhat' && (
          <group position={[0, 0.25, 0]} scale={0.22}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.8, 0.8, 0.6, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.8, 0]} scale={0.9} castShadow>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          </group>
        )}

        {custom.headgear === 'wizard' && (
          <group position={[0, 0.24, 0]} rotation={[-0.1, 0, 0]} scale={0.28}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <coneGeometry args={[0.8, 1.8, 16]} />
              <meshStandardMaterial color="#312e81" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0]} scale={[1.2, 0.04, 1.2]} castShadow>
              <cylinderGeometry args={[1, 1, 1, 24]} />
              <meshStandardMaterial color="#312e81" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.8, 0.3]} scale={0.06}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#fcd34d" emissive="#fbbf24" emissiveIntensity={0.5} />
            </mesh>
          </group>
        )}

        {custom.headgear === 'helmet' && (
          <group position={[0, 0.02, 0.04]} scale={0.34}>
            <mesh castShadow>
              <sphereGeometry args={[1, 32, 32]} />
              <meshPhysicalMaterial 
                color="#06b6d4" 
                transparent 
                opacity={0.35} 
                roughness={0.1} 
                transmission={0.9} 
                ior={1.5}
                thickness={0.2}
              />
            </mesh>
            <mesh position={[0, -0.72, 0]} scale={[0.8, 0.15, 0.8]} castShadow>
              <cylinderGeometry args={[1, 1.1, 1, 20]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )}

        {custom.headgear !== 'helmet' && (
          <group>
            <mesh position={[0, 0.12, -0.06]} scale={[0.26, 0.23, 0.25]} rotation={[0.1, 0, 0]} castShadow>
              <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color={custom.hairColor} roughness={0.85} />
            </mesh>
            
            {custom.hairStyle === 'spiky' && (
              <group position={[0, 0.22, 0.08]} scale={0.05}>
                {[0, 1, 2, 3, 4].map(i => (
                  <mesh key={i} position={[Math.sin(i)*0.8 - 0.4, 0, -i*0.2]} rotation={[0.4, 0, i * 0.1]} castShadow>
                    <coneGeometry args={[0.5, 2.5, 4]} />
                    <meshStandardMaterial color={custom.hairColor} roughness={0.8} />
                  </mesh>
                ))}
              </group>
            )}

            {custom.hairStyle === 'curly' && (
              <group position={[0, 0.18, -0.1]} scale={0.045}>
                {[-1.5, -0.5, 0.5, 1.5].map((x, idx) => (
                  <mesh key={idx} position={[x, 0.8, idx * 0.1]} castShadow>
                    <sphereGeometry args={[1.1, 8, 8]} />
                    <meshStandardMaterial color={custom.hairColor} roughness={0.9} />
                  </mesh>
                ))}
              </group>
            )}

            {custom.hairStyle === 'long' && (
              <group position={[0, 0.02, -0.12]} scale={0.048}>
                <mesh position={[0, -2.4, 0.2]} scale={[4.5, 4.0, 1.5]} castShadow>
                  <sphereGeometry args={[1, 16, 16]} />
                  <meshStandardMaterial color={custom.hairColor} roughness={0.9} />
                </mesh>
              </group>
            )}

            {custom.hairStyle === 'ponytail' && (
              <group>
                <mesh position={[0, 0.1, -0.25]} scale={[0.05, 0.05, 0.05]}>
                  <sphereGeometry args={[1, 8, 8]} />
                  <meshStandardMaterial color={custom.accentColor} />
                </mesh>
              </group>
            )}
          </group>
        )}
      </group>
    </group>
  );
}

// ==========================================
// SCENE LIGHTING & EFFECTS
// ==========================================
interface SceneProps {
  custom: CharacterPreset;
  activeAnimation: string;
  activeEmotion: string;
  animSpeed: number;
  jiggleStrength: number;
  swayAmp: number;
  bounceAmp: number;
  stiffness: number;
  visemeQueue: QueuedViseme[];
  voiceActive: boolean;
  lipSyncFeedback: (open: number, smile: number, pucker: number, name: string) => void;
  bgTheme: string;
}

function Scene({
  custom,
  activeAnimation,
  activeEmotion,
  animSpeed,
  jiggleStrength,
  swayAmp,
  bounceAmp,
  stiffness,
  visemeQueue,
  voiceActive,
  lipSyncFeedback,
  bgTheme
}: SceneProps) {
  const rimColor = custom.accentColor;

  return (
    <>
      <ambientLight intensity={bgTheme === 'dark' ? 0.35 : 0.65} />
      <hemisphereLight args={['#ffffff', '#cbd5e1', bgTheme === 'dark' ? 0.25 : 0.45]} />
      
      <directionalLight
        position={[3, 5, 4]}
        intensity={bgTheme === 'dark' ? 1.0 : 1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      
      <pointLight 
        position={[-3, 1.8, -2.5]} 
        intensity={2.8} 
        color={rimColor} 
        distance={10} 
      />
      
      <pointLight 
        position={[2.5, -1, 3]} 
        intensity={0.5} 
        color="#ffffff" 
      />

      <RiggedCharacter
        custom={custom}
        activeAnimation={activeAnimation}
        activeEmotion={activeEmotion}
        animSpeed={animSpeed}
        jiggleStrength={jiggleStrength}
        swayAmp={swayAmp}
        bounceAmp={bounceAmp}
        stiffness={stiffness}
        visemeQueue={visemeQueue}
        voiceActive={voiceActive}
        lipSyncFeedback={lipSyncFeedback}
      />

      {bgTheme === 'grid' && (
        <gridHelper args={[12, 24, '#06b6d4', '#1e293b']} position={[0, -1.6, 0]} />
      )}

      <ContactShadows 
        position={[0, -1.6, 0]} 
        opacity={bgTheme === 'dark' ? 0.65 : 0.45} 
        scale={6} 
        blur={2.4} 
        far={4} 
        resolution={512} 
        color="#020617" 
      />
    </>
  );
}

// ==========================================
// MAIN STUDIO CLASS
// ==========================================
const DEFAULT_PRESET: CharacterPreset = {
  name: 'Leo',
  role: 'Student',
  description: 'Energetic campus student with a spiky hairstyle and backpack, ready for classes.',
  skinColor: '#ffd8b3',
  hairColor: '#4a3319',
  shirtColor: '#22c55e',
  pantsColor: '#475569',
  shoeColor: '#1e293b',
  hairStyle: 'spiky',
  headgear: 'cap',
  handheld: 'none',
  glasses: 'none',
  backpack: true,
  accentColor: '#22c55e',
};

export function Character3DStudio() {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('student');
  const [customPreset, setCustomPreset] = useState<CharacterPreset>({ ...DEFAULT_PRESET });
  
  // Animation / Emotion
  const [activeAnimation, setActiveAnimation] = useState<string>('walk');
  const [activeEmotion, setActiveEmotion] = useState<string>('happy');
  
  // Customizer sliders / params
  const [animSpeed, setAnimSpeed] = useState<number>(1.0);
  const [jiggleStrength, setJiggleStrength] = useState<number>(1.0);
  const [swayAmp, setSwayAmp] = useState<number>(1.0);
  const [bounceAmp, setBounceAmp] = useState<number>(1.0);
  const [stiffness, setStiffness] = useState<number>(0.5);

  // Background / Scene Theme
  const [bgTheme, setBgTheme] = useState<string>('dark');
  
  // Speech Voice Synthesis state
  const [speechText, setSpeechText] = useState<string>("Hi! I am Leo, your custom animated character. Watch my lips move as I speak to you!");
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [visemeQueue, setVisemeQueue] = useState<QueuedViseme[]>([]);
  const speechUtt = useRef<SpeechSynthesisUtterance | null>(null);

  // Real-time lip-sync statistics for HUD
  const [hudMouthOpen, setHudMouthOpen] = useState<number>(0);
  const [hudMouthSmile, setHudMouthSmile] = useState<number>(0.5);
  const [hudMouthPucker, setHudMouthPucker] = useState<number>(0);
  const [hudVisemeName, setHudVisemeName] = useState<string>('idle');

  // Active Customizer Tab
  const [activeTab, setActiveTab] = useState<'preset' | 'face' | 'clothes' | 'physics' | 'speech'>('preset');

  // Sync preset selection
  const handlePresetSelect = (key: string) => {
    setSelectedPresetKey(key);
    const newPreset = PRESETS[key] || DEFAULT_PRESET;
    setCustomPreset({ ...newPreset });
    setSpeechText(`Hello there! I'm ${newPreset.name}, representing the ${newPreset.role} role. Let's explore together!`);
  };

  // Perform speech synthesised phrase with lip-sync viseme scheduling
  const handleSpeak = () => {
    if (!speechText) return;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setVoiceActive(false);
      
      const utterance = new SpeechSynthesisUtterance(speechText);
      speechUtt.current = utterance;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                              voices.find(v => v.lang.startsWith('en')) || 
                              voices[0];
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => {
        const now = performance.now() / 1000;
        const queue = textToVisemes(speechText, now);
        setVisemeQueue(queue);
        setVoiceActive(true);
      };
      
      utterance.onend = () => {
        setVoiceActive(false);
        setVisemeQueue([]);
      };
      
      utterance.onerror = () => {
        setVoiceActive(false);
        setVisemeQueue([]);
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const now = performance.now() / 1000;
          const remainingText = speechText.substring(event.charIndex);
          const localQueue = textToVisemes(remainingText, now);
          setVisemeQueue(prev => {
            const passed = prev.filter(v => v.time < now);
            return [...passed, ...localQueue];
          });
        }
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis is not supported in this browser. Procedural mouth mouth movements will still display.");
    }
  };

  const lastHudUpdate = useRef(0);
  const lipSyncFeedback = (open: number, smile: number, pucker: number, name: string) => {
    const now = performance.now();
    if (now - lastHudUpdate.current > 60) {
      setHudMouthOpen(open);
      setHudMouthSmile(smile);
      setHudMouthPucker(pucker);
      setHudVisemeName(name);
      lastHudUpdate.current = now;
    }
  };

  const handleReset = () => {
    const preset = PRESETS[selectedPresetKey] || DEFAULT_PRESET;
    setCustomPreset({ ...preset });
    setAnimSpeed(1.0);
    setJiggleStrength(1.0);
    setSwayAmp(1.0);
    setBounceAmp(1.0);
    setStiffness(0.5);
  };

  const getBgClass = () => {
    switch (bgTheme) {
      case 'light':
        return 'bg-gradient-to-tr from-slate-100 via-blue-50 to-white text-slate-800 border-slate-200';
      case 'grid':
        return 'bg-slate-950 text-white border-cyan-950';
      case 'sunset':
        return 'bg-gradient-to-b from-amber-950 via-rose-950 to-slate-950 text-amber-50 border-rose-950';
      case 'dark':
      default:
        return 'bg-gradient-to-b from-stone-900 via-stone-950 to-black text-stone-100 border-stone-800';
    }
  };

  return (
    <div className={`w-full min-h-[calc(100vh-140px)] rounded-3xl border flex flex-col md:flex-row overflow-hidden shadow-2xl transition-all duration-500 ${getBgClass()}`}>
      
      {/* 3D RENDER CANVAS PANEL */}
      <div className="flex-1 min-h-[460px] md:h-auto relative flex flex-col justify-between p-6 overflow-hidden">
        
        {/* HUD Overlay Stats (Top Left) */}
        <div className="absolute top-6 left-6 z-10 space-y-2 pointer-events-none">
          <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${voiceActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[11px] font-mono tracking-wider font-bold uppercase">
              {voiceActive ? `TTS Playing: Viseme [ ${hudVisemeName.toUpperCase()} ]` : 'Speech Idle'}
            </span>
          </div>

          <div className="px-4 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-mono space-y-1">
            <div className="text-white/40 uppercase text-[9px] mb-1 font-bold">Mouth Rig Real-time</div>
            <div className="flex justify-between gap-4">
              <span>Aperture:</span>
              <span className="text-cyan-400 font-bold">{hudMouthOpen.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Smile/Frown:</span>
              <span className={`font-bold ${hudMouthSmile > 0.5 ? 'text-green-400' : 'text-rose-400'}`}>{hudMouthSmile.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Pucker:</span>
              <span className="text-yellow-400 font-bold">{hudMouthPucker.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* HUD Camera instructions (Top Right) */}
        <div className="absolute top-6 right-6 z-10 pointer-events-none">
          <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 text-[10px] font-medium text-white/60 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Drag to rotate • Scroll to zoom</span>
          </div>
        </div>

        {/* THE 3D CANVAS PORT */}
        <div className="w-full h-full absolute inset-0 z-0">
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 0.4, 3.4], fov: 40 }}
          >
            <Scene
              custom={customPreset}
              activeAnimation={activeAnimation}
              activeEmotion={activeEmotion}
              animSpeed={animSpeed}
              jiggleStrength={jiggleStrength}
              swayAmp={swayAmp}
              bounceAmp={bounceAmp}
              stiffness={stiffness}
              visemeQueue={visemeQueue}
              voiceActive={voiceActive}
              lipSyncFeedback={lipSyncFeedback}
              bgTheme={bgTheme}
            />
            <OrbitControls 
              enablePan={false} 
              minDistance={1.8} 
              maxDistance={5.0} 
              target={[0, 0.2, 0]}
              maxPolarAngle={Math.PI / 2 + 0.1}
            />
          </Canvas>
        </div>

        {/* BOTTOM HUD / SCENE ACCENT CONTROLLER */}
        <div className="z-10 mt-auto flex justify-between items-end gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold font-serif">{customPreset.name}</h2>
            <p className="text-xs text-white/50">{customPreset.role} • Custom 3D Skinned Skeleton</p>
          </div>
          
          <div className="flex gap-1.5 p-1 bg-black/30 backdrop-blur-lg rounded-xl border border-white/10">
            {['dark', 'light', 'grid', 'sunset'].map(theme => (
              <button
                key={theme}
                onClick={() => setBgTheme(theme)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase transition-all ${
                  bgTheme === theme ? 'bg-white text-slate-900 shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* DASHBOARD CONFIGURATION SIDEBAR */}
      <div className="w-full md:w-[440px] border-t md:border-t-0 md:border-l border-white/10 bg-white/5 backdrop-blur-xl flex flex-col p-6 space-y-6 max-h-[800px] md:max-h-none overflow-y-auto">
        
        <div className="flex justify-between items-center pb-4 border-b border-white/15">
          <div>
            <h1 className="text-lg font-black tracking-wide uppercase flex items-center gap-2 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              Character Studio
            </h1>
            <p className="text-xs text-white/40 font-medium">Procedural Skeletal Skinning Lab</p>
          </div>
          <button
            onClick={handleReset}
            className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl border border-white/10 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Reset Settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1 p-1 bg-black/25 rounded-2xl border border-white/5">
          {[
            { id: 'preset', label: 'Preset', icon: Award },
            { id: 'face', label: 'Face', icon: Smile },
            { id: 'clothes', label: 'Outfit', icon: Palette },
            { id: 'physics', label: 'Physics', icon: Activity },
            { id: 'speech', label: 'Speech', icon: Volume2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[9px] font-bold tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-5">
          
          {activeTab === 'preset' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                Select Character Blueprint
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(PRESETS).map(key => {
                  const p = PRESETS[key];
                  const isSelected = selectedPresetKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handlePresetSelect(key)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                        isSelected 
                          ? 'border-cyan-500/80 bg-cyan-500/10 shadow-lg shadow-cyan-950/20' 
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="font-serif text-sm font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-white/50">{p.role}</div>
                      
                      <div className="flex gap-1 mt-2.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.skinColor }} />
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.hairColor }} />
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.shirtColor }} />
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                <div className="text-[11px] font-bold text-cyan-400 uppercase">Configuration Specs</div>
                <p className="text-xs text-white/70 leading-relaxed">{customPreset.description}</p>
              </div>
            </div>
          )}

          {activeTab === 'face' && (
            <div className="space-y-5">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-cyan-400" />
                  Emotional Face Expression
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {['happy', 'sad', 'angry', 'excited', 'surprised', 'wink'].map(emo => (
                    <button
                      key={emo}
                      onClick={() => setActiveEmotion(emo)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border capitalize transition-all ${
                        activeEmotion === emo
                          ? 'border-cyan-500 bg-cyan-500/10 text-white'
                          : 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t border-white/10">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Hair & Eye Customization</h3>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase font-mono">Hair Style</label>
                  <div className="flex flex-wrap gap-2">
                    {['short', 'spiky', 'curly', 'long', 'ponytail'].map(style => (
                      <button
                        key={style}
                        onClick={() => setCustomPreset(prev => ({ ...prev, hairStyle: style as any }))}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border capitalize transition-all ${
                          customPreset.hairStyle === style
                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                            : 'border-white/10 text-white/60 hover:bg-white/5'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase font-mono">Eyewear (Glasses)</label>
                  <div className="flex gap-2">
                    {['none', 'round', 'square'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setCustomPreset(prev => ({ ...prev, glasses: opt as any }))}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border capitalize transition-all ${
                          customPreset.glasses === opt
                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                            : 'border-white/10 text-white/60 hover:bg-white/5'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clothes' && (
            <div className="space-y-5">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Accessories</h3>
                
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 uppercase font-mono">Headwear / Hats</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['none', 'cap', 'crown', 'chefhat', 'wizard', 'helmet'].map(hat => (
                        <button
                          key={hat}
                          onClick={() => setCustomPreset(prev => ({ ...prev, headgear: hat as any }))}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border capitalize transition-all ${
                            customPreset.headgear === hat
                              ? 'border-cyan-500 bg-cyan-500/10 text-white'
                              : 'border-white/10 text-white/60 hover:bg-white/5'
                          }`}
                        >
                          {hat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] text-white/40 uppercase font-mono">Handheld Items</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['none', 'pointer', 'wand', 'shield', 'clipboard', 'books'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomPreset(prev => ({ ...prev, handheld: item as any }))}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border capitalize transition-all ${
                            customPreset.handheld === item
                              ? 'border-cyan-500 bg-cyan-500/10 text-white'
                              : 'border-white/10 text-white/60 hover:bg-white/5'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 pt-3 border-t border-white/10">
                    <span className="text-xs font-bold text-white/70">Equip Backpack Bag</span>
                    <button
                      onClick={() => setCustomPreset(prev => ({ ...prev, backpack: !prev.backpack }))}
                      className={`px-4 py-1.5 text-xs font-black rounded-lg border transition-all ${
                        customPreset.backpack
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {customPreset.backpack ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  Color Palette Editor
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-white/40 flex justify-between">
                      <span>Skin tone</span>
                      <span className="font-bold text-white/70">{customPreset.skinColor}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customPreset.skinColor} 
                        onChange={(e) => setCustomPreset(prev => ({ ...prev, skinColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg overflow-hidden border-none bg-transparent cursor-pointer"
                      />
                      <div className="flex-1 flex gap-1">
                        {['#ffd8b3', '#ffe0c2', '#ffd2a1', '#fcd34d', '#e0a87c'].map(c => (
                          <button 
                            key={c} 
                            onClick={() => setCustomPreset(prev => ({ ...prev, skinColor: c }))} 
                            className="w-4 h-4 rounded-full border border-white/20" 
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-white/40 flex justify-between">
                      <span>Hair Tint</span>
                      <span className="font-bold text-white/70">{customPreset.hairColor}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customPreset.hairColor} 
                        onChange={(e) => setCustomPreset(prev => ({ ...prev, hairColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg overflow-hidden border-none bg-transparent cursor-pointer"
                      />
                      <div className="flex-1 flex gap-1">
                        {['#1a1a1a', '#4a3319', '#d97706', '#e2e8f0', '#3b2314'].map(c => (
                          <button 
                            key={c} 
                            onClick={() => setCustomPreset(prev => ({ ...prev, hairColor: c }))} 
                            className="w-4 h-4 rounded-full border border-white/20" 
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-white/40 flex justify-between">
                      <span>Shirt / Upper</span>
                      <span className="font-bold text-white/70">{customPreset.shirtColor}</span>
                    </label>
                    <input 
                      type="color" 
                      value={customPreset.shirtColor} 
                      onChange={(e) => setCustomPreset(prev => ({ ...prev, shirtColor: e.target.value }))}
                      className="w-full h-8 rounded-lg overflow-hidden border-none bg-transparent cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-white/40 flex justify-between">
                      <span>Trousers / Lower</span>
                      <span className="font-bold text-white/70">{customPreset.pantsColor}</span>
                    </label>
                    <input 
                      type="color" 
                      value={customPreset.pantsColor} 
                      onChange={(e) => setCustomPreset(prev => ({ ...prev, pantsColor: e.target.value }))}
                      className="w-full h-8 rounded-lg overflow-hidden border-none bg-transparent cursor-pointer"
                    />
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === 'physics' && (
            <div className="space-y-5">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Skeletal Motion Sequence
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'walk', label: '🚶 Walk' },
                    { id: 'run', label: '🏃 Run' },
                    { id: 'dance', label: '🕺 Hip Hop' },
                    { id: 'jump', label: '🦘 High Jump' },
                    { id: 'wave', label: '👋 Friendly Wave' },
                    { id: 'sad', label: '🥱 Sad Slouch' },
                    { id: 'stomp', label: '😠 Impatient Stomp' },
                    { id: 'float', label: '🌌 Space Float' }
                  ].map(anim => (
                    <button
                      key={anim.id}
                      onClick={() => setActiveAnimation(anim.id)}
                      className={`py-3 px-4 text-xs font-bold text-left rounded-xl border transition-all ${
                        activeAnimation === anim.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-white'
                          : 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {anim.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Physics Properties</h3>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Animation Speed</span>
                    <span className="font-mono text-cyan-400 font-bold">{animSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={animSpeed}
                    onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Body Bob (Vertical)</span>
                    <span className="font-mono text-cyan-400 font-bold">x{bounceAmp.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={bounceAmp}
                    onChange={(e) => setBounceAmp(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Body Sway (Lateral)</span>
                    <span className="font-mono text-cyan-400 font-bold">x{swayAmp.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={swayAmp}
                    onChange={(e) => setSwayAmp(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Hair Inertial Jiggle</span>
                    <span className="font-mono text-cyan-400 font-bold">x{jiggleStrength.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={jiggleStrength}
                    onChange={(e) => setJiggleStrength(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Joint Lag (Spring stiffness)</span>
                    <span className="font-mono text-cyan-400 font-bold">{(stiffness * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={stiffness}
                    onChange={(e) => setStiffness(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

              </div>

            </div>
          )}

          {activeTab === 'speech' && (
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Text-To-Speech Performance
              </h3>

              <div className="space-y-3">
                <label className="text-xs text-white/60 leading-relaxed block">
                  Write down a phrase or sentence below. Clicking "Perform speech" will synthesise the voice and schedule the facial rig deformers to speak in real-time.
                </label>
                
                <textarea
                  value={speechText}
                  onChange={(e) => setSpeechText(e.target.value)}
                  className="w-full h-24 p-3.5 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/80 leading-relaxed resize-none"
                  placeholder="Type speech here..."
                />

                <button
                  onClick={handleSpeak}
                  disabled={voiceActive || !speechText}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border shadow-lg transition-all ${
                    voiceActive
                      ? 'bg-green-500/10 border-green-500 text-green-400 cursor-not-allowed animate-pulse'
                      : 'bg-gradient-to-b from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-cyan-400'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {voiceActive ? 'Speaking Phrase...' : 'Speak & Perform'}
                </button>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 text-xs">
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">How Lip-Sync Works</div>
                <p className="text-white/60 leading-relaxed">
                  Our system breaks words down phonetically into <strong className="text-cyan-400">visemes</strong> (shapes like open, smile, pucker, teeth-touch). Using SpeechSynthesis, it tracks word boundaries to adjust target weights dynamically in the 3D vertex bones.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
