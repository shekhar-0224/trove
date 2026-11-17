import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { StandeeSafe, Turntable } from "./Stage3D.jsx";
import { ItemModel, hasModel, Showcase } from "./Models3D.jsx";

// Frames the item: pushes it right on wide screens (the lot panel sits bottom-left) and pulls back on narrow ones.
function useFraming() {
  const { size } = useThree();
  const aspect = size.width / size.height;
  return { x: 0, dist: aspect < 0.8 ? 9.2 : aspect < 1.15 ? 7.0 : 6.0, look: aspect < 0.8 ? -0.6 : 1.0 };
}
function Rig() {
  const t = useRef(0);
  const { x, dist, look } = useFraming();
  useFrame(({ camera }, dt) => {
    t.current += dt;
    camera.position.x = x * 0.55 + Math.sin(t.current * 0.18) * 0.5;
    camera.position.y = 1.8 + Math.sin(t.current * 0.23) * 0.08;
    camera.position.z = dist;
    camera.lookAt(x * 0.55, look, 0);
  });
  return null;
}

// Sways the item side to side so the photo always faces the room (a full spin would show its thin edge).
function Spinner({ children }) {
  const g = useRef(), t = useRef(0);
  const { x } = useFraming();
  useFrame((_, dt) => { t.current += dt; if (g.current) g.current.rotation.y = Math.sin(t.current * 0.6) * 0.55; });
  return <group position={[x, 0, 0]}><group ref={g}>{children}</group></group>;
}

function Framed({ children }) { const { x } = useFraming(); return <group position={[x, 0, 0]}>{children}</group>; }

// The live studio: curved backdrop, lit turntable, the current lot slowly turning.
export default function Studio3D({ src, lot, pulse }) {
  const model = hasModel(lot);
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.7, 5.6], fov: 34 }}>
      <color attach="background" args={["#ebebef"]} />
      <fog attach="fog" args={["#ebebef", 9, 18]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[2.5, 6, 3]} angle={0.45} penumbra={0.8} intensity={60} castShadow color="#fff4ea" />
      <spotLight position={[-3, 4, 2]} angle={0.5} penumbra={1} intensity={25} color="#e6efff" />
      <Environment resolution={256}>
        <Lightformer form="ring" intensity={3} position={[0, 2.5, 5]} scale={2.2} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 2, 0]} scale={[2, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[5, 2, 0]} scale={[2, 4, 1]} />
      </Environment>
      {/* cyclorama */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#efeff3" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, -6]} >
        <cylinderGeometry args={[12, 12, 14, 64, 1, true, Math.PI * 0.75, Math.PI * 0.5]} />
        <meshStandardMaterial color="#e9e9ee" side={2} roughness={1} />
      </mesh>
      <Framed><Turntable radius={1.7} pulse={pulse} /></Framed>
      {model ? <Framed><Suspense fallback={null}><Showcase l={lot} speed={0.5}><ItemModel l={lot} /></Showcase></Suspense></Framed> : <Spinner><StandeeSafe src={src} height={2.3} /></Spinner>}
      <ContactShadows position={[0, 0.07, 0]} frames={1} opacity={0.4} scale={7} blur={2.4} far={3} />
      <Rig />
    </Canvas>
  );
}
