use std::sync::Once;

#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

#[cfg(target_os = "macos")]
use crate::fns::{
    setup_menubar_panel_listeners, swizzle_to_menubar_panel, update_menubar_appearance,
};

#[cfg(not(target_os = "macos"))]
use tauri::Manager;

static INIT: Once = Once::new();

#[tauri::command]
pub fn init(app_handle: tauri::AppHandle) {
    INIT.call_once(|| {
        #[cfg(target_os = "macos")]
        {
            swizzle_to_menubar_panel(&app_handle);
            update_menubar_appearance(&app_handle);
            setup_menubar_panel_listeners(&app_handle);
        }

        #[cfg(not(target_os = "macos"))]
        {
            // Windows: 기본 윈도우 초기화
            let _ = &app_handle;
        }
    });
}

#[tauri::command]
pub fn show_menubar_panel(app_handle: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let panel = app_handle.get_webview_panel("main").unwrap();
        panel.show();
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Windows: 기본 윈도우 표시
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}
