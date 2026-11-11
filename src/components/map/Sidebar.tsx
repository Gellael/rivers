import React from "react";
import type { BaseMap, River, SidebarTab } from "../../types";
import { COLORS, ISLANDS, fmtRate } from "../../constants";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  filteredRivers: River[];
  selIsland: string;
  onSelectIsland: (island: string) => void;
  selRiver: River | null;
  onSelectRiver: (r: River) => void;
  onFocusRiver: (r: River) => void;
  warnings: string[];
  showGeeTiles: boolean;
  onToggleGeeTiles: (v: boolean) => void;
  geeOpacity: number;
  onChangeGeeOpacity: (v: number) => void;
  showGee2010: boolean;
  onToggleGee2010: (v: boolean) => void;
  showGee2020: boolean;
  onToggleGee2020: (v: boolean) => void;
  showGeeChange: boolean;
  onToggleGeeChange: (v: boolean) => void;
  baseMap: BaseMap;
  onChangeBaseMap: (bm: BaseMap) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  tab,
  onTabChange,
  filteredRivers,
  selIsland,
  onSelectIsland,
  selRiver,
  onSelectRiver,
  onFocusRiver,
  warnings,
  showGeeTiles,
  onToggleGeeTiles,
  geeOpacity,
  onChangeGeeOpacity,
  showGee2010,
  onToggleGee2010,
  showGee2020,
  onToggleGee2020,
  showGeeChange,
  onToggleGeeChange,
  baseMap,
  onChangeBaseMap,
}) => {
  if (!open) return null;

  return (
    <aside className="sidebar">
      <div className="tabs">
        <button className={tab === "rivers" ? "on" : ""} onClick={() => onTabChange("rivers")}>
          Sungai ({filteredRivers.length})
        </button>
        <button className={tab === "layers" ? "on" : ""} onClick={() => onTabChange("layers")}>
          Layer
        </button>
        <button className={tab === "detail" ? "on" : ""} onClick={() => onTabChange("detail")}>
          Detail
        </button>
        <button className="sb-collapse" onClick={onClose}>
          Tutup
        </button>
      </div>

      {tab === "rivers" && (
        <div className="tab-body">
          <div className="chips">
            {ISLANDS.map((i) => (
              <button
                key={i}
                className={selIsland === i ? "chip on" : "chip"}
                onClick={() => onSelectIsland(i)}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="river-list">
            {filteredRivers.map((r) => (
              <button
                key={r.id}
                className={`river-row ${selRiver?.id === r.id ? "sel" : ""}`}
                onClick={() => onSelectRiver(r)}
              >
                <div className="river-main">
                  <span className="river-name">{r.name}</span>
                  <span className="river-meta">{r.province} · {r.segmentCount} segmen</span>
                </div>
                <span className={`rate ${r.avgRate > 0 ? "ero" : "akr"}`}>
                  {fmtRate(r.avgRate)}
                </span>
              </button>
            ))}
            {filteredRivers.length === 0 && <div className="empty">Sungai tidak ditemukan.</div>}
          </div>
        </div>
      )}

      {tab === "layers" && (
        <div className="tab-body">
          {warnings.length > 0 && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", color: "#fca5a5", fontSize: "11.5px", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, marginBottom: "4px", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⚠️</span> Status Koneksi Backend
              </div>
              {warnings.map((w, idx) => (
                <div key={idx} style={{ marginBottom: "6px" }}>{w}</div>
              ))}
              <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="https://riverbe.vercel.app"
                  defaultValue={typeof window !== "undefined" ? (localStorage.getItem("INARIVERS_BACKEND_URL") || "") : ""}
                  id="backend-url-input"
                  style={{ flex: 1, background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", padding: "4px 8px", fontSize: "11px" }}
                />
                <button
                  className="btn primary sm"
                  style={{ height: "28px", padding: "0 12px", fontSize: "11px" }}
                  onClick={() => {
                    const val = (document.getElementById("backend-url-input") as HTMLInputElement)?.value;
                    if (val && typeof window !== "undefined") {
                      localStorage.setItem("INARIVERS_BACKEND_URL", val.trim());
                      window.location.reload();
                    }
                  }}
                >
                  Hubungkan
                </button>
              </div>
            </div>
          )}

          <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <div style={{ fontWeight: 600, fontSize: "12.5px", color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                GEE Cloud Tiles (30m)
              </div>
              <input
                type="checkbox"
                checked={showGeeTiles}
                onChange={(e) => onToggleGeeTiles(e.target.checked)}
                style={{ accentColor: "#10b981", cursor: "pointer" }}
              />
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.4, marginBottom: "8px" }}>
              Citra bibir sungai & zona pergeseran real-time dari Google Earth Engine untuk seluruh sungai Indonesia.
            </div>
            {showGeeTiles && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--faint)", marginBottom: "4px" }}>
                  <span>Transparansi</span>
                  <span>{Math.round(geeOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.05"
                  value={geeOpacity}
                  onChange={(e) => onChangeGeeOpacity(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#10b981" }}
                />
              </div>
            )}
          </div>

          <h3 className="section-title">Pilihan Lapisan GEE</h3>

          <label className="toggle-row">
            <input type="checkbox" checked={showGee2010} onChange={(e) => onToggleGee2010(e.target.checked)} />
            <span className="switch" />
            <div>
              <div className="toggle-name">Garis Bibir Tahun 2010 (Awal)</div>
              <div className="toggle-desc">
                <span><i className="sw-line" style={{ background: COLORS.bank2010 }} /> Kuning Emas (30m Landsat)</span>
              </div>
            </div>
          </label>

          <label className="toggle-row">
            <input type="checkbox" checked={showGee2020} onChange={(e) => onToggleGee2020(e.target.checked)} />
            <span className="switch" />
            <div>
              <div className="toggle-name">Garis Bibir Tahun 2020 (Terbaru)</div>
              <div className="toggle-desc">
                <span><i className="sw-line" style={{ background: COLORS.bank2020 }} /> Pink Terang (30m Landsat)</span>
              </div>
            </div>
          </label>

          <label className="toggle-row">
            <input type="checkbox" checked={showGeeChange} onChange={(e) => onToggleGeeChange(e.target.checked)} />
            <span className="switch" />
            <div>
              <div className="toggle-name">Zona Dinamika (Erosi & Akresi)</div>
              <div className="toggle-desc">
                <span style={{ color: "#ef4444", marginRight: 8 }}>■ Erosi</span>
                <span style={{ color: "#06b6d4" }}>■ Akresi</span>
              </div>
            </div>
          </label>

          <h3 className="section-title" style={{ marginTop: 20 }}>Peta Dasar</h3>
          <div className="seg" role="group" aria-label="Peta dasar" style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
            {([
              ["sat-2010", "Satelit 2010"],
              ["sat-2020", "Satelit 2020"],
              ["sat", "Satelit Kini"],
              ["dark", "Gelap"],
            ] as [BaseMap, string][]).map(([k, label]) => (
              <button
                key={k}
                style={{ flex: "1 1 45%", fontSize: "11px", padding: "6px 8px" }}
                className={baseMap === k ? "on" : ""}
                onClick={() => onChangeBaseMap(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {baseMap === "sat-2010" && (
            <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.25)", borderRadius: "6px", fontSize: "11px", color: "#fbbf24", lineHeight: 1.4 }}>
              <b>Satelit 2010 Aktif:</b> Menampilkan foto citra Landsat bebas awan tahun 2010 dari Google Earth Engine untuk mencocokkan garis bibir sungai awal.
            </div>
          )}
          {baseMap === "sat-2020" && (
            <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(255, 34, 85, 0.08)", border: "1px solid rgba(255, 34, 85, 0.25)", borderRadius: "6px", fontSize: "11px", color: "#ff6b8b", lineHeight: 1.4 }}>
              <b>Satelit 2020 Aktif:</b> Menampilkan foto citra Landsat 8 tahun 2020 untuk memverifikasi pergeseran garis tebing terbaru.
            </div>
          )}

          <div style={{ marginTop: 24, padding: "12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px", color: "var(--faint)", lineHeight: 1.5 }}>
            <b style={{ color: "var(--text)" }}>Koneksi Cloud GEE:</b><br />
            • Gateway: <code>Secure Backend API via Vercel</code><br />
            • Resolusi: 30 meter per piksel<br />
            • Cakupan: Seluruh sungai di Indonesia
          </div>
        </div>
      )}

      {tab === "detail" && (
        <div className="tab-body">
          {selRiver ? (
            <div>
              <div className="detail-head">
                <div className="detail-eyebrow">Sungai aktif</div>
                <h2>{selRiver.name}</h2>
                <div className="detail-loc">{selRiver.province} · {selRiver.island}</div>
              </div>

              <div className="metrics">
                <div className="metric">
                  <span className="metric-label">Laju rata-rata</span>
                  <span className={`metric-val ${selRiver.avgRate > 0 ? "ero" : "akr"}`}>{fmtRate(selRiver.avgRate)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Segmen</span>
                  <span className="metric-val">{selRiver.segmentCount}</span>
                </div>
              </div>

              <p className="note">
                <b>Dinamika.</b>{" "}
                {selRiver.avgRate > 1
                  ? "Sungai mengalami pelebaran aktif (erosi tebing). Garis 2020 bergeser keluar dari garis 2010."
                  : selRiver.avgRate < -1
                    ? "Sungai mengalami penyempitan (sedimentasi)."
                    : "Kondisi relatif stabil."}
              </p>

              <button className="btn primary block lg" onClick={() => onFocusRiver(selRiver)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                Fokus ke Sungai Ini
              </button>
            </div>
          ) : (
            <div className="empty" style={{ textAlign: "center", padding: "32px 14px" }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>🗺️</div>
              <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "13px", marginBottom: "6px" }}>Pilih Sungai</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                Pilih salah satu sungai pada tab <b>Sungai</b> atau klik garis sungai pada peta untuk menganalisis detail dinamika pergeseran.
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
