import { useEffect, useState } from "react";
import { LOT_FIELDS } from "../data/schema.js";
import { importLots } from "../lib/importer.js";

export default function ImportSheet({ onClose, onLoad, onSample }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState(null);
  const [showFields, setShowFields] = useState(false);
  useEffect(() => { const k = e => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);

  const ingest = (raw, label) => {
    try {
      const { lots, warnings } = importLots(raw);
      if (!lots.length) { setMsg({ err: true, text: "No lots found. Each row needs at least a title." }); return; }
      if (warnings.length) setMsg({ text: `Loaded. Some rows are missing: ${warnings.join(", ")}. Add them for better ranking and lot pages.` });
      onLoad(lots, label);
    } catch {
      setMsg({ err: true, text: "That isn't valid JSON or CSV. Export as JSON or CSV and try again." });
    }
  };
  const onFile = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => ingest(String(rd.result), f.name); rd.readAsText(f); e.target.value = ""; };

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="import" role="dialog" aria-modal="true" aria-labelledby="impT" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="impT">Import your lots</h2>
        <p className="muted">Bring a CSV or JSON export. Use the Trove template for the best lot pages; common scraper exports (like Apify) are recognised too. Files are read on this device only.</p>
        <div className="row">
          <label className="btn primary" htmlFor="impFile">Choose file</label>
          <input id="impFile" type="file" accept=".csv,.json,text/csv,application/json" hidden onChange={onFile} />
          <a className="btn quiet" href="/trove-lot-template.csv" download>Download template</a>
          <button className="btn quiet" onClick={onSample}>Use sample catalog</button>
        </div>
        <textarea rows="5" value={text} onChange={e => setText(e.target.value)} placeholder="Or paste CSV / JSON here" aria-label="Paste CSV or JSON" />
        <div className="row"><button className="btn quiet" onClick={() => text.trim() && ingest(text, "pasted data")}>Load pasted data</button></div>
        {msg && <p className={msg.err ? "err" : "muted"}>{msg.text}</p>}

        <button className="link" onClick={() => setShowFields(s => !s)} aria-expanded={showFields}>{showFields ? "Hide" : "Show"} the lot fields ({LOT_FIELDS.length})</button>
        {showFields && (
          <div className="fields">
            <table>
              <thead><tr><th>Column</th><th>What it is</th><th>Example</th></tr></thead>
              <tbody>
                {LOT_FIELDS.map(f => (
                  <tr key={f.key}>
                    <td><code>{f.key}</code>{f.req && <span className="req">required</span>}</td>
                    <td>{f.label}{f.note && <small>{f.note}</small>}</td>
                    <td className="ex">{f.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
