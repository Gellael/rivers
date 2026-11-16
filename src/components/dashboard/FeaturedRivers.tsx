import React, { useEffect, useRef, useState } from "react";
import type { River } from "../../types";
import { RIVERS } from "../../constants";
import { getMorph, seedOf, type Morph } from "./riverScene";

interface FeaturedRiversProps {
  onSelectRiver: (river: River) => void;
}

const W = 640;
const H = 400;
const MAX_RATE = 8;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/**
 * Scrollytelling: panel citra menempel di kiri. Saat tiap sungai di kanan melewati
 * tengah layar, citranya berganti dan sungainya bergeser dari 2010 ke 2020.
 */
export const FeaturedRivers: React.FC<FeaturedRiversProps> = ({ onSelectRiver }) => {
  const pick = (id: string, i: number) => RIVERS.find((r) => r.id === id) || RIVERS[i];
  const featured = [
    { river: pick("musi", 0), badge: "Sumatera", rateClass: "ero", rateText: "+5.90 m/th", desc: "Erosi tebing paling masif di Indonesia. Alur melebar rata-rata 59 meter dalam 10 tahun." },
    { river: pick("mahakam", 1), badge: "Kalimantan", rateClass: "ero", rateText: "+3.94 m/th", desc: "Alur meander di Kalimantan Timur sangat aktif bermigrasi, dengan tebing terpotong di sisi luar belokan." },
    { river: pick("barito", 2), badge: "Kalimantan", rateClass: "ero", rateText: "+3.21 m/th", desc: "Abrasi tebing di hilir Kalimantan Selatan, dengan perubahan batas air yang konsisten." },
    { river: pick("siak", 3), badge: "Sumatera", rateClass: "akr", rateText: "-7.32 m/th", desc: "Pengendapan lumpur terkuat di Indonesia, membuat alur sungai menyempit." },
  ];

  const [active, setActive] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const yr = useRef<HTMLSpanElement>(null);
  const steps = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const morph = (i: number): Morph => {
      const f = featured[i];
      const shift = 0.25 + clamp(Math.abs(parseFloat(f.rateText)) / MAX_RATE) * 0.5;
      return getMorph(seedOf(f.river.id), W, H, shift, 1.1);
    };

    let cur = 0, target = 0, idx = 0, raf = 0, visible = false, n = 0;
    const paint = (sec: number) => {
      morph(idx).render(ctx, { t: cur, overlay: true, old: true, now: true, time: reduce ? undefined : sec });
      if (yr.current) {
        yr.current.textContent = String(Math.round(2010 + 10 * cur));
        yr.current.style.color = `rgb(${Math.round(251 + 4 * cur)},${Math.round(191 - 157 * cur)},${Math.round(36 + 49 * cur)})`;
      }
    };
    const frame = (now: number) => {
      raf = 0;
      const d = target - cur;
      if (reduce || Math.abs(d) < 0.0004) cur = target; else cur += d * 0.12;
      const settled = cur === target;
      if (!settled || reduce || (n++ & 1) === 0) paint(now / 1000);
      if ((visible && !reduce) || !settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const onScroll = () => {
      const vc = window.innerHeight * 0.5;
      let best = 0, bd = Infinity;
      steps.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - vc);
        if (d < bd) { bd = d; best = i; }
      });
      const el = steps.current[best];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = clamp((vc - r.top) / r.height);
      const e = clamp((p - 0.12) / 0.6);
      target = e * e * (3 - 2 * e);
      if (best !== idx) { idx = best; cur = target; setActive(best); }
      kick();
    };

    // bangun medan sungai bergantian agar tidak menahan halaman
    const warm = featured.map((_, i) => window.setTimeout(() => { morph(i); if (i === idx) kick(); }, 150 + i * 450));
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    if (canvas.current) io.observe(canvas.current);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      warm.forEach((w) => window.clearTimeout(w));
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cur = featured[active];

  return (
    <section className="ds-section rv">
      <div className="ds-head">
        <h2>Empat sungai dengan perubahan terbesar</h2>
        <p>Gulir ke bawah. Setiap sungai menunjukkan bibirnya bergeser dari 2010 ke 2020.</p>
      </div>

      <div className="rv-grid">
        <div className="rv-visual">
          <div className="rv-frame">
            <div className="rv-stage">
              <canvas ref={canvas} className="rv-canvas" width={W} height={H} role="img" aria-label={`Ilustrasi pergeseran alur ${cur.river.name}`} />
              <div className="rv-year ds-num" aria-hidden="true"><span ref={yr}>2010</span></div>
            </div>
            <div className="rv-read">
              <div>
                <b>{cur.river.name}</b>
                <span>{cur.badge} · {cur.river.segmentCount} segmen</span>
              </div>
              <em className={`ds-num ${cur.rateClass}`}>{cur.rateText}</em>
            </div>
            <div className="rv-key">
              <span><i className="ln g" /> Bibir 2010</span>
              <span><i className="ln p" /> Bibir 2020</span>
              <span><i className="bx r" /> Erosi</span>
              <span><i className="bx c" /> Akresi</span>
            </div>
          </div>
        </div>

        <ol className="rv-steps">
          {featured.map(({ river, badge, rateClass, rateText, desc }, i) => (
            <li key={river.id} ref={(el) => { steps.current[i] = el; }} className={`rv-step ${active === i ? "on" : ""}`}>
              <div className="rv-meta">{badge} · {river.segmentCount} segmen transek</div>
              <h3 className="rv-name">{river.name}</h3>
              <div className={`rv-rate ds-num ${rateClass}`}>{rateText}</div>
              <p>{desc}</p>
              <button type="button" className="ds-textlink" onClick={() => onSelectRiver(river)}>Lihat {river.name} di peta</button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
