export interface GeeTilesConfig {
  tile2010?: string;
  tile2020?: string;
  tileChange?: string;
  tileSat2010?: string;
  tileSat2020?: string;
  cloudQuality?: string;
}

export interface River {
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

export type BaseMap = "sat-2010" | "sat-2020" | "sat" | "dark" | "light";
export type YearMode = "compare" | "2010" | "2020";
export type DataStatus = "loading" | "ok" | "warn" | "error";
export type SidebarTab = "rivers" | "layers" | "detail";
export type PageView = "dashboard" | "map";
