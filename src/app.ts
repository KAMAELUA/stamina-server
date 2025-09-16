import express from "express";
import {apiRouter} from './routes/index.js';

export async function initApp() {
    const app = express();
    app.use(express.json());

    app.use(apiRouter);

    // centralized error handler
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error(err);
        res.status(500).json({ error: "internal_error" });
    });

    return app;
}
