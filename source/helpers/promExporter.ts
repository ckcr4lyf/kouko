import redis from '../db/redis';
import CONSTANTS from './constants';
import { execSync } from 'child_process';
import { getActiveTorrentCount } from '../db/redis-di';

/**
 * incrAccounce asynchronously calls an INCR operation
 * on the redis key which keeps a count of total number
 * of successful announce requests.
 */
export const incrAnnounce = (reqDuration: number): void => {
    void redis.incr(CONSTANTS.ANNOUNCE_COUNT_KEY);
    void redis.incrby(CONSTANTS.REQ_DURATION_KEY, reqDuration);
}

/**
 * incrBadAccounce asynchronously calls an INCR operation
 * on the redis key which keeps a count of total number
 * of bad announce requests (invalid params)    
 */
export const incrBadAnnounce = (): void => {
    void redis.incr(CONSTANTS.BAD_ANNOUNCE_COUNT_KEY);
}

export const getTcpData = (): string => {
    const command = `netstat -tan | grep ':6969' | awk '{print $6}' | sort | uniq -c`;
    
    try {
        const result = execSync(command).toString().split('\n').filter(el => el !== '').map(el => {
            const trimmed = el.trim();
            const parts = trimmed.split(' ');
            return `kouko_tcp_stats{state="${parts[1]}"} ${parts[0]}\n`;
        });

        return result.join('');
    } catch (e){
        console.log(`Failed to get netstat data`);
        return ``;
    }
}

export const prepareMemoryExportData = async() => {
    let exportData = '';
    const memoryUsage = process.memoryUsage();
    exportData += `kouko_heap_total ${memoryUsage.heapTotal}\n`;
    exportData += `kouko_heap_used ${memoryUsage.heapUsed}\n`;
    return exportData;
}

export const prepareExportData = async () => {

    let exportData = '';

    const announceCount = parseInt(await redis.get(CONSTANTS.KIRYUU_ANNOUNCE_COUNT_KEY) || '0');
    const avgRequestTime = parseInt(await redis.get(CONSTANTS.KIRYUU_REQ_DURATION_KEY) || '0');
    const activeTorrentsCount = await getActiveTorrentCount(redis);

    if (isNaN(announceCount)){
        throw new Error("announceCount was not a number");
    }

    if (isNaN(avgRequestTime)){
        throw new Error("avgRequestTime was not a number");
    }

    exportData += `kouko_http_request_count{status_code="200", method="GET", path="announce"} ${announceCount}\n`;
    exportData += `kouko_http_request_duration_sum{status_code="200", method="GET", path="announce"} ${avgRequestTime}\n`;
    exportData += `kouko_active_torrents ${activeTorrentsCount}\n`;
    exportData += getTcpData();

    return exportData;
}