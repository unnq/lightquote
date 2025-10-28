/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

// ---------- Utilities ----------
const fmtMoney = (n) =>
  isFinite(n) ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }) : "$0";
const num = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v));
const LS_KEY = "xmas-estimator-v4";

// ---------- Presets ----------
const PRESETS = {
  Budget: { linear: { base: 10, steep: 12.5 }, count: { bush: 30, smallTree: 30, largeTree: 45, trim: 35, generic: 35 } },
  Standard:{ linear: { base: 12, steep: 15 },   count: { bush: 35, smallTree: 35, largeTree: 50, trim: 40, generic: 40 } },
  "High-End":{ linear:{ base: 14, steep: 18 },  count: { bush: 40, smallTree: 40, largeTree: 55, trim: 50, generic: 50 } },
};

// Classifiers (for preset application)
function classifyLinear(row){
  const L = (row.label || "").toLowerCase();
  if (L.includes("2nd") || L.includes("second") || L.includes("steep") || L.includes("tile") ||
      L.includes("two-story") || L.includes("two story") || L.includes("2 story") || L.includes("second story"))
    return "steep";
  return "base";
}
function classifyCount(row){
  const L = (row.label || "").toLowerCase();
  if (L.includes("large") && L.includes("tree")) return "largeTree";
  if (L.includes("small") && L.includes("tree")) return "smallTree";
  if (L.includes("bush")) return "bush";
  if (L.includes("trim") || L.includes("wreath") || L.includes("garland") || L.includes("decor")) return "trim";
  return "generic";
}

// ---------- Default State ----------
const defaultState = {
  title: "Medium Tier",
  linear: [
    { id: crypto.randomUUID(), selected: true, label: "1st Story Roofline", quantity: 80, unit: "ft", rate: 7.5 },
    { id: crypto.randomUUID(), selected: true, label: "2nd Story Roofline", quantity: 60, unit: "ft", rate: 7.5 },
  ],
  count: [
    { id: crypto.randomUUID(), selected: true, label: "Large Trees", quantity: 20, unit: "strands", rate: 45 },
    { id: crypto.randomUUID(), selected: true, label: "Bushes", quantity: 8, unit: "strands", rate: 30 },
    { id: crypto.randomUUID(), selected: true, label: "Small Trees", quantity: 12, unit: "strands", rate: 30 },
    { id: crypto.randomUUID(), selected: true, label: "Decorative Trim", quantity: 3, unit: "strands", rate: 40 },
  ],
  // Materials
  materialsFlat: 600,
  materialsAutoEnabled: true,
  materialsRateLinear: 0.7,   // $/ft (0.50–0.85)
  materialsRateStrand: 12,    // $/strand (10–16)
  // Other
  overheadFlat: 0,
  laborers: [
    { id: crypto.randomUUID(), name: "Laborer 1", wage: 25, hours: 8 },
    { id: crypto.randomUUID(), name: "Laborer 2", wage: 25, hours: 8 },
  ],
  notes: "",
};

// ---------- Local Storage Hook ----------
function usePersistentState(key, initial) {
  const [state, setState] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

// ---------- Row Components ----------
function LineRow({ row, onChange, onDelete }) {
  const update = (k, v) => onChange({ ...row, [k]: v });
  const lineTotal = num(row.quantity) * num(row.rate);

  return (
    <div className="row">
      <div className="grid row-grid">
        {/* 1: Mat checkbox */}
        <label className="matCheck">
          <input
            type="checkbox"
            checked={!!row.selected}
            onChange={(e) => update("selected", e.target.checked)}
            aria-label="Include in materials calc"
          />
          <span className="matCheck__label">Mat</span>
        </label>

        {/* 2: Description (full line on mobile) */}
        <input
          value={row.label}
          onChange={(e) => update("label", e.target.value)}
          placeholder="Description"
        />

        {/* 3: Qty */}
        <input
          type="number"
          step="1"
          min="0"
          value={row.quantity}
          onChange={(e) => update("quantity", e.target.value)}
          placeholder="Qty"
        />
        {/* 4: Unit */}
        <input
          value={row.unit}
          onChange={(e) => update("unit", e.target.value)}
          placeholder="Unit"
        />
        {/* 5: × symbol (visual only) */}
        <div className="times" aria-hidden="true">×</div>
        {/* 6: Rate */}
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.rate}
          onChange={(e) => update("rate", e.target.value)}
          placeholder="Rate"
        />
        {/* 7: Line total (inline, right-aligned) */}
        <div className="lineTotal">{fmtMoney(lineTotal)}</div>
        {/* 8: Delete */}
        <button aria-label="Delete row" onClick={onDelete}>✕</button>
      </div>
    </div>
  );
}

