import express from 'express';
import favicon from 'serve-favicon';
import path from 'path';
import { createServer } from 'http';

import './config';
import router from './api/router';

const app = express();

app.disable('x-powered-by');
app.disable('etag');
app.use(favicon(path.join(__dirname, '../public', 'favicon.png')));
app.use(express.json());
app.use('/', router);

const IP = process.env.IP || '127.0.0.1';
const PORT = parseInt(process.env.PORT || '6969');

createServer(app).listen(PORT, IP, () => {
    console.log(`Started server at ${IP}:${PORT}`);
});

process.on('SIGINT', () => {
    console.log(`\nBye bye!`);
    process.exit(0);
})