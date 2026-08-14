import fs from 'fs';
import path from 'path';
import util from 'util';

/**
 * Logger class for handling application logging.
 */
class Logger {
    constructor(logDirectory = 'logs/app', debugLogDirectory = 'logs/debug', timeZone = 'Europe/Budapest') {
        this.logDirectory = logDirectory;
        this.debugLogDirectory = debugLogDirectory;
        this.timeZone = timeZone;
        this.createLogDirectory(logDirectory);
        this.createLogDirectory(debugLogDirectory);
    }

    createLogDirectory(directory) {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
    }

    getLogFilePath(level) {
        const date = new Date().toLocaleDateString('sv-SE', { timeZone: this.timeZone });
        const directory = (level === 'debug') ? this.debugLogDirectory : this.logDirectory;
        return path.join(directory, `${date}.log`);
    }

    getTimeStamp() {
        return new Date().toLocaleString('hu-HU', { timeZone: this.timeZone });
    }

    // Map level to ANSI color codes for console output
    getLevelColor(level) {
        const lvl = String(level).toLowerCase();
        switch (lvl) {
            case 'debug': // yellowish orange
                return '\x1b[38;5;208m';
            case 'warn': // yellow
                return '\x1b[33m';
            case 'error': // red
                return '\x1b[31m';
            default:
                return '';
        }
    }

    // Colorize only the [LEVEL] tag for console output
    colorizeLevelTag(level, tag) {
        const color = this.getLevelColor(level);
        const reset = '\x1b[0m';
        return color ? `${color}${tag}${reset}` : tag;
    }

    // Core log method now supports additional arguments to attach objects/metadata
    log(message, level, ...args) {
        let baseMessage = message;

        // Special handling if the first message is an Error
        if (message instanceof Error) {
            baseMessage = `${message.message}\n${this.formatStackTrace(message.stack)}`;
        } else if (typeof message === 'object') {
            // If message is an object, stringify it for better readability
            try {
                baseMessage = JSON.stringify(message, null, 2);
            } catch (err) {
                baseMessage = util.inspect(message, { depth: 4, breakLength: 80 });
            }
        }

        // Format any additional arguments (objects, errors, primitives)
        const formattedExtras = args.map(arg => this.stringifyArg(arg));
        const combined = [baseMessage, ...formattedExtras].filter(Boolean).join(' | ');

        // Plain message for file logging (no ANSI colors)
        const timeStamp = this.getTimeStamp();
        const upperLevel = String(level).toUpperCase();
        const fileMessage = `[${timeStamp}] [${upperLevel}]: ${combined}\n`;
        fs.appendFileSync(this.getLogFilePath(level), fileMessage);

        // Console message with colored [LEVEL] tag only
        const plainLevelTag = `[${upperLevel}]`;
        const coloredLevelTag = this.colorizeLevelTag(level, plainLevelTag);
        const consoleMessage = `[${timeStamp}] ${coloredLevelTag}: ${combined}`;
        console.log(consoleMessage);
    }

    stringifyArg(arg) {
        if (arg instanceof Error) {
            return `${arg.message}\n${this.formatStackTrace(arg.stack)}`;
        }
        const type = typeof arg;
        if (arg === null || type === 'undefined') return String(arg);
        if (type === 'string') return arg;
        if (type === 'number' || type === 'boolean' || type === 'bigint') return String(arg);
        try {
            return JSON.stringify(arg, null, 2);
        } catch {
            try {
                return util.inspect(arg, { depth: 4, breakLength: 80 });
            } catch {
                return '[Unable to stringify argument]';
            }
        }
    }

    /**
     * Convenience methods for logging at different levels
     * @param {string} message - The message to log
     * @param {...any} args - Additional arguments to log (objects, errors, primitives)
     */
    debug(message, ...args) {
        this.log(message, 'debug', ...args);
    }

    /**
     * Convenience method for logging at info level
     * @param {string} message - The message to log
     * @param {...any} args - Additional arguments to log (objects, errors, primitives)
     */
    info(message, ...args) {
        this.log(message, 'info', ...args);
    }

    /**
     * Convenience method for logging at warn level
     * @param {string} message - The message to log
     * @param {...any} args - Additional arguments to log (objects, errors, primitives)
     */
    warn(message, ...args) {
        this.log(message, 'warn', ...args);
    }

    /**
     * Convenience method for logging at error level
     * @param {string} message - The message to log
     * @param {...any} args - Additional arguments to log (objects, errors, primitives)
     */
    error(message, ...args) {
        const errorMessage = message instanceof Error
            ? message
            : `CUSTOM ERROR: ${message}`;

        this.log(errorMessage, 'error', ...args);
    }

    formatStackTrace(stack) {
        try {
            const stackLines = stack?.split('\n'); // Safely split the stack trace
            if (!stackLines || stackLines.length < 2) {
                return 'Stack trace information is unavailable.';
            }

            const relevantLine = stackLines[1].trim();
            const match = relevantLine.match(/:(\d+):\d+/);

            if (!match || match.length < 2) {
                return `Unable to extract line number: ${relevantLine}`;
            }

            const lineNumber = match[1]; // Safely extract the line number
            return `Line ${lineNumber}: ${relevantLine}`;
        } catch (err) {
            return 'Error while formatting stack trace.';
        }
    }
}
const logger = new Logger();

export default logger;