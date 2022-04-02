/**
 * Separate process for running the prometheus server to collect and expose metrics,
 * as well as for running cleanup jobs every 5 min, to avoid blocking main tracker
 */

import express from "express";
import { createServer } from "http";
import { cleanJob } from "./db/redis-di";
import { getLogger } from "./helpers/logger";
import { prepareExportData } from "./helpers/promExporter";
import { redis } from './db/redis';
import './config';

// const p1 = redis.pipeline();
// p1.set("BRUV", "BRUV");
// p1.exec();

const logger = getLogger(`prom-server`);

setInterval(() => {
    cleanJob(redis);
}, 1000 * 60 * 10); // Every 10 minutes

const PROM_IP = process.env.PROM_IP || '127.0.0.1';
const PROM_PORT = parseInt(process.env.PROM_PORT || '9999');
const promApp = express();

promApp.get('/metrics', async (req, res) => {
    const responseText = await prepareExportData();
    res.set('Connection', 'close');
    res.end(responseText);
    res.socket?.end();
})

createServer(promApp).listen(PROM_PORT, PROM_IP, () => {
    logger.info(`Started prometheus metrics server at ${PROM_IP}:${PROM_PORT}`);
    cleanJob(redis);
})

process.on('SIGINT', () => {
    console.log(`\nBye bye!`);
    process.exit(0);
})