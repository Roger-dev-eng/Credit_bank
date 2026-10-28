use std::sync::Mutex;
use std::sync::atomic::Ordering;
use std::time::Duration;
use tauri::{Emitter, Manager};
use tauri_plugin_updater::{Update, UpdaterExt};
use crate::Backend;

#[derive(Default)]
pub struct Updates { pending: Mutex<Option<Update>> }

#[tauri::command]
pub async fn check_update(app: tauri::AppHandle) -> Result<serde_json::Value,String> {
    if app.state::<Backend>().updating.load(Ordering::SeqCst) {
        return Err("Uma atualização já está em andamento.".into());
    }
    let closing = app.clone();
    let updater = app.updater_builder()
        .timeout(Duration::from_secs(20))
        .on_before_exit(move || {
            // SQLite is backed up and all financial writes are frozen before this hook.
            if let Some(backend) = closing.try_state::<Backend>() {
                if let Ok(mut child) = backend.child.lock() {
                    let _ = child.kill(); let _ = child.wait();
                }
            }
            closing.cleanup_before_exit();
        })
        .build().map_err(|_|"Não foi possível preparar o serviço de atualizações.".to_string())?;
    let mut update = updater.check().await.map_err(|_|"Não foi possível consultar as atualizações. Verifique sua internet; o canal precisa ter uma versão publicada.".to_string())?;
    let result = if let Some(update) = &mut update {
        update.timeout = Some(Duration::from_secs(1800));
        if update.download_url.scheme() != "https" ||
            !update.download_url.as_str().starts_with("https://github.com/Roger-dev-eng/Credit_bank/releases/download/") {
            return Err("O endereço do pacote não pertence ao canal oficial de atualizações.".into());
        }
        serde_json::json!({"available":true,"currentVersion":update.current_version,"version":update.version,"notes":update.body})
    } else { serde_json::json!({"available":false,"currentVersion":app.package_info().version.to_string()}) };
    *app.state::<Updates>().pending.lock().map_err(|_|"Serviço ocupado.")? = update;
    Ok(result)
}

struct UpdatingGuard<'a>(&'a std::sync::atomic::AtomicBool);
impl Drop for UpdatingGuard<'_> { fn drop(&mut self) { self.0.store(false, Ordering::SeqCst); } }

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(),String> {
    let backend = app.state::<Backend>();
    if backend.updating.swap(true, Ordering::SeqCst) {
        return Err("Uma atualização já está em andamento.".into());
    }
    let _guard = UpdatingGuard(&backend.updating);
    let update = app.state::<Updates>().pending.lock().map_err(|_|"Serviço ocupado.")?.clone()
        .ok_or("Consulte as atualizações novamente antes de instalar.")?;
    let mut downloaded=0u64;
    let bytes = update.download(|chunk,total| {
        downloaded += chunk as u64;
        let _ = app.emit("update-progress",serde_json::json!({"stage":"download","downloaded":downloaded,"total":total}));
    },||{}).await.map_err(|_|"O download ou a verificação da assinatura falhou. Nenhuma atualização foi instalada; seus dados permanecem intactos.".to_string())?;
    let _ = app.emit("update-progress",serde_json::json!({"stage":"backup"}));
    let prepared=backend.client.post(format!("{}/api/atualizacoes/preparar",backend.url))
        .header("X-Credito-Token",&backend.token).send().await;
    if !prepared.is_ok_and(|response|response.status().is_success()) {
        let _ = backend.client.post(format!("{}/api/atualizacoes/liberar",backend.url))
            .header("X-Credito-Token",&backend.token).send().await;
        return Err("Não foi possível criar o backup. A instalação foi cancelada.".into());
    }
    let _ = app.emit("update-progress",serde_json::json!({"stage":"install"}));
    if update.install(bytes).is_err() {
        // Extraction/verification failures happen before the exit hook; release maintenance
        // if Java is still running. If spawning Windows Setup failed after the hook, restart safely.
        let alive=backend.child.lock().ok().and_then(|mut c|c.try_wait().ok()).is_some_and(|exit|exit.is_none());
        if alive {
            let _ = backend.client.post(format!("{}/api/atualizacoes/liberar",backend.url))
                .header("X-Credito-Token",&backend.token).send().await;
        }
        return Err("Não foi possível iniciar a instalação. O backup foi preservado. Feche e reabra o aplicativo antes de tentar novamente.".into());
    }
    Ok(())
}
