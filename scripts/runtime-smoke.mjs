import {spawn} from 'node:child_process';import {mkdirSync} from 'node:fs';import {resolve} from 'node:path';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..');const dir=resolve(root,'.dev','runtime-smoke-'+randomUUID());mkdirSync(dir,{recursive:true});const token=randomUUID()+randomUUID();
const resources=resolve(root,process.argv.includes('--release')?'desktop/src-tauri/target/release/resources':'desktop/src-tauri/resources');
const child=spawn(resolve(resources,'runtime/bin/java.exe'),['-jar',resolve(resources,'backend.jar')],{windowsHide:true,env:{...process.env,CREDITO_DATA_DIR:dir,CREDITO_TOKEN:token,CREDITO_PORT:'18767'},stdio:['ignore','ignore','pipe']});
let errors='';child.stderr.on('data',d=>errors+=d.toString());
try{
 let ready=false;for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error('Java encerrou: '+errors);try{const res=await fetch('http://127.0.0.1:18767/api/health',{headers:{'X-Credito-Token':token}});if(res.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500));}
 assert.ok(ready,'Backend indisponível com runtime empacotado: '+errors);
 const clientes=await fetch('http://127.0.0.1:18767/api/clientes',{headers:{'X-Credito-Token':token}});assert.deepEqual(await clientes.json(),[]);
 const semToken=await fetch('http://127.0.0.1:18767/api/clientes');assert.equal(semToken.status,403);
 const docs=await fetch('http://127.0.0.1:18767/v3/api-docs',{headers:{'X-Credito-Token':token}});assert.equal(docs.status,200);const schema=await docs.json();assert.ok(schema.paths['/api/pagamentos']);
 console.log('Runtime jlink: inicialização, banco vazio, API protegida e OpenAPI aprovados.');
}finally{child.kill();}
