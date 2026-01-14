//! Menubar panel initialization and visibility commands.
//!
//! This module handles the conversion of the main window to a menubar panel
//! on macOS, and provides commands for showing/hiding it.

use std::sync::Once;

#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

#[cfg(not(target_os = "macos"))]
use tauri::Manager;

#[cfg(target_os = "macos")]
use crate::utils::macos::{
    setup_menubar_panel_listeners, swizzle_to_menubar_panel, update_menubar_appearance,
};

static INIT: Once = Once::new();

/// Initializes the menubar panel (macOS) or main window (Windows).
/// This should be called once from the frontend after the app is ready.
#[tauri::command]
#[specta::specta]
pub fn init_menubar(app_handle: tauri::AppHandle) {
    INIT.call_once(|| {
        #[cfg(target_os = "macos")]
        {
            swizzle_to_menubar_panel(&app_handle);
            update_menubar_appearance(&app_handle);
            setup_menubar_panel_listeners(&app_handle);
        }

        #[cfg(not(target_os = "macos"))]
        {
            // Windows: basic window initialization
            let _ = &app_handle;
        }
    });
}

/// Shows the menubar panel (macOS) or main window (Windows).
#[tauri::command]
#[specta::specta]
pub fn show_menubar_panel(app_handle: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let panel = app_handle.get_webview_panel("main").unwrap();
        panel.show();
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Windows: show main window
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}
