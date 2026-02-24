//! Application lifecycle commands.

/// Restart the app after destroying the single-instance lock.
/// Without this, `app.restart()` races with the single-instance plugin
/// and the new process exits immediately (sees old process still alive).
#[tauri::command]
#[specta::specta]
pub fn restart_app(app: tauri::AppHandle) {
    tauri_plugin_single_instance::destroy(&app);
    app.restart();
}
