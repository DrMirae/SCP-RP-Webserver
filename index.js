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
        return;
    }

    for (const [process, data] of Object.entries(request_data)) {
        try {
            call_process(process, data);
        } catch (error) {
            logger.error('There was an error while processing the request:', error, '\nData:\n', data, '\nProcess:', process, '\n\n', '----------------------------------------\n');
        }
    }

    logger.info('Requests have been Processed!');
}

app.post('/post', async (req, res) => {

    const ip_address = req.socket.remoteAddress;
    logger.info(`-> IP: ${ip_address}`);

    try {
        const request_data = req.body;
        //logger.debug(`Received Raw JSON data: ${JSON.stringify(request_data, null, 2)}`);

        //process_request_data(request_data);

        res.json({ message: 'JSON POST request received successfully' });

        logger.debug(request_data)
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