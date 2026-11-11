import React from "react";
import type { BaseMap, DataStatus, River, SidebarTab, YearMode } from "../../types";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { Legend } from "./Legend";
import { TimeBar } from "./TimeBar";

interface MapViewProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  searchQ: string;
  onSearchChange: (q: string) => void;
  onSearchClear: () => void;
  dataStatus: DataStatus;
  baseMap: BaseMap;
  onChangeBaseMap: (bm: BaseMap) => void;
  onShowAssetModal: () => void;
  onResetView: () => void;
  onGoToDashboard: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: (open: boolean) => void;
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  filteredRivers: River[];
  selIsland: string;
  onSelectIsland: (island: string) => void;
  selRiver: River | null;
  onSelectRiver: (r: River) => void;
  onFocusRiver: (r: River) => void;
  warnings: string[];
  showGeeTiles: boolean;
  onToggleGeeTiles: (v: boolean) => void;
  geeOpacity: number;
  onChangeGeeOpacity: (v: number) => void;
  showGee2010: boolean;
  onToggleGee2010: (v: boolean) => void;
  showGee2020: boolean;
  onToggleGee2020: (v: boolean) => void;
  showGeeChange: boolean;
  onToggleGeeChange: (v: boolean) => void;
  yearMode: YearMode;
  onYearModeChange: (m: YearMode) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  containerRef,
  searchQ,
  onSearchChange,
  onSearchClear,
  dataStatus,
  baseMap,
  onChangeBaseMap,
  onShowAssetModal,
  onResetView,
  onGoToDashboard,
  sidebarOpen,
  onToggleSidebar,
  tab,
  onTabChange,
  filteredRivers,
  selIsland,
  onSelectIsland,
  selRiver,
  onSelectRiver,
  onFocusRiver,
  warnings,
  showGeeTiles,
  onToggleGeeTiles,
  geeOpacity,
  onChangeGeeOpacity,
  showGee2010,
  onToggleGee2010,
  showGee2020,
  onToggleGee2020,
  showGeeChange,
  onToggleGeeChange,
  yearMode,
  onYearModeChange,
}) => {
  return (
    <div className={`app-root ${sidebarOpen ? "with-sb" : ""}`}>
      <Topbar
        searchQ={searchQ}
        onSearchChange={onSearchChange}
        onSearchClear={onSearchClear}
        dataStatus={dataStatus}
        baseMap={baseMap}
        onChangeBaseMap={onChangeBaseMap}
        onShowAssetModal={onShowAssetModal}
        onResetView={onResetView}
        onGoToDashboard={onGoToDashboard}
        onOpenLayersTab={() => {
          onTabChange("layers");
          onToggleSidebar(true);
        }}
      />

      <div ref={containerRef} className="map-container" />

      {!sidebarOpen && (
        <button className="sb-toggle" onClick={() => onToggleSidebar(true)}>
          Panel
        </button>
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => onToggleSidebar(false)}
        tab={tab}
        onTabChange={onTabChange}
        filteredRivers={filteredRivers}
        selIsland={selIsland}
        onSelectIsland={onSelectIsland}
        selRiver={selRiver}
        onSelectRiver={onSelectRiver}
        onFocusRiver={onFocusRiver}
        warnings={warnings}
        showGeeTiles={showGeeTiles}
        onToggleGeeTiles={onToggleGeeTiles}
        geeOpacity={geeOpacity}
        onChangeGeeOpacity={onChangeGeeOpacity}
        showGee2010={showGee2010}
        onToggleGee2010={onToggleGee2010}
        showGee2020={showGee2020}
        onToggleGee2020={onToggleGee2020}
        showGeeChange={showGeeChange}
        onToggleGeeChange={onToggleGeeChange}
        baseMap={baseMap}
        onChangeBaseMap={onChangeBaseMap}
      />

      <TimeBar
        yearMode={yearMode}
        onYearModeChange={onYearModeChange}
      />

      <Legend />
    </div>
  );
};
