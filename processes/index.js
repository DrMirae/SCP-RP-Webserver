import logger from "#utility/logger.js";
import player_time_on_server from "#processes/player_time_on_server_process.js";

/**
 * Uses switch() and correctly sorts args for each process
 * @param {string} process - The Process to run
 * @param {object} data - for each Process:
 *  player_time_on_server: [{operation: "get"/"set"/"add"/"remove", roblox_id: string, time: number (seconds)}]
 */
export default async function call_process(process, data) {
    switch (process) {
        case 'player_time_on_server':
            //WIP
            const { operation, roblox_id, time } = data;
            if (!operation || !roblox_id) {
                logger.warn(`Invalid data for process: ${process}\n${JSON.stringify(data, null, 2)}`);
                return {code: 400, message: {"error": "Invalid data, parameters: operation : string (\"get\" / \"set\" / \"add\" / \"remove\"), roblox_id : string, time : int (default: 0) (seconds)"}};
            }

            const response = await player_time_on_server(operation, roblox_id, time);
            logger.debug('call_process', response.code, response.message);

            return response;
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