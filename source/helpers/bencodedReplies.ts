/**
 * Takes in a string and prepares a bencoded reply as a tracker error
 * @param errorMsg The message to send back to client
 */
export const trackerError = (errorMsg: string) => {
    return `d14:failure reason${errorMsg.length}:${errorMsg}e`;
}

export const announceReply = (noSeeds: number, noLeeches: number, peers: Buffer[]) => {

    const initial = `d8:completei${noSeeds}e10:incompletei${noLeeches}e8:intervali600e12:min intervali300e5:peers${peers.length * 6}:`;
    const peerData = Buffer.concat(peers);
    const reply = Buffer.concat([Buffer.from(initial), peerData, Buffer.from('e')]);

    return reply;
}