function Section({ title, rows, setRows, defaults }) {
  const addRow = () => setRows((rs) => [...rs, { id: crypto.randomUUID(), selected: true, label: "", quantity: 0, unit: defaults.unit, rate: 0 }]);
  const changeRow = (id, next) => setRows((rs) => rs.map((r) => (r.id === id ? next : r)));
  const deleteRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));

  const total = useMemo(() => rows.reduce((s, r) => s + num(r.quantity) * num(r.rate), 0), [rows]);

  return (
    <div className="card">
      <div className="section-title">
        <h2>{title}</h2>
        <div className="small">Total: <strong>{fmtMoney(total)}</strong></div>
      </div>

      {/* Head row — remove "Description" label per request */}
      <div className="grid head head-grid">
        <div>Mat</div>
        <div></div>
        <div>Qty</div>
        <div>Unit</div>
        <div aria-hidden="true">×</div>
        <div>Rate</div>
        <div>Line Total</div>
        <div></div>
      </div>

      {rows.map((r) => (
        <LineRow key={r.id} row={r} onChange={(next) => changeRow(r.id, next)} onDelete={() => deleteRow(r.id)} />
      ))}

      <div className="add-row">
        <button onClick={addRow}>+ Add Row</button>
      </div>
    </div>
  );
}

function LaborSection({ laborers, setLaborers }) {
  const addLab = () => setLaborers((ls) => [...ls, { id: crypto.randomUUID(), name: `Laborer ${ls.length + 1}`, wage: 25, hours: 8 }]);
  const changeLab = (id, next) => setLaborers((ls) => ls.map((l) => (l.id === id ? next : l)));
  const deleteLab = (id) => setLaborers((ls) => ls.filter((l) => l.id !== id));

  const laborTotal = useMemo(() => laborers.reduce((s, l) => s + num(l.wage) * num(l.hours), 0), [laborers]);

  return (
    <div className="card">
      <div className="section-title">
        <h2>Labor</h2>
        <div className="small">Total Labor Cost: <strong>{fmtMoney(laborTotal)}</strong></div>
      </div>

      <div className="grid head" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 40px" }}>
        <div>Name</div><div>Wage $/hr</div><div>Hours</div><div className="right">Cost</div><div></div>
      </div>

      {laborers.map((l) => (
        <div className="grid" key={l.id} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 40px" }}>
          <input value={l.name} onChange={(e) => changeLab(l.id, { ...l, name: e.target.value })} />
          <input type="number" step="1" min="0" value={l.wage} onChange={(e) => changeLab(l.id, { ...l, wage: e.target.value })} />
          <input type="number" step="0.5" min="0" value={l.hours} onChange={(e) => changeLab(l.id, { ...l, hours: e.target.value })} />
          <div className="right" style={{ padding: "8px 6px" }}>{fmtMoney(num(l.wage) * num(l.hours))}</div>
          <button onClick={() => deleteLab(l.id)}>✕</button>
        </div>
      ))}

      <div className="add-row">
        <button onClick={addLab}>+ Add Laborer</button>
      </div>
    </div>
  );
}

