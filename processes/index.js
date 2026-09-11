import logger from "#utility/logger.js";
import logSession from "#processes/log_session_process.js";

/**
 * Uses switch() and correctly sorts args for each process
 * @param {string} process - The Process to run
 * @param {object} data - for each Process:
 *  log_session: {roblox_id: string, username: string, start_timestamp: int (seconds), end_timestamp: int (seconds)}
 */
export default async function call_process(process, data) {
    switch (process) {
        case 'log_session':
            const { roblox_id, username, start_timestamp, end_timestamp } = data;
            if (!roblox_id || !username) {
                logger.warn(`Invalid data for process: ${process}\n${JSON.stringify(data, null, 2)}`);
                return {code: 400, message: {"error": "Invalid data, parameters: roblox_id: string, username: string, start_timestamp: int (seconds), end_timestamp: int (seconds)"}};
            }

            return logSession(roblox_id, username, start_timestamp, end_timestamp);
        default:
            let object
            try {
                object = JSON.stringify(data, null, 2);
            } catch (err) {
                object = '[Unable to stringify object]';
            }
            logger.warn(`Unknown process: ${process}\n${object}`);
            return { code: 404, message: { error: `Unknown Process: ${process}` } };
    }
}