"use client";

import Link from "next/link";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { PARTICIPANT_COLORS, PARTICIPANT_MARKS } from "@/domain/models/constants";
import { Icon, type IconName } from "./icons";

export { Icon, Logo, Logo3D, type IconName } from "./icons";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type Size = "md" | "lg" | "xl";

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary font-semibold",
  secondary: "btn-glass text-ink",
  ghost: "bg-transparent text-ink border border-line hover:bg-white/5",
  danger: "btn-danger font-semibold",
  quiet: "bg-transparent text-muted underline underline-offset-4 hover:text-ink",
};

const SIZE: Record<Size, string> = {
  md: "min-h-12 px-4 py-2.5 text-base",
  lg: "min-h-14 px-5 py-3 text-lg",
  xl: "min-h-16 px-6 py-4 text-xl",
};

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full transition duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 select-none";

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  block,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: IconName; block?: boolean }) {
  return (
    <button type="button" {...props} className={cx(BASE, VARIANT[variant], variant !== "quiet" && SIZE[size], block && "w-full", className)}>
      {icon && <Icon name={icon} className={size === "md" ? "size-5" : "size-6"} />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  block,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  block?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cx(BASE, VARIANT[variant], SIZE[size], block && "w-full", className)}>
      {icon && <Icon name={icon} className={size === "md" ? "size-5" : "size-6"} />}
      {children}
    </Link>
  );
}

/** Fondo animado con los colores del nivel actual. */
export function Aurora() {
  return (
    <div className="aurora" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

export function Screen({ children, className, level = "leve" }: { children: ReactNode; className?: string; level?: string }) {
  return (
    <main data-level={level} className={cx("safe-top safe-bottom relative mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 overflow-x-clip px-4 pb-6", className)}>
      <Aurora />
      {children}
    </main>
  );
}

export function Card({ children, className, glow }: { children: ReactNode; className?: string; glow?: boolean }) {
  return <section className={cx("glass rounded-[28px] p-5", glow && "glow-border", className)}>{children}</section>;
}

export function Title({ children, sub, eyebrow }: { children: ReactNode; sub?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="space-y-2 animate-in">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold leading-tight">{children}</h1>
      {sub && <p className="text-muted">{sub}</p>}
    </header>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <p
      role="status"
      className={cx(
        "flex gap-2 rounded-2xl border px-4 py-3 text-sm",
        tone === "warn" ? "border-warn/50 bg-warn/10 text-ink" : "border-line bg-white/5 text-muted",
      )}
    >
      <Icon name={tone === "warn" ? "shield" : "sparkle"} className="mt-0.5 size-4 shrink-0 text-accent" />
      <span>{children}</span>
    </p>
  );
}

export function ParticipantTag({ alias, slot, className }: { alias: string; slot: number; className?: string }) {
  const color = PARTICIPANT_COLORS[slot];
  return (
    <span className={cx("inline-flex items-center gap-1.5 font-semibold", className)}>
      <span
        aria-hidden
        className="inline-flex size-5 items-center justify-center rounded-full text-[0.6rem] leading-none text-[#1a0612]"
        style={{ background: color, boxShadow: `0 0 12px ${color}88` }}
      >
        {PARTICIPANT_MARKS[slot]}
      </span>
      <span>{alias}</span>
    </span>
  );
}

/** Avatar grande para pantallas de entrega del teléfono. */
export function Avatar({ alias, slot }: { alias: string; slot: number }) {
  const color = PARTICIPANT_COLORS[slot];
  return (
    <span
      aria-hidden
      className="mx-auto flex size-20 items-center justify-center rounded-full font-display text-3xl font-semibold italic text-[#1a0612] animate-float"
      style={{ background: `radial-gradient(circle at 30% 30%, #fff8, ${color})`, boxShadow: `0 0 40px ${color}99` }}
    >
      {alias.trim().charAt(0).toUpperCase() || PARTICIPANT_MARKS[slot]}
    </span>
  );
}

export function Chip({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition duration-200 active:scale-95 disabled:opacity-40",
        selected ? "border-transparent bg-gradient-to-r from-accent to-accent-2 font-semibold text-accent-ink shadow-[0_6px_20px_-8px_var(--glow)]" : "border-line bg-white/5 text-ink hover:bg-white/10",
      )}
    >
      {selected && <Icon name="check" className="size-4" />}
      {children}
    </button>
  );
}

/** Opción grande tipo tarjeta (radio o interruptor). */
export function OptionTile({
  selected,
  onClick,
  title,
  description,
  icon,
  role = "radio",
  level,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName;
  role?: "radio" | "button";
  level?: string;
  badge?: ReactNode;
}) {
  const aria = role === "radio" ? { role: "radio", "aria-checked": selected } : { "aria-pressed": selected };
  return (
    <button
      type="button"
      {...aria}
      data-level={level}
      onClick={onClick}
      className={cx(
        "glass group relative flex w-full items-start gap-4 rounded-3xl p-4 text-left transition duration-200 active:scale-[0.98]",
        selected ? "glow-border" : "hover:bg-white/5",
      )}
    >
      {icon && (
        <span
          className={cx(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl transition",
            selected ? "bg-gradient-to-br from-accent to-accent-2 text-accent-ink" : "bg-white/5 text-accent",
          )}
        >
          <Icon name={icon} className="size-6" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-lg font-semibold">{title}</span>
          {badge}
        </span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition",
          selected ? "border-transparent bg-accent text-accent-ink" : "border-line",
        )}
      >
        {selected && <Icon name="check" className="size-4" />}
      </span>
    </button>
  );
}

/** Barra de progreso por pasos. */
export function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-1 items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={`Paso ${current} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cx(
            "h-1.5 flex-1 rounded-full transition-all duration-500",
            i < current ? "bg-gradient-to-r from-accent to-accent-2 shadow-[0_0_10px_var(--glow)]" : "bg-white/10",
          )}
        />
      ))}
    </div>
  );
}

/** Diálogo modal accesible con foco atrapado. */
export function Dialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>("button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])") ?? []).filter(
        (n) => !n.hasAttribute("disabled"),
      );
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
      if (e.key === "Tab") {
        const f = focusables();
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" role="presentation">
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="glass glow-border w-full max-w-md space-y-4 rounded-[28px] p-6 animate-deal">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white/5 p-3 transition hover:bg-white/10">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-full transition peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--focus)]",
          checked ? "bg-gradient-to-r from-accent to-accent-2" : "bg-white/15",
        )}
      >
        <span className={cx("absolute top-1 size-5 rounded-full bg-white shadow transition-all duration-200", checked ? "left-6" : "left-1")} />
      </span>
      <span className="min-w-0">
        <span className="font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}
