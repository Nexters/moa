//! System tray/menu bar icon functionality.

use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

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
static TRAY_ICON_IDLE: &[u8] = include_bytes!("../icons/tray-idle.png");

/// Embedded animation frames for coin-flip effect (working state)
static TRAY_FRAMES: [&[u8]; 14] = [
    include_bytes!("../icons/tray-frame-0.png"),
    include_bytes!("../icons/tray-frame-1.png"),
    include_bytes!("../icons/tray-frame-2.png"),
    include_bytes!("../icons/tray-frame-3.png"),
    include_bytes!("../icons/tray-frame-4.png"),
    include_bytes!("../icons/tray-frame-5.png"),
    include_bytes!("../icons/tray-frame-6.png"),
    include_bytes!("../icons/tray-frame-7.png"),
    include_bytes!("../icons/tray-frame-8.png"),
    include_bytes!("../icons/tray-frame-9.png"),
    include_bytes!("../icons/tray-frame-10.png"),
    include_bytes!("../icons/tray-frame-11.png"),
    include_bytes!("../icons/tray-frame-12.png"),
    include_bytes!("../icons/tray-frame-13.png"),
];

/// Animation control flag
static ANIMATING: AtomicBool = AtomicBool::new(false);

/// Animation frame interval (85ms × 14 frames ≈ 1.2s per rotation)
const FRAME_INTERVAL: Duration = Duration::from_millis(85);

/// Creates the system tray icon with click handlers.
pub fn create(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    let icon = Image::from_bytes(include_bytes!("../icons/tray.png"))?;

    TrayIconBuilder::with_id("tray")
        .icon(icon)
        .icon_as_template(false)
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

/// 트레이 아이콘 상태 변경 로직 (커맨드와 내부 모두에서 사용)
pub fn update_icon_state(app: &AppHandle, is_working: bool) {
    if is_working {
        // 이미 애니메이션 중이면 중복 spawn 방지
        if ANIMATING.swap(true, Ordering::SeqCst) {
            return;
        }

        let app_clone = app.clone();
        std::thread::spawn(move || {
            let mut frame_idx: usize = 0;

            while ANIMATING.load(Ordering::Relaxed) {
                if let Some(tray) = app_clone.tray_by_id("tray") {
                    if let Ok(icon) = Image::from_bytes(TRAY_FRAMES[frame_idx]) {
                        let _ = tray.set_icon(Some(icon));
                    }
                }

                frame_idx = (frame_idx + 1) % TRAY_FRAMES.len();
                std::thread::sleep(FRAME_INTERVAL);
            }

            // 애니메이션 종료 후 idle 아이콘 복원
            if let Some(tray) = app_clone.tray_by_id("tray") {
                if let Ok(icon) = Image::from_bytes(TRAY_ICON_IDLE) {
                    let _ = tray.set_icon(Some(icon));
                }
            }
        });

        log::debug!("트레이 아이콘 애니메이션 시작");
    } else {
        ANIMATING.store(false, Ordering::SeqCst);
        log::debug!("트레이 아이콘 애니메이션 중지");
    }
}

/// 트레이 아이콘 상태 변경 (근무중: 코인 플립 애니메이션 / 비근무: 정적 아이콘)
#[tauri::command]
#[specta::specta]
pub fn set_tray_icon_state(app: AppHandle, is_working: bool) -> Result<(), String> {
    update_icon_state(&app, is_working);
    Ok(())
}

/// 트레이 타이틀 설정 (macOS 전용 - 메뉴바에 텍스트 표시)
#[tauri::command]
#[specta::specta]
pub fn set_tray_title(app: AppHandle, title: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let tray = app
            .tray_by_id("tray")
            .ok_or("트레이 아이콘을 찾을 수 없습니다")?;

        tray.set_title(title.as_deref())
            .map_err(|e| format!("타이틀 설정 실패: {e}"))?;

        log::debug!("트레이 타이틀 변경: {:?}", title);
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = title; // Windows/Linux에서는 미지원
        log::debug!("트레이 타이틀은 macOS에서만 지원됩니다");
    }

    Ok(())
}
