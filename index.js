import express from 'express';
import bodyParser from 'body-parser';
import call_process from "#processes/index.js";
import logger from "#utility/logger.js";
import shutdown from "#utility/shutdown.js";
import { SERVER_PORT } from "#config/index.js";
import verify_key from "#utility/key_verification.js";

const app = express();
app.use(bodyParser.json());

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

    try {
        let response;
        if (verify_key(key.key1, key.key2)) {
            logger.info(`Approved request for process: ${process}`);
            response = await call_process(process, data);
        } else {
            logger.warn('Invalid key received:', request_data.key);
            response = {code: 401, message: {error: "Invalid key"}};
        }

        if (response.code === 200) {
            logger.info(`Request ${process} has been processed successfully!`);
        } else if (response.code !== 401) {
            logger.warn(`Request ${process} failed with code: ${response.code}, message: ${JSON.stringify(response.message)}`);
        }

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

        const response = await process_request_data(request_data);

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