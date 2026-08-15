import logger from '#utility/logger.js';
import { query } from '#utility/database.js';

/**
 * Performs a DB operation on a player's playtime
 * @param {string} operation - "get" / "set" / "add" / "remove"
 * @param {string} roblox_id - The ID of the Player
 * @param {int} time - The time in terms of seconds on how long the player's been on the server
 *
 * @return {Promise<Object<code:number,message:object>>} - Code 200 if it was successful with the message {roblox_id: <int>} as {roblox_id: playtime}, otherwise an error with its corresponding code and message
 */
async function player_time_on_server(operation, roblox_id, time = 0) {
    switch (operation) {
        case "get":
            logger.info(`Getting playtime for player ${roblox_id}`);
            const result = await query("SELECT playtime FROM users WHERE roblox_id = ?", [roblox_id]);
            if (result.length > 0) {
                return { code: 200, message: { [roblox_id]: result[0].playtime } };
            } else {
                logger.info(`Player ${roblox_id} not found`);
                return { code: 404, message: { error: "Player not found" } };
            }
        case "set":
            break;
        case "add":
            break;
        case "remove":
            break;

        default:
            logger.info(`Operation ${operation} not implemented`);
            return { code: 400, message: { error: "Not implemented" } };
    }

    return { code: 400, message: { error: "Not implemented" } };
}

export default player_time_on_server;
