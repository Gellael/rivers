import riverList from "../rivers.json";
import type { BaseMap, DataStatus, River } from "../types";

export const RIVERS = riverList as River[];

export const COLORS = {
  erosi: "#ef4444",
  akresi: "#06b6d4",
  bank2010: "#fbbf24",
  bank2020: "#ff2255",
};

export const ISLANDS = ["Semua", "Kalimantan", "Sumatera", "Jawa", "Sulawesi", "Papua"];

export function fmtRate(v: number): string {
  return `${v > 0 ? "+" : ""}${Number(v.toFixed(2))} m/th`;
}

export const esriTiles = (service: string): string =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`;

export const BASE_LAYERS: Record<BaseMap, string[]> = {
  "sat-2010": ["base-sat-2010"],
  "sat-2020": ["base-sat-2020"],
  sat: ["base-sat"],
  dark: ["base-dark", "base-dark-ref"],
  light: ["base-light"],
};

export const ALL_BASE_LAYERS = Object.values(BASE_LAYERS).flat();

export function buildStyle(base: BaseMap): any {
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
      "base-dark": {
        type: "raster",
        tiles: [esriTiles("Canvas/World_Dark_Gray_Base")],
        tileSize: 256,
        maxzoom: 16,
        attribution: "Tiles © Esri, DeLorme, NAVTEQ",
      },
      "base-dark-ref": {
        type: "raster",
        tiles: [esriTiles("Canvas/World_Dark_Gray_Reference")],
        tileSize: 256,
        maxzoom: 16,
      },
      "base-light": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors",
      },
      "base-sat": {
        type: "raster",
        tiles: [esriTiles("World_Imagery")],
        tileSize: 256,
        maxzoom: 17,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      },
      "base-sat-2010": {
        type: "raster",
        tiles: [esriTiles("World_Imagery")],
        tileSize: 256,
        maxzoom: 17,
        attribution: "Google Earth Engine · Landsat 2010 True Color",
      },
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

export const statusLabel: Record<DataStatus, string> = {
  loading: "Memuat data",
  ok: "Data siap",
  warn: "Peringatan data",
  error: "Gagal memuat data",
};

export const statusClass: Record<DataStatus, string> = {
  loading: "load",
  ok: "ok",
  warn: "warn",
  error: "err",
};
