import express from 'express';
import favicon from 'serve-favicon';
import path from 'path';
import { createServer } from 'http';
import fs from 'fs';

import './config';
import router from './api/router';
import { getLogger } from './helpers/logger';

const app = express();

app.disable('x-powered-by');
app.disable('etag');
app.use(favicon(path.join(__dirname, '../public', 'favicon.png')));
app.use(express.json());
app.use((req, res, next) => {
    res.set('Connection', 'close');
    next();
});

app.use('/', router);

const IP = process.env.IP || '127.0.0.1';
const PORT = parseInt(process.env.PORT || '6969');

//Create the logs folder if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir) || !fs.lstatSync(logsDir).isDirectory()){
    fs.mkdirSync(logsDir);
}

const logger = getLogger('app');

createServer(app).listen(PORT, IP, () => {
    logger.info(`Started tracker at ${IP}:${PORT}`);
}).on('connection', (socket) => {
    const timeout = 2 * 1000; // 2s timeout. A bit harsh but normall it takes < 10ms for proper announce.
    socket.setTimeout(timeout);
    socket.once('timeout', () => {
        socket.end();
    });
})

process.on('SIGINT', () => {
    console.log(`\nBye bye!`);
    process.exit(0);
})