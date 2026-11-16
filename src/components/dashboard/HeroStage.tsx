import React, { useEffect, useRef } from "react";
import type { River } from "../../types";
import { fmtRate } from "../../constants";
import { getMorph, type Morph, type Spot } from "./riverScene";

const W = 800;
const H = 450;
const NAV = 64;
const PAD = 12;

interface HeroStageProps {
  erosi: River | null;
  akresi: River | null;
  total: number;
  onOpenMap: () => void;
}

type Box = { l: number; t: number; r: number; b: number };
type Mode = "ur" | "ul" | "dr" | "dl";
type Sel = { spot: Spot; mode: Mode } | null;

const hit = (a: Box, b: Box) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/**
 * Hero setinggi layar. Gulir halaman = memajukan waktu: sungai bergeser dari bibir 2010
 * (garis emas) ke bibir 2020 (garis pink) dan zona erosi/akresi tumbuh bersamanya.
 * Semua elemen UI berada di satu grid, dan label callout dicarikan posisi yang
 * tidak menabrak teks, tombol, tahun, atau statistik.
 */
export const HeroStage: React.FC<HeroStageProps> = ({ erosi, akresi, total, onOpenMap }) => {
  const wrap = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctlEl = useRef<HTMLDivElement>(null);
  const yearEl = useRef<HTMLDivElement>(null);
  const copyEl = useRef<HTMLDivElement>(null);
  const statsEl = useRef<HTMLDivElement>(null);
  const yr = useRef<HTMLSpanElement>(null);
  const rail = useRef<HTMLElement>(null);
  const eroEl = useRef<HTMLDivElement>(null);
  const accEl = useRef<HTMLDivElement>(null);
  const api = useRef<{ set: (v: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, st = sticky.current, wr = wrap.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !st || !wr || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let morph: Morph | null = null;
    let cur = 0, target = 0, raf = 0, user = false, visible = true, n = 0, cw = 1, ch = 1;
    let eroSel: Sel = null, accSel: Sel = null;

    /* ---- tata letak callout: cari titik yang tidak menabrak UI ---- */
    const layout = () => {
      cw = st.clientWidth; ch = st.clientHeight;
      const sr = st.getBoundingClientRect();
      const box = (el: HTMLElement | null, pad = PAD): Box | null => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        return { l: r.left - sr.left - pad, t: r.top - sr.top - pad, r: r.right - sr.left + pad, b: r.bottom - sr.top + pad };
      };
      const avoid = [box(ctlEl.current), box(yearEl.current), box(copyEl.current), box(statsEl.current)].filter(Boolean) as Box[];

      if (!morph) return;
      const sc = Math.max(cw / W, ch / H), ox = (cw - W * sc) / 2, oy = (ch - H * sc) / 2;
      const taken: Box[] = [];
      const choose = (list: Spot[], el: HTMLDivElement | null): Sel => {
        const b = el?.querySelector<HTMLElement>(".callout-box");
        if (!el || !b) return null;
        const bw = b.offsetWidth, bh = b.offsetHeight;
        for (const spot of list) {
          const px = ox + spot.x * sc, py = oy + spot.y * sc;
          const dot: Box = { l: px - 10, t: py - 10, r: px + 10, b: py + 10 };
          for (const mode of ["ur", "ul", "dr", "dl"] as Mode[]) {
            const right = mode === "ur" || mode === "dr", up = mode === "ur" || mode === "ul";
            const l = right ? px + 16 : px - 16 - bw, t = up ? py - 12 - bh : py + 12;
            const r: Box = { l, t, r: l + bw, b: t + bh };
            const inside = r.l > 8 && r.r < cw - 8 && r.t > 8 && r.b < ch - 8 && dot.l > 8 && dot.r < cw - 8;
            if (!inside) continue;
            if ([...avoid, ...taken].some((a) => hit(a, r) || hit(a, dot))) continue;
            taken.push({ l: r.l - 6, t: r.t - 6, r: r.r + 6, b: r.b + 6 }, dot);
            el.style.left = `${px}px`;
            el.style.top = `${py}px`;
            el.dataset.mode = mode;
            return { spot, mode };
          }
        }
        return null;
      };
      eroSel = choose(morph.eroC, eroEl.current);
      accSel = choose(morph.accC, accEl.current);
      kick();
    };

    const paint = (sec: number) => {
      if (!morph) return;
      morph.render(ctx, { t: cur, overlay: true, old: true, now: true, time: reduce ? undefined : sec });
      if (yr.current) {
        yr.current.textContent = String(Math.round(2010 + 10 * cur));
        yr.current.style.color = `rgb(${Math.round(251 + 4 * cur)},${Math.round(191 - 157 * cur)},${Math.round(36 + 49 * cur)})`;
      }
      if (rail.current) rail.current.style.width = `${cur * 100}%`;
      eroEl.current?.classList.toggle("on", !!eroSel && cur > 0.5);
      accEl.current?.classList.toggle("on", !!accSel && cur > 0.5);
    };

    const frame = (now: number) => {
      raf = 0;
      const d = target - cur;
      if (reduce || Math.abs(d) < 0.0004) cur = target; else cur += d * 0.1;
      const settled = cur === target;
      if (!settled || reduce || (n++ & 1) === 0) paint(now / 1000);
      if ((visible && !reduce) || !settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const onScroll = () => {
      const span = wr.offsetHeight - ch;
      const p = Math.min(1, Math.max(0, (NAV - wr.getBoundingClientRect().top) / Math.max(1, span)));
      if (p > 0.004) user = true;
      if (user) target = p;
      kick();
    };

    api.current = { set: (v) => { user = true; target = v; kick(); } };
    // bangun medan setelah frame pertama agar halaman tidak terasa tertahan
    const build = window.setTimeout(() => { morph = getMorph(7, W, H, 0.55, 1.1); layout(); kick(); }, 0);
    const timer = window.setTimeout(() => { if (!user) { target = reduce ? 0.5 : 0.55; kick(); } }, 900);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(wr);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    const ro = new ResizeObserver(layout);
    ro.observe(st);
    document.fonts?.ready.then(layout).catch(() => undefined);
    onScroll();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(build);
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
      ro.disconnect();
    };
  }, []);

  const go = (p: number) => {
    const wr = wrap.current, st = sticky.current;
    if (!wr || !st) return;
    const span = wr.offsetHeight - st.clientHeight;
    const top = window.scrollY + wr.getBoundingClientRect().top - NAV + p * span;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    api.current?.set(p);
  };

  return (
    <section className="stage" ref={wrap} aria-label="Perbandingan citra satelit 2010 dan 2020">
      <div className="stage-sticky" ref={sticky}>
        <canvas ref={canvas} className="stage-canvas" width={W} height={H} role="img" aria-label="Ilustrasi alur sungai pada 2010 dan 2020, dengan zona erosi merah dan akresi cyan" />
        <div className="stage-scrim" />

        <div className="callout ero" ref={eroEl}><i className="callout-dot" /><div className="callout-box"><b>Erosi tebing</b><span>Daratan 2010 yang kini menjadi air</span></div></div>
        <div className="callout akr" ref={accEl}><i className="callout-dot" /><div className="callout-box"><b>Akresi sedimen</b><span>Air 2010 yang kini menjadi daratan</span></div></div>

        <div className="stage-ui">
          <div className="ds-wrap stage-ui-in">
            <div className="stage-ctl" ref={ctlEl} role="group" aria-label="Lompat ke tahun">
              <button type="button" onClick={() => go(0)}>2010</button>
              <button type="button" onClick={() => go(0.45)}>Bandingkan</button>
              <button type="button" onClick={() => go(1)}>2020</button>
            </div>

            <div className="stage-year" ref={yearEl} aria-hidden="true">
              <span className="stage-yr ds-num" ref={yr}>2010</span>
              <div className="stage-rail"><i ref={rail} /></div>
              <div className="stage-key">
                <span><i className="ln g" /> Bibir 2010</span>
                <span><i className="ln p" /> Bibir kini</span>
                <span><i className="bx r" /> Erosi</span>
                <span><i className="bx c" /> Akresi</span>
              </div>
            </div>

            <div className="stage-copy" ref={copyEl}>
              <h1>Ke mana sungai Indonesia berpindah dalam 10 tahun?</h1>
              <p className="ds-lead">
                Citra Landsat 2010 dan 2020 dibandingkan pada <b>{total} daerah aliran sungai</b>. Pergeseran bibir sungai diukur di setiap segmen 100 meter.
              </p>
              <div className="ds-hero-actions">
                <button type="button" className="ds-btn on-dark" onClick={onOpenMap}>Buka peta interaktif <Arrow /></button>
                <button type="button" className="ds-textlink" onClick={() => go(0.45)}>Lihat perbandingannya</button>
              </div>
              <p className="stage-note">Ilustrasi skematis. Data sebenarnya: Landsat 30 m, diolah di Google Earth Engine.</p>
            </div>

            <div className="stage-stats" ref={statsEl}>
              {erosi && (
                <div className="ero">
                  <span>Erosi tertinggi</span>
                  <b>{erosi.name}</b>
                  <em className="ds-num">{fmtRate(erosi.avgRate)}</em>
                </div>
              )}
              {akresi && (
                <div className="akr">
                  <span>Akresi tertinggi</span>
                  <b>{akresi.name}</b>
                  <em className="ds-num">{fmtRate(akresi.avgRate)}</em>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
