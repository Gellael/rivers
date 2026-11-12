import React from "react";
import type { River } from "../../types";
import { fmtRate } from "../../constants";

/* ------------------------------------------------------------------
 * Ilustrasi meander sungai 2010 vs 2020 (dihitung sekali di level modul).
 * Bibir sungai dibangun dari garis tengah + offset normal, lalu
 * zona erosi/akresi diambil dari selisih bibir 2020 terhadap 2010.
 * ------------------------------------------------------------------ */
type Pt = [number, number];
type Side = "left" | "right";

const W = 520;
const H = 560;
const N = 140;

function center(t: number, migrated: boolean): Pt {
  const phase = migrated ? 0.24 : 0;
  const amp = migrated ? 128 : 114;
  const x =
    W * 0.5 +
    Math.sin(t * Math.PI * 1.9 + 0.5 + phase) * amp +
    Math.sin(t * Math.PI * 6 + phase * 2) * 10;
  const y = -30 + t * (H + 60);
  return [x, y];
}

function buildChannel(migrated: boolean) {
  const half = migrated ? 36 : 31;
  const left: Pt[] = [];
  const right: Pt[] = [];
  const mid: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = center(t, migrated);
    const [x1, y1] = center(Math.max(0, t - 0.004), migrated);
    const [x2, y2] = center(Math.min(1, t + 0.004), migrated);
    let tx = x2 - x1;
    let ty = y2 - y1;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const nx = -ty;
    const ny = tx;
    const w = half + Math.sin(t * Math.PI * 9 + (migrated ? 1 : 0)) * 3;
    mid.push([x, y]);
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  }
  return { left, right, mid };
}

const pts = (a: Pt[]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
const line = (a: Pt[]) => `M${pts(a)}`;
const channel = (l: Pt[], r: Pt[]) => `M${pts(l)} L${pts([...r].reverse())} Z`;
const patch = (a: Pt[], b: Pt[], c: number, span = 11) => {
  const i0 = Math.max(0, c - span);
  const i1 = Math.min(N, c + span);
  return `M${pts(a.slice(i0, i1 + 1))} L${pts(b.slice(i0, i1 + 1).reverse())} Z`;
};

const O = buildChannel(false); // 2010
const M = buildChannel(true); // 2020

function hotspot(from: number, to: number) {
  let best = from;
  let bestD = 0;
  for (let i = from; i <= to; i++) {
    const d = M.mid[i][0] - O.mid[i][0];
    if (Math.abs(d) > Math.abs(bestD)) {
      bestD = d;
      best = i;
    }
  }
  const ero: Side = bestD > 0 ? "right" : "left";
  const acc: Side = bestD > 0 ? "left" : "right";
  return { i: best, ero, acc };
}

const SPOTS = [hotspot(25, 70), hotspot(85, 125)];

const CONTOURS = [
  "M-10,70 C120,40 260,110 380,70 S520,40 540,60",
  "M-10,150 C140,120 240,190 380,150 S500,120 540,140",
  "M-10,420 C100,450 230,390 350,430 S500,470 540,440",
  "M-10,500 C130,520 250,470 380,505 S500,540 540,520",
];

interface HeroVisualProps {
  erosi: River | null;
  akresi: River | null;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({ erosi, akresi }) => {
  return (
    <div className="hv" aria-hidden="true">
      <svg className="hv-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="hv-land" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#10261f" />
            <stop offset="60%" stopColor="#0a1815" />
            <stop offset="100%" stopColor="#060d0d" />
          </radialGradient>
          <linearGradient id="hv-water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0e4a66" />
            <stop offset="55%" stopColor="#0a3550" />
            <stop offset="100%" stopColor="#0b2a44" />
          </linearGradient>
          <pattern id="hv-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="#ff5470" strokeWidth="2" strokeOpacity="0.9" />
          </pattern>
          <filter id="hv-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={W} height={H} fill="url(#hv-land)" />

        {CONTOURS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
        ))}

        {/* Alur 2020 (air) */}
        <path d={channel(M.left, M.right)} fill="url(#hv-water)" />
        {/* Jejak 2010 yang kini menjadi daratan (akresi) ditandai di bawah */}
        <path d={channel(O.left, O.right)} fill="rgba(34,211,238,0.10)" />

        {/* Arus air */}
        <path d={line(M.mid)} fill="none" stroke="rgba(125,211,252,0.55)" strokeWidth="2" strokeLinecap="round" className="hv-flow" />

        {/* Zona erosi & akresi */}
        {SPOTS.map((s, k) => (
          <g key={k} className="hv-patch">
            <path d={patch(M[s.ero], O[s.ero], s.i)} fill="rgba(255,84,112,0.5)" stroke="#ff5470" strokeWidth="1.2" />
            <path d={patch(M[s.ero], O[s.ero], s.i)} fill="url(#hv-hatch)" opacity="0.7" />
            <path d={patch(M[s.acc], O[s.acc], s.i)} fill="rgba(34,211,238,0.55)" stroke="#22d3ee" strokeWidth="1.2" />
          </g>
        ))}

        {/* Bibir 2010 (emas, putus-putus) */}
        <path d={line(O.left)} fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeDasharray="6 5" filter="url(#hv-glow)" opacity="0.95" />
        <path d={line(O.right)} fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeDasharray="6 5" filter="url(#hv-glow)" opacity="0.95" />

        {/* Bibir 2020 (pink, digambar animasi) */}
        <path d={line(M.left)} pathLength={1} fill="none" stroke="#ff2255" strokeWidth="2.6" strokeLinecap="round" filter="url(#hv-glow)" className="hv-draw" />
        <path d={line(M.right)} pathLength={1} fill="none" stroke="#ff2255" strokeWidth="2.6" strokeLinecap="round" filter="url(#hv-glow)" className="hv-draw" />

        {/* Penanda titik panas */}
        {SPOTS.map((s, k) => {
          const [ex, ey] = M[s.ero][s.i];
          const [ax, ay] = M[s.acc][s.i];
          return (
            <g key={k}>
              <circle cx={ex} cy={ey} r="6" fill="none" stroke="#ff5470" strokeWidth="1.5" className="hv-ping" />
              <circle cx={ex} cy={ey} r="3" fill="#ff5470" />
              <circle cx={ax} cy={ay} r="6" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="hv-ping" />
              <circle cx={ax} cy={ay} r="3" fill="#22d3ee" />
            </g>
          );
        })}
      </svg>

      <div className="hv-scan" />
      <span className="hv-corner tl" />
      <span className="hv-corner tr" />
      <span className="hv-corner bl" />
      <span className="hv-corner br" />

      <div className="hv-chip year">
        <span className="y10">● 2010</span>
        <span style={{ color: "#64748b" }}>→</span>
        <span className="y20">● 2020</span>
      </div>

      {erosi && (
        <div className="hv-chip ero">
          <div className="hv-chip-label"><i /> Erosi tertinggi</div>
          <div className="hv-chip-name">{erosi.name}</div>
          <div className="hv-chip-val">{fmtRate(erosi.avgRate)}</div>
        </div>
      )}

      {akresi && (
        <div className="hv-chip akr">
          <div className="hv-chip-label"><i /> Akresi tertinggi</div>
          <div className="hv-chip-name">{akresi.name}</div>
          <div className="hv-chip-val">{fmtRate(akresi.avgRate)}</div>
        </div>
      )}

      <div className="hv-chip src">LANDSAT 30M · GEE</div>
    </div>
  );
};