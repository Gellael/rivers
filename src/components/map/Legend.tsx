import React from "react";
import { COLORS } from "../../constants";

export const Legend: React.FC = () => {
  return (
    <div className="legend">
      <div className="leg-head">Legenda GEE (30m)</div>
      <div className="leg-item">
        <span className="lbox" style={{ background: "#ef4444" }} />
        Zona erosi (tebing hilang)
      </div>
      <div className="leg-item">
        <span className="lbox" style={{ background: "#06b6d4" }} />
        Zona akresi (sedimen)
      </div>
      <div className="leg-item">
        <span className="lline" style={{ background: COLORS.bank2010 }} />
        Bibir 2010 (Awal)
      </div>
      <div className="leg-item">
        <span className="lline" style={{ background: COLORS.bank2020 }} />
        Bibir 2020 (Terbaru)
      </div>
      <div className="leg-item">
        <span className="lline vec" />
        Vektor geser
      </div>
    </div>
  );
};

