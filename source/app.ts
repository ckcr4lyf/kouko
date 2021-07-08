import express from 'express';
import favicon from 'serve-favicon';
import path from 'path';
import { createServer } from 'http';
import fs from 'fs';

import './config';
import router from './api/router';
import { genericLogger } from './helpers/logger';
import { prepareExportData } from './helpers/promExporter';

const app = express();

app.disable('x-powered-by');
app.disable('etag');
app.use(favicon(path.join(__dirname, '../public', 'favicon.png')));
app.use(express.json());
app.use('/', router);

const IP = process.env.IP || '127.0.0.1';
const PORT = parseInt(process.env.PORT || '6969');

//Create the logs folder if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir) || !fs.lstatSync(logsDir).isDirectory()){
    fs.mkdirSync(logsDir);
}

createServer(app).listen(PORT, IP, () => {
    genericLogger.log('KOUKO', `Started server at ${IP}:${PORT}`);
});

const PROM_IP = process.env.PROM_IP || '127.0.0.1';
const PROM_PORT = parseInt(process.env.PROM_PORT || '9999');
const promApp = express();

promApp.get('/metrics', async (req, res) => {
    const responseText = await prepareExportData();
    res.end(responseText);
})

createServer(promApp).listen(PROM_PORT, PROM_IP, () => {
    genericLogger.log('PROM METRICS', `Started metrics server at ${PROM_IP}:${PROM_PORT}`);
})

process.on('SIGINT', () => {
    console.log(`\nBye bye!`);
    process.exit(0);
})