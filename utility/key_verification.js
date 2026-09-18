import logger from "#utility/logger.js";
import { KEY_MULTIPLIER } from "#config/index.js";

/**
 * Verifies the provided key against the current timestamp
 * @param {number} timestamp - The timestamp to verify against
 * @param {number} key - The key to verify
 * @returns {boolean} - Returns true if the key is valid, false otherwise
 */
function verify_key(timestamp, key){
    if (typeof timestamp !== 'number' || typeof key !== 'number') {
        return false;
    }

    if (key === 0) {
        logger.debug('Key verification failed: Key is zero.');
        return false;
    }

    const current_timestamp = Math.floor(Date.now() / 1000);

    if (5 < timestamp - current_timestamp || timestamp - current_timestamp < -15) {
        logger.debug('Key verification failed: Timestamp is out of date.');
        return false;
    }

    const key_difference = Math.abs(Math.floor(key/KEY_MULTIPLIER) - timestamp);
    if (key_difference > 10) {
        logger.debug('Key verification failed: Key difference out of range.');
        return false;
    }
    return true;
}

export default verify_key;