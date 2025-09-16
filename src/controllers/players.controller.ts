import type {Request, Response, NextFunction} from 'express';
import {createPlayer} from '../services/players.service.js';
import {nowMs} from '../utils.js';
import {db} from '../services/db.service.js';

export const registerPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const {name} = req.body ?? {};

    if(!name) {
        return res.status(400).json({error: "missing_name"});
    }

    const existing = Object.values(db.data.players).find(p => p.name === name);

    if(existing) {
        return res.status(400).json({error: "name_taken"});
    }

    const p = createPlayer(name);

    return res.json({
        playerId: p.id,
        stamina: p.stamina,
        maxStamina: p.maxStamina,
        nextRefillAt: p.nextRefillAt,
        serverTime: nowMs()
    });
}