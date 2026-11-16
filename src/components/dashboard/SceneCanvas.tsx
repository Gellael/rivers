import React, { useEffect, useRef } from "react";
import { getMorph, type SceneKey } from "./riverScene";

interface SceneCanvasProps {
  seed: number;
  mode: SceneKey;
  w?: number;
  h?: number;
  shift?: number;
  wscale?: number;
  className?: string;
}

/** Thumbnail citra sungai sintetis (dekoratif, statis). */
export const SceneCanvas: React.FC<SceneCanvasProps> = ({ seed, mode, w = 240, h = 150, shift = 0.45, wscale = 1.3, className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const m = getMorph(seed, w, h, shift, wscale);
    if (mode === "y2010") m.render(ctx, { t: 0, old: true });
    else if (mode === "y2020") m.render(ctx, { t: 1, now: true });
    else m.render(ctx, { t: 1, overlay: true, old: true, now: true });
  }, [seed, mode, w, h, shift, wscale]);
  return <canvas ref={ref} width={w} height={h} className={className} aria-hidden="true" />;
};
