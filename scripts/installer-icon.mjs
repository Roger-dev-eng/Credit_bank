// Retain the original small DIB icons supported by NSIS and add high-resolution
// PNG entries for Explorer's large and extra-large file views.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const dir=resolve(import.meta.dirname,'../desktop/src-tauri/icons');
const target=resolve(dir,'icon.ico');const old=readFileSync(target);
const images=[];
for(let k=0;k<old.readUInt16LE(4);k++){
 const entry=old.subarray(6+k*16,22+k*16);const size=entry[0]||256;
 if(size>64)continue;
 const data=old.subarray(entry.readUInt32LE(12),entry.readUInt32LE(12)+entry.readUInt32LE(8));
 images.push({size,data});
}
for(const [size,file] of [[128,'128x128.png'],[256,'128x128@2x.png']])images.push({size,data:readFileSync(resolve(dir,file))});
const header=Buffer.alloc(6+images.length*16);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);
let offset=header.length;
images.forEach(({size,data},k)=>{const start=6+k*16;header[start]=size===256?0:size;header[start+1]=size===256?0:size;header.writeUInt16LE(1,start+4);header.writeUInt16LE(32,start+6);header.writeUInt32LE(data.length,start+8);header.writeUInt32LE(offset,start+12);offset+=data.length;});
writeFileSync(target,Buffer.concat([header,...images.map(x=>x.data)]));
