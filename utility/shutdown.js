import { end } from '#utility/database.js';

/**
 * Shuts down the application gracefully.
 * @param {import('node:http').Server} server - The web server instance
 * @param {boolean} both - Whether to shut down both the database and the web server
 */
async function shutdown(server, both) {
    try {
        // Close all database connections in the pool
        await end();

        if (!both) {return;}

        // Stop the web server
        server.close(() => {
            console.log('Webserver stopped.');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(0);
    }
}

export default shutdown;