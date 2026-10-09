"use client";

import { useEffect, useState } from "react";
import { subscribePwa, type OfflineStatus } from "@/pwa/register";

const LABEL: Record<OfflineStatus, string> = {
  ready: "Disponible sin conexión",
  installing: "Preparando uso sin conexión…",
  dev: "Modo desarrollo: sin uso offline",
  unsupported: "Este navegador no permite uso sin conexión",
  error: "No se pudo preparar el uso sin conexión",
};

export function OfflineBadge({ compact }: { compact?: boolean } = {}) {
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  useEffect(() => subscribePwa((s) => setStatus(s.offline)), []);
  if (!status) return null;
  return (
    <p data-testid="offline-status" data-status={status} className={compact ? "flex items-center gap-1 text-[0.7rem] text-muted" : "flex items-center gap-2 text-sm text-muted"} role="status">
      <span aria-hidden className={status === "ready" ? "text-ok" : "text-faint"}>
        {status === "ready" ? "●" : "○"}
      </span>
      {LABEL[status]}
    </p>
  );
}
