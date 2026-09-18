import * as mariadb from 'mariadb';
import logger from '#utility/logger.js';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } from '#config/index.js';

// Basic validation with log messages
function validateConfig() {
    const missing = [];
    if (!DB_HOST) missing.push('DB_HOST');
    if (!DB_USER) missing.push('DB_USER');
    if (!DB_NAME) missing.push('DB_NAME');
    if (missing.length > 0) {
        logger.error('Database configuration is incomplete', { missing });
    }
}

validateConfig();

// Create a MariaDB database
const pool = mariadb.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 20,
    port: 3306,
    acquireTimeout: 10_000,
    idleTimeout: 60,

    compress: true,
});

/**
 * Acquires a database connection from the pool.
 * @returns {Promise<mariadb.PoolConnection>}
 */
async function getConnection() {
    try {
        logger.info('Acquiring database connection...');
        const connection = await pool.getConnection();

        logger.info('Database connection acquired.');
        return connection;
    } catch (err) {
        logger.error('Failed to acquire a database connection', err);
        throw err;
    }
}

/**
 * Executes the given function with a database connection.
 * @param {function(mariadb.PoolConnection): Promise<any>} fn
 * @returns {Promise<any>}
 */
async function withConnection(fn) {
    let conn;
    try {
        conn = await getConnection();
        return await fn(conn);
    } finally {
        if (conn) {
            try {
                await conn.release();
            } catch (_) { /* ignore */ }
        }
    }
}

/**
 * Executes a query in the database.
 * @param {string} sql
 * @param {Array<any>} [params]
 * @returns {Promise<mariadb.RowDataPacket[]>}
 */
async function query(sql, params = []) {
    try {
        // Fast path: mariadb pool supports pool.query()
        if (typeof pool.query === 'function') {
            return await pool.query(sql, params);
        }

        // Fallback path: manual connection (older/alternate behavior)
        return await withConnection((conn) => conn.query(sql, params));
    } catch (err) {
        // Avoid dumping params in logs (can leak user data). Log SQL at most.
        logger.error('Database query failed', { sql }, err);
        throw err;
    }
}

let poolEnded = false;

/**
 * Closes the database pool.
 * @returns {Promise<void>}
 */
async function end() {
    if (poolEnded) return;
    poolEnded = true;
    try {
        await pool.end();
        logger.info('Database Closed');
    } catch (err) {
        logger.warn('Error while closing database database', err);
    }
}

// Shutdown handling
function attachShutdownHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'beforeExit'];
    signals.forEach(sig => {
        try {
            process.on(sig, () => {
                // No await to avoid blocking
                end().catch(() => {});
            });
        } catch (_) {}
    });
}

attachShutdownHandlers();

export { pool, getConnection, withConnection, query, end};
