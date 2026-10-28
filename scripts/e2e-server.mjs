import {spawn} from 'node:child_process';import {mkdirSync} from 'node:fs';import {resolve} from 'node:path';import {randomUUID} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');const dir=resolve(root,'.dev','e2e-'+randomUUID());mkdirSync(dir,{recursive:true});
const env={...process.env,CREDITO_TOKEN:randomUUID()+randomUUID(),CREDITO_DATA_DIR:dir,CREDITO_PORT:'18766'};
const backend=spawn('java',['-jar',resolve(root,'backend/target/credito-backend-0.1.0.jar')],{env,stdio:'inherit',windowsHide:true});
const frontend=spawn(process.execPath,[resolve(root,'frontend/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','1421'],{cwd:resolve(root,'frontend'),env,stdio:'inherit',windowsHide:true});
function stop(){backend.kill();frontend.kill()};process.on('exit',stop);process.on('SIGINT',()=>{stop();process.exit()});process.on('SIGTERM',()=>{stop();process.exit()});
backend.on('exit',code=>{frontend.kill();process.exit(code||0)});
