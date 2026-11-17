import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { StandeeSafe, Turntable } from "./Stage3D.jsx";
import { ItemModel, hasModel, Showcase } from "./Models3D.jsx";

function Sway({ children }) {
  const g = useRef(), t = useRef(0);
  useFrame((_, dt) => { t.current += dt; if (g.current) g.current.rotation.y = Math.sin(t.current * 0.7) * 0.5; });
  return <group ref={g}>{children}</group>;
}

export default function Viewer3D({ src, lot }) {
  const model = hasModel(lot);
  return (
    <div className="viewer3d">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.2, 6.6], fov: 35 }}>
        <color attach="background" args={["#f5f5f7"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} castShadow />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2} position={[0, 3, 4]} scale={[6, 2, 1]} />
          <Lightformer form="rect" intensity={1} position={[-4, 2, -2]} scale={[3, 3, 1]} />
          <Lightformer form="rect" intensity={1} position={[4, 2, -2]} scale={[3, 3, 1]} />
        </Environment>
        {model ? <Suspense fallback={null}><Showcase l={lot} speed={0.35}><ItemModel l={lot} /></Showcase></Suspense> : <Sway><StandeeSafe src={src} height={2.3} /></Sway>}
        <Turntable radius={1.5} />
        <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={8} blur={2.6} far={3} />
        <OrbitControls target={[0, 0.9, 0]} {...(model ? {} : { minAzimuthAngle: -1.1, maxAzimuthAngle: 1.1 })} enablePan={false} minDistance={3.2} maxDistance={8} minPolarAngle={0.6} maxPolarAngle={1.62} />
      </Canvas>
      {model && <p className="v3d-note">Representative 3D model for this category · a seller scan gives an exact replica</p>}
    </div>
  );
}
