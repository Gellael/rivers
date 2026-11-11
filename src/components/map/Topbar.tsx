import React from "react";
import type { BaseMap, DataStatus } from "../../types";
import { statusClass, statusLabel } from "../../constants";

interface TopbarProps {
  searchQ: string;
  onSearchChange: (q: string) => void;
  onSearchClear: () => void;
  dataStatus: DataStatus;
  baseMap: BaseMap;
  onChangeBaseMap: (bm: BaseMap) => void;
  onShowAssetModal: () => void;
  onResetView: () => void;
  onGoToDashboard: () => void;
  onOpenLayersTab: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  searchQ,
  onSearchChange,
  onSearchClear,
  dataStatus,
  baseMap,
  onChangeBaseMap,
  onShowAssetModal,
  onResetView,
  onGoToDashboard,
  onOpenLayersTab,
}) => {
  return (
    <header className="topbar">
      <div className="brand" onClick={onGoToDashboard} style={{ cursor: "pointer" }}>
        <span className="brand-name">INARivers</span>
        <span className="brand-sub">Pergeseran bibir sungai, 2010 – 2020</span>
      </div>

      <label className="search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          placeholder="Cari sungai atau provinsi"
          value={searchQ}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQ && (
          <button type="button" className="icon-btn" aria-label="Hapus pencarian" onClick={onSearchClear}>
            ×
          </button>
        )}
      </label>

      <div className="topbar-right">
        <button
          className="btn btn-asset"
          onClick={onShowAssetModal}
          title="Info Asset GEE Se-Indonesia"
        >
          <span className="live-dot" />
          <span>Asset GEE</span>
        </button>

        <button
          className={`status ${statusClass[dataStatus]} ${dataStatus === "warn" || dataStatus === "error" ? "clickable" : ""}`}
          onClick={() => {
            if (dataStatus === "warn" || dataStatus === "error") onOpenLayersTab();
          }}
          title={dataStatus === "warn" || dataStatus === "error" ? "Klik untuk melihat detail koneksi" : undefined}
        >
          <span className="status-dot" />
          {statusLabel[dataStatus]}
        </button>

        <div className="seg basemap-seg" role="group" aria-label="Peta dasar">
          {([
            ["sat-2010", "Satelit 2010"],
            ["sat-2020", "Satelit 2020"],
            ["sat", "Satelit Kini"],
            ["dark", "Gelap"],
          ] as [BaseMap, string][]).map(([k, label]) => (
            <button
              key={k}
              className={baseMap === k ? "on" : ""}
              onClick={() => onChangeBaseMap(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          className="btn btn-nav-action"
          onClick={onResetView}
          title="Tampilkan peta seluruh wilayah Indonesia"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span>Seluruh Indonesia</span>
        </button>

        <button
          className="btn btn-primary-gradient"
          onClick={onGoToDashboard}
          title="Kembali ke Dashboard Beranda"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
          <span>Ringkasan</span>
        </button>
      </div>
    </header>
  );
};
