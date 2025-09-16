import "dotenv/config";
import {initApp} from './src/app.js';
import {db} from './src/services/db.service.js';
import {env} from './src/config/env.js';

async function bootstrap() {
    await db.init();
    await db.save();

    const app = await initApp();
    app.listen(env.PORT, (err) => {
        if(err) throw err;
        console.log(`Server listening on http://localhost:${env.PORT}`);
    });
}

bootstrap().catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
});