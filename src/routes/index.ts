import {playersRouter} from './players.routes.js';
import {staminaRouter} from './stamina.router.js';
import {Router} from 'express';
import {sessionRouter} from './session.router.js';

export const apiRouter = Router();

apiRouter.use("/v1/players", playersRouter);
apiRouter.use("/v1/stamina", staminaRouter);
apiRouter.use("/v1/sessions", sessionRouter);