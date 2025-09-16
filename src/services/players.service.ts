import {nowMs} from '../utils.js';
import { randomUUID } from "crypto";
import {db} from './db.service.js';
import {Player} from '../types.js';
import {env} from '../config/env.js';

const IDEMPOTENCY_TTL = 10 * 60 * 1000;

export function createPlayer(name: string) {
    const ts = nowMs();
    const id = randomUUID();

    const p: Player = {
        id,
        name,
        stamina: env.MAX_STAMINA,
        maxStamina: env.MAX_STAMINA,
        nextRefillAt: null,
        createdAt: ts,
        updatedAt: ts,
        recentIdempotency: {}
    };
    db.data.players[id] = p;
    db.save();
    return p;
}

export function getPlayer(playerId: string): Player | undefined {
    return db.data.players[playerId];
}

export function pruneIdempotency(p: Player, ts: number) {
    for (const [k, v] of Object.entries(p.recentIdempotency)) {
        if (ts - v.at > IDEMPOTENCY_TTL) delete p.recentIdempotency[k];
    }
}