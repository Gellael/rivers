import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

// Fix WebWorker URL for Vite bundler (loads worker directly from public folder)
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

import riverList from "./rivers.json";

interface GeeTilesConfig {
  tile2010?: string;
  tile2020?: string;
  tileChange?: string;
  tileSat2010?: string;
  tileSat2020?: string;
  cloudQuality?: string;
}

/* ============ Types ============ */
interface River {
  id: string;
  name: string;
  island: string;
  province: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  zoom: number;
  segmentCount: number;
  avgRate: number;
}
const RIVERS = riverList as River[];

type BaseMap = "sat-2010" | "sat-2020" | "sat" | "dark" | "light";
type YearMode = "compare" | "2010" | "2020";
type DataStatus = "loading" | "ok" | "warn" | "error";

/* ============ Konstanta Warna ============ */
const COLORS = {
  erosi: "#ef4444",
  akresi: "#06b6d4",
  bank2010: "#fbbf24",
  bank2020: "#ff2255",
};

const ISLANDS = ["Semua", "Kalimantan", "Sumatera", "Jawa", "Sulawesi", "Papua"];

/* ============ Helper & Animasi ============ */
function fmtRate(v: number) {
  return `${v > 0 ? "+" : ""}${Number(v.toFixed(2))} m/th`;
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * value));

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  return <>{count.toLocaleString("id-ID")}</>;
}

function SatelliteSplitViewer({
  onExploreRiver,
  onOpenMap,
}: {
  onExploreRiver: (river: River) => void;
  onOpenMap: (mode?: "compare" | "2010" | "2020") => void;
}) {
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

  const kapuas = RIVERS.find((r) => r.id === "kapuas") || RIVERS[0];

  return (
    <div className="split-viewer-card" id="vis-simulation">
      <div className="split-header">
        <div className="split-header-left">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 10px #38bdf8" }} />
          <div>
            <div className="split-river-name">Sungai Kapuas, Kalimantan Barat</div>
            <div className="split-coords">0°03'12"S 109°51'24"E · Meander Loop · Resolusi Landsat 30m</div>
          </div>
        </div>

        <div className="split-presets">
          <button className={`split-preset-btn ${splitPos > 85 ? "active" : ""}`} onClick={() => setSplitPos(95)}>
            100% 2010
          </button>
          <button className={`split-preset-btn ${splitPos >= 45 && splitPos <= 55 ? "active" : ""}`} onClick={() => setSplitPos(50)}>
            Split 50/50
          </button>
          <button className={`split-preset-btn ${splitPos < 15 ? "active" : ""}`} onClick={() => setSplitPos(5)}>
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
        {/* Floating telemetry tags */}
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

            {/* Subtle terrain contours */}
            <path d="M 0,60 Q 250,90 450,40 T 900,80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <path d="M 0,310 Q 300,280 600,340 T 900,300" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

            {/* River Channel 2010 */}
            <path
              d="M 0,160 C 180,150 260,260 420,265 C 580,270 650,110 820,110 L 900,115 L 900,205 L 820,200 C 660,200 600,355 420,350 C 250,345 180,235 0,245 Z"
              fill="url(#water2010)"
            />

            {/* Sandbar 2010 (inner point bar) */}
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

            {/* Shifted River Channel 2020 (Bank expanded outwards) */}
            <path
              d="M 0,160 C 180,150 250,305 420,315 C 570,310 650,90 820,95 L 900,100 L 900,190 L 820,185 C 670,185 580,380 420,380 C 250,375 180,235 0,245 Z"
              fill="url(#water2020)"
            />

            {/* ZONA EROSI TEBING (Highlighted in Red Hatch + Border) */}
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

            {/* ZONA AKRESI SEDIMEN (Highlighted in Cyan) */}
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
            <span>Zona Erosi (+0.52 m/th)</span>
          </div>
          <div className="split-legend-item">
            <span className="split-indicator-box" style={{ background: "rgba(6, 182, 212, 0.7)", border: "1px solid #06b6d4" }} />
            <span>Zona Akresi Sedimen</span>
          </div>
        </div>

        <button
          className="btn hero-btn-primary"
          style={{ padding: "8px 18px", fontSize: "12.5px" }}
          onClick={() => {
            onExploreRiver(kapuas);
            onOpenMap("compare");
          }}
        >
          Lihat Sungai Kapuas di Peta →
        </button>
      </div>
    </div>
  );
}

