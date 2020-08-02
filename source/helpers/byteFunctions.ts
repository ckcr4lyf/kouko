/**
 * Takes a URL encoded hash and return the hex string representation, aka the 40 byte infohash
 * @param hash The URL encoded hash present in the announce request
 */
export const urlHashToHexString = (hash: string) => {

    let hex = '';
    let pos = 0;

    while (pos < hash.length){
        if (hash[pos] == '%'){
            //This byte is a a hex character, so we can directly use the next two characters
            hex += hash.substr(pos+1, 2);
            pos += 3;
        } else {
            //This character is in ascii. We need hex representation
            hex += hash.charCodeAt(pos).toString(16);
            pos++;
        }
    }

    return hex;
}

/**
 * Takes in a dotted string ipv4 representation (upto 15 bytes) and returns the raw address as a 4byte buffer.
 * @param ipv4 The dotted ipv4
 */
export const ipv4ToBytes = (ipv4: string) => {

    const octets = ipv4.split('.'); //['127', '0', '0', '1']
    const decimalOctets = octets.map(octet => parseInt(octet)); //[127, 0, 0, 1]

    return Buffer.from(decimalOctets); //0x7f, 0x00, 0x00, 0x01
}

export const redisToPeers = (redisPeers: string[]) => {
    return redisPeers.map(redisPeer => Buffer.from(redisPeer, 'latin1'));
}