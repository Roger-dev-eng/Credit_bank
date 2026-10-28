#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{process::{Child, Command, Stdio}, sync::Mutex, time::Duration};
use tauri::Manager;

struct Backend {
 child: Mutex<Child>,
 url: String,
 token: String,
 client: reqwest::Client,
 #[cfg(windows)]
 job: usize,
}
impl Drop for Backend {
 fn drop(&mut self) {
  if let Ok(child) = self.child.get_mut() { let _ = child.kill(); let _ = child.wait(); }
  #[cfg(windows)] unsafe { windows_sys::Win32::Foundation::CloseHandle(self.job as _); }
 }
}

#[cfg(windows)]
fn attach_job(child: &Child) -> Result<usize, String> {
 use std::os::windows::io::AsRawHandle;
 use windows_sys::Win32::{Foundation::CloseHandle,System::JobObjects::*};
 unsafe {
  let job=CreateJobObjectW(std::ptr::null(),std::ptr::null());
  if job.is_null() { return Err("Não foi possível criar o controle do processo Java.".into()); }
  let mut limits: JOBOBJECT_EXTENDED_LIMIT_INFORMATION=std::mem::zeroed();
  limits.BasicLimitInformation.LimitFlags=JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
  if SetInformationJobObject(job,JobObjectExtendedLimitInformation,&limits as *const _ as _,std::mem::size_of_val(&limits) as u32)==0 || AssignProcessToJobObject(job,child.as_raw_handle() as _)==0 {
   CloseHandle(job);return Err("Não foi possível vincular o Java ao aplicativo.".into());
  }
  Ok(job as usize)
 }
}

async fn request(backend: &Backend, path: String, method: String, body: Option<String>) -> Result<reqwest::Response,String> {
 if !path.starts_with("/api/") || path.contains("..") || path.contains('#') || path.contains('\\') { return Err("Caminho de API inválido.".into()); }
 if !["GET","POST","PUT","DELETE"].contains(&method.as_str()) { return Err("Método inválido.".into()); }
 let mut ready=false;
 for _ in 0..90 {
  if let Ok(mut child)=backend.child.lock() { if let Ok(Some(_))=child.try_wait() { return Err("O backend encerrou. Feche o aplicativo e consulte backend.log no diretório de dados.".into()); } }
  if let Ok(res)=backend.client.get(format!("{}/api/health",backend.url)).header("X-Credito-Token",&backend.token).send().await { if res.status().is_success() {ready=true;break;} }
  tokio_sleep().await;
 }
 if !ready {return Err("O backend não ficou disponível em 45 segundos. Reinicie o aplicativo.".into());}
 let method=reqwest::Method::from_bytes(method.as_bytes()).map_err(|e|e.to_string())?;
 let mut req=backend.client.request(method,format!("{}{}",backend.url,path)).header("X-Credito-Token",&backend.token);
 if let Some(body)=body {req=req.header("Content-Type","application/json").body(body);}
 let res=req.send().await.map_err(|_|"Não foi possível comunicar com o backend local.".to_string())?;
 if !res.status().is_success() {
  let msg=res.json::<serde_json::Value>().await.ok().and_then(|v|v.get("detail").and_then(|s|s.as_str()).map(str::to_string)).unwrap_or_else(||"Operação recusada pelo backend.".into());
  return Err(msg);
 }
 Ok(res)
}
async fn tokio_sleep(){tauri::async_runtime::spawn_blocking(||std::thread::sleep(Duration::from_millis(500))).await.ok();}

#[tauri::command]
async fn api_request(state: tauri::State<'_,Backend>,path:String,method:String,body:Option<String>) -> Result<serde_json::Value,String> {
 let res=request(&state,path,method,body).await?;
 let text=res.text().await.map_err(|e|e.to_string())?;
 if text.is_empty(){Ok(serde_json::Value::Null)}else{serde_json::from_str(&text).map_err(|e|e.to_string())}
}
#[tauri::command]
async fn api_download(state: tauri::State<'_,Backend>,path:String) -> Result<Vec<u8>,String>{
 Ok(request(&state,path,"GET".into(),None).await?.bytes().await.map_err(|e|e.to_string())?.to_vec())
}

fn main(){
 tauri::Builder::default()
 .setup(|app|{
  let dir=app.path().app_local_data_dir()?;
  let dir=dunce::simplified(&dir).to_path_buf();std::fs::create_dir_all(&dir)?;
  let resource=app.path().resource_dir()?.join("resources");
  let resource=dunce::simplified(&resource).to_path_buf();
  let token=format!("{}{}",uuid::Uuid::new_v4(),uuid::Uuid::new_v4());
  let port=std::net::TcpListener::bind("127.0.0.1:0")?.local_addr()?.port();
  let log=std::fs::OpenOptions::new().create(true).append(true).open(dir.join("backend.log"))?;
  let mut cmd=Command::new(resource.join("runtime/bin/java.exe"));
  cmd.arg("-jar").arg(resource.join("backend.jar")).env("CREDITO_TOKEN",&token).env("CREDITO_PORT",port.to_string()).env("CREDITO_DATA_DIR",&dir)
    .stdin(Stdio::null()).stdout(Stdio::from(log.try_clone()?)).stderr(Stdio::from(log));
  #[cfg(windows)] {use std::os::windows::process::CommandExt;cmd.creation_flags(0x08000000);}
  let mut child=cmd.spawn()?;
  #[cfg(windows)] let job=match attach_job(&child){Ok(job)=>job,Err(e)=>{let _=child.kill();let _=child.wait();return Err(std::io::Error::other(e).into());}};
  let client=match reqwest::Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none()).timeout(Duration::from_secs(30)).build(){Ok(c)=>c,Err(e)=>{let _=child.kill();let _=child.wait();return Err(e.into());}};
  app.manage(Backend{child:Mutex::new(child),url:format!("http://127.0.0.1:{}",port),token,client,#[cfg(windows)]job});
  Ok(())
 })
 .invoke_handler(tauri::generate_handler![api_request,api_download])
 .on_window_event(|window,event|{if matches!(event,tauri::WindowEvent::Destroyed){if let Some(state)=window.app_handle().try_state::<Backend>(){if let Ok(mut child)=state.child.lock(){let _=child.kill();let _=child.wait();}}}})
 .run(tauri::generate_context!()).expect("Não foi possível iniciar Gestão de Crédito");
}
