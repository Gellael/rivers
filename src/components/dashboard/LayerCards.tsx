import React from "react";
import type { YearMode } from "../../types";
import { SceneCanvas } from "./SceneCanvas";

interface LayerCardsProps {
  onSelectYearMode: (mode: YearMode) => void;
}

export const LayerCards: React.FC<LayerCardsProps> = ({ onSelectYearMode }) => {
  return (
    <section className="ds-section">
      <div className="ds-head">
        <h2>Tiga lapisan data di peta</h2>
        <p>Garis tepi air diekstrak dari citra Landsat 7 dan 8 beresolusi 30 meter, lalu dibandingkan untuk menemukan tebing yang tergerus dan daratan baru.</p>
      </div>

      <div className="layers">
        <article className="layer l10">
          <SceneCanvas className="layer-thumb" seed={11} mode="y2010" w={320} h={200} shift={0.55} wscale={1.5} />
          <h3>Bibir sungai 2010</h3>
          <div className="layer-src">Landsat 7 ETM+</div>
          <p>Garis tepi perairan 10 tahun lalu, dari mosaik citra bebas awan. Ini titik awal pengukuran.</p>
          <button type="button" className="ds-textlink" onClick={() => onSelectYearMode("2010")}>Tampilkan layer 2010</button>
        </article>

        <article className="layer l20">
          <SceneCanvas className="layer-thumb" seed={11} mode="y2020" w={320} h={200} shift={0.55} wscale={1.5} />
          <h3>Bibir sungai 2020</h3>
          <div className="layer-src">Landsat 8 OLI</div>
          <p>Garis tepi perairan terkini dari citra Surface Reflectance, untuk melihat ke mana alur sungai berpindah.</p>
          <button type="button" className="ds-textlink" onClick={() => onSelectYearMode("2020")}>Tampilkan layer 2020</button>
        </article>

        <article className="layer ldyn">
          <SceneCanvas className="layer-thumb" seed={11} mode="change" w={320} h={200} shift={0.55} wscale={1.5} />
          <h3>Zona erosi dan akresi</h3>
          <div className="layer-src">Selisih 2010 ke 2020</div>
          <p>Poligon selisih tebing: merah untuk tanah yang hilang tergerus arus, teal untuk daratan baru dari endapan.</p>
          <button type="button" className="ds-textlink" onClick={() => onSelectYearMode("compare")}>Tampilkan zona perubahan</button>
        </article>
      </div>
    </section>
  );
};
