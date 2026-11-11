import React from "react";
import { COLORS, fmtRate } from "../../constants";
import type { River } from "../../types";

interface DonutChartProps {
  eroding: number;
  accreting: number;
  erosiPct: number;
  akresiPct: number;
  widest: River | null;
  narrowest: River | null;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  eroding,
  accreting,
  erosiPct,
  akresiPct,
  widest,
  narrowest,
}) => {
  const r = 54;
  const c = 2 * Math.PI * r;
  const erosiLen = (erosiPct / 100) * c;

  return (
    <div className="dash-right-stack">
      <section className="card">
        <h2>Proporsi Erosi vs Akresi Nasional</h2>
        <div className="chart-wrap">
          <svg width="130" height="130" viewBox="0 0 140 140" style={{ filter: "drop-shadow(0 4px 16px rgba(239,68,68,0.25))" }}>
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={COLORS.erosi}
              strokeWidth="12"
              strokeDasharray={`${erosiLen} ${c - erosiLen}`}
              strokeDashoffset={c / 4}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={COLORS.akresi}
              strokeWidth="12"
              strokeDasharray={`${(akresiPct / 100) * c} ${c - (akresiPct / 100) * c}`}
              strokeDashoffset={c / 4 - erosiLen}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
            <text x="70" y="64" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="800">{erosiPct}%</text>
            <text x="70" y="82" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontWeight="600" letterSpacing="0.05em">EROSI</text>
          </svg>

          <div className="chart-legend">
            <div className="chart-leg-item">
              <span className="leg-dot" style={{ background: COLORS.erosi }} />
              <div>
                <div className="leg-val">{eroding} sungai ({erosiPct}%)</div>
                <div className="leg-desc">Kecenderungan erosi tebing</div>
              </div>
            </div>
            <div className="chart-leg-item">
              <span className="leg-dot" style={{ background: COLORS.akresi }} />
              <div>
                <div className="leg-val">{accreting} sungai ({akresiPct}%)</div>
                <div className="leg-desc">Kecenderungan sedimentasi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Catatan Temuan Data</h2>
        <div className="insight-list">
          {widest && widest.avgRate > 0 && (
            <div className="insight-item ero-border">
              <div>
                <div className="insight-title">Erosi Tertinggi: {widest.name}</div>
                <div className="insight-desc">Mengalami pelebaran tebing rata-rata <b>{fmtRate(widest.avgRate)}</b>, menandakan gerusan air paling agresif.</div>
              </div>
            </div>
          )}
          {narrowest && narrowest.avgRate < 0 && (
            <div className="insight-item akr-border">
              <div>
                <div className="insight-title">Sedimentasi Tertinggi: {narrowest.name}</div>
                <div className="insight-desc">Alur menyempit <b>{fmtRate(narrowest.avgRate)}</b> akibat endapan sedimen lumpur yang signifikan.</div>
              </div>
            </div>
          )}
          <div className="insight-item info-border">
            <div>
              <div className="insight-title">Sumber & Sensor Satelit</div>
              <div className="insight-desc">Diproses menggunakan Google Earth Engine API dari data arsip Landsat USGS/NASA resolusi 30m.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
