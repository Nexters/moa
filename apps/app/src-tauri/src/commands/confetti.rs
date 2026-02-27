//! Full-screen confetti overlay window commands.

use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Creates a full-screen transparent overlay window for the confetti animation.
/// The window is click-through so the user can interact with other apps.
/// Each invocation creates a new window with a unique label, allowing overlapping confetti.
#[tauri::command]
#[specta::specta]
pub fn show_confetti_window(app_handle: tauri::AppHandle) -> Result<(), String> {
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

    let label = format!(
        "confetti-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );

    let confetti_window =
        WebviewWindowBuilder::new(&app_handle, &label, WebviewUrl::App("confetti.html".into()))
            .transparent(true)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .focused(false)
            .inner_size(size.width as f64 / scale, size.height as f64 / scale)
            .position(pos.x as f64 / scale, pos.y as f64 / scale)
            .build()
            .map_err(|e| e.to_string())?;

    confetti_window
        .set_ignore_cursor_events(true)
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Closes all confetti overlay windows.
#[tauri::command]
#[specta::specta]
pub fn close_confetti_window(app_handle: tauri::AppHandle) {
    let windows: Vec<_> = app_handle
        .webview_windows()
        .into_iter()
        .filter(|(label, _)| label.starts_with("confetti-"))
        .map(|(_, window)| window)
        .collect();

    for window in windows {
        let _ = window.destroy();
    }
}
