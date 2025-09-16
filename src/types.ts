export type PlayerId = string;
export type SessionId = string;

export type SessionOutcome = "win" | "lose" | "restart" | "exit";

export interface Player {
    id: string;
    name?: string;
    stamina: number;
    maxStamina: number;
    nextRefillAt: number | null;
    createdAt: number;
    updatedAt: number;
    recentIdempotency: Record<string, { at: number; response: any }>;
}

export interface Session {
    id: SessionId;
    playerId: PlayerId;
    status: "open" | "closed";
    createdAt: number;
    closedAt?: number;
    lastOutcome?: SessionOutcome;
}

export interface DBStorage {
    players: Record<PlayerId, Player>;
    sessions: Record<SessionId, Session>;
}

export interface EnvConfig {
    MAX_STAMINA: number;
    REFILL_INTERVAL_MS: number;
    PORT: number;
}