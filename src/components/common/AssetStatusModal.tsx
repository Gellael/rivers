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
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: "14px",
          padding: "26px 30px",
          maxWidth: "620px",
          width: "92%",
          maxHeight: "88vh",
          overflowY: "auto",
          color: "var(--text)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.75)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Google Earth Engine (GEE) — Status Data & Asset</h3>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ fontSize: "20px", color: "var(--muted)", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
          <p style={{ margin: "0 0 14px", color: "var(--text)" }}>
            Sistem <b>INARivers</b> memproses citra satelit multitemporal <b>Landsat resolusi 30 meter</b> (JRC Global Surface Water + MERIT Hydro) untuk memantau dinamika abrasi tebing dan sedimentasi alur sungai di seluruh Indonesia (2010 – 2020).
          </p>

          <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px" }}>
            <div style={{ fontWeight: 600, color: "#34d399", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⚡</span> Pemanggilan Data On-Demand & Terisolasi Indonesia
            </div>
            <div style={{ fontSize: "12px", color: "var(--text)" }}>
              Garis sungai <b>hanya dimuat saat sungai dipilih</b> dan dipangkas khusus di dalam wilayah sungai bersangkutan. Tampilan awal peta menyajikan cakupan nasional seluruh Indonesia tanpa tumpang-tindih garis global.
            </div>
          </div>

          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px" }}>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Koneksi Cloud & Keamanan:</div>
            <div className="mono" style={{ fontSize: "12px", color: "#34d399", marginBottom: "4px" }}>✅ Terhubung via Backend API Gateway (Vercel Serverless)</div>
            <div className="mono" style={{ fontSize: "11.5px", color: "var(--muted)" }}>🔒 Keamanan: <code>Zero Credential on Client (Service Account Diamankan di Backend)</code></div>
          </div>

          <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>Asset GEE Resmi yang Digunakan:</div>
          <ul style={{ paddingLeft: "18px", margin: "0 0 14px", fontSize: "12.5px" }}>
            <li style={{ marginBottom: "5px" }}>
              <b>Citra Landsat 2010 & 2020</b> (True Color Bebas Awan 30m) &rarr; <code className="mono">citra_landsat_2010</code> & <code className="mono">citra_landsat_2020</code>
            </li>
            <li style={{ marginBottom: "5px" }}>
              <b>Garis Tepi Tebing Awal 2010</b> (Kuning Emas) &rarr; <code className="mono">bibir_sungai_2010</code>
            </li>
            <li style={{ marginBottom: "5px" }}>
              <b>Garis Tepi Tebing Terbaru 2020</b> (Pink/Merah Terang) &rarr; <code className="mono">bibir_sungai_2020</code>
            </li>
            <li style={{ marginBottom: "5px" }}>
              <b>Zona Dinamika Erosi & Akresi</b> (Merah Erosi, Cyan Akresi) &rarr; <code className="mono">dinamika_pergeseran_2010_2020</code>
            </li>
          </ul>

          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Penyimpanan Permanen (Asset Caching):</div>
            <p style={{ margin: 0, fontSize: "12px" }}>
              Setiap garis sungai yang dipanggil tersimpan permanen di <b>GEE Asset & Cache Backend</b>. Saat Anda membuka sungai yang sama kembali, data langsung ditarik seketika dari asset tanpa menghitung ulang.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn primary" onClick={onClose} style={{ padding: "8px 22px" }}>Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
};
