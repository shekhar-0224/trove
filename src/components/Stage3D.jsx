import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// A photo mounted on a display block, the shared building block of the 3D viewer and the live studio.
export function Standee({ src, height = 2.2, spin = 0, intro = true }) {
  const tex = useLoader(THREE.TextureLoader, src);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const aspect = tex.image ? tex.image.width / tex.image.height : 0.8;
  const w = height * aspect, d = 0.12;
  const g = useRef();
  const born = useRef(performance.now());
  useEffect(() => { born.current = performance.now(); }, [src]);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (spin) g.current.rotation.y += dt * spin;
    if (intro) {
      const t = Math.min(1, (performance.now() - born.current) / 700);
      const e = 1 - Math.pow(1 - t, 3);
      g.current.scale.setScalar(0.6 + 0.4 * e);
      g.current.position.y = height / 2 + 0.06 - (1 - e) * 0.6;
    }
  });
  return (
    <group ref={g} position={[0, height / 2 + 0.06, 0]}>
      <RoundedBox args={[w + 0.08, height + 0.08, d]} radius={0.05} smoothness={4}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.25} clearcoat={1} clearcoatRoughness={0.15} />
      </RoundedBox>
      <mesh position={[0, 0, d / 2 + 0.002]}>
        <planeGeometry args={[w, height]} />
        <meshStandardMaterial map={tex} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, -d / 2 - 0.002]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, height]} />
        <meshStandardMaterial map={tex} roughness={0.55} color="#d9d9de" />
      </mesh>
    </group>
  );
}

export function Turntable({ radius = 1.6, pulse = 0 }) {
  const ring = useRef(), last = useRef(-1), t0 = useRef(0);
  useFrame(() => {
    if (!ring.current) return;
    if (pulse !== last.current) { last.current = pulse; t0.current = performance.now(); }
    const t = Math.min(1, (performance.now() - t0.current) / 900);
    ring.current.scale.setScalar(1 + t * 0.9);
    ring.current.material.opacity = (1 - t) * 0.55;
  });
  return (
    <group>
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius, radius * 1.03, 0.06, 96]} />
        <meshPhysicalMaterial color="#f2f2f4" roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.065, 0]}>
        <ringGeometry args={[radius * 0.98, radius * 1.02, 96]} />
        <meshBasicMaterial color="#ff6a3d" transparent opacity={0} />
      </mesh>
    </group>
  );
}

export class Safe extends Component {
  constructor(p) { super(p); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidUpdate(prev) { if (prev.k !== this.props.k && this.state.err) this.setState({ err: false }); }
  render() { return this.state.err ? (this.props.fallback ?? null) : this.props.children; }
}

export function StandeeSafe(props) {
  const fb = useMemo(() => (
    <mesh position={[0, 1.15, 0]}><boxGeometry args={[1.6, 2.2, 0.12]} /><meshStandardMaterial color="#e9e9ee" /></mesh>
  ), []);
  return <Safe k={props.src} fallback={fb}><Suspense fallback={fb}><Standee {...props} /></Suspense></Safe>;
}
