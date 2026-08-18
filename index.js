import express from 'express';
import bodyParser from 'body-parser';
import call_process from "#processes/index.js";
import logger from "#utility/logger.js";
import shutdown from "#utility/shutdown.js";
import { SERVER_PORT } from "#config/index.js";
import { KEY_MULTIPLIER } from "#config/index.js";

const app = express();
app.use(bodyParser.json());

function verify_key(timestamp, key){
    if (typeof timestamp !== 'number' || typeof key !== 'number') {
        return false;
    }

    const current_timestamp = Math.floor(Date.now() / 1000);

    if (0 > current_timestamp - timestamp > 30) {
        return false;
    }

    return key/KEY_MULTIPLIER === timestamp;
}

async function process_request_data(request_data){
    if (!(request_data !== null && request_data.constructor === Object)) {
        logger.warn('Received invalid request data:', request_data);
        return {code: 400, message: {error: "Invalid request data"}};
    }

    const key = request_data.key;
    const process = request_data.process;
    const data = request_data.data;

    if (!process || !(data !== null && data.constructor === Object) || !key) {
        logger.warn('Received invalid request data:', request_data);
        return {code: 400, message: {error: "Invalid request structure"}};
    }

    logger.info(`Received request for process: ${process}`);

    try {
        const response = await call_process(process, data);

        logger.info(`Request ${process} has been processed!`);
        logger.debug('process_request_data', response.code, response.message);

        return response;
    } catch (error) {
        logger.error('There was an error while processing the request:', error);
        return {
            code: 500,
            message: { error: "Internal Server Error" }
        };
    }
}

app.post('/post', async (req, res) => {

    const ip_address = req.socket.remoteAddress;
    logger.info(`-> IP: ${ip_address}`);

    try {

        const request_data = req.body;
        //logger.debug(`Received Raw JSON data: ${JSON.stringify(request_data, null, 2)}`);

        const response = process_request_data(request_data);

        logger.debug('Post', response.code, response.message);

        res.json(response);

    } catch (error) {
        logger.error(`Error processing Request:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const server = app.listen(SERVER_PORT, () => {
    logger.info(`Server is listening on port ${SERVER_PORT}`);
});

const signals = ['SIGINT', 'SIGTERM', 'beforeExit'];
signals.forEach(sig => {
    try {
        process.on(sig, () => {
            logger.info("Received SIGTERM. Proceeding with shutdown...");
            shutdown(server, true).then();
        });
    } catch (_) {}
});