import {Router} from 'express';
import {endSession, getOpenSession, startSession} from '../controllers/session.controller.js';

export const sessionRouter = Router();

sessionRouter.post("/start/:playerId", startSession);
sessionRouter.post("/end/:playerId", endSession);
sessionRouter.get("/open/:playerId", getOpenSession);