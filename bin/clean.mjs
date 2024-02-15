import pg from 'pg';
import { cleanJob } from '../build/db/postgres.js';

const client = new pg.Client(`postgresql://kiryuu:password@localhost:5432`);

console.log(`going2connect`)
await client.connect();

console.log(`we in`)

await cleanJob(client);