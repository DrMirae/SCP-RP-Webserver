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
 * Returns the total playtime of a player from the database, it works with either the roblox_id or the username, if both are provided, it will use the roblox_id
 * @param {string} roblox_id - The ID of the Player
 * @param {string} username - The username of the Player
 *
 * @return {Promise<Object<code:number,message:object>>} - Code 200 if it was successful with the message {roblox_id: <int>, playtime: <int>}, otherwise an error with its corresponding code and message
 */
export default async function getPlaytime(roblox_id, username) {
    let sql;
    if (roblox_id) {
        sql = 'SELECT roblox_id, playtime FROM users WHERE roblox_id = ?';
    } else if (username) {
        sql = 'SELECT roblox_id, playtime FROM users WHERE username = ?';
    } else {
        return { code: 400, message: { error: "Invalid data, parameters: roblox_id: string or username: string" } };
    }

    let user_row = await query(sql, [roblox_id || username]);

    if (user_row.length === 0) {
        logger.info(`Player ${roblox_id || username} not found`);
        return { code: 404, message: { error: "Player not found" } };
    }

    const playtime = user_row[0].playtime;
    const updated_roblox_id = user_row[0].roblox_id;

    const playtime_formatted = formatSeconds(playtime);

    logger.info(`${updated_roblox_id} has a playtime of ${playtime_formatted}`);
    return { code: 200, message: { roblox_id: updated_roblox_id, playtime: playtime } };

}
