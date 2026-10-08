import { useId } from "react";
import { iconPath } from "./icons";
import { GAME_THEME, themeStyle, type ThemeKey } from "./visuals";

/**
 * Emblema de juego: medallón con el degradado del juego, filete dorado,
 * cuatro rombos y el símbolo al centro. Siempre decorativo.
 */
export function GameEmblem({ theme, className }: { theme: ThemeKey; className?: string }) {
  const id = useId().replace(/:/g, "");
  const t = GAME_THEME[theme];
  const filled = t.icon === "play" || t.icon === "skip";
  return (
    <svg viewBox="0 0 100 100" className={className ?? "size-12"} style={themeStyle(theme)} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`em-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--g1)" }} />
          <stop offset="1" style={{ stopColor: "var(--g2)" }} />
        </linearGradient>
        <linearGradient id={`emr-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#f5c76b" />
          <stop offset="1" stopColor="#b8862e" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#emr-${id})`} />
      <circle cx="50" cy="50" r="45" fill={`url(#em-${id})`} />
      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--g3)" strokeOpacity="0.75" strokeWidth="1.4" strokeDasharray="1.5 3.2" />
      <circle cx="50" cy="50" r="31" fill="rgba(20,4,18,0.28)" />
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d="M50 8.5l2.6 3.5-2.6 3.5-2.6-3.5z" fill="#fff3c4" transform={`rotate(${a} 50 50)`} />
      ))}
      <ellipse cx="50" cy="26" rx="26" ry="10" fill="#fff" opacity="0.14" />
      <svg x="29" y="29" width="42" height="42" viewBox="0 0 24 24">
        <path d={iconPath(t.icon)} fill={filled ? "#fff" : "none"} stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </svg>
  );
}
