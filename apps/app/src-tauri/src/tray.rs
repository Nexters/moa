//! System tray/menu bar icon functionality.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

use crate::types::{MenubarDisplayMode, UserSettings};

#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

#[cfg(not(target_os = "macos"))]
use tauri_plugin_positioner::{Position, WindowExt};

/// Embedded tray icons — dark theme (white icons for dark menubar)
static TRAY_ICON_IDLE: &[u8] = include_bytes!("../icons/tray-idle.png");
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

/// Embedded tray icons — light theme (black icons for light menubar)
static TRAY_ICON_IDLE_LIGHT: &[u8] = include_bytes!("../icons/tray-idle-light.png");
static TRAY_FRAMES_LIGHT: [&[u8]; 14] = [
    include_bytes!("../icons/tray-frame-light-0.png"),
    include_bytes!("../icons/tray-frame-light-1.png"),
    include_bytes!("../icons/tray-frame-light-2.png"),
    include_bytes!("../icons/tray-frame-light-3.png"),
    include_bytes!("../icons/tray-frame-light-4.png"),
    include_bytes!("../icons/tray-frame-light-5.png"),
    include_bytes!("../icons/tray-frame-light-6.png"),
    include_bytes!("../icons/tray-frame-light-7.png"),
    include_bytes!("../icons/tray-frame-light-8.png"),
    include_bytes!("../icons/tray-frame-light-9.png"),
    include_bytes!("../icons/tray-frame-light-10.png"),
    include_bytes!("../icons/tray-frame-light-11.png"),
    include_bytes!("../icons/tray-frame-light-12.png"),
    include_bytes!("../icons/tray-frame-light-13.png"),
];

/// Animation control flag
static ANIMATING: AtomicBool = AtomicBool::new(false);

/// Cached menubar dark/light mode state
static IS_DARK_MENUBAR: AtomicBool = AtomicBool::new(true);

/// Animation frame interval (85ms × 14 frames ≈ 1.2s per rotation)
const FRAME_INTERVAL: Duration = Duration::from_millis(85);

/// 메뉴바 표시 모드 CheckMenuItem 참조 보관
struct MenuDisplayItems {
    none_item: CheckMenuItem<tauri::Wry>,
    daily_item: CheckMenuItem<tauri::Wry>,
    accumulated_item: CheckMenuItem<tauri::Wry>,
}

static MENU_DISPLAY_ITEMS: Mutex<Option<MenuDisplayItems>> = Mutex::new(None);

