import { useEffect, useState } from "react";
import { lotImg } from "./LotCard.jsx";

// The Trove loader: a chest opens, light spills out, and today's finds rise out of it.
export default function Loader({ lots, interests, onDone }) {
  const picks = (interests.length ? lots.filter(l => interests.includes(l.category)) : lots).slice(0, 5);
  const finds = picks.length >= 5 ? picks : lots.slice(0, 5);
  const lines = ["Opening the vault", `Checking ${lots.length * 83} lots for you`, "Lining up today's auctions", "Found something special"];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ids = lines.map((_, i) => setTimeout(() => setStep(i), i * (reduce ? 250 : 800)));
    const done = setTimeout(onDone, reduce ? 1100 : 3600);
    return () => { ids.forEach(clearTimeout); clearTimeout(done); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="loader" onClick={onDone} role="progressbar" aria-label="Loading Trove">
      <div className="chest-scene">
        <div className="beam" />
        <div className="finds">
          {finds.map((l, i) => (
            <div className="find" style={{ "--i": i, "--n": finds.length }} key={l.lot_id}>
              <img src={lotImg(l, 240, 300)} alt="" />
            </div>
          ))}
        </div>
        <div className="chest">
          <div className="lid"><div className="lid-top" /><div className="lid-front" /></div>
          <div className="box"><div className="lock" /></div>
        </div>
        <div className="floor-shadow" />
      </div>
      <div className="loader-copy">
        <div className="wordmark">trove</div>
        <div className="loader-line" key={step}>{lines[step]}<span className="dots"><i>.</i><i>.</i><i>.</i></span></div>
        <div className="loader-bar"><b /></div>
      </div>
      <span className="skip">Tap to skip</span>
    </div>
  );
}
