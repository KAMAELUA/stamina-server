import {Router} from 'express';
import {getStamina} from '../controllers/stamina.controller.js';

export const staminaRouter = Router();

staminaRouter.get("/player/:playerId", getStamina);