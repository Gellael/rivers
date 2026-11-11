import React from "react";

interface AssetStatusModalProps {
  onClose: () => void;
}

export const AssetStatusModal: React.FC<AssetStatusModalProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: "14px",
          padding: "26px 30px",
          maxWidth: "600px",
          width: "92%",
          maxHeight: "85vh",
          overflowY: "auto",
          color: "var(--text)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Google Earth Engine (GEE) — Status Data & Asset</h3>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ fontSize: "18px", color: "var(--muted)" }}>×</button>
        </div>

        <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
          <p style={{ margin: "0 0 14px" }}>
            Garis bibir sungai dan zona pergeseran tebing diproses langsung dari citra satelit Landsat Google Earth Engine (JRC Global Surface Water 30m + MERIT Hydro) mencakup <b>seluruh sungai di Indonesia</b> (tanpa garis pantai/laut).
          </p>

          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Koneksi Cloud GEE:</div>
            <div className="mono" style={{ fontSize: "12px", color: "#34d399" }}>✅ Terhubung via Backend API (Vercel)</div>
            <div className="mono" style={{ fontSize: "12px", color: "var(--muted)" }}>Security: <code>Zero Credential on Client (Environment Variable Gateway)</code></div>
          </div>

          <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>Asset GEE yang Digunakan:</div>
          <ul style={{ paddingLeft: "18px", margin: "0 0 16px", fontSize: "12.5px" }}>
            <li>Citra Satelit Historis tahun <b>2010</b> (Landsat True Color) &rarr; <code>citra_landsat_2010</code></li>
            <li>Garis tepi tebing tahun <b>2010</b> (Kuning Emas) &rarr; <code>bibir_sungai_2010</code></li>
            <li>Garis tepi tebing tahun <b>2020</b> (Pink/Merah Terang) &rarr; <code>bibir_sungai_2020</code></li>
            <li>Zona Erosi (Merah) & Akresi (Cyan) &rarr; <code>dinamika_pergeseran_2010_2020</code></li>
          </ul>

          <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Skrip GEE Code Editor (Siap Pakai):</div>
          <p style={{ margin: "0 0 16px", fontSize: "12px" }}>
            Tersedia file <code className="mono">data-pipeline/gee_code_editor_script.js</code> yang dapat langsung di-copy-paste ke <b>code.earthengine.google.com</b> untuk visualisasi interaktif dan ekspor asset permanen via tab Tasks.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn primary" onClick={onClose} style={{ padding: "8px 20px" }}>Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
};

