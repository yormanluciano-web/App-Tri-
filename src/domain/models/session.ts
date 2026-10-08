import type {
  Category,
  Gender,
  GameId,
  Intensity,
  Light,
  Permission,
  Relationship,
  RoleId,
} from "./constants";

export type ParticipantId = string;

export interface LimitProfile {
  /** Se incrementa con cada edición; invalida autorizaciones anteriores. */
  version: number;
  permissions: Partial<Record<Permission, Light>>;
  /** Restricciones adicionales con una persona concreta. Solo pueden restringir. */
  pairOverrides: Record<ParticipantId, Partial<Record<Permission, Light>>>;
}

export interface Preferences {
  preferred: Category[];
  avoided: Category[];
}

export interface Participant {
  id: ParticipantId;
  alias: string;
  /** Índice de color/marcador visual; distingue alias repetidos. */
  slot: number;
  adultDeclared: boolean;
  /** Ausente en sesiones antiguas: entonces nunca recibe cartas «solo hombre y mujer». */
  gender?: Gender;
  limits: LimitProfile;
  preferences: Preferences;
}

export type StorageMode = "normal" | "private";

export interface SessionConfig {
  mode: StorageMode;
  participants: Participant[];
  relationship: Relationship | null;
  initialLevel: Intensity;
  durationMin: number | null;
  games: GameId[];
  sharedLimits: Partial<Record<Permission, Light>>;
  /** Sesión de demostración: personas ficticias, siempre privada, sin pantallas de configuración. */
  demo?: boolean;
}

export type SessionStatus =
  | "setup"
  | "awaitingInitialConsent"
  | "ready"
  | "selecting"
  | "awaitingActivityConsent"
  | "playing"
  | "paused"
  | "awaitingLevelConsent"
  | "roundReveal"
  | "finished"
  | "blocked";

export type Assignment = Partial<Record<RoleId, ParticipantId>>;

export type TurnOutcome = "cumplido" | "pasado" | "cambiado" | "rechazado" | "detenido" | "invalidado";

export interface Turn {
  id: string;
  /** Índice de la oportunidad (turnCounter) a la que pertenece. */
  opportunity: number;
  activityId: string;
  contentVersion: number;
  game: GameId;
  assignment: Assignment;
  implicated: ParticipantId[];
  protagonist: ParticipantId | null;
  /** Personas que tenían opción compatible como protagonistas en esta oportunidad. */
  focusable: ParticipantId[];
  /** Claves de estadística de combinación (dirigida, no dirigida o grupo). */
  combos: string[];
  needsConsent: boolean;
  consentAskees: ParticipantId[];
  authorized: boolean;
  limitsVersion: number;
  status: "awaiting_consent" | "ready" | "running" | "closed";
  outcome?: TurnOutcome;
  /** Etapa de cadena (0..2) si aplica. */
  chainStage?: number;
  /** Indica si proviene de un evento sorpresa. */
  fromSurprise?: boolean;
  /** Excepción explícita al cooldown aprobada por el grupo. */
  repeatException?: boolean;
}

export interface OfferRecord {
  activityId: string;
  familyId: string;
  category: Category;
  game: GameId;
  opportunity: number;
  rejected: boolean;
}

export interface SessionStats {
  offered: Record<ParticipantId, number>;
  completed: Record<ParticipantId, number>;
  sinceProtagonist: Record<ParticipantId, number>;
  shared: Record<ParticipantId, number>;
  /** Claves «a>b» (dirigidas), «a+b» (no dirigidas, ordenadas) y «grupo». */
  combos: Record<string, number>;
  /** Máxima espera observada con oportunidad compatible (diagnóstico). */
  maxWaitObserved: number;
}

export interface TimerState {
  turnId: string;
  durationMs: number;
  remainingMs: number;
  running: boolean;
  /** Marca de reloj del último arranque mientras corre. */
  startedAt: number | null;
}

export interface Progress {
  /** activeMs en el momento de entrar al nivel actual. */
  enteredAtActiveMs: number;
  /** Horizonte de tiempo (ms) restante al entrar; null en sesión sin límite. */
  horizonMs: number | null;
  turnsOfferedInLevel: number;
}

export interface PendingEffects {
  forcedProtagonist?: ParticipantId;
  forcedAssignment?: Assignment;
  miniRemaining?: number;
  repeatActivityId?: string;
}

export interface ChainState {
  stage: number;
  lastScore: number;
}

export interface SessionState {
  id: string;
  schemaVersion: number;
  contentVersion: number;
  version: number;
  status: SessionStatus;
  pausedFrom: SessionStatus | null;
  config: SessionConfig;
  level: Intensity;
  limitsVersion: number;
  activeMs: number;
  lastTickAt: number | null;
  progress: Progress;
  /** Número de oportunidades cerradas. */
  turnCounter: number;
  currentGame: GameId;
  gameUsage: Partial<Record<GameId, number>>;
  currentTurn: Turn | null;
  history: OfferRecord[];
  stats: SessionStats;
  nextSurpriseAt: number | null;
  pending: PendingEffects;
  chain: ChainState | null;
  timer: TimerState | null;
  /** Mensaje neutral del último bloqueo o rechazo (sin autoría). */
  notice: string | null;
  /** Detener mostró el panel neutral (terminar o volver a la pausa). */
  stopped: boolean;
  /** Cambios/rechazos dentro de la oportunidad abierta. */
  changesInOpportunity: number;
  /** Semilla de la sesión (no sensible); el RNG real vive en memoria. */
  seed: number;
  startedAt: number;
  updatedAt: number;
}
