import redis from '../db/redis';
import CONSTANTS from './constants';

/**
 * incrAccounce asynchronously calls an INCR operation
 * on the redis key which keeps a count of total number
 * of successful announce requests.
 */
export const incrAnnounce = (): void => {
    void redis.incr(CONSTANTS.ANNOUNCE_COUNT_KEY);
}

/**
 * incrBadAccounce asynchronously calls an INCR operation
 * on the redis key which keeps a count of total number
 * of bad announce requests (invalid params)    
 */
 export const incrBadAnnounce = (): void => {
    void redis.incr(CONSTANTS.BAD_ANNOUNCE_COUNT_KEY);
}

export const logResponseTime = (ms: number): void => {
    void redis.multi().incrby(CONSTANTS.REQ_TIME_COUNTER, ms).incr(CONSTANTS.REQ_COUNT_COUNTER).exec();
}

export const getAvgResonseTime = async (): Promise<number> => {

    const result = await redis.multi().getset(CONSTANTS.REQ_TIME_COUNTER, 0).getset(CONSTANTS.REQ_COUNT_COUNTER, 0).exec();

    if (result.length !== 2){
        console.log('weird');
    }

    // TODO: Make sure no errors
    const totalTime = parseInt(result[0][1]);
    const totalReqs = parseInt(result[1][1]);

    return totalTime / totalReqs
}

export const prepareExportData = async () => {

    let exportData = '';

    const announceCount = parseInt(await redis.get(CONSTANTS.ANNOUNCE_COUNT_KEY) || '0');
    const badAnnounceCount = parseInt(await redis.get(CONSTANTS.BAD_ANNOUNCE_COUNT_KEY) || '0');
    const memoryUsage = process.memoryUsage();
    const avgRequestTime = await getAvgResonseTime();

    if (isNaN(announceCount)){
        throw new Error("announceCount was not a number");
    }

    if (isNaN(badAnnounceCount)){
        throw new Error("badAnnounceCount was not a number");
    }

    exportData += `kouko_http_request_count{status_code="200", method="GET", path="announce"} ${announceCount}\n`;
    exportData += `kouko_http_request_count{status_code="400", method="GET", path="announce"} ${badAnnounceCount}\n`;
    exportData += `kouko_heap_total ${memoryUsage.heapTotal}\n`;
    exportData += `kouko_heap_used ${memoryUsage.heapUsed}\n`;
    exportData += `kouko_avg_announce_time ${avgRequestTime}\n`;

    return exportData;
}