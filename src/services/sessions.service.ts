import {nowMs} from '../utils.js';
import {randomUUID} from 'crypto';
import {Player, Session, SessionOutcome} from '../types.js';
import {db} from './db.service.js';
import {recalcStamina} from './stamina.service.js';
import {env} from '../config/env.js';

export function findOpenSessionByPlayer(playerId: string) {
    const sessions = db.data.sessions;
    for (const s of Object.values(sessions)) {
        if (s.playerId === playerId && s.status === "open") return s;
    }
    return undefined;
}

export function createSession(playerId: string): Session {
    const ts = nowMs();
    const id = randomUUID();
    const s: Session = {
        id,
        playerId,
        status: "open",
        createdAt: ts
    };
    db.data.sessions[id] = s;
    db.save();
    return s;
}

export function getSession(sessionId: string): Session | undefined {
    return db.data.sessions[sessionId];
}

export function closeSession(s: Session, outcome: SessionOutcome): void {
    s.status = "closed";
    s.closedAt = nowMs();
    s.lastOutcome = outcome;
    db.save();
}

export function applyLoss(ts: number, p: Player): void {
    recalcStamina(ts, p);
    if (p.stamina <= 0) return;
    const wasMax = p.stamina === p.maxStamina;
    p.stamina -= 1;
    if (wasMax) {
        p.nextRefillAt = ts + env.REFILL_INTERVAL_MS;
    }
}