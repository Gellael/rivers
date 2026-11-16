import React from "react";
import { fmtRate } from "../../constants";
import type { River } from "../../types";

interface DonutChartProps {
  eroding: number;
  accreting: number;
  erosiPct: number;
  akresiPct: number;
  widest: River | null;
  narrowest: River | null;
}

export const DonutChart: React.FC<DonutChartProps> = ({ eroding, accreting, erosiPct, akresiPct, widest, narrowest }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  const erosiLen = (erosiPct / 100) * c;
  const akrLen = (akresiPct / 100) * c;

  return (
    <div className="side">
      <section>
        <div className="panel-head">
          <h2 className="panel-title">Erosi dan akresi nasional</h2>
          <p className="panel-sub">Kecenderungan dominan tiap sungai, 2010 ke 2020.</p>
        </div>
        <div className="split-ratio">
          <svg className="donut" viewBox="0 0 140 140" role="img" aria-label={`${erosiPct}% sungai dominan erosi, ${akresiPct}% dominan akresi`}>
            <g transform="rotate(-90 70 70)">
              <circle cx="70" cy="70" r={r} fill="none" stroke="#ff5470" strokeWidth="20" strokeDasharray={`${erosiLen} ${c - erosiLen}`} />
              <circle cx="70" cy="70" r={r} fill="none" stroke="#22d3ee" strokeWidth="20" strokeDasharray={`${akrLen} ${c - akrLen}`} strokeDashoffset={-erosiLen} />
            </g>
            <text x="70" y="77" textAnchor="middle" fill="#e8ecf2" fontSize="26" fontWeight="800" fontFamily="Archivo, sans-serif">{erosiPct}%</text>
          </svg>

          <div className="ratio-list">
            <div className="ratio-item">
              <i style={{ background: "#ff5470" }} />
              <div><b>{eroding} sungai ({erosiPct}%)</b><span>Dominan erosi tebing</span></div>
            </div>
            <div className="ratio-item">
              <i style={{ background: "#22d3ee" }} />
              <div><b>{accreting} sungai ({akresiPct}%)</b><span>Dominan sedimentasi</span></div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="panel-head">
          <h2 className="panel-title">Catatan temuan</h2>
        </div>
        <ul className="notes">
          {widest && widest.avgRate > 0 && (
            <li className="note ero">
              <b className="t">Erosi tertinggi: {widest.name}</b>
              <p>Tebing melebar rata-rata <b>{fmtRate(widest.avgRate)}</b>, gerusan air paling agresif di antara semua sungai.</p>
            </li>
          )}
          {narrowest && narrowest.avgRate < 0 && (
            <li className="note akr">
              <b className="t">Sedimentasi tertinggi: {narrowest.name}</b>
              <p>Alur menyempit <b>{fmtRate(narrowest.avgRate)}</b> karena endapan lumpur yang besar.</p>
            </li>
          )}
          <li className="note">
            <b className="t">Sumber data</b>
            <p>Arsip Landsat USGS/NASA 30 m, diproses lewat Google Earth Engine.</p>
          </li>
        </ul>
      </section>
    </div>
  );
};
