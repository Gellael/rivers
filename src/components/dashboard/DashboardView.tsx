import React from "react";
import type { River, YearMode } from "../../types";
import { RIVERS } from "../../constants";
import { Reveal } from "../common/Reveal";
import { HeroStage } from "./HeroStage";
import { FeaturedRivers } from "./FeaturedRivers";
import { LayerCards } from "./LayerCards";
import { StatsGrid } from "./StatsGrid";
import { RiverRanking } from "./RiverRanking";
import { DonutChart } from "./DonutChart";
import "../../Dashboard.css";

interface DashboardViewProps {
  onOpenMap: () => void;
  onSelectRiver: (river: River) => void;
  onSelectYearMode: (mode: YearMode) => void;
  onShowAssetModal: () => void;
  dashIsland: string;
  onSelectIsland: (island: string) => void;
}

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

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
    <div className="ds">
      <header className="ds-nav">
        <div className="ds-wrap ds-nav-in">
          <div className="ds-brand">
            <div className="ds-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M2 12C5 8 9 16 12 12s7 4 10-2" />
              </svg>
            </div>
            <span className="ds-brand-name">INARivers</span>
          </div>
          <div className="ds-nav-actions">
            <button type="button" className="ds-status" onClick={onShowAssetModal}>
              <i /> Status aset GEE
            </button>
            <button type="button" className="ds-btn sm on-dark" onClick={onOpenMap}>
              Buka peta
            </button>
          </div>
        </div>
      </header>

      <main>
        <HeroStage
          erosi={widest && widest.avgRate > 0 ? widest : null}
          akresi={narrowest && narrowest.avgRate < 0 ? narrowest : null}
          total={RIVERS.length}
          onOpenMap={onOpenMap}
        />

        <Reveal>
          <StatsGrid
            totalRivers={RIVERS.length}
            eroding={eroding}
            accreting={accreting}
            totalSeg={totalSeg}
            erosiPct={erosiPct}
            akresiPct={akresiPct}
          />
        </Reveal>

        <div className="band-dark">
          <div className="ds-wrap">
            <FeaturedRivers
              onSelectRiver={(r) => {
                onSelectRiver(r);
                onOpenMap();
              }}
            />
          </div>
        </div>

        <div className="ds-wrap">
          <LayerCards
            onSelectYearMode={(mode) => {
              onSelectYearMode(mode);
              onOpenMap();
            }}
          />

          <section className="ds-section">
            <div className="ds-two" id="dash-ranking">
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
          </section>

          <section className="ds-section">
            <div className="ds-cta">
              <svg className="cta-line" viewBox="0 0 600 200" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" aria-hidden="true">
                <path d="M0 120 C80 20 160 20 220 100 S360 180 430 90 S540 30 600 70" />
              </svg>
              <div>
                <h3>Pilih sungai, lihat bibirnya bergeser.</h3>
                <p>Jelajahi {RIVERS.length} sungai di peta, periksa tiap segmen, dan bandingkan citra satelit 2010 dengan 2020.</p>
              </div>
              <button type="button" className="ds-btn on-dark" onClick={onOpenMap}>
                Buka peta interaktif <Arrow />
              </button>
            </div>
          </section>

          <footer className="ds-footer">
            <span>© {new Date().getFullYear()} INARivers. WebGIS dinamika pergeseran bibir sungai Indonesia.</span>
            <span>Google Earth Engine dan Landsat 30 m</span>
          </footer>
        </div>
      </main>
    </div>
  );
};
