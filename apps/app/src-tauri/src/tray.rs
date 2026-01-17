//! System tray/menu bar icon functionality.

use tauri::{
    image::Image,
    tray::{MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use tauri_plugin_positioner::{Position, WindowExt};

#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

/// Creates the system tray icon with click handlers.
pub fn create(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    let icon = Image::from_bytes(include_bytes!("../icons/tray.png"))?;

    TrayIconBuilder::with_id("tray")
        .icon(icon)
        .icon_as_template(true)
        .on_tray_icon_event(|tray, event| {
            // Let positioner handle tray events for positioning
            tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

            let app_handle = tray.app_handle();

            if let TrayIconEvent::Click { button_state, .. } = event {
                if button_state == MouseButtonState::Up {
                    toggle_main_window(app_handle);
                }
            }
        })
        .build(app_handle)
}

/// Toggle main window visibility.
#[cfg(target_os = "macos")]
fn toggle_main_window(app_handle: &AppHandle) {
    // Try panel first (after init_menubar was called from frontend)
    if let Ok(panel) = app_handle.get_webview_panel("main") {
        if panel.is_visible() {
            panel.order_out(None);
        } else {
            // Position window at tray icon before showing
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.move_window(Position::TrayBottomCenter);
            }
            panel.show();
        }
        return;
    }

    // Fallback to regular window
    if let Some(window) = app_handle.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.move_window(Position::TrayBottomCenter);
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn toggle_main_window(app_handle: &AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.move_window(Position::TrayBottomCenter);
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}
