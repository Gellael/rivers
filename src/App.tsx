import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

// Fix WebWorker URL for Vite bundler (loads worker directly from public folder)
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

import type { BaseMap, DataStatus, GeeTilesConfig, PageView, River, SidebarTab, YearMode } from "./types";
import { ALL_BASE_LAYERS, BASE_LAYERS, buildStyle, RIVERS } from "./constants";
import { DashboardView } from "./components/dashboard/DashboardView";
import { MapView } from "./components/map/MapView";
import { AssetStatusModal } from "./components/common/AssetStatusModal";

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pendingFly = useRef<River | null>(null);

  const [page, setPage] = useState<PageView>("dashboard");
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
  const [selRiver, setSelRiver] = useState<River | null>(null);
  const [tab, setTab] = useState<SidebarTab>("detail");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [showGeeTiles, setShowGeeTiles] = useState(true);
  const [showGee2010, setShowGee2010] = useState(true);
  const [showGee2020, setShowGee2020] = useState(true);
  const [showGeeChange, setShowGeeChange] = useState(true);
  const [geeOpacity, setGeeOpacity] = useState(1.0);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Ganti basemap yang otomatis menyelaraskan visibilitas layer tahun
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

  const filteredRivers = RIVERS.filter((r) => {
    if (selIsland !== "Semua" && r.island !== selIsland) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.province.toLowerCase().includes(q);
    }
    return true;
  });

  /* ---- Navigasi terbang ke sungai ---- */
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
      /* layer belum siap */
    }
  }, []);

  const syncVisibility = useCallback(() => {
    const show2010 = showGee2010 && (yearMode === "compare" || yearMode === "2010");
    const show2020 = showGee2020 && (yearMode === "compare" || yearMode === "2020");
    const showZn = showGeeChange && (yearMode === "compare" || yearMode === "2020");

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

  useEffect(() => {
    for (const id of ALL_BASE_LAYERS) setVis(id, BASE_LAYERS[baseMap].includes(id));
  }, [baseMap, setVis]);

  useEffect(() => {
    if (ready && pendingFly.current) {
      const r = pendingFly.current;
      pendingFly.current = null;
      flyToRiver(r);
    }
  }, [ready, flyToRiver]);

  /* ============================================================
   * INISIALISASI PETA MAPLIBRE
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
      center: [109.85, -0.05],
      zoom: 10.5,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    mapRef.current = map;

    const styleReady = new Promise<void>((resolve) => {
      if (map.isStyleLoaded()) resolve();
      else map.once("load", () => resolve());
    });

    const init = async () => {
      await styleReady;
      if (cancelled) return;

      try {
        if (map.getSource("gee-src-2010")) return;

        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const queryBackend = urlParams?.get("backend");
        const storedBackend = typeof window !== "undefined" ? localStorage.getItem("INARIVERS_BACKEND_URL") : null;
        if (queryBackend) {
          localStorage.setItem("INARIVERS_BACKEND_URL", queryBackend);
        }

        const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
        const defaultBackend = isLocalhost ? "http://localhost:8080" : "https://riverbe.vercel.app";
        const apiBase = (queryBackend || storedBackend || import.meta.env.VITE_API_URL || defaultBackend).replace(/\/$/, "");

        let tiles: GeeTilesConfig | null = null;
        try {
          const apiRes = await fetch(`${apiBase}/api/tiles`);
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data?.tile2010 || data?.tiles?.tile2010) {
              tiles = data?.tiles || data;
            }
          }
        } catch (fetchErr) {
          console.warn("[INARivers] Gagal memanggil API backend:", fetchErr);
        }

        if (!tiles) {
          setWarnings([
            `Backend di ${apiBase} belum merespons data tile GEE. Pastikan backend aktif atau atur URL backend di tab Layer.`
          ]);
          setDataStatus("warn");
          setReady(true);
          return;
        }

        // Base Satelit Historis 2010
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
            map.addLayer({ id: "base-sat-2010", type: "raster", source: "base-sat-2010", layout: { visibility: isVis } }, firstId);
          } catch (e) {
            console.warn(e);
          }
        }

        // Base Satelit Historis 2020
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
            map.addLayer({ id: "base-sat-2020", type: "raster", source: "base-sat-2020", layout: { visibility: isVis } }, firstId);
          } catch (e) {
            console.warn(e);
          }
        }

        // Layer 1: Dinamika Pergeseran (Erosi & Akresi)
        if (tiles?.tileChange && !map.getSource("gee-src-change")) {
          map.addSource("gee-src-change", { type: "raster", tiles: [tiles.tileChange], tileSize: 256, maxzoom: 18 });
          map.addLayer({ id: "gee-tile-change", type: "raster", source: "gee-src-change", paint: { "raster-opacity": 0.85 } });
        }

        // Layer 2: Garis Bibir Tahun 2010
        if (tiles?.tile2010 && !map.getSource("gee-src-2010")) {
          map.addSource("gee-src-2010", { type: "raster", tiles: [tiles.tile2010], tileSize: 256, maxzoom: 18 });
          map.addLayer({ id: "gee-tile-2010", type: "raster", source: "gee-src-2010", paint: { "raster-opacity": 1.0 } });
        }

        // Layer 3: Garis Bibir Tahun 2020
        if (tiles?.tile2020 && !map.getSource("gee-src-2020")) {
          map.addSource("gee-src-2020", { type: "raster", tiles: [tiles.tile2020], tileSize: 256, maxzoom: 18 });
          map.addLayer({ id: "gee-tile-2020", type: "raster", source: "gee-src-2020", paint: { "raster-opacity": 1.0 } });
        }

        setDataStatus("ok");
        setReady(true);
      } catch (err) {
        console.error("[INARivers] Gagal memuat layer GEE:", err);
        setDataStatus("error");
      }
    };

    init().catch((err) => {
      if (cancelled) return;
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

  /* ============ RENDER ============ */
  if (page === "dashboard") {
    return (
      <>
        <DashboardView
          onOpenMap={() => setPage("map")}
          onSelectRiver={(r) => {
            setSelRiver(r);
            setTab("detail");
            pendingFly.current = r;
          }}
          onSelectYearMode={(mode) => setYearMode(mode)}
          onShowAssetModal={() => setShowAssetModal(true)}
          dashIsland={dashIsland}
          onSelectIsland={(isl) => setDashIsland(isl)}
        />
        {showAssetModal && <AssetStatusModal onClose={() => setShowAssetModal(false)} />}
      </>
    );
  }

  return (
    <>
      <MapView
        containerRef={containerRef}
        searchQ={searchQ}
        onSearchChange={(q) => {
          setSearchQ(q);
          setTab("rivers");
          setSidebarOpen(true);
        }}
        onSearchClear={() => setSearchQ("")}
        dataStatus={dataStatus}
        baseMap={baseMap}
        onChangeBaseMap={changeBaseMap}
        onShowAssetModal={() => setShowAssetModal(true)}
        onResetView={() => {
          setSelRiver(null);
          setSearchQ("");
          setTab("rivers");
          mapRef.current?.fitBounds([[94.5, -11.5], [141.5, 6.5]], {
            padding: { top: 60, bottom: 80, right: 40, left: sidebarOpen ? 360 : 40 },
            duration: 1200,
          });
        }}
        onGoToDashboard={() => setPage("dashboard")}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={(open) => setSidebarOpen(open)}
        tab={tab}
        onTabChange={(t) => setTab(t)}
        filteredRivers={filteredRivers}
        selIsland={selIsland}
        onSelectIsland={(isl) => setSelIsland(isl)}
        selRiver={selRiver}
        onSelectRiver={goToRiver}
        onFocusRiver={flyToRiver}
        warnings={warnings}
        showGeeTiles={showGeeTiles}
        onToggleGeeTiles={setShowGeeTiles}
        geeOpacity={geeOpacity}
        onChangeGeeOpacity={setGeeOpacity}
        showGee2010={showGee2010}
        onToggleGee2010={setShowGee2010}
        showGee2020={showGee2020}
        onToggleGee2020={setShowGee2020}
        showGeeChange={showGeeChange}
        onToggleGeeChange={setShowGeeChange}
        yearMode={yearMode}
        onYearModeChange={setYearMode}
      />
      {showAssetModal && <AssetStatusModal onClose={() => setShowAssetModal(false)} />}
    </>
  );
}
