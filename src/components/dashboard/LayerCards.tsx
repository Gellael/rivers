import React from "react";
import type { YearMode } from "../../types";

interface LayerCardsProps {
  onSelectYearMode: (mode: YearMode) => void;
}

export const LayerCards: React.FC<LayerCardsProps> = ({ onSelectYearMode }) => {
  return (
    <section style={{ marginBottom: "40px" }}>
      <div className="section-header-row">
        <div className="section-subtitle">STRUKTUR DATA GEOSPASIAL</div>
        <h2 className="section-title">Tiga Lapisan Analisis Multitemporal</h2>
        <p className="section-desc">Kombinasi ekstraksi vektor tepi perairan dari citra satelit Landsat 7 dan 8 resolusi 30 meter.</p>
      </div>

      <div className="layers-grid">
        <div className="layer-card c-2010">
          <div>
            <div className="layer-tag">BASELINE 2010 · LANDSAT 7</div>
            <div className="layer-title">Garis Bibir Tahun 2010</div>
            <div className="layer-desc">Garis batas tepi perairan historis 10 tahun lalu, diekstraksi dari mosaik citra Landsat 7 ETM+ bebas awan.</div>
          </div>
          <button
            className="layer-btn"
            onClick={() => onSelectYearMode("2010")}
          >
            Tampilkan Layer 2010 di Peta →
          </button>
        </div>

        <div className="layer-card c-2020">
          <div>
            <div className="layer-tag">TERKINI 2020 · LANDSAT 8</div>
            <div className="layer-title">Garis Bibir Tahun 2020</div>
            <div className="layer-desc">Garis batas tepi perairan terkini dari citra Landsat 8 OLI Surface Reflectance untuk mendeteksi perubahan alur.</div>
          </div>
          <button
            className="layer-btn"
            onClick={() => onSelectYearMode("2020")}
          >
            Tampilkan Layer 2020 di Peta →
          </button>
        </div>

        <div className="layer-card c-dyn">
          <div>
            <div className="layer-tag">DELTA 10 TAHUN · EROSI & AKRESI</div>
            <div className="layer-title">Zona Dinamika Morfologi</div>
            <div className="layer-desc">Kalkulasi poligon selisih tebing: zona tanah hilang tergerus arus (Merah) vs sedimentasi daratan baru (Cyan).</div>
          </div>
          <button
            className="layer-btn"
            onClick={() => onSelectYearMode("compare")}
          >
            Tampilkan Zona Dinamika di Peta →
          </button>
        </div>
      </div>
    </section>
  );
};
