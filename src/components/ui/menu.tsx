"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Icon, Screen, cx, type IconName } from "./index";

export interface MenuSection {
  id: string;
  icon: IconName;
  title: string;
  /** Una línea bajo el título en la lista. */
  sub?: string;
  content: ReactNode;
  tone?: "danger";
}

/**
 * Página tipo «ajustes del teléfono»: una lista de secciones que cabe en la
 * pantalla; al tocar una, su contenido ocupa la pantalla con «Atrás». Solo el
 * contenido de una sección larga se desplaza por dentro. `#id` en la dirección
 * abre esa sección directamente.
 */
export function MenuPage({ title, sub, backHref = "/", backLabel = "Inicio", sections, footer }: { title: string; sub?: string; backHref?: string; backLabel?: string; sections: MenuSection[]; footer?: ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    // La sección del enlace (#privacidad…) solo se conoce en el cliente, tras montar.
    const id = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id && sections.some((s) => s.id === id)) setOpen(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = sections.find((s) => s.id === open) ?? null;

  if (current) {
    return (
      <Screen fit>
        <header className="flex shrink-0 items-center gap-2 pt-1">
          <Button variant="secondary" icon="back" aria-label={`Volver a ${title}`} className="!size-11 !min-h-0 !rounded-full !p-0" onClick={() => setOpen(null)} />
          <h1 id={current.id} className="min-w-0 truncate text-2xl font-semibold">
            {current.title}
          </h1>
        </header>
        <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-2">{current.content}</div>
      </Screen>
    );
  }

  return (
    <Screen fit>
      <header className="flex shrink-0 items-center gap-2 pt-1">
        <Link href={backHref} aria-label={`Volver a ${backLabel}`} className="btn-glass flex size-11 shrink-0 items-center justify-center rounded-full">
          <Icon name="back" className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
          {sub && <p className="truncate text-xs text-muted">{sub}</p>}
        </div>
      </header>
      <nav aria-label={title} className="-mx-4 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
        <ul className="glass divide-y divide-line overflow-hidden rounded-3xl">
          {sections.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setOpen(s.id)} className="flex min-h-[3.75rem] w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5 active:bg-white/10">
                <span
                  className={cx(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    s.tone === "danger" ? "bg-bad/15 text-bad" : "bg-gradient-to-br from-accent/25 to-accent-2/25 text-accent",
                  )}
                >
                  <Icon name={s.icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block font-semibold leading-tight", s.tone === "danger" && "text-bad")}>{s.title}</span>
                  {s.sub && <span className="block truncate text-xs text-muted">{s.sub}</span>}
                </span>
                <Icon name="back" className="size-4 shrink-0 rotate-180 text-faint" />
              </button>
            </li>
          ))}
        </ul>
        {footer && <div className="pt-3">{footer}</div>}
      </nav>
    </Screen>
  );
}
