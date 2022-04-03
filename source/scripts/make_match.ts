const urlsafe = ['*', '-', '.', '_'];

const l = 'a';
const u = 'A';

for (let i = 0; i < 26; i++){
    const chrl = String.fromCharCode(l.charCodeAt(0) + i);
    console.log(`'${chrl}' => "${Buffer.from(chrl).toString('hex')}",`);
    const chru = String.fromCharCode(u.charCodeAt(0) + i);
    console.log(`'${chru}' => "${Buffer.from(chru).toString('hex')}",`);
}

for (let x of urlsafe){
    console.log(`'${x}' => "${Buffer.from(x).toString('hex')}",`);
}