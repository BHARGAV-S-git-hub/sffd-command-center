"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const TacticalMap = dynamic(() => import("./components/TacticalMap"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Zone {
  district: string;
  latitude: number;
  longitude: number;
  map_hex_code: string;
  risk_score_percent: number;
  resource_status: string;
  live_recommendation: string;
  potential_seconds_saved: number;
  engines_deployed: number;
  active_incidents: number; 
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000000; color: #ededed; font-family: 'Inter', sans-serif; overflow: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
  @keyframes pulse { 50% { opacity: 0.5; } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .premium-btn {
    width: 100%; padding: 12px; background: transparent; border: 1px solid #333;
    color: #ededed; font-family: 'JetBrains Mono', monospace; font-size: 11px;
    font-weight: 700; letter-spacing: 0.1em; border-radius: 6px; cursor: pointer;
    transition: all 0.2s ease; display: flex; justify-content: center; gap: 8px; text-transform: uppercase;
  }
  .premium-btn:hover:not(:disabled) { background: #ededed; color: #000; border-color: #ededed; box-shadow: 0 0 15px rgba(255,255,255,0.1); }
  .premium-btn:disabled { opacity: 0.4; cursor: not-allowed; background: #111; border-color: #222; }

  .card-container { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 12px; padding: 20px; transition: border-color 0.3s ease; }
  .card-container:hover { border-color: #333; }

  input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
  input[type=range]::-webkit-slider-thumb { 
    -webkit-appearance: none; height: 18px; width: 6px; background: #fff; 
    border-radius: 2px; cursor: pointer; margin-top: -7px; box-shadow: 0 0 10px rgba(255,255,255,0.8);
  }
  input[type=range]::-webkit-slider-runnable-track { 
    width: 100%; height: 4px; cursor: pointer; background: #333; border-radius: 2px; 
  }
  input[type=range]:focus { outline: none; }
  
  select {
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ededed%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 10px top 50%;
    background-size: 10px auto;
  }
`;

// ─── Battalion Card ────────────────────────────────────────────────────────────
function BattalionCard({ zone, idx, onAddEngine }: { zone: Zone; idx: number; onAddEngine: (d: string) => void }) {
  const isMaxed = zone.engines_deployed >= 10;
  const districtName = zone.district || `BATTALION_${idx + 1}`;

  return (
    <div className="card-container" style={{ animation: `slideIn 0.3s ease ${idx * 0.05}s both`, flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "#ffffff" }}>{districtName}</h3>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Risk Prob</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: zone.map_hex_code }}>
                {zone.risk_score_percent}%
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Opt. Impact</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "#32d74b" }}>
                -{zone.potential_seconds_saved}s
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ padding: "4px 10px", borderRadius: 4, background: `${zone.map_hex_code}1A`, border: `1px solid ${zone.map_hex_code}4D`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: zone.map_hex_code, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: zone.map_hex_code, animation: zone.resource_status === "DEFICIT" ? "pulse 1s infinite" : "none" }} />
            {zone.resource_status}
          </div>
          {zone.engines_deployed > 0 && <span style={{ fontSize: 10, color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>+{zone.engines_deployed} Units</span>}
        </div>
      </div>
      <button className="premium-btn" disabled={isMaxed} onClick={() => onAddEngine(districtName)}>
        {isMaxed ? "MAX CAPACITY REACHED" : `ADD ENGINE [+2] → ${districtName}`}
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CommandCenter() {
  const [baseData, setBaseData] = useState<Zone[]>([]);
  const [timeOffset, setTimeOffset] = useState<number>(0); 
  const [weatherEvent, setWeatherEvent] = useState<string>("NORMAL"); // New Weather State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Weather Multipliers mapped to dropdown values
  const weatherMultipliers: Record<string, number> = {
    "NORMAL": 1.0,
    "HIGH_WINDS": 1.4,
    "EARTHQUAKE": 1.8
  };

  useEffect(() => {
    fetch("/api/dispatch")
      .then(r => { if (!r.ok) throw new Error("API route failed"); return r.json(); })
      .then(json => {
        if (Array.isArray(json) && json.length > 0) {
          setBaseData(json.map((z: any) => ({ ...z, engines_deployed: 0, active_incidents: z.activeIncidents || 5 })));
        } else setError("No incident data found.");
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const addEngine = useCallback((districtName: string) => {
    setBaseData(prev => prev.map(z => {
      const currentName = z.district || `BATTALION_${prev.indexOf(z) + 1}`;
      if (currentName !== districtName) return z;
      const newRisk = Math.max(5, z.risk_score_percent - 25);
      return {
        ...z, risk_score_percent: newRisk,
        resource_status: newRisk < 40 ? "SURPLUS" : newRisk < 70 ? "STABLE" : "DEFICIT",
        map_hex_code: newRisk < 40 ? "#32d74b" : newRisk < 70 ? "#ff9f0a" : "#ff453a",
        engines_deployed: z.engines_deployed + 2,
        live_recommendation: "System stabilized via manual override."
      };
    }));
  }, []);

  // ─── THE TEMPORAL & ENVIRONMENTAL ML ENGINE ───
  const displayData = useMemo(() => {
    const currentMultiplier = weatherMultipliers[weatherEvent] || 1.0;

    return [...baseData].map(zone => {
      // 1. Calculate time decay
      const incidentLoad = zone.active_incidents || 5;
      const decayMultiplier = 2 + (incidentLoad * 0.3); 
      const timeDecayedRisk = zone.risk_score_percent + (decayMultiplier * timeOffset);

      // 2. Apply Environmental Multiplier
      const forecastedRisk = Math.min(100, Math.round(timeDecayedRisk * currentMultiplier));

      // 3. Recalculate status and colors based on new forecasted risk
      let newStatus = "SURPLUS";
      let newHex = "#32d74b"; 
      if (forecastedRisk >= 40 && forecastedRisk < 70) { newStatus = "STABLE"; newHex = "#ff9f0a"; } 
      else if (forecastedRisk >= 70) { newStatus = "DEFICIT"; newHex = "#ff453a"; } 

      // 4. Update Recommendation String
      let dynamicRec = zone.live_recommendation;
      if (forecastedRisk >= 70) {
        dynamicRec = weatherEvent !== "NORMAL" 
          ? `ENVIRONMENTAL STRESS CRITICAL (${currentMultiplier}x Multiplier). Reroute units immediately.`
          : `CRITICAL DECAY: Reroute reserve units immediately.`;
      }

      return {
        ...zone,
        risk_score_percent: forecastedRisk,
        resource_status: newStatus,
        map_hex_code: newHex,
        live_recommendation: dynamicRec
      };
    }).sort((a, b) => b.risk_score_percent - a.risk_score_percent); 
  }, [baseData, timeOffset, weatherEvent]);

  if (loading || error) return (
    <div style={{ height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: error ? "#ff453a" : "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
      <style>{GLOBAL_CSS}</style>
      {error ? `[SYSTEM FAULT] ${error}` : <span style={{ animation: "pulse 1.5s infinite" }}>SYNCING WITH DATABRICKS ML ENGINE...</span>}
    </div>
  );

  const deficitZone = displayData.find(z => z.resource_status === "DEFICIT") || displayData[0];
  const surplusZone = [...displayData].reverse().find(z => z.resource_status === "SURPLUS") || displayData[displayData.length - 1];
  const isSimActive = timeOffset > 0 || weatherEvent !== "NORMAL";

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ height: "100vh", padding: "32px 48px", display: "flex", flexDirection: "column", maxWidth: 1600, margin: "0 auto" }}>
        
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #1f1f1f", paddingBottom: 24, marginBottom: 32, flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em" }}>San Francisco Fire Command</h1>
            <p style={{ color: "#888", fontSize: 12, marginTop: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>
              Databricks Live ML Pipeline {isSimActive && <span style={{ color: "#ff9f0a", marginLeft: 8 }}></span>}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: !isSimActive ? "#32d74b" : "#ff9f0a", border: `1px solid ${!isSimActive ? "rgba(50,215,75,0.3)" : "rgba(255,159,10,0.3)"}`, padding: "6px 12px", borderRadius: 4, background: !isSimActive ? "rgba(50,215,75,0.05)" : "rgba(255,159,10,0.05)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: !isSimActive ? "#32d74b" : "#ff9f0a", animation: "pulse 2s infinite" }} />
            {!isSimActive ? "LIVE UPLINK" : `SIMULATING ENVIRONMENT`}
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 32, height: "calc(100vh - 150px)" }}>
          
          {/* Left Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 12, height: "100%", paddingBottom: "40px" }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, flexShrink: 0 }}>
              Active Battalions
            </h2>
            {displayData.map((zone, idx) => (
              <BattalionCard key={zone.district || idx} zone={zone} idx={idx} onAddEngine={addEngine} />
            ))}
          </div>

          {/* Right Console */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%", overflowY: "auto", paddingBottom: "40px", paddingRight: 8 }}>
            
            {/* AI SYSTEM OVERRIDE BOX */}
            {deficitZone && surplusZone && deficitZone.district !== surplusZone.district && (
              <div className="card-container" style={{ borderLeft: "3px solid #ff453a", display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ML Optimization Directive
                  </h3>
                  <span style={{ fontSize: 11, color: "#ff453a", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>SYS.REC.01</span>
                </div>
                <p style={{ fontSize: 14, color: "#ccc", lineHeight: 1.6, maxWidth: "90%" }}>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{deficitZone.district || 'TARGET_ZONE'}</span> is in <span style={{color: "#ff453a"}}>DEFICIT</span>. 
                  <br/>System Message: <i>"{deficitZone.live_recommendation}"</i>
                </p>
                <div>
                  <button 
                    className="premium-btn" style={{ width: 'auto', padding: '12px 32px', display: 'inline-flex' }} 
                    onClick={() => addEngine(deficitZone.district || 'TARGET_ZONE')} disabled={deficitZone.engines_deployed >= 10}
                  >
                    AUTHORIZE ENGINE TRANSFER
                  </button>
                </div>
              </div>
            )}

            {/* Top Chart */}
            <div className="card-container" style={{ flexShrink: 0, height: "300px", display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 24 }}>
                Risk Probability Matrix (%)
              </h2>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="district" stroke="#333" tick={{ fill: "#888", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#333" domain={[0, 100]} tick={{ fill: "#888", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} />
                    <ReferenceLine y={70} stroke="rgba(255,69,58,0.3)" strokeDasharray="3 3" />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace" }}/>
                    <Bar dataKey="risk_score_percent" radius={[4, 4, 0, 0]} barSize={32}>
                      {displayData.map((entry, i) => (
                        <Cell key={i} fill={entry.map_hex_code || "#888"} opacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Map & Timeline Slider Container */}
            <div style={{ display: "flex", gap: 24, height: "300px", flexShrink: 0 }}>
              
              {/* Map */}
              <div className="card-container" style={{ flex: 1, padding: 0, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", top: 16, left: 16, zIndex: 400, background: "rgba(0,0,0,0.8)", border: "1px solid #333", padding: "6px 12px", borderRadius: 6, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#888" }}>
                  GEO-SPATIAL OVERVIEW
                </div>
                <TacticalMap data={displayData} />
              </div>

              {/* SIMULATION CONTROLS */}
              <div className="card-container" style={{ width: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: isSimActive ? "1px solid #ff9f0a" : "1px solid #1f1f1f" }}>
                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: isSimActive ? "#ff9f0a" : "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>
                    Simulation Controls
                  </h3>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 8, lineHeight: 1.5 }}>
                    Inject environmental hazards or forecast time decay to stress-test fleet capacity.
                  </p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  
                  {/* Weather Dropdown */}
                  <div>
                    <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#666", marginBottom: 8, letterSpacing: "0.05em" }}>
                      ENVIRONMENTAL CONTEXT
                    </div>
                    <select 
                      value={weatherEvent}
                      onChange={(e) => setWeatherEvent(e.target.value)}
                      style={{
                        width: "100%", background: "#111", border: "1px solid #333", color: weatherEvent === 'NORMAL' ? "#ededed" : "#ff9f0a",
                        padding: "10px 12px", borderRadius: "6px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                        outline: "none", cursor: "pointer", fontWeight: 700
                      }}
                    >
                      <option value="NORMAL">NORMAL CONDITIONS</option>
                      <option value="HIGH_WINDS">HIGH WINDS</option>
                      <option value="EARTHQUAKE">EARTHQUAKE</option>
                    </select>
                  </div>

                  {/* Time Slider */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#666", letterSpacing: "0.05em" }}>TIME FORECAST</span>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: timeOffset === 0 ? "#fff" : "#ff9f0a" }}>
                        +{timeOffset} HRS
                      </span>
                    </div>

                    <input 
                      type="range" min="0" max="12" step="1" 
                      value={timeOffset} 
                      onChange={(e) => setTimeOffset(Number(e.target.value))} 
                    />
                    
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#666", marginTop: 4 }}>
                      <span>NOW</span>
                      <span>+12H</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}