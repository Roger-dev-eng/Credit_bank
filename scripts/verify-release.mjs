// Offline release check using Node's Ed25519 implementation and the Minisign
// signature format used by Tauri. No private key is read by this script.
// Format reference: https://github.com/jedisct1/minisign/blob/master/src/minisign.c
import {createHash,createPublicKey,verify} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
export function verifySignedBytes(bytes,signature,publicKey){
 const pubLines=Buffer.from(publicKey.trim(),'base64').toString('utf8').trim().split(/\r?\n/);
 const sigLines=Buffer.from(signature.trim(),'base64').toString('utf8').trim().split(/\r?\n/);
 if(pubLines.length!==2||sigLines.length!==4)throw new Error('Formato de assinatura inválido.');
 const pub=Buffer.from(pubLines[1],'base64');const sig=Buffer.from(sigLines[1],'base64');
 if(pub.length!==42||sig.length!==74||!pub.subarray(2,10).equals(sig.subarray(2,10)))throw new Error('Chave de assinatura diferente da chave do aplicativo.');
 const key=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),pub.subarray(10)]),format:'der',type:'spki'});
 const algorithm=sig.subarray(0,2).toString('ascii');
 if(!['Ed','ED'].includes(algorithm))throw new Error('Algoritmo de assinatura inválido.');
 const message=algorithm==='ED'?createHash('blake2b512').update(bytes).digest():bytes;
 if(!verify(null,message,key,sig.subarray(10)))throw new Error('A assinatura do pacote não é válida.');
 if(!sigLines[2].startsWith('trusted comment: '))throw new Error('Comentário assinado ausente.');
 const comment=Buffer.from(sigLines[2].slice('trusted comment: '.length),'utf8');
 if(!verify(null,Buffer.concat([sig.subarray(10),comment]),key,Buffer.from(sigLines[3],'base64')))throw new Error('A assinatura dos metadados não é válida.');
}
export function verifyRelease(){
 const root=resolve(import.meta.dirname,'..');const config=JSON.parse(readFileSync(resolve(root,'desktop/src-tauri/tauri.conf.json'),'utf8'));
 const manifest=JSON.parse(readFileSync(resolve(root,'dist/windows/latest.json'),'utf8'));
 assert.equal(manifest.version,config.version);
 const name=`Gestao-de-Credito-${config.version}-x64-instalador.exe`;
 const bytes=readFileSync(resolve(root,'dist/windows',name));
 const signature=readFileSync(resolve(root,'dist/windows',name+'.sig'),'utf8').trim();
 assert.equal(manifest.platforms['windows-x86_64'].signature,signature);
 verifySignedBytes(bytes,signature,config.plugins.updater.pubkey);
 const comment=Buffer.from(signature,'base64').toString('utf8').split(/\r?\n/)[2];
 assert.ok(comment.split('\t').includes('version:'+config.version),'A assinatura não está vinculada à versão anunciada.');
 bytes[bytes.length-1]^=1;
 assert.throws(()=>verifySignedBytes(bytes,signature,config.plugins.updater.pubkey));
 return {version:config.version,validSignature:true,tamperedPackageRejected:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(verifyRelease()));
