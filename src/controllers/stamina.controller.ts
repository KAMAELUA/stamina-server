import {Request, Response, NextFunction} from 'express';
import {nowMs} from '../utils.js';
import {getPlayer} from '../services/players.service.js';
import {recalcStamina} from '../services/stamina.service.js';

export const getStamina = async (req: Request, res: Response, next: NextFunction) => {
    const {playerId} = req.params as {playerId: string};

    const p = getPlayer(playerId);
    if (!p) return res.status(404).json({ error: "player_not_found" });

    const ts = nowMs();
    recalcStamina(ts, p);
    p.updatedAt = ts;

    return res.json({
        stamina: p.stamina,
        maxStamina: p.maxStamina,
        nextRefillAt: p.nextRefillAt,
        serverTime: ts
    });
}