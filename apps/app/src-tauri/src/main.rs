// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod command;
#[cfg(target_os = "macos")]
mod fns;
mod tray;

use tauri::Manager;

fn main() {
    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            command::init,
            command::show_menubar_panel
        ]);

    // macOS: NSPanel 플러그인 등록
    #[cfg(target_os = "macos")]
    let builder = builder.plugin(tauri_nspanel::init());

    builder
        .setup(|app| {
            // macOS: Dock 아이콘 숨김 (메뉴바 앱)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let app_handle = app.app_handle();

            tray::create(app_handle)?;

            // Windows: 시작 시 창 숨김 (트레이에서만 표시)
            #[cfg(not(target_os = "macos"))]
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
