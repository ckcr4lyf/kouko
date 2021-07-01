import fs from 'fs';
import path from 'path';

export default class Logger {

    logfile: string;

    constructor (logfile: string) {
        this.logfile = path.join(process.cwd(), 'logs', logfile);
    }

    log = (prefix: string, message: string) => {

        let timeString = new Date().toISOString();
        let logEntry = `${timeString} [${prefix}] - ${message}`;

        console.log(logEntry);
        fs.appendFileSync(this.logfile, `${logEntry}\n`);
    }
}

export const genericLogger = new Logger('kouko.log')
export const announceLogger = new Logger('announce.log');
export const scrapeLogger = new Logger('scrape.log');