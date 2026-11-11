import React from "react";
import type { YearMode } from "../../types";

interface TimeBarProps {
  yearMode: YearMode;
  onYearModeChange: (m: YearMode) => void;
}

export const TimeBar: React.FC<TimeBarProps> = ({
  yearMode,
  onYearModeChange,
}) => {
  return (
    <div className="time-bar" role="group" aria-label="Mode Lapisan Waktu">
      <button
        className={`time-btn ${yearMode === "compare" ? "on" : ""}`}
        onClick={() => onYearModeChange("compare")}
        title="Bandingkan garis 2010 vs 2020 beserta zona erosi & akresi"
      >
        <span className="time-dot comp" />
        <span>Komparasi (2010 vs 2020)</span>
      </button>

      <button
        className={`time-btn ${yearMode === "2010" ? "on" : ""}`}
        onClick={() => onYearModeChange("2010")}
        title="Hanya tampilkan garis bibir sungai tahun 2010"
      >
        <span className="time-dot y2010" />
        <span>Garis Bibir 2010 (Awal)</span>
      </button>

      <button
        className={`time-btn ${yearMode === "2020" ? "on" : ""}`}
        onClick={() => onYearModeChange("2020")}
        title="Hanya tampilkan garis bibir sungai tahun 2020"
      >
        <span className="time-dot y2020" />
        <span>Garis Bibir 2020 (Terbaru)</span>
      </button>
    </div>
  );
};
