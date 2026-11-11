import React from "react";
import type { River } from "../../types";
import { RIVERS } from "../../constants";

interface FeaturedRiversProps {
  onSelectRiver: (river: River) => void;
}

export const FeaturedRivers: React.FC<FeaturedRiversProps> = ({ onSelectRiver }) => {
  const musi = RIVERS.find((r) => r.id === "musi") || RIVERS[0];
  const mahakam = RIVERS.find((r) => r.id === "mahakam") || RIVERS[1];
  const barito = RIVERS.find((r) => r.id === "barito") || RIVERS[2];
  const siak = RIVERS.find((r) => r.id === "siak") || RIVERS[3];

  const featured = [
    {
      river: musi,
      badge: "Sumatera",
      rateClass: "ero",
      rateText: "+5.90 m/th",
      desc: "Erosi tebing paling masif di Indonesia — pelebaran alur mencapai rata-rata 59 meter dalam rentang 10 tahun.",
    },
    {
      river: mahakam,
      badge: "Kalimantan",
      rateClass: "ero",
      rateText: "+3.94 m/th",
      desc: "Migrasi alur meander sangat aktif di Kalimantan Timur dengan pemotongan tebing tebal di sisi luar belokan.",
    },
    {
      river: barito,
      badge: "Kalimantan",
      rateClass: "ero",
      rateText: "+3.21 m/th",
      desc: "Abrasi pesisir dan tebing sungai hilir di Kalimantan Selatan dengan perubahan batas air yang konsisten.",
    },
    {
      river: siak,
      badge: "Sumatera",
      rateClass: "akr",
      rateText: "-7.32 m/th",
      desc: "Akumulasi sedimen dan lumpur terkuat di Indonesia, menyebabkan penyempitan alur sungai secara terukur.",
    },
  ];

  return (
    <section style={{ marginBottom: "40px" }}>
      <div className="section-header-row">
        <div className="section-subtitle">FOKUS DINAMIKA MORFOLOGI</div>
        <h2 className="section-title">Sungai dengan Perubahan Paling Signifikan</h2>
        <p className="section-desc">Empat Daerah Aliran Sungai utama dengan laju erosi tebing dan akumulasi sedimen tertinggi di Indonesia.</p>
      </div>

      <div className="featured-rivers-grid">
        {featured.map(({ river, badge, rateClass, rateText, desc }) => (
          <div
            key={river.id}
            className="featured-river-card"
            onClick={() => onSelectRiver(river)}
          >
            <div>
              <div className="feat-river-top">
                <span className="feat-island-badge">{badge}</span>
                <span className={`feat-river-rate ${rateClass}`}>{rateText}</span>
              </div>
              <div className="feat-river-name">{river.name}</div>
              <div className="feat-river-detail">{desc}</div>
            </div>
            <div className="feat-river-footer">
              <span>{river.segmentCount} Segmen Transek</span>
              <span className="feat-link-btn">Fokus di Peta →</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
