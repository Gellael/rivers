/* ------------------------------------------------------------------
 * Mesin citra sungai sintetis (gaya Landsat) untuk visual dashboard.
 *
 * Medan (hutan, ladang, bayangan relief) dibangun sekali. Setelah itu alur
 * sungai di-render ulang tiap frame untuk waktu t (0 = 2010, 1 = 2020):
 * garis tengah dan lebarnya diinterpolasi, sehingga sungai benar-benar
 * bergeser, bukan sekadar disapu. Tepi air memakai anti-aliasing.
 *
 *   daratan 2010 -> air  = erosi   (rose)
 *   air 2010 -> daratan  = akresi  (cyan)
 *
 * Ini ilustrasi skematis, bukan data nyata sungai tertentu.
 * ------------------------------------------------------------------ */
export type SceneKey = "y2010" | "y2020" | "change";
export interface Spot { x: number; y: number }
export interface RenderOpts {
  /** 0 = 2010, 1 = 2020 */
  t: number;
  /** warnai erosi dan akresi */
  overlay?: boolean;
  /** garis bibir 2010 (emas, putus-putus) */
  old?: boolean;
  /** garis bibir saat t (pink) */
  now?: boolean;
  /** detik; jika diisi, permukaan air berkilau pelan */
  time?: number;
}

export const seedOf = (id: string) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);

