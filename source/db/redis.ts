import redis from 'redis';
import { promisify } from 'util';

//extension to add promisified methods
interface r extends redis.RedisClient {
    [key: string]: any
}

export let client: r = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});

client.on('error', (error: any) => {
    console.error(`Error connecting to redis`, error);
    process.exit(1);
});

client.zrevrangebyscoreAsync = promisify(client.zrevrangebyscore).bind(client);
client.zaddAsync = promisify(client.zadd).bind(client);
client.hmgetAsync = promisify(client.hmget).bind(client);