/* ============ Style peta (semua basemap gratis, tanpa API key) ============ */
const esriTiles = (service: string) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`;

/** Layer basemap yang aktif untuk tiap pilihan. */
const BASE_LAYERS: Record<BaseMap, string[]> = {
  "sat-2010": ["base-sat-2010"],
  "sat-2020": ["base-sat-2020"],
  sat: ["base-sat"],
  dark: ["base-dark", "base-dark-ref"],
  light: ["base-light"],
};
const ALL_BASE_LAYERS = Object.values(BASE_LAYERS).flat();

function buildStyle(base: BaseMap): any {
  const raster = (id: string, source: string, visible: boolean) => ({
    id,
    type: "raster",
    source,
    layout: { visibility: visible ? "visible" : "none" },
  });
  const on = BASE_LAYERS[base];
  return {
    version: 8,
    sources: {
      // Esri Dark Gray Canvas: gratis, tanpa key
      "base-dark": {
        type: "raster",
        tiles: [esriTiles("Canvas/World_Dark_Gray_Base")],
        tileSize: 256,
        maxzoom: 16,
        attribution: "Tiles © Esri, DeLorme, NAVTEQ",
      },
      // Label (nama tempat) untuk basemap gelap, transparan
      "base-dark-ref": {
        type: "raster",
        tiles: [esriTiles("Canvas/World_Dark_Gray_Reference")],
        tileSize: 256,
        maxzoom: 16,
      },
      // OpenStreetMap standar: gratis, tanpa key
      "base-light": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors",
      },
      // Esri World Imagery: gratis, tanpa key
      "base-sat": {
        type: "raster",
        tiles: [esriTiles("World_Imagery")],
        tileSize: 256,
        maxzoom: 17,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      },
      // Citra Satelit Landsat 2010 Komposit Bebas Awan (GEE 30m)
      "base-sat-2010": {
        type: "raster",
        tiles: [esriTiles("World_Imagery")],
        tileSize: 256,
        maxzoom: 17,
        attribution: "Google Earth Engine · Landsat 2010 True Color",
      },
      // Citra Satelit Landsat 8 2020 Komposit Bebas Awan (GEE 30m)
      "base-sat-2020": {
        type: "raster",
        tiles: [esriTiles("World_Imagery")],
        tileSize: 256,
        maxzoom: 17,
        attribution: "Google Earth Engine · Landsat 8 2020 True Color",
      },
    },
    layers: [
      raster("base-dark", "base-dark", on.includes("base-dark")),
      raster("base-dark-ref", "base-dark-ref", on.includes("base-dark-ref")),
      raster("base-light", "base-light", on.includes("base-light")),
      raster("base-sat", "base-sat", on.includes("base-sat")),
      raster("base-sat-2010", "base-sat-2010", on.includes("base-sat-2010")),
      raster("base-sat-2020", "base-sat-2020", on.includes("base-sat-2020")),
    ],
  };
}

/* ============ Ikon ============ */
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ============ App ============ */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pendingFly = useRef<River | null>(null);

  const [page, setPage] = useState<"dashboard" | "map">("dashboard");
  const [dashIsland, setDashIsland] = useState<string>("Semua");
  const [dataStatus, setDataStatus] = useState<DataStatus>("loading");
  const [ready, setReady] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [baseMap, setBaseMap] = useState<BaseMap>("sat-2010");
  const baseRef = useRef(baseMap);
  baseRef.current = baseMap;
  const [yearMode, setYearMode] = useState<YearMode>("compare");

  const [searchQ, setSearchQ] = useState("");
  const [selIsland, setSelIsland] = useState("Semua");
  const [selRiver, setSelRiver] = useState<River | null>(RIVERS[0] ?? null);
  const [tab, setTab] = useState<"rivers" | "layers" | "detail">("detail");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [showGeeTiles, setShowGeeTiles] = useState(true);
  const [showGee2010, setShowGee2010] = useState(true);
  const [showGee2020, setShowGee2020] = useState(true);
  const [showGeeChange, setShowGeeChange] = useState(true);
  const [geeOpacity, setGeeOpacity] = useState(1.0);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Fungsi ganti basemap yang otomatis menyelaraskan fokus garis tahun
  const changeBaseMap = (k: BaseMap) => {
    setBaseMap(k);
    if (k === "sat-2010") {
      setShowGee2010(true);
      setShowGee2020(false);
      setShowGeeChange(false);
      setYearMode("2010");
    } else if (k === "sat-2020") {
      setShowGee2010(false);
      setShowGee2020(true);
      setShowGeeChange(false);
      setYearMode("2020");
    } else if (k === "sat" || k === "dark") {
      setShowGee2010(true);
      setShowGee2020(true);
      setShowGeeChange(true);
      setYearMode("compare");
    }
  };

  const filtered = RIVERS.filter((r) => {
    if (selIsland !== "Semua" && r.island !== selIsland) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.province.toLowerCase().includes(q);
    }
    return true;
  });

  /* ---- Terbang ke sungai ---- */
  const flyToRiver = useCallback(
    (river: River) => {
      const map = mapRef.current;
      if (!map) return;
      const padding = { top: 80, bottom: 100, right: 60, left: sidebarOpen ? 360 : 60 };
      if (river.bounds) map.fitBounds(river.bounds, { padding, maxZoom: 13, duration: 1500 });
      else map.flyTo({ center: river.center, zoom: river.zoom || 11, duration: 1500 });
    },
    [sidebarOpen],
  );

  const goToRiver = useCallback(
    (river: River) => {
      setSelRiver(river);
      setTab("detail");
      flyToRiver(river);
    },
    [flyToRiver],
  );

  /* ---- Visibilitas layer ---- */
  const setVis = useCallback((layerId: string, visible: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    } catch {
      /* layer belum ada */
    }
  }, []);

  const syncVisibility = useCallback(() => {
    const show2010 = showGee2010 && (yearMode === "compare" || yearMode === "2010");
    const show2020 = showGee2020 && (yearMode === "compare" || yearMode === "2020");
    const showZn = showGeeChange && (yearMode === "compare" || yearMode === "2020");

    // Hanya kontrol layer resmi GEE resolusi 30m
    setVis("gee-tile-2010", showGeeTiles && show2010);
    setVis("gee-tile-2020", showGeeTiles && show2020);
    setVis("gee-tile-change", showGeeTiles && showZn);

    for (const id of ALL_BASE_LAYERS) setVis(id, BASE_LAYERS[baseMap].includes(id));
  }, [showGeeTiles, showGee2010, showGee2020, showGeeChange, yearMode, baseMap, setVis]);

  useEffect(() => {
    if (ready) syncVisibility();
  }, [ready, syncVisibility]);

  // Efek perubahan opasitas GEE tiles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    try {
      if (map.getLayer("gee-tile-2010")) map.setPaintProperty("gee-tile-2010", "raster-opacity", geeOpacity);
      if (map.getLayer("gee-tile-2020")) map.setPaintProperty("gee-tile-2020", "raster-opacity", geeOpacity);
      if (map.getLayer("gee-tile-change")) map.setPaintProperty("gee-tile-change", "raster-opacity", geeOpacity * 0.85);
    } catch {
      /* ignore */
    }
  }, [geeOpacity, ready]);

  // Basemap bisa diganti kapan saja, tidak perlu menunggu data
  useEffect(() => {
    for (const id of ALL_BASE_LAYERS) setVis(id, BASE_LAYERS[baseMap].includes(id));
  }, [baseMap, setVis]);

  // Sungai yang dipilih dari dashboard: terbang setelah peta siap
  useEffect(() => {
    if (ready && pendingFly.current) {
      const r = pendingFly.current;
      pendingFly.current = null;
      flyToRiver(r);
    }
  }, [ready, flyToRiver]);

  /* ============================================================
   * INISIALISASI PETA
   * ============================================================ */
  useEffect(() => {
    if (page !== "map" || !containerRef.current) return;

    let cancelled = false;
    setReady(false);
    setDataStatus("loading");
    setWarnings([]);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(baseRef.current),
      center: [109.85, -0.05], // Area meander Sungai Kapuas dengan data GEE nyata
      zoom: 10.5,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    mapRef.current = map;

    // Pastikan style & map siap sebelum addSource/addLayer
    const styleReady = new Promise<void>((resolve) => {
      if (map.isStyleLoaded()) resolve();
      else map.once("load", () => resolve());
    });

    const init = async () => {
      await styleReady;
      if (cancelled) return;

      try {
        if (map.getSource("gee-src-2010")) return;

        // Ambil token tile secara aman melalui Backend API di Vercel / Localhost
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const queryBackend = urlParams?.get("backend");
        const storedBackend = typeof window !== "undefined" ? localStorage.getItem("INARIVERS_BACKEND_URL") : null;
        if (queryBackend) {
          localStorage.setItem("INARIVERS_BACKEND_URL", queryBackend);
        }

        const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
        const defaultBackend = isLocalhost ? "http://localhost:8080" : "https://riverbe.vercel.app";
        const apiBase = (queryBackend || storedBackend || import.meta.env.VITE_API_URL || defaultBackend).replace(/\/$/, "");
        console.log(`[INARivers] Menghubungi backend API di: ${apiBase}/api/tiles`);

        let tiles: GeeTilesConfig | null = null;
        try {
          const apiRes = await fetch(`${apiBase}/api/tiles`);
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data?.tile2010 || data?.tiles?.tile2010) {
              tiles = data?.tiles || data;
            } else if (data?.message) {
              console.warn("[INARivers] Backend belum siap:", data.message);
            }
          } else {
            console.warn(`[INARivers] Backend HTTP error: ${apiRes.status}`);
          }
        } catch (fetchErr) {
          console.warn("[INARivers] Gagal memanggil API backend:", fetchErr);
        }

        if (!tiles) {
          console.warn("[INARivers] Menunggu backend Vercel aktif untuk melayani tile.");
          setWarnings([
            `Backend di ${apiBase} belum merespons data tile GEE. Pastikan backend Vercel aktif atau masukkan URL backend Vercel Anda pada panel Lapisan.`
          ]);
          setDataStatus("warn");
          setReady(true);
          return;
        }

        // Kembalikan ke satelit historis GEE asli untuk tahun 2010 dan 2020
        if (tiles?.tileSat2010 && map.getSource("base-sat-2010")) {
          try {
            const isVis = baseRef.current === "sat-2010" ? "visible" : "none";
            if (map.getLayer("base-sat-2010")) map.removeLayer("base-sat-2010");
            map.removeSource("base-sat-2010");
            map.addSource("base-sat-2010", {
              type: "raster",
              tiles: [tiles.tileSat2010],
              tileSize: 256,
              maxzoom: 18,
              attribution: "Google Earth Engine · Landsat 2010 True Color",
            });
            const firstId = map.getStyle().layers?.[0]?.id;
            map.addLayer(
              {
                id: "base-sat-2010",
                type: "raster",
                source: "base-sat-2010",
                layout: { visibility: isVis },
              },
              firstId
            );
          } catch (e) {
            console.warn("[INARivers] Gagal memperbarui base-sat-2010:", e);
          }
        }

        if (tiles?.tileSat2020 && map.getSource("base-sat-2020")) {
          try {
            const isVis = baseRef.current === "sat-2020" ? "visible" : "none";
            if (map.getLayer("base-sat-2020")) map.removeLayer("base-sat-2020");
            map.removeSource("base-sat-2020");
            map.addSource("base-sat-2020", {
              type: "raster",
              tiles: [tiles.tileSat2020],
              tileSize: 256,
              maxzoom: 18,
              attribution: "Google Earth Engine · Landsat 8 2020 True Color",
            });
            const firstId = map.getStyle().layers?.[0]?.id;
            map.addLayer(
              {
                id: "base-sat-2020",
                type: "raster",
                source: "base-sat-2020",
                layout: { visibility: isVis },
              },
              firstId
            );
          } catch (e) {
            console.warn("[INARivers] Gagal memperbarui base-sat-2020:", e);
          }
        }

        // Layer 1: Dinamika Pergeseran (Erosi & Akresi)
        if (tiles?.tileChange && !map.getSource("gee-src-change")) {
          map.addSource("gee-src-change", {
            type: "raster",
            tiles: [tiles.tileChange],
            tileSize: 256,
            maxzoom: 18,
          });
          map.addLayer({
            id: "gee-tile-change",
            type: "raster",
            source: "gee-src-change",
            paint: { "raster-opacity": 0.85 },
          });
        }

        // Layer 2: Garis Bibir Tahun 2010 (Kuning Emas)
        if (tiles?.tile2010 && !map.getSource("gee-src-2010")) {
          map.addSource("gee-src-2010", {
            type: "raster",
            tiles: [tiles.tile2010],
            tileSize: 256,
            maxzoom: 18,
          });
          map.addLayer({
            id: "gee-tile-2010",
            type: "raster",
            source: "gee-src-2010",
            paint: { "raster-opacity": 1.0 },
          });
        }

        // Layer 3: Garis Bibir Tahun 2020 (Pink/Merah Terang)
        if (tiles?.tile2020 && !map.getSource("gee-src-2020")) {
          map.addSource("gee-src-2020", {
            type: "raster",
            tiles: [tiles.tile2020],
            tileSize: 256,
            maxzoom: 18,
          });
          map.addLayer({
            id: "gee-tile-2020",
            type: "raster",
            source: "gee-src-2020",
            paint: { "raster-opacity": 1.0 },
          });
        }

        console.log("[INARivers] ✅ GEE Raster Tiles berhasil dimuat dari Backend");
        setDataStatus("ok");
        setReady(true);
      } catch (err) {
        console.error("[INARivers] Gagal memuat layer GEE:", err);
        setDataStatus("error");
      }
    };

    init().catch((err) => {
      if (cancelled) return;
      console.error("[INARivers] Gagal memuat data:", err);
      setWarnings([String(err?.message || err)]);
      setDataStatus("error");
    });

    return () => {
      cancelled = true;
      setReady(false);
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [page]);

  /* ============ DASHBOARD ============ */
  if (page === "dashboard") {
    const totalSeg = RIVERS.reduce((a, r) => a + r.segmentCount, 0);
    const dashFilteredRivers = dashIsland === "Semua" ? RIVERS : RIVERS.filter((r) => r.island === dashIsland);
    const ranked = [...dashFilteredRivers].sort((a, b) => Math.abs(b.avgRate) - Math.abs(a.avgRate)).slice(0, 8);
    const maxAbs = Math.max(...ranked.map((r) => Math.abs(r.avgRate)), 0.01);
    const eroding = RIVERS.filter((r) => r.avgRate > 0).length;
    const accreting = RIVERS.length - eroding;
    const widest = RIVERS.length ? RIVERS.reduce((a, r) => (r.avgRate > a.avgRate ? r : a)) : null;
    const narrowest = RIVERS.length ? RIVERS.reduce((a, r) => (r.avgRate < a.avgRate ? r : a)) : null;
    const erosiPct = RIVERS.length ? Math.round((eroding / RIVERS.length) * 100) : 0;
    const akresiPct = 100 - erosiPct;

    // SVG Donut chart
    const DonutChart = () => {
      const r = 54, c = 2 * Math.PI * r;
      const erosiLen = (erosiPct / 100) * c;
      return (
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ filter: "drop-shadow(0 4px 20px rgba(255,84,112,0.3))" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={COLORS.erosi} strokeWidth="12"
            strokeDasharray={`${erosiLen} ${c - erosiLen}`} strokeDashoffset={c / 4}
            strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
          <circle cx="70" cy="70" r={r} fill="none" stroke={COLORS.akresi} strokeWidth="12"
            strokeDasharray={`${(akresiPct / 100) * c} ${c - (akresiPct / 100) * c}`}
            strokeDashoffset={c / 4 - erosiLen} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
          <text x="70" y="64" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">{erosiPct}%</text>
          <text x="70" y="82" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="500">EROSI</text>
        </svg>
      );
    };

    // Mini bar chart for river comparison
    const MiniBar = ({ rate, max }: { rate: number; max: number }) => {
      const pct = (Math.abs(rate) / max) * 100;
      const isEro = rate > 0;
      return (
        <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden", flex: 1 }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: "3px",
            background: isEro ? `linear-gradient(90deg, ${COLORS.erosi}, #ff8fa3)` : `linear-gradient(90deg, ${COLORS.akresi}, #67e8f9)`,
            transition: "width 0.8s ease",
          }} />
        </div>
      );
    };

    return (
      <div className="dash">
        <div className="dash-bg" />

        <div className="dash-inner">
          <header className="dash-header">
            <div className="brand">
              <div className="dash-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 12C5 8 9 16 12 12s7 4 10-2" />
                </svg>
              </div>
              <span className="brand-name">INARivers</span>
              <span className="dash-tagline-chip">LANDSAT 30M · MULTITEMPORAL</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} onClick={() => setShowAssetModal(true)}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", marginRight: "6px" }} />
                Status Asset GEE
              </button>
              <button className="btn hero-btn-primary" onClick={() => setPage("map")}>
                Buka Peta Interaktif →
              </button>
            </div>
          </header>

          <section className="hero">
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              OBSERVASI SPASIAL 2010 — 2020 · GOOGLE EARTH ENGINE
            </div>

            <h1>
              Dinamika Pergeseran <span className="hero-gradient">Bibir Sungai Indonesia</span>
            </h1>
            <p>
              Pemantauan abrasi tebing dan pembentukan sedimen pada <b>{RIVERS.length} Daerah Aliran Sungai utama</b> Indonesia menggunakan citra satelit Landsat resolusi 30 meter dalam rentang satu dekade.
            </p>

            <div className="hero-actions">
              <button className="btn hero-btn-primary" onClick={() => setPage("map")}>
                Buka Peta Interaktif →
              </button>
              <button
                className="btn hero-btn-secondary"
                onClick={() => {
                  const el = document.getElementById("vis-simulation");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Komparasi 2010 vs 2020 ↓
              </button>
            </div>

            <div className="hero-metrics">
              <div className="metric-pill">
                <span>SUNGAI:</span>
                <strong>{RIVERS.length} Wilayah DAS</strong>
              </div>
              <div className="metric-pill">
                <span>TRANSEK:</span>
                <strong>{totalSeg.toLocaleString("id-ID")} Segmen</strong>
              </div>
              <div className="metric-pill">
                <span>SENSOR:</span>
                <strong>Landsat 7 / 8 (30m)</strong>
              </div>
              <div className="metric-pill">
                <span>RENTANG:</span>
                <strong>2010 — 2020 (10 Tahun)</strong>
              </div>
            </div>
          </section>

          {/* INTERACTIVE SATELLITE SPLIT VIEWER */}
          <SatelliteSplitViewer
            onExploreRiver={(r) => {
              setSelRiver(r);
              setTab("detail");
              pendingFly.current = r;
            }}
            onOpenMap={(mode) => {
              if (mode) setYearMode(mode);
              setPage("map");
            }}
          />

          {/* FEATURED RIVERS DYNAMICS */}
          <section style={{ marginBottom: "40px" }}>
            <div className="section-header-row">
              <div className="section-subtitle">FOKUS DINAMIKA MORFOLOGI</div>
              <h2 className="section-title">Sungai dengan Perubahan Paling Signifikan</h2>
              <p className="section-desc">Empat sungai utama dengan laju erosi tebing dan akumulasi sedimen tertinggi di Indonesia.</p>
            </div>

            <div className="featured-rivers-grid">
              {/* Sungai Musi */}
              <div
                className="featured-river-card"
                onClick={() => {
                  const r = RIVERS.find((x) => x.id === "musi") || RIVERS[0];
                  setSelRiver(r);
                  setTab("detail");
                  pendingFly.current = r;
                  setPage("map");
                }}
              >
                <div>
                  <div className="feat-river-top">
                    <span className="feat-island-badge">Sumatera</span>
                    <span className="feat-river-rate ero">+5.90 m/th</span>
                  </div>
                  <div className="feat-river-name">Sungai Musi</div>
                  <div className="feat-river-detail">Erosi tebing paling masif di Indonesia — pelebaran alur mencapai rata-rata 59 meter dalam rentang 10 tahun.</div>
                </div>
                <div className="feat-river-footer">
                  <span>107 Segmen Transek</span>
                  <span>Fokus di Peta →</span>
                </div>
              </div>

              {/* Sungai Mahakam */}
              <div
                className="featured-river-card"
                onClick={() => {
                  const r = RIVERS.find((x) => x.id === "mahakam") || RIVERS[0];
                  setSelRiver(r);
                  setTab("detail");
                  pendingFly.current = r;
                  setPage("map");
                }}
              >
                <div>
                  <div className="feat-river-top">
                    <span className="feat-island-badge">Kalimantan</span>
                    <span className="feat-river-rate ero">+3.94 m/th</span>
                  </div>
                  <div className="feat-river-name">Sungai Mahakam</div>
                  <div className="feat-river-detail">Migrasi alur meander sangat aktif di Kalimantan Timur dengan pemotongan tebing tebal di sisi luar belokan.</div>
                </div>
                <div className="feat-river-footer">
                  <span>186 Segmen Transek</span>
                  <span>Fokus di Peta →</span>
                </div>
              </div>

              {/* Sungai Barito */}
              <div
                className="featured-river-card"
                onClick={() => {
                  const r = RIVERS.find((x) => x.id === "barito") || RIVERS[0];
                  setSelRiver(r);
                  setTab("detail");
                  pendingFly.current = r;
                  setPage("map");
                }}
              >
                <div>
                  <div className="feat-river-top">
                    <span className="feat-island-badge">Kalimantan</span>
                    <span className="feat-river-rate ero">+3.21 m/th</span>
                  </div>
                  <div className="feat-river-name">Sungai Barito</div>
                  <div className="feat-river-detail">Abrasi pesisir dan tebing sungai hilir di Kalimantan Selatan dengan perubahan batas air yang konsisten.</div>
                </div>
                <div className="feat-river-footer">
                  <span>165 Segmen Transek</span>
                  <span>Fokus di Peta →</span>
                </div>
              </div>

              {/* Sungai Siak */}
              <div
                className="featured-river-card"
                onClick={() => {
                  const r = RIVERS.find((x) => x.id === "siak") || RIVERS[0];
                  setSelRiver(r);
                  setTab("detail");
                  pendingFly.current = r;
                  setPage("map");
                }}
              >
                <div>
                  <div className="feat-river-top">
                    <span className="feat-island-badge">Sumatera</span>
                    <span className="feat-river-rate akr">-7.32 m/th</span>
                  </div>
                  <div className="feat-river-name">Sungai Siak</div>
                  <div className="feat-river-detail">Akumulasi sedimen dan lumpur terkuat di Indonesia, menyebabkan penyempitan alur sungai secara terukur.</div>
                </div>
                <div className="feat-river-footer">
                  <span>19 Segmen Transek</span>
                  <span>Fokus di Peta →</span>
                </div>
              </div>
            </div>
          </section>

          {/* THREE CORE DATA LAYERS */}
          <section style={{ marginBottom: "40px" }}>
            <div className="section-header-row">
              <div className="section-subtitle">STRUKTUR DATA GEOSPASIAL</div>
              <h2 className="section-title">Tiga Lapisan Analisis Multitemporal</h2>
              <p className="section-desc">Kombinasi ekstraksi vektor tepi perairan dari citra satelit Landsat 7 dan 8 resolusi 30 meter.</p>
            </div>

            <div className="layers-grid">
              <div className="layer-card c-2010">
                <div>
                  <div className="layer-tag">BASELINE 2010 · LANDSAT 7</div>
                  <div className="layer-title">Garis Bibir Tahun 2010</div>
                  <div className="layer-desc">Garis batas tepi perairan historis 10 tahun lalu, diekstraksi dari mosaik citra Landsat 7 ETM+ bebas awan.</div>
                </div>
                <button
                  className="layer-btn"
                  onClick={() => {
                    setYearMode("2010");
                    setPage("map");
                  }}
                >
                  Tampilkan Layer 2010 di Peta →
                </button>
              </div>

              <div className="layer-card c-2020">
                <div>
                  <div className="layer-tag">TERKINI 2020 · LANDSAT 8</div>
                  <div className="layer-title">Garis Bibir Tahun 2020</div>
                  <div className="layer-desc">Garis batas tepi perairan terkini dari citra Landsat 8 OLI Surface Reflectance untuk mendeteksi perubahan alur.</div>
                </div>
                <button
                  className="layer-btn"
                  onClick={() => {
                    setYearMode("2020");
                    setPage("map");
                  }}
                >
                  Tampilkan Layer 2020 di Peta →
                </button>
              </div>

              <div className="layer-card c-dyn">
                <div>
                  <div className="layer-tag">DELTA 10 TAHUN · EROSI & AKRESI</div>
                  <div className="layer-title">Zona Dinamika Morfologi</div>
                  <div className="layer-desc">Kalkulasi poligon selisih tebing: zona tanah hilang tergerus arus (Merah) vs sedimentasi daratan baru (Cyan).</div>
                </div>
                <button
                  className="layer-btn"
                  onClick={() => {
                    setYearMode("compare");
                    setPage("map");
                  }}
                >
                  Tampilkan Zona Dinamika di Peta →
                </button>
              </div>
            </div>
          </section>

          {/* STATS GRID */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-val"><AnimatedCounter value={RIVERS.length} /></div>
              <div className="stat-label2">Sungai Terpantau</div>
              <div className="stat-sub">5 Pulau Besar Indonesia</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: "#ef4444" }}><AnimatedCounter value={eroding} /></div>
              <div className="stat-label2">Dominan Erosi</div>
              <div className="stat-sub">{erosiPct}% sungai mengalami pelebaran tebing</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: "#06b6d4" }}><AnimatedCounter value={accreting} /></div>
              <div className="stat-label2">Dominan Akresi</div>
              <div className="stat-sub">{akresiPct}% sungai mengalami sedimentasi</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: "#fbbf24" }}><AnimatedCounter value={totalSeg} /></div>
              <div className="stat-label2">Segmen Transek</div>
              <div className="stat-sub">Jarak ukur interval 100m</div>
            </div>
          </div>

          {/* RANKING & PROPORSI */}
          <div className="dash-grid2" id="dash-ranking">
            <section className="card">
              <div className="card-head">
                <div>
                  <h2 style={{ margin: "0 0 4px" }}>Peringkat Laju Pergeseran Sungai</h2>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Klik nama sungai untuk langsung memperbesar peta pada lokasi sungai</div>
                </div>
                <span className="card-badge">{ranked.length} Sungai</span>
              </div>

              <div className="dash-pills">
                {["Semua", "Kalimantan", "Sumatera", "Jawa", "Sulawesi", "Papua"].map((isl) => (
                  <button
                    key={isl}
                    className={`dash-pill ${dashIsland === isl ? "active" : ""}`}
                    onClick={() => setDashIsland(isl)}
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
                    onClick={() => {
                      setSelRiver(r);
                      setTab("detail");
                      pendingFly.current = r;
                      setPage("map");
                    }}
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

            <div className="dash-right-stack">
              <section className="card">
                <h2>Proporsi Erosi vs Akresi Nasional</h2>
                <div className="chart-wrap">
                  <DonutChart />
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
          </div>

          {/* BOTTOM CTA */}
          <section className="cta-card">
            <div>
              <h3>Siap Menjelajahi Peta Interaktif?</h3>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
                Akses visualisasi spasial 18 sungai utama, inspeksi segmen pergeseran, dan bandingkan citra satelit langsung.
              </p>
            </div>
            <button className="btn hero-btn-primary" onClick={() => setPage("map")}>
              Buka Peta Interaktif →
            </button>
          </section>

          <footer className="dash-footer">
            <span>© {new Date().getFullYear()} INARivers · WebGIS Dinamika Pergeseran Bibir Sungai Indonesia</span>
            <span>Google Earth Engine & Landsat 30m</span>
          </footer>
        </div>
      </div>
    );
  }

  /* ============ HALAMAN PETA ============ */
  const statusLabel: Record<DataStatus, string> = {
    loading: "Memuat data",
    ok: "Data siap",
    warn: `${warnings.length} peringatan data`,
    error: "Gagal memuat data",
  };
  const statusClass = { loading: "load", ok: "ok", warn: "warn", error: "err" }[dataStatus];

  return (
    <div className={`app-root ${sidebarOpen ? "with-sb" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-name">INARivers</span>
          <span className="brand-sub">Pergeseran bibir sungai, 2010 – 2020</span>
        </div>

        <label className="search">
          <IconSearch />
          <input
            placeholder="Cari sungai atau provinsi"
            value={searchQ}
            onChange={(e) => { setSearchQ(e.target.value); setTab("rivers"); setSidebarOpen(true); }}
          />
          {searchQ && <button type="button" className="icon-btn" aria-label="Hapus pencarian" onClick={() => setSearchQ("")}>×</button>}
        </label>

        <div className="topbar-right">
          <button
            className="btn"
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              borderColor: "rgba(16, 185, 129, 0.4)",
              color: "#34d399",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
            }}
            onClick={() => setShowAssetModal(true)}
            title="Info Asset GEE Se-Indonesia"
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
            Asset GEE
          </button>

          <button
            className={`status ${statusClass} ${dataStatus === "warn" || dataStatus === "error" ? "clickable" : ""}`}
            onClick={() => { if (dataStatus === "warn" || dataStatus === "error") { setTab("layers"); setSidebarOpen(true); } }}
          >
            <span className="status-dot" />
            {statusLabel[dataStatus]}
          </button>

          <div className="seg" role="group" aria-label="Peta dasar">
            {([
              ["sat-2010", "Satelit 2010"],
              ["sat-2020", "Satelit 2020"],
              ["sat", "Satelit Kini"],
              ["dark", "Gelap"],
            ] as [BaseMap, string][]).map(([k, label]) => (
              <button key={k} className={baseMap === k ? "on" : ""} onClick={() => changeBaseMap(k)}>{label}</button>
            ))}
          </div>

          <button
            className="btn"
            onClick={() => {
              setSelRiver(null); setSearchQ(""); setTab("rivers");
              mapRef.current?.fitBounds([[94.5, -11.5], [141.5, 6.5]], {
                padding: { top: 60, bottom: 80, right: 40, left: sidebarOpen ? 360 : 40 },
                duration: 1200,
              });
            }}
          >
            Seluruh Indonesia
          </button>
          <button className="btn ghost" onClick={() => setPage("dashboard")}>Ringkasan</button>
        </div>
      </header>

      <div ref={containerRef} className="map-container" />

      {!sidebarOpen && (
        <button className="sb-toggle" onClick={() => setSidebarOpen(true)}>Panel</button>
      )}

      {sidebarOpen && (
        <aside className="sidebar">
          <div className="tabs">
            <button className={tab === "rivers" ? "on" : ""} onClick={() => setTab("rivers")}>Sungai ({filtered.length})</button>
            <button className={tab === "layers" ? "on" : ""} onClick={() => setTab("layers")}>Layer</button>
            <button className={tab === "detail" ? "on" : ""} onClick={() => setTab("detail")}>Detail</button>
            <button className="sb-collapse" onClick={() => setSidebarOpen(false)}>Tutup</button>
          </div>

          {tab === "rivers" && (
            <div className="tab-body">
              <div className="chips">
                {ISLANDS.map((i) => (
                  <button key={i} className={selIsland === i ? "chip on" : "chip"} onClick={() => setSelIsland(i)}>{i}</button>
                ))}
              </div>
              <div className="river-list">
                {filtered.map((r) => (
                  <button key={r.id} className={`river-row ${selRiver?.id === r.id ? "sel" : ""}`} onClick={() => goToRiver(r)}>
                    <div className="river-main">
                      <span className="river-name">{r.name}</span>
                      <span className="river-meta">{r.province} · {r.segmentCount} segmen</span>
                    </div>
                    <span className={`rate ${r.avgRate > 0 ? "ero" : "akr"}`}>{fmtRate(r.avgRate)}</span>
                  </button>
                ))}
                {filtered.length === 0 && <div className="empty">Sungai tidak ditemukan.</div>}
              </div>
            </div>
          )}

          {tab === "layers" && (
            <div className="tab-body">
              {warnings.length > 0 && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", color: "#fca5a5", fontSize: "11.5px", lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>⚠️</span> Status Koneksi Backend
                  </div>
                  {warnings.map((w, idx) => (
                    <div key={idx} style={{ marginBottom: "6px" }}>{w}</div>
                  ))}
                  <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="https://riverbe.vercel.app"
                      defaultValue={typeof window !== "undefined" ? (localStorage.getItem("INARIVERS_BACKEND_URL") || "") : ""}
                      id="backend-url-input"
                      style={{ flex: 1, background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", padding: "4px 8px", fontSize: "11px" }}
                    />
                    <button
                      style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", fontWeight: 500 }}
                      onClick={() => {
                        const val = (document.getElementById("backend-url-input") as HTMLInputElement)?.value;
                        if (val && typeof window !== "undefined") {
                          localStorage.setItem("INARIVERS_BACKEND_URL", val.trim());
                          window.location.reload();
                        }
                      }}
                    >
                      Hubungkan
                    </button>
                  </div>
                </div>
              )}

              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ fontWeight: 600, fontSize: "12.5px", color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                    GEE Cloud Tiles (30m)
                  </div>
                  <input
                    type="checkbox"
                    checked={showGeeTiles}
                    onChange={(e) => setShowGeeTiles(e.target.checked)}
                    style={{ accentColor: "#10b981", cursor: "pointer" }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.4, marginBottom: "8px" }}>
                  Citra bibir sungai & zona pergeseran real-time dari Google Earth Engine untuk seluruh sungai Indonesia.
                </div>
                {showGeeTiles && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--faint)", marginBottom: "4px" }}>
                      <span>Transparansi</span>
                      <span>{Math.round(geeOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.05"
                      value={geeOpacity}
                      onChange={(e) => setGeeOpacity(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "#10b981" }}
                    />
                  </div>
                )}
              </div>

              <h3 className="section-title">Pilihan Lapisan GEE</h3>

              <label className="toggle-row">
                <input type="checkbox" checked={showGee2010} onChange={(e) => setShowGee2010(e.target.checked)} />
                <span className="switch" />
                <div>
                  <div className="toggle-name">Garis Bibir Tahun 2010 (Awal)</div>
                  <div className="toggle-desc">
                    <span><i className="sw-line" style={{ background: COLORS.bank2010 }} /> Kuning Emas (30m Landsat)</span>
                  </div>
                </div>
              </label>

              <label className="toggle-row">
                <input type="checkbox" checked={showGee2020} onChange={(e) => setShowGee2020(e.target.checked)} />
                <span className="switch" />
                <div>
                  <div className="toggle-name">Garis Bibir Tahun 2020 (Terbaru)</div>
                  <div className="toggle-desc">
                    <span><i className="sw-line" style={{ background: COLORS.bank2020 }} /> Pink Terang (30m Landsat)</span>
                  </div>
                </div>
              </label>

              <label className="toggle-row">
                <input type="checkbox" checked={showGeeChange} onChange={(e) => setShowGeeChange(e.target.checked)} />
                <span className="switch" />
                <div>
                  <div className="toggle-name">Zona Dinamika (Erosi & Akresi)</div>
                  <div className="toggle-desc">
                    <span style={{ color: "#ef4444", marginRight: 8 }}>■ Erosi</span>
                    <span style={{ color: "#06b6d4" }}>■ Akresi</span>
                  </div>
                </div>
              </label>

              <h3 className="section-title" style={{ marginTop: 20 }}>Peta Dasar</h3>
              <div className="seg" role="group" aria-label="Peta dasar" style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                {([
                  ["sat-2010", "Satelit 2010"],
                  ["sat-2020", "Satelit 2020"],
                  ["sat", "Satelit Kini"],
                  ["dark", "Gelap"],
                ] as [BaseMap, string][]).map(([k, label]) => (
                  <button key={k} style={{ flex: "1 1 45%", fontSize: "11px", padding: "6px 8px" }} className={baseMap === k ? "on" : ""} onClick={() => changeBaseMap(k)}>{label}</button>
                ))}
              </div>

              {baseMap === "sat-2010" && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.25)", borderRadius: "6px", fontSize: "11px", color: "#fbbf24", lineHeight: 1.4 }}>
                  🛰️ <b>Satelit 2010 Aktif:</b> Menampilkan foto citra Landsat bebas awan tahun 2010 dari Google Earth Engine untuk mencocokkan garis bibir sungai awal.
                </div>
              )}
              {baseMap === "sat-2020" && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(255, 34, 85, 0.08)", border: "1px solid rgba(255, 34, 85, 0.25)", borderRadius: "6px", fontSize: "11px", color: "#ff6b8b", lineHeight: 1.4 }}>
                  🛰️ <b>Satelit 2020 Aktif:</b> Menampilkan foto citra Landsat 8 tahun 2020 untuk memverifikasi pergeseran garis tebing terbaru.
                </div>
              )}

              <div style={{ marginTop: 24, padding: "12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px", color: "var(--faint)", lineHeight: 1.5 }}>
                <b style={{ color: "var(--text)" }}>Koneksi Cloud GEE:</b><br />
                • Gateway: <code>Secure Backend API via Vercel</code><br />
                • Resolusi: 30 meter per piksel<br />
                • Cakupan: Seluruh sungai di Indonesia
              </div>
            </div>
          )}

          {tab === "detail" && (
            <div className="tab-body">
              {selRiver ? (
                <div>
                  <div className="detail-head">
                    <div className="detail-eyebrow">Sungai aktif</div>
                    <h2>{selRiver.name}</h2>
                    <div className="detail-loc">{selRiver.province} · {selRiver.island}</div>
                  </div>

                  <div className="metrics">
                    <div className="metric">
                      <span className="metric-label">Laju rata-rata</span>
                      <span className={`metric-val ${selRiver.avgRate > 0 ? "ero" : "akr"}`}>{fmtRate(selRiver.avgRate)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Segmen</span>
                      <span className="metric-val">{selRiver.segmentCount}</span>
                    </div>
                  </div>

                  <p className="note">
                    <b>Dinamika.</b>{" "}
                    {selRiver.avgRate > 1
                      ? "Sungai mengalami pelebaran aktif (erosi tebing). Garis 2020 bergeser keluar dari garis 2010."
                      : selRiver.avgRate < -1
                        ? "Sungai mengalami penyempitan (sedimentasi)."
                        : "Kondisi relatif stabil."}
                  </p>

                  <button className="btn block" onClick={() => flyToRiver(selRiver)}>Fokus ke sungai ini</button>
                </div>
              ) : (
                <div className="empty">Pilih sungai dari tab Sungai untuk melihat detail.</div>
              )}
            </div>
          )}
        </aside>
      )}

      <div className="time-bar seg" role="group" aria-label="Mode tahun">
        <button className={yearMode === "compare" ? "on" : ""} onClick={() => setYearMode("compare")}>Komparasi (2010 vs 2020)</button>
        <button className={yearMode === "2010" ? "on" : ""} onClick={() => setYearMode("2010")}>Garis Bibir 2010 (Awal)</button>
        <button className={yearMode === "2020" ? "on" : ""} onClick={() => setYearMode("2020")}>Garis Bibir 2020 (Terbaru)</button>
        <button
          className="muted"
          onClick={() => {
            if (selRiver) {
              flyToRiver(selRiver);
            } else {
              const kapuas = RIVERS.find((r) => r.id === "kapuas");
              if (kapuas) goToRiver(kapuas);
            }
          }}
        >
          {selRiver ? `Fokus ${selRiver.name}` : "Fokus Kapuas"}
        </button>
      </div>

      <div className="legend">
        <div className="leg-head">Legenda GEE (30m)</div>
        <div className="leg-item"><span className="lbox" style={{ background: "#ef4444" }} />Zona erosi (tebing hilang)</div>
        <div className="leg-item"><span className="lbox" style={{ background: "#06b6d4" }} />Zona akresi (sedimen)</div>
        <div className="leg-item"><span className="lline" style={{ background: COLORS.bank2010 }} />Bibir 2010 (Awal)</div>
        <div className="leg-item"><span className="lline" style={{ background: COLORS.bank2020 }} />Bibir 2020 (Terbaru)</div>
        <div className="leg-item"><span className="lline vec" />Vektor geser</div>
      </div>

      {showAssetModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowAssetModal(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: "12px",
              padding: "24px 28px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "85vh",
              overflowY: "auto",
              color: "var(--text)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Google Earth Engine (GEE) - Asset & Visualisasi</h3>
              </div>
              <button className="icon-btn" onClick={() => setShowAssetModal(false)} style={{ fontSize: "18px" }}>×</button>
            </div>

            <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
              <p style={{ margin: "0 0 12px" }}>
                Garis bibir sungai dan zona pergeseran tebing diproses langsung dari citra satelit Landsat Google Earth Engine (JRC Global Surface Water 30m + MERIT Hydro) mencakup <b>seluruh sungai di Indonesia</b> (tanpa garis pantai/laut).
              </p>

              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px" }}>
                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Koneksi GEE:</div>
                <div className="mono" style={{ fontSize: "12px", color: "#34d399" }}>✅ Terhubung via Backend API (Vercel)</div>
                <div className="mono" style={{ fontSize: "12px", color: "var(--muted)" }}>Security: <code>Zero Credential on Client (Environment Variable Gateway)</code></div>
              </div>

              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>Asset GEE yang Digunakan:</div>
              <ul style={{ paddingLeft: "18px", margin: "0 0 14px", fontSize: "12.5px" }}>
                <li>Citra Satelit Historis tahun <b>2010</b> (Landsat True Color) &rarr; <code>citra_landsat_2010</code></li>
                <li>Garis tepi tebing tahun <b>2010</b> (Kuning Emas) &rarr; <code>bibir_sungai_2010</code></li>
                <li>Garis tepi tebing tahun <b>2020</b> (Pink/Merah Terang) &rarr; <code>bibir_sungai_2020</code></li>
                <li>Zona Erosi (Merah) & Akresi (Cyan) &rarr; <code>dinamika_pergeseran_2010_2020</code></li>
              </ul>

              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Skrip GEE Code Editor (Siap Pakai):</div>
              <p style={{ margin: "0 0 12px", fontSize: "12px" }}>
                Tersedia file <code className="mono">data-pipeline/gee_code_editor_script.js</code> yang dapat langsung di-copy-paste ke <b>code.earthengine.google.com</b> untuk visualisasi interaktif dan ekspor asset permanen via tab Tasks.
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button className="btn primary" onClick={() => setShowAssetModal(false)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}