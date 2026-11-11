import React, { useRef, useState } from "react";
import type { YearMode } from "../../types";

interface SatelliteSplitViewerProps {
  onOpenMap: (mode?: YearMode) => void;
}

export const SatelliteSplitViewer: React.FC<SatelliteSplitViewerProps> = ({ onOpenMap }) => {
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSplit = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, Math.round((x / rect.width) * 100)));
    setSplitPos(pct);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateSplit(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateSplit(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className="split-viewer-card" id="vis-simulation">
      <div className="split-header">
        <div className="split-header-left">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 10px #38bdf8" }} />
          <div>
            <div className="split-river-name">Komparasi Dinamika Alur Sungai Indonesia</div>
            <div className="split-coords">Simulasi Morfologi Meander Multitemporal · Resolusi Landsat 30m (2010 vs 2020)</div>
          </div>
        </div>

        <div className="split-presets">
          <button
            className={`split-preset-btn ${splitPos > 85 ? "active" : ""}`}
            onClick={() => setSplitPos(95)}
          >
            100% 2010
          </button>
          <button
            className={`split-preset-btn ${splitPos >= 45 && splitPos <= 55 ? "active" : ""}`}
            onClick={() => setSplitPos(50)}
          >
            Split 50/50
          </button>
          <button
            className={`split-preset-btn ${splitPos < 15 ? "active" : ""}`}
            onClick={() => setSplitPos(5)}
          >
            100% 2020
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="split-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Floating telemetry badges */}
        <div className="split-badge-2010">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24" }} />
          <span>2010 (Landsat 7)</span>
        </div>

        <div className="split-badge-2020">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff2255" }} />
          <span>2020 (Landsat 8)</span>
        </div>

        {/* LAYER 1: BASELINE YEAR 2010 */}
        <div className="split-layer">
          <svg viewBox="0 0 900 380" preserveAspectRatio="none">
            <defs>
              <linearGradient id="satBg2010" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0d1b17" />
                <stop offset="50%" stopColor="#12241d" />
                <stop offset="100%" stopColor="#0a1612" />
              </linearGradient>
              <linearGradient id="water2010" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3d3725" />
                <stop offset="50%" stopColor="#4a422a" />
                <stop offset="100%" stopColor="#383222" />
              </linearGradient>
            </defs>

            {/* Satellite Terrain Texture 2010 */}
            <rect width="900" height="380" fill="url(#satBg2010)" />

            <path d="M 0,60 Q 250,90 450,40 T 900,80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <path d="M 0,310 Q 300,280 600,340 T 900,300" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

            {/* River Channel 2010 */}
            <path
              d="M 0,160 C 180,150 260,260 420,265 C 580,270 650,110 820,110 L 900,115 L 900,205 L 820,200 C 660,200 600,355 420,350 C 250,345 180,235 0,245 Z"
              fill="url(#water2010)"
            />

            {/* Sandbar 2010 */}
            <path d="M 590,140 C 620,130 650,135 660,160 C 640,165 610,160 590,140 Z" fill="#786c4a" opacity="0.6" />

            {/* Garis Bibir 2010 (Kuning Emas) */}
            <path
              d="M 0,160 C 180,150 260,260 420,265 C 580,270 650,110 820,110 L 900,115"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              style={{ filter: "drop-shadow(0 0 5px rgba(251, 191, 36, 0.6))" }}
            />
            <path
              d="M 0,245 C 180,235 250,345 420,350 C 600,355 660,200 820,200 L 900,205"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              style={{ filter: "drop-shadow(0 0 5px rgba(251, 191, 36, 0.6))" }}
            />
          </svg>
        </div>

        {/* LAYER 2: YEAR 2020 (CLIPPED BY SPLIT POSITION) */}
        <div
          className="split-layer"
          style={{
            clipPath: `inset(0 0 0 ${splitPos}%)`,
            WebkitClipPath: `inset(0 0 0 ${splitPos}%)`,
          }}
        >
          <svg viewBox="0 0 900 380" preserveAspectRatio="none">
            <defs>
              <linearGradient id="satBg2020" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#081412" />
                <stop offset="50%" stopColor="#0c1d18" />
                <stop offset="100%" stopColor="#06120e" />
              </linearGradient>
              <linearGradient id="water2020" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2e2b20" />
                <stop offset="50%" stopColor="#3d3725" />
                <stop offset="100%" stopColor="#2b261b" />
              </linearGradient>
              <pattern id="hatchEro" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.8" />
              </pattern>
            </defs>

            {/* Satellite Terrain 2020 */}
            <rect width="900" height="380" fill="url(#satBg2020)" />

            {/* Shifted River Channel 2020 */}
            <path
              d="M 0,160 C 180,150 250,305 420,315 C 570,310 650,90 820,95 L 900,100 L 900,190 L 820,185 C 670,185 580,380 420,380 C 250,375 180,235 0,245 Z"
              fill="url(#water2020)"
            />

            {/* ZONA EROSI TEBING */}
            <path
              d="M 260,260 C 330,300 380,315 450,315 C 430,285 390,270 330,265 Z"
              fill="rgba(239, 68, 68, 0.45)"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
            <path
              d="M 260,260 C 330,300 380,315 450,315 C 430,285 390,270 330,265 Z"
              fill="url(#hatchEro)"
            />

            {/* ZONA AKRESI SEDIMEN */}
            <path
              d="M 620,135 C 655,100 705,95 760,105 C 720,125 680,135 620,135 Z"
              fill="rgba(6, 182, 212, 0.55)"
              stroke="#06b6d4"
              strokeWidth="1.5"
            />

            {/* Garis Bibir 2020 (Pink Terang) */}
            <path
              d="M 0,160 C 180,150 250,305 420,315 C 570,310 650,90 820,95 L 900,100"
              fill="none"
              stroke="#ff2255"
              strokeWidth="2.8"
              style={{ filter: "drop-shadow(0 0 6px rgba(255, 34, 85, 0.8))" }}
            />
            <path
              d="M 0,245 C 180,235 250,375 420,380 C 580,380 670,185 820,185 L 900,190"
              fill="none"
              stroke="#ff2255"
              strokeWidth="2.8"
              style={{ filter: "drop-shadow(0 0 6px rgba(255, 34, 85, 0.8))" }}
            />
          </svg>
        </div>

        {/* Draggable Vertical Splitter Line */}
        <div className="split-divider" style={{ left: `${splitPos}%` }}>
          <div className="split-handle">
            <span>‹ 2010</span>
            <span style={{ color: "#38bdf8" }}>|</span>
            <span>2020 ›</span>
          </div>
        </div>
      </div>

      <div className="split-footer">
        <div className="split-legend-group">
          <div className="split-legend-item">
            <span className="split-indicator-line" style={{ background: "#fbbf24", borderTop: "2px dashed #fbbf24" }} />
            <span>Garis Bibir 2010</span>
          </div>
          <div className="split-legend-item">
            <span className="split-indicator-line" style={{ background: "#ff2255" }} />
            <span>Garis Bibir 2020</span>
          </div>
          <div className="split-legend-item">
            <span className="split-indicator-box" style={{ background: "rgba(239, 68, 68, 0.7)", border: "1px solid #ef4444" }} />
            <span>Zona Erosi Tebing</span>
          </div>
          <div className="split-legend-item">
            <span className="split-indicator-box" style={{ background: "rgba(6, 182, 212, 0.7)", border: "1px solid #06b6d4" }} />
            <span>Zona Akresi Sedimen</span>
          </div>
        </div>

        <button
          className="btn hero-btn-primary"
          style={{ padding: "9px 20px", fontSize: "13px" }}
          onClick={() => onOpenMap("compare")}
        >
          Buka Peta Seluruh Indonesia →
        </button>
      </div>
    </div>
  );
};
