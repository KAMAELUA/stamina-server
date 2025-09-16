import {EnvConfig} from '../types.js';

const DEFAULT_MAX_STAMINA = 5;
const DEFAULT_REFILL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PORT = 3000;

export const env: EnvConfig = {
    MAX_STAMINA: Number(process.env.MAX_STAMINA ?? DEFAULT_MAX_STAMINA),
    REFILL_INTERVAL_MS: Number(process.env.REFILL_INTERVAL_MS ?? DEFAULT_REFILL_INTERVAL_MS),
    PORT: Number(process.env.PORT ?? DEFAULT_PORT),
};