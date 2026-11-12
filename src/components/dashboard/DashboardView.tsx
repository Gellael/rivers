import React, { useEffect } from "react";
import type { River, YearMode } from "../../types";
import { RIVERS } from "../../constants";
import { Reveal } from "../common/Reveal";
import { HeroVisual } from "./HeroVisual";
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

/* Kartu yang punya efek "spotlight" mengikuti kursor */
const SPOTLIGHT_SELECTOR = ".featured-river-card, .layer-card, .stat-card, .card";

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

  // Posisi kursor → variabel CSS --mx / --my untuk efek spotlight
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(SPOTLIGHT_SELECTOR);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  const tickerItems = [
    "Landsat 7 ETM+ · 2010",
    "Landsat 8 OLI · 2020",
    "JRC Global Surface Water 30 m",
    "MERIT Hydro",
    "Google Earth Engine",
    `${RIVERS.length} Daerah Aliran Sungai`,
    `${totalSeg.toLocaleString("id-ID")} segmen transek`,
    "Erosi & Akresi tebing",
  ];

  return (
    <div className="dash">
      <div className="dash-bg" aria-hidden="true">
        <span className="aurora a1" />
        <span className="aurora a2" />
        <span className="aurora a3" />
      </div>

      <header className="dash-nav">
        <div className="dash-nav-in">
          <div className="brand">
            <div className="dash-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2 12C5 8 9 16 12 12s7 4 10-2" />
              </svg>
            </div>
            <span className="brand-name">INARivers</span>
            <span className="dash-tagline-chip">LANDSAT 30M · MULTITEMPORAL</span>
          </div>
          <div className="dash-nav-actions">
            <button className="btn btn-asset" onClick={onShowAssetModal}>
              <span className="live-dot" />
              Status Asset GEE
            </button>
            <button className="btn hero-btn-primary compact" onClick={onOpenMap}>
              Buka Peta Interaktif →
            </button>
          </div>
        </div>
        <span className="dash-progress" aria-hidden="true" />
      </header>

      <div className="dash-inner">
        <section className="hero">
          <div className="hero-copy">
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
          </div>

          <HeroVisual
            erosi={widest && widest.avgRate > 0 ? widest : null}
            akresi={narrowest && narrowest.avgRate < 0 ? narrowest : null}
          />
        </section>

        {/* TICKER SUMBER DATA */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map((k) => (
              <div className="ticker-set" key={k}>
                {tickerItems.map((t) => (
                  <span className="ticker-item" key={t}>
                    <i />
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* INTERACTIVE SATELLITE SPLIT VIEWER */}
        <Reveal className="dash-block">
          <SatelliteSplitViewer
            onOpenMap={(mode) => {
              if (mode) onSelectYearMode(mode);
              onOpenMap();
            }}
          />
        </Reveal>

        {/* FEATURED RIVERS DYNAMICS */}
        <Reveal className="dash-block">
          <FeaturedRivers
            onSelectRiver={(r) => {
              onSelectRiver(r);
              onOpenMap();
            }}
          />
        </Reveal>

        {/* THREE CORE DATA LAYERS */}
        <Reveal className="dash-block">
          <LayerCards
            onSelectYearMode={(mode) => {
              onSelectYearMode(mode);
              onOpenMap();
            }}
          />
        </Reveal>

        {/* STATS GRID */}
        <Reveal className="dash-block">
          <StatsGrid
            totalRivers={RIVERS.length}
            eroding={eroding}
            accreting={accreting}
            totalSeg={totalSeg}
            erosiPct={erosiPct}
            akresiPct={akresiPct}
          />
        </Reveal>

        {/* RANKING & PROPORSI */}
        <Reveal className="dash-block">
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
        </Reveal>

        {/* BOTTOM CTA */}
        <Reveal className="dash-block">
          <section className="cta-card">
            <div>
              <h3>Siap Menjelajahi Peta Interaktif?</h3>
              <p style={{ margin: 0, color: "#a8b8cc", fontSize: "15px" }}>
                Akses visualisasi spasial {RIVERS.length} sungai utama, inspeksi segmen pergeseran, dan bandingkan citra satelit langsung.
              </p>
            </div>
            <button className="btn hero-btn-primary" onClick={onOpenMap}>
              Buka Peta Interaktif →
            </button>
          </section>
        </Reveal>

        <footer className="dash-footer">
          <span>© {new Date().getFullYear()} INARivers · WebGIS Dinamika Pergeseran Bibir Sungai Indonesia</span>
          <span>Google Earth Engine & Landsat 30m</span>
        </footer>
      </div>
    </div>
  );
};