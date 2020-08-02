import { urlHashToHexString } from "./byteFunctions";

const invalid = (param: string) => {
    return (!param || param === '');
}

export const checkAnnounceParameters = (query: any) => { //TODO: define the query interface

    const portBytes = Buffer.alloc(2, 0); //2bytes for the port

    if (invalid(query.info_hash)){
        return false;
    }

    let result: any = {}; //TODO: define the result interface

    const infohash = urlHashToHexString(query.info_hash);

    if (infohash.length !== 40){
        return false;
    }

    result.infohash = infohash.toLowerCase();

    const REQUIRED_KEYS = ['peer_id', 'port', 'downloaded', 'uploaded', 'left'];
    const valid = REQUIRED_KEYS.every(requiredKey => Object.keys(query).includes(requiredKey));

    if (!valid){
        return false;
    }

    result.downloaded = parseInt(query.downloaded);
    result.uploaded = parseInt(query.uploaded);
    result.left = parseInt(query.left);
    result.peerId = query.peer_id;
    result.event = query.event;
    const port = parseInt(query.port);

    if (isNaN(port) || port > 0xFFFF){
        return false;
    }

    portBytes.writeUInt16BE(port);
    result.port = portBytes;

    if (isNaN(result.uploaded) || isNaN(result.downloaded) || isNaN(result.left)){
        return false;
    }

    if (result.uploaded < 0 || result.downloaded < 0 || result.left < 0){
        return false;
    }

    return result;
}