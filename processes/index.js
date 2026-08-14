import logger from "#utility/logger.js";

/**
 * Uses switch() and correctly sorts args for each process
 * @param {string} process - The Process to run
 * @param {object} data - for each Process:
 *  login: [{UUID: string, username: string}]
 *  interaction: {player: string, coordinates: [number, number]}
 *  we: [{name: string, val1: number, val2: number, operation: string}]
 */
export default function call_process(process, data) {
    switch (process) {
        case 'player_time_on_server':
            //WIP
            break;
        default:
            let object
            try {
                object = JSON.stringify(data, null, 2);
            } catch (err) {
                object = '[Unable to stringify object]';
            }
            logger.warn(`Unknown process: ${process}\n${object}`);
    }
}