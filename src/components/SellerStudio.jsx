import { useEffect, useRef, useState } from "react";
import { lotImg } from "./LotCard.jsx";
import { eur } from "../lib/format.js";

// Seller side of live: camera check, pick the lots to run, name the show, go live.
export default function SellerStudio({ lots, onCancel, onStart }) {
  const video = useRef(null);
  const [stream, setStream] = useState(null);
  const [camErr, setCamErr] = useState("");
  const [title, setTitle] = useState("My first live auction");
  const [picked, setPicked] = useState(() => lots.slice(0, 5).map(l => l.lot_id));
  const streamRef = useRef(null);

  const startCam = async () => {
    setCamErr("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      streamRef.current = s; setStream(s);
    } catch {
      setCamErr("Camera isn't available. Allow camera access in your browser, or go live with the 3D studio instead.");
    }
  };
  useEffect(() => { if (video.current && stream) video.current.srcObject = stream; }, [stream]);
  useEffect(() => () => { if (streamRef.current && !streamRef.current.__handedOff) streamRef.current.getTracks().forEach(t => t.stop()); }, []);

  const toggle = id => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  const chosen = lots.filter(l => picked.includes(l.lot_id));
  const go = () => {
    if (stream) stream.__handedOff = true;
    onStart({ id: "show-you", seller: "you", own: true, title: title.trim() || "Live auction", lots: chosen.map(l => ({ ...l, live: true })), viewers: 40, stream });
  };

  return (
    <main className="wrap studio">
      <button className="link back" onClick={onCancel}>← Back to live shows</button>
      <h1>Go live</h1>
      <p className="muted">Show your items on camera, run them one by one, and let the room bid. This prototype runs the room on your device; the audience is simulated.</p>
      <div className="studio-grid">
        <div className="cam">
          {stream ? <video ref={video} autoPlay playsInline muted /> : (
            <div className="cam-empty">
              <p>Check your camera and lighting before you start.</p>
              <button className="btn primary" onClick={startCam}>Turn on camera</button>
              {camErr && <p className="err small">{camErr}</p>}
            </div>
          )}
        </div>
        <div className="studio-side">
          <label className="field"><span>Show title</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} /></label>
          <div className="field"><span>Lots to run ({chosen.length})</span>
            <div className="pick-grid">
              {lots.slice(0, 24).map(l => (
                <button key={l.lot_id} className="pick-lot" aria-pressed={picked.includes(l.lot_id)} onClick={() => toggle(l.lot_id)} title={l.title}>
                  <img src={lotImg(l, 160, 200)} alt="" /><small>{eur(l.estimate_low)}</small>
                </button>
              ))}
            </div>
          </div>
          <button className="btn primary go" disabled={!chosen.length} onClick={go}>{stream ? "Go live with camera" : "Go live with 3D studio"}</button>
          <p className="muted small">Tip: lots imported with the Trove template show up here as your inventory.</p>
        </div>
      </div>
    </main>
  );
}
