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
          title="Info Asset GEE"
        >
          <span className="live-dot" />
          Asset GEE
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
            ["sat-2010", "2010"],
            ["sat-2020", "2020"],
            ["sat", "Kini"],
            ["dark", "Gelap"],
          ] as [BaseMap, string][]).map(([k, label]) => (
            <button
              key={k}
              className={baseMap === k ? "on" : ""}
              onClick={() => onChangeBaseMap(k)}
              title={k === "sat-2010" ? "Satelit 2010" : k === "sat-2020" ? "Satelit 2020" : k === "sat" ? "Satelit Kini" : "Gelap"}
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
          Seluruh Indonesia
        </button>

        <button
          className="btn btn-primary-gradient"
          onClick={onGoToDashboard}
          title="Kembali ke halaman Ringkasan"
        >
          Ringkasan
        </button>
      </div>
    </header>
  );
};
