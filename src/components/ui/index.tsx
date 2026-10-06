"use client";

import Link from "next/link";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { PARTICIPANT_COLORS, PARTICIPANT_MARKS, LIGHT_LABEL, type Light } from "@/domain/models/constants";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink font-semibold hover:brightness-110",
  secondary: "bg-surface-2 text-ink border border-line hover:border-accent",
  ghost: "bg-transparent text-ink border border-line hover:bg-surface-2",
  danger: "bg-bad text-[#2a0606] font-semibold hover:brightness-110",
  quiet: "bg-transparent text-muted underline underline-offset-4 hover:text-ink",
};

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  block,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "min-h-11 min-w-11 rounded-2xl px-4 py-2.5 text-base transition disabled:cursor-not-allowed disabled:opacity-45",
        VARIANT[variant],
        block && "w-full",
        className,
      )}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  block,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  block?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-base transition",
        VARIANT[variant],
        block && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Screen({ children, className, level }: { children: ReactNode; className?: string; level?: string }) {
  return (
    <main
      data-level={level}
      className={cx("safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 pb-6", className)}
    >
      {children}
    </main>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("glass rounded-3xl p-5", className)}>{children}</section>;
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold leading-tight">{children}</h1>
      {sub && <p className="text-muted">{sub}</p>}
    </header>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <p
      role="status"
      className={cx(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "warn" ? "border-warn/60 bg-warn/10 text-ink" : "border-line bg-surface-2 text-muted",
      )}
    >
      {children}
    </p>
  );
}

export function ParticipantTag({ alias, slot, className }: { alias: string; slot: number; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 font-semibold", className)}>
      <span aria-hidden style={{ color: PARTICIPANT_COLORS[slot] }}>
        {PARTICIPANT_MARKS[slot]}
      </span>
      <span>{alias}</span>
    </span>
  );
}

const LIGHT_ICON: Record<Light, string> = { green: "✓", yellow: "?", red: "✕" };
const LIGHT_CLASS: Record<Light, string> = {
  green: "border-ok text-ok",
  yellow: "border-warn text-warn",
  red: "border-bad text-bad",
};

export function LightBadge({ light }: { light: Light }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", LIGHT_CLASS[light])}>
      <span aria-hidden>{LIGHT_ICON[light]}</span>
      {LIGHT_LABEL[light]}
    </span>
  );
}

/** Selector de semáforo: icono, palabra y descripción; no depende solo del color. */
export function LightPicker({
  value,
  onChange,
  label,
  hint,
  allowed = ["green", "yellow", "red"],
  name,
}: {
  value: Light;
  onChange: (l: Light) => void;
  label: string;
  hint?: string;
  allowed?: Light[];
  name: string;
}) {
  return (
    <fieldset className="space-y-2 rounded-2xl border border-line p-3">
      <legend className="px-1 font-semibold">{label}</legend>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <div className="grid grid-cols-3 gap-2">
        {(["green", "yellow", "red"] as Light[]).map((l) => {
          const disabled = !allowed.includes(l);
          const checked = value === l;
          return (
            <label
              key={l}
              className={cx(
                "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-xl border px-1 py-2 text-center text-sm",
                checked ? LIGHT_CLASS[l] + " bg-surface-2" : "border-line text-muted",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={l}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(l)}
              />
              <span aria-hidden className="text-lg leading-none">
                {LIGHT_ICON[l]}
              </span>
              <span>{LIGHT_LABEL[l]}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
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
        "min-h-11 rounded-full border px-4 py-2 text-sm transition disabled:opacity-40",
        selected ? "border-accent bg-accent text-accent-ink font-semibold" : "border-line bg-surface-2 text-ink",
      )}
    >
      {selected && <span aria-hidden>✓ </span>}
      {children}
    </button>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="presentation">
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="glass w-full max-w-md space-y-4 rounded-3xl p-5 animate-in">
        <h2 className="text-xl font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-line p-3">
      <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}
