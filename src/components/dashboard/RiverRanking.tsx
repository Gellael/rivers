import React from "react";
import type { River } from "../../types";
import { COLORS, ISLANDS, RIVERS, fmtRate } from "../../constants";

interface RiverRankingProps {
  dashIsland: string;
  onSelectIsland: (island: string) => void;
  onSelectRiver: (river: River) => void;
}

export const RiverRanking: React.FC<RiverRankingProps> = ({
  dashIsland,
  onSelectIsland,
  onSelectRiver,
}) => {
  const dashFilteredRivers = dashIsland === "Semua" ? RIVERS : RIVERS.filter((r) => r.island === dashIsland);
  const ranked = [...dashFilteredRivers].sort((a, b) => Math.abs(b.avgRate) - Math.abs(a.avgRate)).slice(0, 8);
  const maxAbs = Math.max(...ranked.map((r) => Math.abs(r.avgRate)), 0.01);

  const MiniBar = ({ rate, max }: { rate: number; max: number }) => {
    const pct = (Math.abs(rate) / max) * 100;
    const isEro = rate > 0;
    return (
      <div style={{ height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden", flex: 1, marginTop: "4px" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "3px",
            background: isEro ? `linear-gradient(90deg, ${COLORS.erosi}, #ff8fa3)` : `linear-gradient(90deg, ${COLORS.akresi}, #67e8f9)`,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    );
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Peringkat Laju Pergeseran Sungai</h2>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Pilih pulau dan klik nama sungai untuk langsung memperbesar peta</div>
        </div>
        <span className="card-badge">{ranked.length} Sungai</span>
      </div>

      <div className="dash-pills">
        {ISLANDS.map((isl) => (
          <button
            key={isl}
            className={`dash-pill ${dashIsland === isl ? "active" : ""}`}
            onClick={() => onSelectIsland(isl)}
          >
            {isl} {isl === "Semua" ? `(${RIVERS.length})` : `(${RIVERS.filter((r) => r.island === isl).length})`}
          </button>
        ))}
      </div>

      <div className="ranking-list">
        {ranked.map((r, i) => (
          <button
            key={r.id}
            className="rank-row2"
            onClick={() => onSelectRiver(r)}
          >
            <span className="rank-num">{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="rank-name">{r.name}</div>
              <div className="rank-meta">{r.province} · {r.island}</div>
              <MiniBar rate={r.avgRate} max={maxAbs} />
            </div>
            <span className={`rank-rate ${r.avgRate > 0 ? "ero" : "akr"}`}>{fmtRate(r.avgRate)}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
