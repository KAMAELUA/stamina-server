import {getPlayer, pruneIdempotency} from '../services/players.service.js';
import {Request, Response, NextFunction} from 'express';
import {nowMs} from '../utils.js';
import {recalcStamina} from '../services/stamina.service.js';
import {
    applyLoss,
    closeSession,
    createSession,
    findOpenSessionByPlayer,
    getSession
} from '../services/sessions.service.js';
import {PlayerId, SessionId, SessionOutcome} from '../types.js';

const OK_OUTCOMES = new Set(["win", "lose", "restart", "exit"]);

export const startSession = (req: Request, res: Response, next: NextFunction) => {
    const {playerId} = req.params as {playerId: PlayerId};
    const p = getPlayer(playerId);
    if (!p) return res.status(404).json({ error: "player_not_found" });

    const ts = nowMs();
    recalcStamina(ts, p);
    if (p.stamina <= 0) {
        return res.status(409).json({
            canPlay: false,
            reason: "no_stamina",
            serverTime: ts,
            nextRefillAt: p.nextRefillAt
        });
    }

    const existing = findOpenSessionByPlayer(p.id);
    if (existing) {
        return res.status(409).json({
            canPlay: false,
            reason: "open_session_exists",
            sessionId: existing.id,
            startedAt: existing.createdAt,
            serverTime: ts
        });
    }

    const s = createSession(p.id);
    p.updatedAt = ts;
    return res.json({
        sessionId: s.id,
        staminaBefore: p.stamina,
        serverTime: ts
    });
};

export const getOpenSession = (req: Request, res: Response, next: NextFunction) => {
    const {playerId} = req.params as {playerId: PlayerId};
    const p = getPlayer(playerId);
    if (!p) return res.status(404).json({ error: "player_not_found" });

    const s = findOpenSessionByPlayer(p.id);
    if (!s) return res.status(204).end(); // No Content
    return res.json({ sessionId: s.id, startedAt: s.createdAt, status: s.status });
};

export const endSession = (req: Request, res: Response) => {
    const { playerId } = req.params as { playerId: PlayerId };
    const { sessionId, outcome, idempotencyKey } = (req.body ?? {}) as {sessionId: SessionId, outcome: SessionOutcome, idempotencyKey: string};
    const ts = nowMs();

    const p = getPlayer(String(playerId ?? ""));
    if (!p) return res.status(404).json({ error: "player_not_found" });

    // idempotency
    pruneIdempotency(p, ts);
    if (idempotencyKey && p.recentIdempotency[idempotencyKey]) {
        return res.json(p.recentIdempotency[idempotencyKey].response);
    }

    const s = getSession(String(sessionId ?? ""));
    if (!s || s.playerId !== p.id) {
        return res.status(404).json({ error: "session_not_found" });
    }

    if (s.status === "closed") {
        recalcStamina(ts, p);
        const resp = {
            alreadyClosed: true,
            stamina: p.stamina,
            nextRefillAt: p.nextRefillAt,
            serverTime: ts
        };
        if (idempotencyKey) {
            p.recentIdempotency[idempotencyKey] = { at: ts, response: resp };
        }
        return res.json(resp);
    }

    if (!OK_OUTCOMES.has(outcome)) {
        return res.status(400).json({ error: "bad_outcome" });
    }

    if (outcome === "lose" || outcome === "restart" || outcome === "exit") {
        applyLoss(ts, p);
    } else {
        recalcStamina(ts, p);
    }

    closeSession(s, outcome);
    p.updatedAt = ts;

    const resp = {
        stamina: p.stamina,
        nextRefillAt: p.nextRefillAt,
        serverTime: ts
    };

    if (idempotencyKey) {
        p.recentIdempotency[idempotencyKey] = { at: ts, response: resp };
        pruneIdempotency(p, ts);
    }

    return res.json(resp);
};