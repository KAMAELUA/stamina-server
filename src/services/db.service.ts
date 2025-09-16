import * as path from 'node:path';
import { DBStorage } from "../types.js";
import fs from "fs/promises";

const DB_FILE = path.join(process.cwd(), "db.json");

let DB: DBStorage = { players: {}, sessions: {} };

async function load(): Promise<void> {
    try {
        const raw = await fs.readFile(DB_FILE, {encoding: 'utf-8'});
        DB = JSON.parse(raw);
    } catch {
        DB = { players: {}, sessions: {} };
    }
}

async function saveNow(): Promise<void> {
    await fs.writeFile(DB_FILE, JSON.stringify(DB, null, 2), "utf8");
}

export const db = {
    get data(): DBStorage {
        return DB;
    },
    async init() {
        await load();
    },
    async save() {
        await saveNow();
    }
};