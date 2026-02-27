//! Full-screen confetti overlay window commands.

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Creates a full-screen transparent overlay window for the confetti animation.
/// The window is click-through so the user can interact with other apps.
#[tauri::command]
#[specta::specta]
pub fn show_confetti_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Skip if already open
    if app_handle.get_webview_window("confetti").is_some() {
        return Ok(());
    }

    let main_window = app_handle
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let monitor = main_window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No monitor found")?;

    let size = monitor.size();
    let scale = monitor.scale_factor();
    let pos = monitor.position();

    let confetti_window = WebviewWindowBuilder::new(
        &app_handle,
        "confetti",
        WebviewUrl::App("index.html".into()),
    )
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .inner_size(size.width as f64 / scale, size.height as f64 / scale)
    .position(pos.x as f64 / scale, pos.y as f64 / scale)
    .build()
    .map_err(|e| e.to_string())?;

    confetti_window
        .set_ignore_cursor_events(true)
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Closes the confetti overlay window.
#[tauri::command]
#[specta::specta]
pub fn close_confetti_window(app_handle: tauri::AppHandle) {
    if let Some(window) = app_handle.get_webview_window("confetti") {
        let _ = window.close();
    }
}
