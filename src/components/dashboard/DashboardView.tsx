import React from "react";
import type { River, YearMode } from "../../types";
import { RIVERS } from "../../constants";
import { SatelliteSplitViewer } from "./SatelliteSplitViewer";
import { FeaturedRivers } from "./FeaturedRivers";
import { LayerCards } from "./LayerCards";
import { StatsGrid } from "./StatsGrid";
import { RiverRanking } from "./RiverRanking";
import { DonutChart } from "./DonutChart";

interface DashboardViewProps {
  onOpenMap: () => void;
  onSelectRiver: (river: River) => void;
  onSelectYearMode: (mode: YearMode) => void;
  onShowAssetModal: () => void;
  dashIsland: string;
  onSelectIsland: (island: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenMap,
  onSelectRiver,
  onSelectYearMode,
  onShowAssetModal,
  dashIsland,
  onSelectIsland,
}) => {
  const totalSeg = RIVERS.reduce((a, r) => a + r.segmentCount, 0);
  const eroding = RIVERS.filter((r) => r.avgRate > 0).length;
  const accreting = RIVERS.length - eroding;
  const widest = RIVERS.length ? RIVERS.reduce((a, r) => (r.avgRate > a.avgRate ? r : a)) : null;
  const narrowest = RIVERS.length ? RIVERS.reduce((a, r) => (r.avgRate < a.avgRate ? r : a)) : null;
  const erosiPct = RIVERS.length ? Math.round((eroding / RIVERS.length) * 100) : 0;
  const akresiPct = 100 - erosiPct;

  return (
    <div className="dash">
      <div className="dash-bg" />

      <div className="dash-inner">
        <header className="dash-header">
          <div className="brand">
            <div className="dash-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2 12C5 8 9 16 12 12s7 4 10-2" />
              </svg>
            </div>
            <span className="brand-name">INARivers</span>
            <span className="dash-tagline-chip">LANDSAT 30M · MULTITEMPORAL</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-asset"
              onClick={onShowAssetModal}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              Status Asset GEE
            </button>
            <button className="btn hero-btn-primary" onClick={onOpenMap}>
              Buka Peta Interaktif →
            </button>
          </div>
        </header>

        <section className="hero">
          <div className="hero-tag">
            <span className="hero-tag-dot" />
            OBSERVASI SPASIAL 2010 — 2020 · GOOGLE EARTH ENGINE
          </div>

          <h1>
            Dinamika Pergeseran <span className="hero-gradient">Bibir Sungai Indonesia</span>
          </h1>
          <p>
            Pemantauan abrasi tebing dan pembentukan sedimen pada <b>{RIVERS.length} Daerah Aliran Sungai utama</b> Indonesia menggunakan citra satelit Landsat resolusi 30 meter dalam rentang satu dekade.
          </p>

          <div className="hero-actions">
            <button className="btn hero-btn-primary" onClick={onOpenMap}>
              Buka Peta Interaktif →
            </button>
            <button
              className="btn hero-btn-secondary"
              onClick={() => {
                const el = document.getElementById("vis-simulation");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Komparasi 2010 vs 2020 ↓
            </button>
          </div>

          <div className="hero-metrics">
            <div className="metric-pill">
              <span>SUNGAI:</span>
              <strong>{RIVERS.length} Wilayah DAS</strong>
            </div>
            <div className="metric-pill">
              <span>TRANSEK:</span>
              <strong>{totalSeg.toLocaleString("id-ID")} Segmen</strong>
            </div>
            <div className="metric-pill">
              <span>SENSOR:</span>
              <strong>Landsat 7 / 8 (30m)</strong>
            </div>
            <div className="metric-pill">
              <span>RENTANG:</span>
              <strong>2010 — 2020 (10 Tahun)</strong>
            </div>
          </div>
        </section>

        {/* INTERACTIVE SATELLITE SPLIT VIEWER */}
        <SatelliteSplitViewer
          onOpenMap={(mode) => {
            if (mode) onSelectYearMode(mode);
            onOpenMap();
          }}
        />

        {/* FEATURED RIVERS DYNAMICS */}
        <FeaturedRivers
          onSelectRiver={(r) => {
            onSelectRiver(r);
            onOpenMap();
          }}
        />

        {/* THREE CORE DATA LAYERS */}
        <LayerCards
          onSelectYearMode={(mode) => {
            onSelectYearMode(mode);
            onOpenMap();
          }}
        />

        {/* STATS GRID */}
        <StatsGrid
          totalRivers={RIVERS.length}
          eroding={eroding}
          accreting={accreting}
          totalSeg={totalSeg}
          erosiPct={erosiPct}
          akresiPct={akresiPct}
        />

        {/* RANKING & PROPORSI */}
        <div className="dash-grid2" id="dash-ranking">
          <RiverRanking
            dashIsland={dashIsland}
            onSelectIsland={onSelectIsland}
            onSelectRiver={(r) => {
              onSelectRiver(r);
              onOpenMap();
            }}
          />

          <DonutChart
            eroding={eroding}
            accreting={accreting}
            erosiPct={erosiPct}
            akresiPct={akresiPct}
            widest={widest}
            narrowest={narrowest}
          />
        </div>

        {/* BOTTOM CTA */}
        <section className="cta-card">
          <div>
            <h3>Siap Menjelajahi Peta Interaktif?</h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
              Akses visualisasi spasial 18 sungai utama, inspeksi segmen pergeseran, dan bandingkan citra satelit langsung.
            </p>
          </div>
          <button className="btn hero-btn-primary" onClick={onOpenMap}>
            Buka Peta Interaktif →
          </button>
        </section>

        <footer className="dash-footer">
          <span>© {new Date().getFullYear()} INARivers · WebGIS Dinamika Pergeseran Bibir Sungai Indonesia</span>
          <span>Google Earth Engine & Landsat 30m</span>
        </footer>
      </div>
    </div>
  );
};
