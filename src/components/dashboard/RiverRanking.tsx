import React from "react";
import type { River } from "../../types";
import { ISLANDS, RIVERS, fmtRate } from "../../constants";

interface RiverRankingProps {
  dashIsland: string;
  onSelectIsland: (island: string) => void;
  onSelectRiver: (river: River) => void;
}

export const RiverRanking: React.FC<RiverRankingProps> = ({ dashIsland, onSelectIsland, onSelectRiver }) => {
  const pool = dashIsland === "Semua" ? RIVERS : RIVERS.filter((r) => r.island === dashIsland);
  const ranked = [...pool].sort((a, b) => Math.abs(b.avgRate) - Math.abs(a.avgRate)).slice(0, 8);
  const maxAbs = Math.max(...ranked.map((r) => Math.abs(r.avgRate)), 0.01);

  return (
    <section>
      <div className="panel-head">
        <h2 className="panel-title">Peringkat laju pergeseran</h2>
        <p className="panel-sub">Menampilkan {ranked.length} sungai dengan pergeseran terbesar. Klik nama sungai untuk memperbesar peta.</p>
      </div>

      <div className="pills" role="group" aria-label="Filter pulau">
        {ISLANDS.map((isl) => (
          <button key={isl} type="button" className="pill" aria-pressed={dashIsland === isl} onClick={() => onSelectIsland(isl)}>
            {isl}
            <small>{isl === "Semua" ? RIVERS.length : RIVERS.filter((r) => r.island === isl).length}</small>
          </button>
        ))}
      </div>

      <ol className="rank-list">
        {ranked.map((r, i) => {
          const kind = r.avgRate > 0 ? "ero" : "akr";
          return (
            <li key={r.id}>
              <button type="button" className="rank-row" onClick={() => onSelectRiver(r)}>
                <span className="rank-n ds-num">{i + 1}</span>
                <span>
                  <span className="rank-name" style={{ display: "block" }}>{r.name}</span>
                  <span className="rank-meta" style={{ display: "block" }}>{r.province}, {r.island}</span>
                </span>
                <span className={`rank-val ds-num ${kind}`}>{fmtRate(r.avgRate)}</span>
                <span className="rank-bar" aria-hidden="true">
                  <i className={kind} style={{ display: "block", width: `${(Math.abs(r.avgRate) / maxAbs) * 100}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
