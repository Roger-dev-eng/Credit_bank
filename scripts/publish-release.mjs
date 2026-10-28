// Publication is manual: run this script explicitly after preparing/testing a release.
// The GitHub credential stays in memory and is never placed in the application.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyRelease} from './verify-release.mjs';
const root=resolve(import.meta.dirname,'..');
const config=JSON.parse(readFileSync(resolve(root,'desktop/src-tauri/tauri.conf.json'),'utf8'));
const version=config.version;const repo='Roger-dev-eng/Credit_bank';
const output=resolve(root,'dist/windows');const manifest=JSON.parse(readFileSync(resolve(output,'latest.json'),'utf8'));
if(manifest.version!==version)throw new Error('Manifesto e aplicativo têm versões diferentes.');
const filename=`Gestao-de-Credito-${version}-x64-instalador.exe`;
verifyRelease();
if(manifest.platforms['windows-x86_64'].url!==`https://github.com/${repo}/releases/download/v${version}/${filename}`)throw new Error('URL do pacote inválida.');
let token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
if(!token){
 try{
  const credential=execFileSync('git',['credential','fill'],{input:`protocol=https\nhost=github.com\npath=${repo}.git\n\n`,encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'},stdio:['pipe','pipe','ignore']});
  token=credential.split(/\r?\n/).find(line=>line.startsWith('password='))?.slice(9);
 }catch{throw new Error('Autentique seu Git no GitHub ou configure GH_TOKEN para publicar. A credencial não deve ser colocada no aplicativo.');}
}
if(!token)throw new Error('Credencial GitHub indisponível.');
const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
async function api(path,method='GET',body){const res=await fetch(`https://api.github.com/repos/${repo}${path}`,{method,headers:{...headers,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(res.status===404&&method==='GET')return null;if(!res.ok)throw new Error(`GitHub recusou a operação (${res.status}).`);return res.json()}
const repository=await api('');
if(repository.private)throw new Error('O canal de atualizações precisa ser público antes de publicar. O repositório continua privado.');
if(process.argv.includes('--check')){console.log(JSON.stringify({repository:repo,public:true,publicationCredentialAvailable:true}));process.exit(0);}
let release=await api(`/releases/tags/v${version}`);
if(release&&!release.draft)throw new Error('Esta versão já foi publicada. Não substitua pacotes assinados; incremente a versão.');
if(!release)release=await api('/releases','POST',{tag_name:`v${version}`,target_commitish:'main',name:`Gestão de Crédito ${version}`,body:readFileSync(resolve(root,`docs/releases/${version}.md`),'utf8'),draft:true,prerelease:false});
// Only the update distribution artifacts are public. Source archives stay local.
for(const name of [filename,filename+'.sig','latest.json','SHA256SUMS.txt']){
 if(release.assets?.some(asset=>asset.name===name))throw new Error(`O rascunho já contém ${name}; revise-o antes de reenviar.`);
 const bytes=readFileSync(resolve(output,name));
 const res=await fetch(release.upload_url.replace(/\{.*\}$/,'')+'?name='+encodeURIComponent(name),{method:'POST',headers:{...headers,'Content-Type':'application/octet-stream','Content-Length':String(bytes.length)},body:bytes});
 if(!res.ok)throw new Error(`Falha ao enviar ${name} (${res.status}). A release permanece como rascunho.`);
}
if(process.argv.includes('--publish'))release=await api(`/releases/${release.id}`,'PATCH',{draft:false,make_latest:'true'});
console.log(JSON.stringify({version,url:release.html_url,draft:release.draft}));
