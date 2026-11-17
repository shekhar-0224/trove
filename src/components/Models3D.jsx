import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { modelFor } from "../lib/models.js";
export { hasModel } from "../lib/models.js";

// Real, artist-made 3D models (glTF), auto-fitted to the turntable. Only categories with a faithful model get 3D;
// everything else stays as photos. A seller scan (GLB) would slot in the same way for an exact replica.
function Fitted({ url, size, anim }) {
  const { scene, animations } = useGLTF(url);
  const root = useMemo(() => {
    const s = scene.clone(true);
    s.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box = new THREE.Box3().setFromObject(s), dim = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const k = size / Math.max(dim.x, dim.y, dim.z);
    const g = new THREE.Group(); s.position.set(-c.x, -box.min.y, -c.z); g.add(s); g.scale.setScalar(k);
    return g;
  }, [scene, size]);
  const ref = useRef();
  const { actions } = useAnimations(animations, ref);
  useEffect(() => { const a = anim && actions[anim]; if (a) { a.reset().fadeIn(0.3).play(); return () => a.fadeOut(0.2); } }, [actions, anim]);
  return <group ref={ref}><primitive object={root} /></group>;
}

export function ItemModel({ l }) {
  const m = modelFor(l);
  if (!m) return null;
  return <group position={[0, 0.06, 0]} rotation={m.rot || [0, 0, 0]}><Fitted url={m.url} size={m.size} anim={m.anim} /></group>;
}

// Pops the item in when the lot changes, then turns it a full 360°.
export function Showcase({ l, speed = 0.45, children }) {
  const g = useRef(), born = useRef(performance.now()), last = useRef(l?.lot_id);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (last.current !== l?.lot_id) { last.current = l?.lot_id; born.current = performance.now(); }
    g.current.rotation.y += dt * speed;
    const t = Math.min(1, (performance.now() - born.current) / 750), e = 1 - Math.pow(1 - t, 3);
    g.current.scale.setScalar(0.55 + 0.45 * e);
    g.current.position.y = (1 - e) * -0.4;
  });
  return <group ref={g}>{children}</group>;
}

