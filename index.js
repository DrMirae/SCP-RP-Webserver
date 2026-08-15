import express from 'express';
import bodyParser from 'body-parser';
import call_process from "#processes/index.js";
import logger from "#utility/logger.js";
import shutdown from "#utility/shutdown.js";
import { SERVER_PORT } from "#config/index.js";

const app = express();
app.use(bodyParser.json());

function process_request_data(request_data){
    if (!(request_data !== null && request_data.constructor === Object)) {
        logger.warn('Received invalid request data:', request_data);
        return {code: 400, message: {error: "Invalid request data"}};
    }

    const process = request_data.process;
    const data = request_data.data;

    if (!process){
        logger.warn('Received invalid request data:', request_data);
        return {code: 400, message: {error: "Invalid Process"}};
    }

    if (!(data !== null && data.constructor === Object)) {
        logger.warn('Received invalid request data:', request_data);
        return {code: 400, message: {error: "Invalid Data"}};
    }

    logger.info(`Received request for process: ${process}`);

    try {
        const { code, message } = call_process(process, data);

        logger.info(`Request ${process} have been Processed!`);

        return {code: code, message: message};
    } catch (error) {
        logger.error('There was an error while processing the request:', error, '\nData:\n', data, '\nProcess:', process, '\n\n', '----------------------------------------\n');
        return {code: 500, message: {error: "Internal Server Error"}};
    }
}

app.post('/post', async (req, res) => {

    const ip_address = req.socket.remoteAddress;
    logger.info(`-> IP: ${ip_address}`);

    try {

        const request_data = req.body;
        //logger.debug(`Received Raw JSON data: ${JSON.stringify(request_data, null, 2)}`);

        const { code, message } = process_request_data(request_data);

        logger.debug(code, message);

        res.json({ code, message });

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