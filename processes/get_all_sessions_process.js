import logger from '#utility/logger.js';
import { query } from '#utility/database.js';

/**
 * Returns all the sessions of a player from the database, it works with either the roblox_id or the username, if both are provided, it will use the roblox_id
 * @param {string} roblox_id - The ID of the Player
 * @param {string} username - The username of the Player
 *
 * @return {Promise<Object<code:number,message:object>>} - Code 200 if it was successful with the message {roblox_id: <int>, sessions: <array>}, otherwise an error with its corresponding code and message
 */
export default async function getAllSessions(roblox_id, username) {
    let roblox_id_sql;
    if (roblox_id) {
        roblox_id_sql = 'SELECT roblox_id FROM users WHERE roblox_id = ?';
    } else if (username) {
        roblox_id_sql = 'SELECT roblox_id FROM users WHERE username = ?';
    } else {
        return { code: 400, message: { error: "Invalid data, parameters: roblox_id: string or username: string" } };
    }

    let user_row = await query(roblox_id_sql, [roblox_id || username]);

    if (user_row.length === 0) {
        logger.info(`Player ${roblox_id || username} not found`);
        return { code: 404, message: { error: "Player not found" } };
    }

    const updated_roblox_id = user_row[0].roblox_id;

    const sessions = await query(
        'SELECT id, start_timestamp, end_timestamp FROM sessions WHERE roblox_id = ?',
        [updated_roblox_id]
    );

    logger.info(`Retrieved all sessions of ${updated_roblox_id}`);
    return { code: 200, message: { roblox_id: updated_roblox_id, sessions: sessions } };

}
