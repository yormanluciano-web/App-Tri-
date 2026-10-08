"use client";

import { create } from "zustand";
import {
  CUSTOM_FILE_PATH,
  EMPTY_CUSTOM_FILE,
  applyCustomChange,
  customFileSchema,
  describeChange,
  serializeCustomFile,
  type CustomChange,
  type CustomFile,
} from "@/data/custom";
import { GithubError, checkAccess, getFile, putFile, type RepoConfig } from "./github";

/**
 * Sesión de administración. La llave de GitHub solo vive en memoria: al
 * recargar o cerrar sesión se olvida (el llavero del sistema puede
 * autocompletarla). En el dispositivo solo se recuerda el repositorio y la
 * rama, que no son secretos.
 */
const REPO_KEY = "trio:admin-repo";
export const DEFAULT_REPO: RepoConfig = { owner: "yormanluciano-web", repo: "App-Tri-", branch: "" };

export function savedRepo(): RepoConfig {
  try {
    const raw = window.localStorage.getItem(REPO_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<RepoConfig>;
      if (typeof v.owner === "string" && typeof v.repo === "string") return { owner: v.owner, repo: v.repo, branch: typeof v.branch === "string" ? v.branch : "" };
    }
  } catch {
    /* sin almacenamiento: valores por defecto */
  }
  return { ...DEFAULT_REPO };
}

function rememberRepo(repo: RepoConfig): void {
  try {
    window.localStorage.setItem(REPO_KEY, JSON.stringify(repo));
  } catch {
    /* opcional */
  }
}

export interface PublishResult {
  commitUrl: string | null;
}

interface AdminState {
  token: string | null;
  repo: RepoConfig | null;
  file: CustomFile | null;
  sha: string | null;
  busy: boolean;
  error: string | null;
  login(repo: RepoConfig, token: string): Promise<boolean>;
  logout(): void;
  reload(): Promise<void>;
  publish(change: CustomChange, title: string): Promise<PublishResult | null>;
  clearError(): void;
}

function message(e: unknown): string {
  if (e instanceof GithubError) return e.message;
  if (e instanceof Error) return e.message;
  return "Algo salió mal.";
}

async function fetchFile(token: string, repo: RepoConfig): Promise<{ file: CustomFile; sha: string | null }> {
  const remote = await getFile(token, repo, CUSTOM_FILE_PATH);
  if (!remote) return { file: { ...EMPTY_CUSTOM_FILE, cartas: [], ocultas: [] }, sha: null };
  const parsed = customFileSchema.safeParse(JSON.parse(remote.text));
  if (!parsed.success) throw new Error("El archivo de cartas del repositorio no tiene el formato esperado.");
  return { file: parsed.data, sha: remote.sha };
}

export const useAdmin = create<AdminState>((set, get) => ({
  token: null,
  repo: null,
  file: null,
  sha: null,
  busy: false,
  error: null,

  async login(input, token) {
    const owner = input.owner.trim();
    const repoName = input.repo.trim();
    const clean = token.trim();
    if (!owner || !repoName || !clean) {
      set({ error: "Completa el usuario, el repositorio y la llave." });
      return false;
    }
    set({ busy: true, error: null });
    try {
      const access = await checkAccess(clean, owner, repoName);
      if (!access.canPush) throw new Error("Esta llave puede leer el repositorio pero no escribir en él.");
      const repo: RepoConfig = { owner, repo: repoName, branch: input.branch.trim() || access.defaultBranch };
      const { file, sha } = await fetchFile(clean, repo);
      rememberRepo(repo);
      set({ token: clean, repo, file, sha, busy: false });
      return true;
    } catch (e) {
      set({ busy: false, error: message(e) });
      return false;
    }
  },

  logout() {
    set({ token: null, repo: null, file: null, sha: null, error: null, busy: false });
  },

  async reload() {
    const { token, repo } = get();
    if (!token || !repo) return;
    set({ busy: true, error: null });
    try {
      const { file, sha } = await fetchFile(token, repo);
      set({ file, sha, busy: false });
    } catch (e) {
      set({ busy: false, error: message(e) });
    }
  },

  async publish(change, title) {
    const { token, repo } = get();
    if (!token || !repo) return null;
    set({ busy: true, error: null });
    // Siempre sobre la última versión del archivo; un reintento si otro cambio se cruzó.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { file, sha } = await fetchFile(token, repo);
        const next = applyCustomChange(file, change);
        const res = await putFile(token, repo, CUSTOM_FILE_PATH, serializeCustomFile(next), sha, describeChange(change, title));
        const fresh = await fetchFile(token, repo).catch(() => ({ file: next, sha: null }));
        set({ file: fresh.file, sha: fresh.sha, busy: false });
        return { commitUrl: res.commitUrl };
      } catch (e) {
        if (e instanceof GithubError && e.status === 409 && attempt === 0) continue;
        set({ busy: false, error: message(e) });
        return null;
      }
    }
    set({ busy: false });
    return null;
  },

  clearError() {
    set({ error: null });
  },
}));
