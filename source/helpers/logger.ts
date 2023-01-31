import fs from 'fs';
import path from 'path';
import { Logger as CLog, LOGLEVEL as CLevel } from '@ckcr4lyf/logger';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

enum LOGLEVEL {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

class LoggerV2 {

    private logFilePath: string;

    constructor(private loggerName: string){
        const logFileName = process.env.LOGFILE || 'default.log';
        this.logFilePath = path.join(__dirname, '../../logs/', logFileName);
    }

    private log(level: LOGLEVEL, message: string, extra: any){
        const entry = {
            ts: new Date().toISOString(),
            level: level,
            logger: this.loggerName,
            message: message,
            ...extra,
        }

        if (extra === undefined){
            console.log(`${entry.ts} [${entry.level}]: ${entry.message}`);
        } else {
            console.log(`${entry.ts} [${entry.level}]: ${entry.message} | ${JSON.stringify(extra)}`);
        }
        fs.appendFileSync(this.logFilePath, `${JSON.stringify(entry)}\n`);
    }

    public debug(msg: string, extra?: any){
        this.log(LOGLEVEL.DEBUG, msg, extra);
    }

    public info(msg: string, extra?: any){
        this.log(LOGLEVEL.INFO, msg, extra);
    }

    public warn(msg: string, extra?: any){
        this.log(LOGLEVEL.WARN, msg, extra);
    }

    public error(msg: string, extra?: any){
        this.log(LOGLEVEL.ERROR, msg, extra);
    }
}

export const getLogger = (loggerName: string) => {
    return new LoggerV2(loggerName);
}

export const getLoggerV3 = () => {
    return new CLog({
        loglevel: CLevel.INFO,
    });
}