/// Detect macOS menubar dark/light mode via AppleInterfaceStyle.
/// 메뉴바는 시스템 외관 모드를 따르므로 AppleInterfaceStyle로 판별한다.
#[cfg(target_os = "macos")]
fn detect_dark_menubar() -> bool {
    std::process::Command::new("defaults")
        .args(["read", "-g", "AppleInterfaceStyle"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[cfg(not(target_os = "macos"))]
fn detect_dark_menubar() -> bool {
    false
}

fn idle_icon() -> &'static [u8] {
    if IS_DARK_MENUBAR.load(Ordering::Relaxed) {
        TRAY_ICON_IDLE
    } else {
        TRAY_ICON_IDLE_LIGHT
    }
}

fn frames() -> &'static [&'static [u8]; 14] {
    if IS_DARK_MENUBAR.load(Ordering::Relaxed) {
        &TRAY_FRAMES
    } else {
        &TRAY_FRAMES_LIGHT
    }
}

/// Creates the system tray icon with click handlers.
pub fn create(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    IS_DARK_MENUBAR.store(detect_dark_menubar(), Ordering::Relaxed);

    let icon = Image::from_bytes(idle_icon())?;
    let current_mode = load_current_display_mode(app_handle);

    // 메뉴바 표시 모드 CheckMenuItem (라디오 스타일)
    let none_item = CheckMenuItem::with_id(
        app_handle,
        "display_none",
        "표기 안함",
        true,
        current_mode == MenubarDisplayMode::None,
        None::<&str>,
    )?;
    let daily_item = CheckMenuItem::with_id(
        app_handle,
        "display_daily",
        "누적 일급",
        true,
        current_mode == MenubarDisplayMode::Daily,
        None::<&str>,
    )?;
    let accumulated_item = CheckMenuItem::with_id(
        app_handle,
        "display_accumulated",
        "누적 월급",
        true,
        current_mode == MenubarDisplayMode::Accumulated,
        None::<&str>,
    )?;

    let display_submenu = Submenu::with_items(
        app_handle,
        "금액 표기",
        true,
        &[&none_item, &daily_item, &accumulated_item],
    )?;

    // 참조 보관 (설정 변경 시 checked 상태 갱신용)
    *MENU_DISPLAY_ITEMS.lock().unwrap() = Some(MenuDisplayItems {
        none_item: none_item.clone(),
        daily_item: daily_item.clone(),
        accumulated_item: accumulated_item.clone(),
    });

    let separator = PredefinedMenuItem::separator(app_handle)?;
    let quit_item = MenuItem::with_id(app_handle, "quit", "앱 종료", true, None::<&str>)?;
    let menu = Menu::with_items(app_handle, &[&display_submenu, &separator, &quit_item])?;

    TrayIconBuilder::with_id("tray")
        .icon(icon)
        .icon_as_template(false)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            // Let positioner handle tray events for positioning
            tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

            if let TrayIconEvent::Click {
                button,
                button_state,
                ..
            } = event
            {
                if button == MouseButton::Left && button_state == MouseButtonState::Up {
                    toggle_main_window(tray.app_handle());
                }
            }
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => app.exit(0),
            id @ ("display_none" | "display_daily" | "display_accumulated") => {
                handle_display_mode_change(app, id);
            }
            _ => {}
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

/// 설정 파일에서 현재 메뉴바 표시 모드 읽기
fn load_current_display_mode(app: &AppHandle) -> MenubarDisplayMode {
    app.path()
        .app_data_dir()
        .ok()
        .and_then(|d| std::fs::read_to_string(d.join("user-settings.json")).ok())
        .and_then(|c| serde_json::from_str::<UserSettings>(&c).ok())
        .map(|s| s.menubar_display_mode)
        .unwrap_or_default()
}

/// 트레이 메뉴에서 표시 모드 변경 시 호출
fn handle_display_mode_change(app: &AppHandle, menu_id: &str) {
    let new_mode = match menu_id {
        "display_none" => MenubarDisplayMode::None,
        "display_daily" => MenubarDisplayMode::Daily,
        "display_accumulated" => MenubarDisplayMode::Accumulated,
        _ => return,
    };

    // 현재 설정 로드 → 모드 변경 → 저장
    let settings_path = app
        .path()
        .app_data_dir()
        .ok()
        .map(|d| d.join("user-settings.json"));

    let Some(path) = settings_path else { return };

    let mut settings = std::fs::read_to_string(&path)
        .ok()
        .and_then(|c| serde_json::from_str::<UserSettings>(&c).ok())
        .unwrap_or_default();

    settings.menubar_display_mode = new_mode;

    if let Err(e) = crate::commands::user_settings::save_user_settings_sync(app, &settings) {
        log::error!("트레이 메뉴에서 설정 저장 실패: {e}");
        return;
    }

    crate::salary::notify_settings_changed();
    let _ = app.emit("user-settings-changed", ());
    log::debug!("트레이 메뉴에서 메뉴바 표시 모드 변경: {menu_id}");
}

/// 메뉴바 표시 모드 CheckMenuItem checked 상태 갱신 (ticker에서 호출)
pub fn update_menu_check_states(mode: &MenubarDisplayMode) {
    if let Ok(guard) = MENU_DISPLAY_ITEMS.lock() {
        if let Some(items) = guard.as_ref() {
            let _ = items
                .none_item
                .set_checked(*mode == MenubarDisplayMode::None);
            let _ = items
                .daily_item
                .set_checked(*mode == MenubarDisplayMode::Daily);
            let _ = items
                .accumulated_item
                .set_checked(*mode == MenubarDisplayMode::Accumulated);
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
                    if let Ok(icon) = Image::from_bytes(frames()[frame_idx]) {
                        let _ = tray.set_icon(Some(icon));
                    }
                }

                frame_idx = (frame_idx + 1) % TRAY_FRAMES.len();
                std::thread::sleep(FRAME_INTERVAL);
            }

            // 애니메이션 종료 후 idle 아이콘 복원
            if let Some(tray) = app_clone.tray_by_id("tray") {
                if let Ok(icon) = Image::from_bytes(idle_icon()) {
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

/// 메뉴바 테마 변경 감지 후 아이콘 갱신 (AppleInterfaceThemeChangedNotification 이벤트 시 호출)
pub fn refresh_theme(app: &AppHandle) {
    let dark = detect_dark_menubar();
    let prev = IS_DARK_MENUBAR.swap(dark, Ordering::Relaxed);

    // 테마 변경 + 비애니메이션 상태일 때만 아이콘 교체
    if prev != dark && !ANIMATING.load(Ordering::Relaxed) {
        if let Some(tray) = app.tray_by_id("tray") {
            if let Ok(icon) = Image::from_bytes(idle_icon()) {
                let _ = tray.set_icon(Some(icon));
            }
        }
        log::debug!(
            "메뉴바 테마 변경 감지: {}",
            if dark { "다크" } else { "라이트" }
        );
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
