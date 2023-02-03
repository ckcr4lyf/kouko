/**
 * Separate process for running the prometheus server to collect and expose metrics,
 * as well as for running cleanup jobs every 5 min, to avoid blocking main tracker
 */

import express from "express";
import { createServer } from "http";
import { cleanJob, cleanPeers } from "./db/redis-di.js";
import { getLogger } from "./helpers/logger.js";
import { prepareExportData } from "./helpers/promExporter.js";
import { redis } from './db/redis.js';
import './config.js';

// const p1 = redis.pipeline();
// p1.set("BRUV", "BRUV");
// p1.exec();

const logger = getLogger(`prom-server`);

setInterval(async () => {
    await cleanJob(redis);
    await cleanPeers(redis);
}, 1000 * 60 * 60 * 12); // Do both, every 2 hours

// setInterval(() => {
//     cleanPeers(redis);
// }, 1000 * 60 * 60 * 24) // For peers, 24 hours

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