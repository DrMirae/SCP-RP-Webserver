import logger from '#utility/logger.js';
import { query } from '#utility/database.js';

function formatSeconds(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

/**
 * Logs a player's play session into the database
 * @param {string} roblox_id - The ID of the Player
 * @param {string} username - The username of the Player
 * @param {int} start_timestamp - The timestamp of when the player started playing
 * @param {int} end_timestamp - The timestamp of when the player stopped playing
 *
 * @return {Promise<Object<code:number,message:object>>} - Code 200 if it was successful with the message {roblox_id: <int>} as {roblox_id: playtime}, otherwise an error with its corresponding code and message
 */
export default async function logSession(roblox_id, username, start_timestamp, end_timestamp) {
    const playtime = end_timestamp - start_timestamp;

    if (playtime <= 0)
        return { code: 400, message: { error: "Invalid timestamps" } };

    let former_playtime = await query(
        'SELECT playtime FROM users WHERE roblox_id = ?',
        [roblox_id]
    );

    if (former_playtime.length === 0) {
        await query(
            'INSERT INTO users (roblox_id, username, playtime) VALUES (?, ?, ?)',
            [roblox_id, username, playtime]
        );
    } else {
        former_playtime = former_playtime[0].playtime;
        await query(
            'UPDATE users SET playtime = ? WHERE roblox_id = ?',
            [former_playtime + playtime, roblox_id]
        );
    }

    await query(
        'INSERT INTO sessions (roblox_id, start_timestamp, end_timestamp) VALUES (?, ?, ?)',
        [roblox_id, start_timestamp, end_timestamp]
    );

    const new_playtime = former_playtime + playtime;
    const new_playtime_formatted = formatSeconds(new_playtime);

    logger.info(`Logged session for player ${roblox_id} with playtime ${new_playtime_formatted}`);

    return { code: 200, message: { roblox_id: new_playtime } };

}
