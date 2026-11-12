import React from "react";
import { AnimatedCounter } from "../common/AnimatedCounter";

interface StatsGridProps {
  totalRivers: number;
  eroding: number;
  accreting: number;
  totalSeg: number;
  erosiPct: number;
  akresiPct: number;
}

const icon = (children: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const StatsGrid: React.FC<StatsGridProps> = ({
  totalRivers,
  eroding,
  accreting,
  totalSeg,
  erosiPct,
  akresiPct,
}) => {
  return (
    <div className="stats-grid">
      <div className="stat-card tone-sky">
        <div className="stat-icon">{icon(<path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3-3 5-3M2 18c2.5-4 5-4 7.5 0s5 4 7.5 0 3-3 5-3" />)}</div>
        <div className="stat-val">
          <AnimatedCounter value={totalRivers} />
        </div>
        <div className="stat-label2">Sungai Terpantau</div>
        <div className="stat-sub">5 Pulau Besar Indonesia</div>
      </div>

      <div className="stat-card tone-ero">
        <div className="stat-icon">{icon(<><path d="M3 7l6 6 4-4 8 8" /><path d="M15 17h6v-6" /></>)}</div>
        <div className="stat-val">
          <AnimatedCounter value={eroding} />
        </div>
        <div className="stat-label2">Dominan Erosi</div>
        <div className="stat-sub">{erosiPct}% sungai mengalami pelebaran tebing</div>
        <div className="stat-bar" aria-hidden="true"><i style={{ width: `${erosiPct}%` }} /></div>
      </div>

      <div className="stat-card tone-akr">
        <div className="stat-icon">{icon(<><path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z" /></>)}</div>
        <div className="stat-val">
          <AnimatedCounter value={accreting} />
        </div>
        <div className="stat-label2">Dominan Akresi</div>
        <div className="stat-sub">{akresiPct}% sungai mengalami sedimentasi</div>
        <div className="stat-bar" aria-hidden="true"><i style={{ width: `${akresiPct}%` }} /></div>
      </div>

      <div className="stat-card tone-gold">
        <div className="stat-icon">{icon(<><path d="M4 20V4" /><path d="M4 8h16M4 14h16M4 20h16" /><path d="M9 4v16M15 4v16" /></>)}</div>
        <div className="stat-val">
          <AnimatedCounter value={totalSeg} />
        </div>
        <div className="stat-label2">Segmen Transek</div>
        <div className="stat-sub">Jarak ukur interval 100m</div>
      </div>
    </div>
  );
};