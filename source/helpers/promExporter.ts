import redis from '../db/redis';
import CONSTANTS from './constants';

/**
 * incrAccounce asynchronously calls an INCR operation
 * on the redis key which keeps a count of total number
 * of successful announce requests.
 */
export const incrAnnounce = () => {
    redis.incr(CONSTANTS.ANNOUNCE_COUNT_KEY);
}

/**
 * incrBadAccounce asynchronously calls an INCR operation
 * on the redis key which keeps a count of total number
 * of bad announce requests (invalid params)
 */
 export const incrBadAnnounce = () => {
    redis.incr(CONSTANTS.BAD_ANNOUNCE_COUNT_KEY);
}

export const prepareExportData = async () => {

    let exportData = '';

    const announceCount = parseInt(await redis.get(CONSTANTS.ANNOUNCE_COUNT_KEY) || '0');
    const badAnnounceCount = parseInt(await redis.get(CONSTANTS.BAD_ANNOUNCE_COUNT_KEY) || '0');

    if (isNaN(announceCount)){
        throw new Error("announceCount was not a number");
    }

    if (isNaN(badAnnounceCount)){
        throw new Error("badAnnounceCount was not a number");
    }

    exportData += `kouko_http_request_count{status_code="200", method="GET", path="announce"} ${announceCount}\n`;
    exportData += `kouko_http_request_count{status_code="400", method="GET", path="announce"} ${badAnnounceCount}\n`;

    return exportData;
}