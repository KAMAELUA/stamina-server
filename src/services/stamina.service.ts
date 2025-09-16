import {Player} from '../types.js';
import {env} from '../config/env.js';

export function recalcStamina(ts: number, p: Player): void {
    if (p.stamina >= p.maxStamina) {
        p.nextRefillAt = null;
        return;
    }
    if (p.nextRefillAt == null) {
        p.nextRefillAt = ts + env.REFILL_INTERVAL_MS;
        return;
    }
    if (ts < p.nextRefillAt) return;

    const elapsed = ts - p.nextRefillAt;
    const gained = 1 + Math.floor(elapsed / env.REFILL_INTERVAL_MS);
    const canGain = Math.min(gained, p.maxStamina - p.stamina);
    p.stamina += canGain;

    if (p.stamina >= p.maxStamina) {
        p.nextRefillAt = null;
    } else {
        p.nextRefillAt = ts + env.REFILL_INTERVAL_MS;
    }
}