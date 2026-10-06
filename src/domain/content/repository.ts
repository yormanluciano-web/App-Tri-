import type { Activity, ContentPack } from "../models/activity";
import { activitySchema } from "../models/activity";
import { validateCatalog, type ValidationResult } from "./validate";

/**
 * Contrato de lectura/escritura del catálogo. La versión actual solo
 * implementa la lectura local; un panel futuro (p. ej. con Supabase) podrá
 * implementar la escritura con validación, versionado y estados editoriales.
 * Ningún paquete importado puede ejecutar código ni eludir límites: todo pasa
 * por el esquema y el validador, y se trata como no confiable.
 */
export interface CatalogReader {
  list(): Promise<readonly Activity[]>;
  get(id: string): Promise<Activity | undefined>;
  packs(): Promise<readonly ContentPack[]>;
}

export interface CatalogWriter {
  /** Crea o actualiza; incrementa contentVersion. Nunca recicla IDs. */
  upsert(activity: Activity): Promise<ValidationResult>;
  /** Desactiva en lugar de borrar, para no romper referencias de versiones anteriores. */
  disable(id: string): Promise<void>;
  setEditorialStatus(id: string, status: Activity["editorialStatus"]): Promise<void>;
}

export class LocalCatalogRepository implements CatalogReader {
  constructor(
    private readonly activities: readonly Activity[],
    private readonly contentPacks: readonly ContentPack[],
  ) {}
  async list() {
    return this.activities;
  }
  async get(id: string) {
    return this.activities.find((a) => a.id === id);
  }
  async packs() {
    return this.contentPacks;
  }
}

/** Valida un paquete externo (cartas propias futuras) antes de aceptarlo. */
export function validateImportedPack(raw: unknown, existingIds: ReadonlySet<string>): { ok: boolean; activities: Activity[]; result: ValidationResult } {
  const list = Array.isArray(raw) ? raw : [];
  const result = validateCatalog(list);
  const activities = list.flatMap((x) => {
    const r = activitySchema.safeParse(x);
    return r.success ? [r.data] : [];
  });
  const clash = activities.filter((a) => existingIds.has(a.id));
  for (const a of clash) result.errors.push({ id: a.id, level: "error", message: "ID ya usado por el catálogo" });
  // Los paquetes importados entran como borrador hasta una revisión humana.
  const drafts = activities.map((a) => ({ ...a, editorialStatus: "draft" as const }));
  return { ok: result.errors.length === 0, activities: drafts, result: { ...result, ok: result.errors.length === 0 } };
}