// ---------- App ----------
function App() {
  const [state, setState] = usePersistentState(LS_KEY, defaultState);
  const [presetKey, setPresetKey] = useState("Standard");

  const setLinear = (fnOrRows) => setState((s) => ({ ...s, linear: typeof fnOrRows === "function" ? fnOrRows(s.linear) : fnOrRows }));
  const setCount  = (fnOrRows) => setState((s) => ({ ...s, count:  typeof fnOrRows === "function" ? fnOrRows(s.count)  : fnOrRows }));
  const setLaborers = (fnOrRows) => setState((s) => ({ ...s, laborers: typeof fnOrRows === "function" ? fnOrRows(s.laborers) : fnOrRows }));

  const applyPreset = () => {
    const P = PRESETS[presetKey]; if (!P) return;
    setState((s) => ({
      ...s,
      linear: s.linear.map((row) => {
        if ((row.unit || "").toLowerCase() !== "ft") return row;
        return { ...row, rate: P.linear[classifyLinear(row)] };
      }),
      count: s.count.map((row) => ({ ...row, rate: P.count[classifyCount(row)] })),
    }));
  };

  // Materials auto-calc
  const autoMaterialsLinear = useMemo(() => {
    const rate = Math.max(0.5, Math.min(0.85, num(state.materialsRateLinear)));
    return state.linear.reduce((sum, r) =>
      sum + (r.selected ? num(r.quantity) : 0) * (String(r.unit).toLowerCase() === "ft" ? rate : 0), 0);
  }, [state.linear, state.materialsRateLinear]);

  const autoMaterialsStrands = useMemo(() => {
    const rate = Math.max(10, Math.min(16, num(state.materialsRateStrand)));
    return state.count.reduce((sum, r) => sum + (r.selected ? num(r.quantity) * rate : 0), 0);
  }, [state.count, state.materialsRateStrand]);

  const materialsAuto = state.materialsAutoEnabled ? (autoMaterialsLinear + autoMaterialsStrands) : 0;
  const materialsFlat = num(state.materialsFlat);
  const materialsTotal = materialsAuto + materialsFlat;

  // Totals
  const linearTotal = useMemo(() => state.linear.reduce((s, r) => s + num(r.quantity) * num(r.rate), 0), [state.linear]);
  const countTotal  = useMemo(() => state.count.reduce((s, r) => s + num(r.quantity) * num(r.rate), 0), [state.count]);
  const revenue = linearTotal + countTotal;

  const laborTotal = useMemo(() => state.laborers.reduce((s, l) => s + num(l.wage) * num(l.hours), 0), [state.laborers]);
  const overhead = num(state.overheadFlat);
  const expenses = laborTotal + materialsTotal + overhead;

  const profit = revenue - expenses;
  const margin = revenue > 0 ? profit / revenue : 0;
  const marginBadge = margin >= 0.6 ? "good" : margin >= 0.45 ? "warn" : "bad";

  const resetToDefault = () => {
    if (confirm("Reset to starter template? This will replace your current inputs.")) {
      setState(defaultState); setPresetKey("Standard");
    }
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `estimate_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importJSON = () => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json";
    inp.onchange = () => {
      const file = inp.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { try { setState(JSON.parse(reader.result)); } catch { alert("Invalid JSON file."); } };
      reader.readAsText(file);
    };
    inp.click();
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>🎄 Christmas Lights Estimator</h1>
          <div className="subtle">Quick on-site calculator • Saves automatically</div>
        </div>
        <div className="toolbar">
          <select value={presetKey} onChange={(e) => setPresetKey(e.target.value)}>
            {Object.keys(PRESETS).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button onClick={applyPreset}>Apply Preset</button>
          <button onClick={resetToDefault}>Reset Template</button>
          <button onClick={exportJSON}>Export</button>
          <button onClick={importJSON}>Import</button>
        </div>
      </div>

      {/* Meta + Materials */}
      <div className="card">
        <div className="kv">
          <div className="field">
            <label>Estimate Title</label>
            <input value={state.title} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} placeholder="e.g., Medium Tier"/>
          </div>
          <div className="field">
            <label>Overhead (flat $)</label>
            <input type="number" step="1" min="0" value={state.overheadFlat} onChange={(e) => setState((s) => ({ ...s, overheadFlat: e.target.value }))}/>
          </div>
          <div className="field">
            <label>Notes</label>
            <input value={state.notes} onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))} placeholder="Access notes, HOA, dates…"/>
          </div>
        </div>

        <hr className="sep" />

        <div className="materials-grid">
          <div className="materials-left">
            <label className="checkline">
              <input type="checkbox" checked={!!state.materialsAutoEnabled}
                     onChange={(e) => setState((s) => ({ ...s, materialsAutoEnabled: e.target.checked }))}/>
              <span>Calculate material cost based on selected items</span>
            </label>

            <div className="rates">
              <div className="field">
                <label>Linear materials ($/ft) <span className="small">(0.50–0.85)</span></label>
                <input type="number" min="0.5" max="0.85" step="0.01"
                       value={state.materialsRateLinear}
                       onChange={(e) => setState((s) => ({ ...s, materialsRateLinear: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Strand materials ($/strand) <span className="small">(10–16)</span></label>
                <input type="number" min="10" max="16" step="0.5"
                       value={state.materialsRateStrand}
                       onChange={(e) => setState((s) => ({ ...s, materialsRateStrand: e.target.value }))}/>
              </div>
            </div>
          </div>

          <div className="materials-right">
            <div className="matbox">
              <div className="matrow"><span>Auto materials</span><strong>{fmtMoney(materialsAuto)}</strong></div>
              <div className="matrow">
                <span>Flat materials</span>
                <input type="number" min="0" step="1"
                       value={state.materialsFlat}
                       onChange={(e) => setState((s) => ({ ...s, materialsFlat: e.target.value }))}/>
              </div>
              <hr className="sep" />
              <div className="matrow total"><span>Total materials</span><strong>{fmtMoney(materialsTotal)}</strong></div>
              <div className="small">Tip: keep “Flat” for fixed/non-item costs (timers, special clips, fuel, etc.).</div>
            </div>
          </div>
        </div>
      </div>

      <Section title="Linear Items (ft)" rows={state.linear} setRows={setLinear} defaults={{ unit: "ft" }} />
      <Section title="Count-Based Items (per item/strand)" rows={state.count} setRows={setCount} defaults={{ unit: "strands" }} />
      <LaborSection laborers={state.laborers} setLaborers={setLaborers} />

      <div className="card">
        <div className="summary">
          <div className="box">
            <h3>Revenue (Customer Price)</h3>
            <div className="big">{fmtMoney(revenue)}</div>
            <div className="small">Linear: {fmtMoney(linearTotal)} • Count: {fmtMoney(countTotal)}</div>
          </div>
          <div className="box">
            <h3>Expenses</h3>
            <div className="big">{fmtMoney(expenses)}</div>
            <div className="small">
              Labor {fmtMoney(laborTotal)} • Materials {fmtMoney(materialsTotal)} (auto {fmtMoney(materialsAuto)} + flat {fmtMoney(materialsFlat)}) • Overhead {fmtMoney(overhead)}
            </div>
          </div>
          <div className="box">
            <h3>Profit / Margin</h3>
            <div className="big">{fmtMoney(profit)}</div>
            <div className="small">Margin:&nbsp;<span className={`badge ${marginBadge}`}>{(margin * 100).toFixed(1)}%</span></div>
          </div>
        </div>
        <hr className="sep" />
        <div className="small">Target <strong>≥ 60% gross margin</strong> or <strong>$150–$200/hr per crew</strong>. Use higher rates for ladders, steep roofs, tile, rush jobs, or long travel.</div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
