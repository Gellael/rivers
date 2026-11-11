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
      <div className="stat-card">
        <div className="stat-val">
          <AnimatedCounter value={totalRivers} />
        </div>
        <div className="stat-label2">Sungai Terpantau</div>
        <div className="stat-sub">5 Pulau Besar Indonesia</div>
      </div>

      <div className="stat-card">
        <div className="stat-val" style={{ color: "#ef4444" }}>
          <AnimatedCounter value={eroding} />
        </div>
        <div className="stat-label2">Dominan Erosi</div>
        <div className="stat-sub">{erosiPct}% sungai mengalami pelebaran tebing</div>
      </div>

      <div className="stat-card">
        <div className="stat-val" style={{ color: "#06b6d4" }}>
          <AnimatedCounter value={accreting} />
        </div>
        <div className="stat-label2">Dominan Akresi</div>
        <div className="stat-sub">{akresiPct}% sungai mengalami sedimentasi</div>
      </div>

      <div className="stat-card">
        <div className="stat-val" style={{ color: "#fbbf24" }}>
          <AnimatedCounter value={totalSeg} />
        </div>
        <div className="stat-label2">Segmen Transek</div>
        <div className="stat-sub">Jarak ukur interval 100m</div>
      </div>
    </div>
  );
};

