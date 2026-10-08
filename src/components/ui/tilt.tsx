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
  const pressed = useRef(false);
  const sheenRef = useRef<HTMLSpanElement>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    el.classList.remove("is-tilting");
    el.style.transform = "";
  };

  const update = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || motionReduced()) return;
    // Sobre un control interno o con el dedo presionado, la carta se queda quieta
    // para que el toque caiga exactamente donde se apuntó.
    if (pressed.current) return;
    if (ignoreInteractive && (e.target as Element).closest("button, a, input, textarea, select, [role='radio']")) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      el.classList.add("is-tilting");
      // Se escribe la transformación directamente (no variables CSS que se heredan
      // a todo el contenido y obligan a recalcular estilos en cada movimiento).
      el.style.transform = `rotateX(${((0.5 - y) * 2 * max).toFixed(2)}deg) rotateY(${((x - 0.5) * 2 * max).toFixed(2)}deg)`;
      const sheen = sheenRef.current;
      if (sheen) {
        sheen.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        sheen.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      }
    });
  };

  return (
    <div className={"scene-3d " + (className ?? "")}>
      <div
        ref={ref}
        className="tilt-3d relative rounded-[28px]"
        onPointerMove={update}
        onPointerDown={() => (pressed.current = true)}
        onPointerLeave={() => {
          pressed.current = false;
          reset();
        }}
        onPointerUp={() => (pressed.current = false)}
        onPointerCancel={() => {
          pressed.current = false;
          reset();
        }}
      >
        {children}
        <span ref={sheenRef} className="sheen" aria-hidden />
      </div>
    </div>
  );
}
