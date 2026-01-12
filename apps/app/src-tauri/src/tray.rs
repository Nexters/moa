use tauri::{
    image::Image,
    tray::{MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

#[cfg(target_os = "macos")]
use crate::fns::position_menubar_panel;

pub fn create(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    let icon = Image::from_bytes(include_bytes!("../icons/tray.png"))?;

    TrayIconBuilder::with_id("tray")
        .icon(icon)
        .icon_as_template(true)
        .on_tray_icon_event(|tray, event| {
            let app_handle = tray.app_handle();

            if let TrayIconEvent::Click { button_state, .. } = event {
                if button_state == MouseButtonState::Up {
                    #[cfg(target_os = "macos")]
                    {
                        let panel = app_handle.get_webview_panel("main").unwrap();

                        if panel.is_visible() {
                            panel.order_out(None);
                            return;
                        }

                        position_menubar_panel(app_handle, 0.0);
                        panel.show();
                    }

                    #[cfg(not(target_os = "macos"))]
                    {
                        // Windows: 기본 윈도우 토글
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                }
            }
        })
        .build(app_handle)
}
