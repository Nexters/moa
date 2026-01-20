//! System tray/menu bar icon functionality.

use tauri::{
    image::Image,
    tray::{MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

#[cfg(not(target_os = "macos"))]
use tauri_plugin_positioner::{Position, WindowExt};

/// Embedded tray icons for different states
static TRAY_ICON_ACTIVE: &[u8] = include_bytes!("../icons/tray-active.png");
static TRAY_ICON_IDLE: &[u8] = include_bytes!("../icons/tray-idle.png");

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
    use crate::utils::macos::position_menubar_panel;

    // Try panel first (after init_menubar was called from frontend)
    if let Ok(panel) = app_handle.get_webview_panel("main") {
        if panel.is_visible() {
            panel.order_out(None);
        } else {
            // Position window below menu bar before showing
            position_menubar_panel(app_handle, 5.0);
            panel.show();
        }
        return;
    }

    // Fallback to regular window
    if let Some(window) = app_handle.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            position_menubar_panel(app_handle, 5.0);
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

/// 트레이 아이콘 상태 변경 (근무중/비근무)
#[tauri::command]
#[specta::specta]
pub fn set_tray_icon_state(app: AppHandle, is_working: bool) -> Result<(), String> {
    let icon_bytes = if is_working {
        TRAY_ICON_ACTIVE
    } else {
        TRAY_ICON_IDLE
    };

    let tray = app
        .tray_by_id("tray")
        .ok_or("트레이 아이콘을 찾을 수 없습니다")?;

    let icon = Image::from_bytes(icon_bytes).map_err(|e| format!("아이콘 로드 실패: {e}"))?;

    tray.set_icon(Some(icon))
        .map_err(|e| format!("아이콘 설정 실패: {e}"))?;

    log::debug!(
        "트레이 아이콘 상태 변경: {}",
        if is_working { "활성" } else { "비활성" }
    );
    Ok(())
}
