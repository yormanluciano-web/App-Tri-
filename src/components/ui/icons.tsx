import type { SVGProps } from "react";

/** Iconos propios (trazo 1.8, 24×24). Siempre decorativos: el texto del botón da el nombre accesible. */
const PATHS = {
  heart: "M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.8 1.1-1.7 2.7-2.8 4.7-2.8 3.3 0 5.7 3.1 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z",
  flame: "M12 21c-3.9 0-6.5-2.7-6.5-6.2 0-3.4 2.4-5.4 3.9-7.6.4 1.8 1.3 3 2.6 3.6-.3-3.3 1.1-6.1 3.6-7.8-.2 2.6.8 4.5 2.4 6.3 1.4 1.6 2.5 3.3 2.5 5.5 0 3.5-2.6 6.2-6.5 6.2Z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6.5 11l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z",
  check: "M5 12.5l4.2 4.2L19 7",
  skip: "M5 6l7 6-7 6V6Zm8 0l7 6-7 6V6Z",
  refresh: "M20 11a8 8 0 0 0-14.3-4.6L4 8m0-4v4h4M4 13a8 8 0 0 0 14.3 4.6L20 16m0 4v-4h-4",
  pause: "M8 5v14M16 5v14",
  stop: "M7 7h10v10H7z",
  play: "M8 5.5v13l10.5-6.5L8 5.5Z",
  dice: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3.5 4.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01",
  wheel: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4",
  cards: "M8 3h10a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm-3 4v13a1 1 0 0 0 1 1h9",
  timer: "M12 8v5l3 2M9 2h6M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  chain: "M10 14a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 0 1 5.7 5.7l-1.2 1.2M14 10a4 4 0 0 1 0 5.7l-2.3 2.3a4 4 0 0 1-5.7-5.7l1.2-1.2",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  shuffle: "M3 7h3c4 0 6 10 10 10h5m0 0-3-3m3 3-3 3M3 17h3c1.6 0 2.8-1.6 3.9-3.6M14 8.6C15 7.4 16 7 17 7h4m0 0-3-3m3 3-3 3",
  gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1Zm0 0c1.5-3 5-3 5-1s-3 1-5 1Z",
  shield: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Zm-3 9 2.2 2.2L15 10",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 19h14",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7m0 3h.01",
  back: "M15 5l-7 7 7 7",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1.5-9a3 3 0 1 0 0-6m2.5 15a5 5 0 0 0-3-4.6",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 1 1 7 0v3",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  arrowUp: "M12 19V5m0 0-6 6m6-6 6 6",
  arrowDown: "M12 5v14m0 0-6-6m6 6 6-6",
  x: "M6 6l12 12M18 6 6 18",
  tower: "M7 20.5h10M7 20.5v-4h10v4M6 16.5v-4h12v4M7 12.5v-4h10v4M9 8.5v-4h6v4",
  bottle: "M10 2.5h4M10.5 2.5v4.5L8 10.5v9.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-9.5L13.5 7V2.5M8 14h8",
  scratch: "M3.5 6.5h17v11h-17zM7 14.5l3-3 2 2 3.5-3.5M17.5 3.5l1 1.5M20.5 2.5l-.5 2",
  board: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21M12 10.6c-.6-.9-2.2-.5-2 .7.2 1 2 1.9 2 1.9s1.8-.9 2-1.9c.2-1.2-1.4-1.6-2-.7Z",
  kiss: "M4 12c2.5-3 5-4 8-2 3-2 5.5-1 8 2-2.5 1.5-5 3.5-8 3.5S6.5 13.5 4 12Zm0 0c2.6.8 5.3 1 8 1s5.4-.2 8-1",
} as const;

export type IconName = keyof typeof PATHS;

export function iconPath(name: IconName): string {
  return PATHS[name];
}

export function Icon({ name, className, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const filled = name === "play" || name === "skip";
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-5"}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Logotipo: tres anillos entrelazados con brillo. */
export function Logo({ className, still }: { className?: string; /** Sin latido (p. ej. dentro de una carta que gira). */ still?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={className}>
      <defs>
        <linearGradient id="logo-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#F3A6D0" />
          <stop offset="0.5" stopColor="#FF4D8D" />
          <stop offset="1" stopColor="#F5C76B" />
        </linearGradient>
        <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g fill="none" stroke="url(#logo-g)" strokeWidth="6" filter="url(#logo-glow)">
        <circle cx="45" cy="50" r="25" />
        <circle cx="75" cy="50" r="25" opacity="0.9" />
        <circle cx="60" cy="75" r="25" opacity="0.75" />
      </g>
      <path
        className={still ? undefined : "animate-heartbeat"}
        d="M60 66s-7-4.3-8.6-8.8c-1.1-3.3 1.1-6.2 4.2-6.2 1.9 0 3.4 1 4.4 2.6 1-1.6 2.5-2.6 4.4-2.6 3.1 0 5.3 2.9 4.2 6.2C67 61.7 60 66 60 66Z"
        fill="url(#logo-g)"
      />
    </svg>
  );
}

const RINGS = [
  { cx: 45, cy: 50, z: -28, o: 1 },
  { cx: 75, cy: 50, z: 0, o: 0.92 },
  { cx: 60, cy: 75, z: 28, o: 0.8 },
];

/** Logotipo en capas: cada anillo y el corazón a distinta profundidad, balanceándose en 3D. */
export function Logo3D({ className }: { className?: string }) {
  return (
    <div className={"scene-3d " + (className ?? "")} aria-hidden>
      <div className="logo-3d relative size-full">
        {RINGS.map((r, i) => (
          <svg key={i} viewBox="0 0 120 120" style={{ transform: `translateZ(${r.z}px)`, filter: "drop-shadow(0 0 6px rgba(255,77,141,0.7))" }}>
            <defs>
              <linearGradient id={`l3d-g${i}`} x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#F3A6D0" />
                <stop offset="0.5" stopColor="#FF4D8D" />
                <stop offset="1" stopColor="#F5C76B" />
              </linearGradient>
            </defs>
            <circle
              cx={r.cx}
              cy={r.cy}
              r="25"
              fill="none"
              stroke={`url(#l3d-g${i})`}
              strokeWidth="6"
              opacity={r.o}
            />
          </svg>
        ))}
        <div style={{ transform: "translateZ(56px)" }}>
        <svg viewBox="0 0 120 120" className="animate-heartbeat absolute inset-0 size-full" style={{ filter: "drop-shadow(0 0 8px rgba(255,77,141,0.9))", willChange: "transform" }}>
          <defs>
            <linearGradient id="l3d-heart" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#FFD1E6" />
              <stop offset="1" stopColor="#FF4D8D" />
            </linearGradient>
          </defs>
          <path
            d="M60 68s-8-4.9-9.8-10c-1.3-3.8 1.3-7.1 4.8-7.1 2.2 0 3.9 1.1 5 3 1.1-1.9 2.8-3 5-3 3.5 0 6.1 3.3 4.8 7.1C68 63.1 60 68 60 68Z"
            fill="url(#l3d-heart)"
          />
        </svg>
        </div>
      </div>
    </div>
  );
}
