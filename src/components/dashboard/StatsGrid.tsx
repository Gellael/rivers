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

export const StatsGrid: React.FC<StatsGridProps> = ({ totalRivers, eroding, accreting, totalSeg, erosiPct, akresiPct }) => {
  return (
    <div className="ds-ledger">
      <div className="ds-wrap">
        <div className="ds-ledger-grid">
          <div className="ds-fig sky">
            <div className="ds-fig-val ds-num"><AnimatedCounter value={totalRivers} /></div>
            <div className="ds-fig-label">Sungai terpantau</div>
            <div className="ds-fig-sub">Di 5 pulau besar Indonesia</div>
          </div>
          <div className="ds-fig ero">
            <div className="ds-fig-val ds-num"><AnimatedCounter value={eroding} /></div>
            <div className="ds-fig-label">Dominan erosi</div>
            <div className="ds-fig-sub">{erosiPct}% sungai mengalami pelebaran tebing</div>
          </div>
          <div className="ds-fig akr">
            <div className="ds-fig-val ds-num"><AnimatedCounter value={accreting} /></div>
            <div className="ds-fig-label">Dominan akresi</div>
            <div className="ds-fig-sub">{akresiPct}% sungai mengalami sedimentasi</div>
          </div>
          <div className="ds-fig gold">
            <div className="ds-fig-val ds-num"><AnimatedCounter value={totalSeg} /></div>
            <div className="ds-fig-label">Segmen transek</div>
            <div className="ds-fig-sub">Diukur setiap 100 meter</div>
          </div>
        </div>
      </div>
    </div>
  );
};