function hash(ix: number, iy: number, s: number) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function vnoise(x: number, y: number, s: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, s: number, o: number) {
  let t = 0, n = 0, a = 0.5, f = 1;
  for (let i = 0; i < o; i++) { t += a * vnoise(x * f, y * f, s + i * 17); n += a; a *= 0.5; f *= 2; }
  return t / n;
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export class Morph {
  readonly w: number;
  readonly h: number;
  readonly eroC: Spot[];
  readonly accC: Spot[];
  private base: Uint8ClampedArray;
  private det: Uint8Array;
  private img: ImageData;
  private c10: Float32Array; private c20: Float32Array;
  private k10: Float32Array; private k20: Float32Array;
  private w10: Float32Array; private w20: Float32Array;
  private reach: number;

  constructor(seed: number, w: number, h: number, shift = 0.5, wscale = 1) {
    this.w = w; this.h = h;
    const r = (k: number) => hash(seed, k, 7);
    const f1 = 0.85 + r(1) * 0.7, f2 = 2.1 + r(2) * 1.2, p1 = r(3) * 6.283, p2 = r(4) * 6.283;
    const a1 = 0.2 + r(5) * 0.07, a2 = 0.05 + r(6) * 0.03;
    const yc = (x: number, m: boolean) =>
      h * 0.5 + Math.sin((x / w) * 6.283 * f1 + p1 + (m ? shift : 0)) * h * a1 * (m ? 1.08 : 1) +
      Math.sin((x / w) * 6.283 * f2 + p2 + (m ? shift * 1.6 : 0)) * h * a2;
    const wid = (x: number, m: boolean) => (h * 0.028 + Math.sin(x * 0.05 + seed) * h * 0.004) * wscale * (m ? 1.12 : 1);

    this.c10 = new Float32Array(w); this.c20 = new Float32Array(w);
    this.k10 = new Float32Array(w); this.k20 = new Float32Array(w);
    this.w10 = new Float32Array(w); this.w20 = new Float32Array(w);
    let maxW = 0;
    for (let x = 0; x < w; x++) {
      this.c10[x] = yc(x, false); this.c20[x] = yc(x, true);
      const s1 = (yc(x + 1, false) - yc(x - 1, false)) / 2, s2 = (yc(x + 1, true) - yc(x - 1, true)) / 2;
      this.k10[x] = 1 / Math.sqrt(1 + s1 * s1); this.k20[x] = 1 / Math.sqrt(1 + s2 * s2);
      this.w10[x] = wid(x, false); this.w20[x] = wid(x, true);
      maxW = Math.max(maxW, this.w10[x], this.w20[x]);
    }
    // k <= 1 sehingga jarak vertikal bisa lebih besar dari lebar; beri ruang ekstra
    this.reach = Math.ceil(maxW * 2.2) + 4;

    this.base = new Uint8ClampedArray(w * h * 4);
    this.det = new Uint8Array(w * h);
    this.img = new ImageData(w, h);

    const GS = Math.max(16, Math.round(w / 20)), gw = Math.ceil(w / GS), gh = Math.ceil(h / GS);
    const eN = new Float32Array(gw * gh), eX = new Float32Array(gw * gh), eY = new Float32Array(gw * gh);
    const aN = new Float32Array(gw * gh), aX = new Float32Array(gw * gh), aY = new Float32Array(gw * gh);
    const sx = 640 / w; // skala noise agar tampilan sama di berbagai resolusi
    const floodReach = h * 0.075 * wscale;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x, o = i * 4;
        const d10 = Math.abs(y - this.c10[x]) * this.k10[x], d20 = Math.abs(y - this.c20[x]) * this.k20[x];
        const wa = d10 < this.w10[x], wb = d20 < this.w20[x];

        const nx = x * sx, ny = y * sx;
        const t = fbm(nx * 0.014, ny * 0.014, seed, 4);
        const t2 = fbm((nx + 2.2) * 0.014, (ny + 2.2) * 0.014, seed, 4);
        const det = fbm(nx * 0.12, ny * 0.12, seed + 3, 2);
        const blk = hash(Math.floor(nx / 9), Math.floor(ny / 7), seed + 9);

        let lr = lerp(10, 40, t), lg = lerp(34, 88, t), lb = lerp(34, 62, t);
        if (t > 0.56 && blk > 0.45) { const k = Math.min(1, (t - 0.56) * 3 * (blk - 0.4)); lr = lerp(lr, 118, k); lg = lerp(lg, 128, k); lb = lerp(lb, 96, k); }
        const dm = Math.min(d10, d20);
        if (dm < floodReach) { const k = (1 - dm / floodReach) * 0.55; lr = lerp(lr, 24, k); lg = lerp(lg, 84, k); lb = lerp(lb, 84, k); }
        // bayangan relief: cahaya dari kiri atas
        const shade = Math.min(1.3, Math.max(0.72, 0.9 + (t - t2) * 9)) * (0.9 + det * 0.2);
        this.base[o] = lr * shade; this.base[o + 1] = lg * shade; this.base[o + 2] = lb * shade; this.base[o + 3] = 255;
        this.det[i] = Math.round(det * 255);

        const gi = Math.floor(y / GS) * gw + Math.floor(x / GS);
        if (!wa && wb) { eN[gi]++; eX[gi] += x; eY[gi] += y; }
        else if (wa && !wb) { aN[gi]++; aX[gi] += x; aY[gi] += y; }
      }
    }

    const cands = (n: Float32Array, px: Float32Array, py: Float32Array): Spot[] => {
      const idx = Array.from(n.keys()).filter((i) => n[i] > 2).sort((p, q) => n[q] - n[p]);
      const out: Spot[] = [];
      for (const i of idx) {
        const s = { x: px[i] / n[i], y: py[i] / n[i] };
        if (out.every((o) => Math.hypot(o.x - s.x, o.y - s.y) > w * 0.08)) out.push(s);
        if (out.length >= 14) break;
      }
      return out.length ? out : [{ x: w * 0.6, y: h * 0.5 }];
    };
    this.eroC = cands(eN, eX, eY);
    this.accC = cands(aN, aX, aY);
  }

  render(ctx: CanvasRenderingContext2D, o: RenderOpts) {
    const { w, h } = this;
    const t = clamp01(o.t);
    const d = this.img.data;
    d.set(this.base);
    const flow = o.time !== undefined;
    const time = o.time ?? 0;

    for (let x = 0; x < w; x++) {
      const c10 = this.c10[x], c20 = this.c20[x];
      const ct = lerp(c10, c20, t), kt = lerp(this.k10[x], this.k20[x], t), wt = lerp(this.w10[x], this.w20[x], t);
      const lo = Math.max(0, Math.floor(Math.min(c10, c20) - this.reach));
      const hi = Math.min(h - 1, Math.ceil(Math.max(c10, c20) + this.reach));
      const k10 = this.k10[x], w10 = this.w10[x];
      for (let y = lo; y <= hi; y++) {
        const dt = Math.abs(y - ct) * kt, d10 = Math.abs(y - c10) * k10;
        const cov = clamp01(wt - dt + 0.5), cov0 = clamp01(w10 - d10 + 0.5);
        if (cov === 0 && cov0 === 0) continue;
        const i = y * w + x, p = i * 4;
        let R = d[p], G = d[p + 1], B = d[p + 2];
        if (cov > 0) {
          const u = Math.min(1, dt / wt), q = u * u, dv = this.det[i] / 255;
          const shim = flow ? 1 + 0.07 * Math.sin(x * 0.21 - time * 1.5 + dv * 7) : 1;
          R = lerp(R, (lerp(10, 36, q) + dv * 6) * shim, cov);
          G = lerp(G, (lerp(62, 128, q) + dv * 8) * shim, cov);
          B = lerp(B, (lerp(96, 158, q) + dv * 6) * shim, cov);
        }
        if (o.overlay) {
          const e = cov - cov0;
          if (e > 0) { const a = 0.78 * e; R = lerp(R, 255, a); G = lerp(G, 84, a); B = lerp(B, 112, a); }
          else if (e < 0) { const a = -0.75 * e; R = lerp(R, 34, a); G = lerp(G, 211, a); B = lerp(B, 238, a); }
        }
        d[p] = R; d[p + 1] = G; d[p + 2] = B;
      }
    }
    ctx.putImageData(this.img, 0, 0);

    const u = w / 640;
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = Math.max(1.4, 2 * u);
    if (o.old) { ctx.setLineDash([6 * u, 5 * u]); ctx.strokeStyle = "#fbbf24"; this.edge(ctx, 0); }
    if (o.now) { ctx.setLineDash([]); ctx.strokeStyle = "#ff2255"; this.edge(ctx, t); }
    ctx.setLineDash([]);
  }

  private edge(ctx: CanvasRenderingContext2D, t: number) {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      for (let x = 0; x < this.w; x += 2) {
        const ct = lerp(this.c10[x], this.c20[x], t), kt = lerp(this.k10[x], this.k20[x], t), wt = lerp(this.w10[x], this.w20[x], t);
        const y = ct + (s * wt) / kt;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

const cache = new Map<string, Morph>();
export function getMorph(seed: number, w: number, h: number, shift = 0.5, wscale = 1): Morph {
  const key = [seed, w, h, shift.toFixed(2), wscale].join("|");
  let m = cache.get(key);
  if (!m) { m = new Morph(seed, w, h, shift, wscale); cache.set(key, m); }
  return m;
}
