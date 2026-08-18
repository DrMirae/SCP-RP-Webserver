import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: './config/.env' });

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

export const SERVER_PORT = process.env.SERVER_PORT || 3413;

assert(SERVER_PORT, 'SERVER_PORT must be defined in .env')

// Replace with other object data
//const spheres_json = fs.readFileSync('./objects/spheres.json', 'utf8');
//export const spheres = JSON.parse(spheres_json);

export const DB_HOST = process.env.DB_HOST;
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_NAME = process.env.DB_NAME;

export const KEY_MULTIPLIER = process.env.KEY_MULTIPLIER || 0;
