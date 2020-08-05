/**
 * Takes in a string and prepares a bencoded reply as a tracker error
 * @param errorMsg The message to send back to client
 */
export const trackerError = (errorMsg: string) => {
    return `d14:failure reason${errorMsg.length}:${errorMsg}e`;
}

export const announceReply = (noSeeds: number, noLeeches: number, peers: Buffer[]) => {

    const initial = `d8:completei${noSeeds}e10:incompletei${noLeeches}e8:intervali1800e12:min intervali1800e5:peers${peers.length * 6}:`;
    const peerData = Buffer.concat(peers);
    const reply = Buffer.concat([Buffer.from(initial), peerData, Buffer.from('e')]);

    return reply;
}

export const scrapeReply = (infohash: string, complete: string, incomplete: string, downloaded: string) => {

    const infohashBuffer = Buffer.from(infohash, 'hex'); //Convert hex string to buffer

    let reply = `d5:filesd20:`;
    reply += infohashBuffer.toString('latin1');
    reply += `d8:completei${complete}e`;
    reply += `10:downloadedi${downloaded}e`;
    reply += `10:incompletei${incomplete}e`;
    reply += `eee`; //Close global, files, and infohash dicts

    return Buffer.from(reply, 'latin1');
}