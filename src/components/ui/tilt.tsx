"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

function motionReduced(): boolean {
  if (typeof window === "undefined") return true;
  const root = document.documentElement.dataset.motion;
  if (root === "reduce") return true;
  if (root === "full") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Inclina su contenido en 3D según la posición del dedo o el ratón, con un
 * reflejo que lo sigue. Sin efecto si la persona pidió reducir movimiento.
 */
export function Tilt({
  children,
  className,
  max = 9,
  ignoreInteractive = false,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  /** No inclina mientras el dedo está sobre un control interno (evita mover el botón al tocarlo). */
  ignoreInteractive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--sheen", "0");
  };

  const update = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || motionReduced()) return;
    if (ignoreInteractive && (e.target as Element).closest("button, a, input, textarea, select, [role='radio']")) {
      reset();
      return;
    }
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.classList.add("is-tilting");
      el.style.setProperty("--ry", `${(x - 0.5) * 2 * max}deg`);
      el.style.setProperty("--rx", `${(0.5 - y) * 2 * max}deg`);
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.style.setProperty("--sheen", "1");
    });
  };

  return (
    <div className={"scene-3d " + (className ?? "")}>
      <div ref={ref} className="tilt-3d relative rounded-[28px]" onPointerMove={update} onPointerLeave={reset} onPointerUp={reset} onPointerCancel={reset}>
        {children}
        <span className="sheen" aria-hidden />
      </div>
    </div>
  );
}
