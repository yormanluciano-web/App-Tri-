"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cx } from "./index";

/**
 * Texto que se ajusta a su espacio: empieza en `max` (rem) y baja hasta `min`
 * hasta que cabe sin desbordar. Si ni así cabe, ese bloque se desplaza por
 * dentro (la pantalla nunca). Se recalcula al cambiar el tamaño o el contenido.
 * Solo toca el estilo del elemento (sin estado de React).
 */
export function FitText({ children, className, max = 1.5, min = 0.95, deps = [] }: { children: ReactNode; className?: string; max?: number; min?: number; deps?: unknown[] }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      let size = max;
      i.style.fontSize = `${size}rem`;
      o.style.overflowY = "hidden";
      while (size > min && i.scrollHeight > o.clientHeight + 1) {
        size = Math.max(min, size - 0.0625);
        i.style.fontSize = `${size}rem`;
      }
      if (i.scrollHeight > o.clientHeight + 1) o.style.overflowY = "auto";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, min, ...deps]);

  return (
    <div ref={outer} className={cx("flex min-h-0 flex-1 flex-col overscroll-contain", className)}>
      <div ref={inner} className="my-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * Escena que se encoge para caber (torre, botella, ruleta, dados…): mide su
 * tamaño natural y aplica una escala ≤ 1. Nunca la agranda.
 */
export function FitScale({ children, className }: { children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const w = i.offsetWidth;
      const h = i.offsetHeight;
      if (!w || !h) return;
      const s = Math.min(1, o.clientWidth / w, o.clientHeight / h);
      i.style.transform = s < 0.999 ? `scale(${s.toFixed(3)})` : "";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className={cx("relative flex min-h-0 flex-1 items-center justify-center", className)}>
      <div ref={inner} className="shrink-0 origin-center">
        {children}
      </div>
    </div>
  );
}
