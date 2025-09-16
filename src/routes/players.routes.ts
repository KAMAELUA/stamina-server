import {Router} from 'express';
import {registerPlayer} from '../controllers/players.controller.js';

export const playersRouter = Router();

playersRouter.post("/register", registerPlayer);