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

use crate::types::{MenubarDisplayMode, MenubarIconTheme, UserSettings};

#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

#[cfg(not(target_os = "macos"))]
use tauri_plugin_positioner::{Position, WindowExt};

/// Embedded tray icons — light theme (white icons for dark menubar)
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

/// Embedded tray icons — dark theme (black icons for light menubar)
static TRAY_ICON_IDLE_DARK: &[u8] = include_bytes!("../icons/tray-idle-light.png");
static TRAY_FRAMES_DARK: [&[u8]; 14] = [
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

/// true = 밝은 아이콘 (Light), false = 어두운 아이콘 (Dark)
static IS_LIGHT_ICON: AtomicBool = AtomicBool::new(true);

/// Animation frame interval (85ms × 14 frames ≈ 1.2s per rotation)
const FRAME_INTERVAL: Duration = Duration::from_millis(85);

fn idle_icon() -> &'static [u8] {
    if IS_LIGHT_ICON.load(Ordering::Relaxed) {
        TRAY_ICON_IDLE
    } else {
        TRAY_ICON_IDLE_DARK
    }
}

fn frames() -> &'static [&'static [u8]; 14] {
    if IS_LIGHT_ICON.load(Ordering::Relaxed) {
        &TRAY_FRAMES
    } else {
        &TRAY_FRAMES_DARK
    }
}

/// 트레이 메뉴 CheckMenuItem 참조 보관
struct MenuItems {
    none_item: CheckMenuItem<tauri::Wry>,
    daily_item: CheckMenuItem<tauri::Wry>,
    accumulated_item: CheckMenuItem<tauri::Wry>,
    icon_light_item: CheckMenuItem<tauri::Wry>,
    icon_dark_item: CheckMenuItem<tauri::Wry>,
}

static MENU_ITEMS: Mutex<Option<MenuItems>> = Mutex::new(None);

/// Creates the system tray icon with click handlers.
pub fn create(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    let settings = load_current_settings(app_handle);
    IS_LIGHT_ICON.store(
        settings.menubar_icon_theme == MenubarIconTheme::Light,
        Ordering::Relaxed,
    );

    let icon = Image::from_bytes(idle_icon())?;

    // 금액 표기 서브메뉴
    let none_item = CheckMenuItem::with_id(
        app_handle,
        "display_none",
        "표기 안함",
        true,
        settings.menubar_display_mode == MenubarDisplayMode::None,
        None::<&str>,
    )?;
    let daily_item = CheckMenuItem::with_id(
        app_handle,
        "display_daily",
        "누적 일급",
        true,
        settings.menubar_display_mode == MenubarDisplayMode::Daily,
        None::<&str>,
    )?;
    let accumulated_item = CheckMenuItem::with_id(
        app_handle,
        "display_accumulated",
        "누적 월급",
        true,
        settings.menubar_display_mode == MenubarDisplayMode::Accumulated,
        None::<&str>,
    )?;

    let display_submenu = Submenu::with_items(
        app_handle,
        "금액 표기",
        true,
        &[&none_item, &daily_item, &accumulated_item],
    )?;

    // 아이콘 테마 서브메뉴
    let icon_light_item = CheckMenuItem::with_id(
        app_handle,
        "icon_light",
        "밝은 아이콘",
        true,
        settings.menubar_icon_theme == MenubarIconTheme::Light,
        None::<&str>,
    )?;
    let icon_dark_item = CheckMenuItem::with_id(
        app_handle,
        "icon_dark",
        "어두운 아이콘",
        true,
        settings.menubar_icon_theme == MenubarIconTheme::Dark,
        None::<&str>,
    )?;

    let icon_submenu = Submenu::with_items(
        app_handle,
        "아이콘 테마",
        true,
        &[&icon_light_item, &icon_dark_item],
    )?;

    // 참조 보관 (설정 변경 시 checked 상태 갱신용)
    *MENU_ITEMS.lock().unwrap() = Some(MenuItems {
        none_item: none_item.clone(),
        daily_item: daily_item.clone(),
        accumulated_item: accumulated_item.clone(),
        icon_light_item: icon_light_item.clone(),
        icon_dark_item: icon_dark_item.clone(),
    });

    let salary_work_settings_item = MenuItem::with_id(
        app_handle,
        "salary_work_settings",
        "월급 · 근무 설정",
        true,
        None::<&str>,
    )?;

    let separator = PredefinedMenuItem::separator(app_handle)?;
    let quit_item = MenuItem::with_id(app_handle, "quit", "앱 종료", true, None::<&str>)?;
    let menu = Menu::with_items(
        app_handle,
        &[
            &display_submenu,
            &icon_submenu,
            &salary_work_settings_item,
            &separator,
            &quit_item,
        ],
    )?;

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
            "salary_work_settings" => {
                let _ = app.emit("open-salary-settings", ());
                show_main_window(app);
            }
            id @ ("display_none" | "display_daily" | "display_accumulated") => {
                handle_display_mode_change(app, id);
            }
            id @ ("icon_light" | "icon_dark") => {
                handle_icon_theme_change(app, id);
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

/// Show main window (without toggling).
#[cfg(target_os = "macos")]
fn show_main_window(app_handle: &AppHandle) {
    use crate::utils::macos::position_menubar_panel;

    if let Ok(panel) = app_handle.get_webview_panel("main") {
        if !panel.is_visible() {
            position_menubar_panel(app_handle, 5.0);
            panel.show();
        }
        return;
    }

    if let Some(window) = app_handle.get_webview_window("main") {
        if !window.is_visible().unwrap_or(false) {
            position_menubar_panel(app_handle, 5.0);
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn show_main_window(app_handle: &AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        if !window.is_visible().unwrap_or(false) {
            let _ = window.move_window(Position::TrayBottomCenter);
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

/// 설정 파일에서 현재 설정 읽기
fn load_current_settings(app: &AppHandle) -> UserSettings {
    app.path()
        .app_data_dir()
        .ok()
        .and_then(|d| std::fs::read_to_string(d.join("user-settings.json")).ok())
        .and_then(|c| serde_json::from_str::<UserSettings>(&c).ok())
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

    let mut settings = load_current_settings(app);
    settings.menubar_display_mode = new_mode;
    save_and_notify(app, &settings, "메뉴바 표시 모드 변경");
}

/// 트레이 메뉴에서 아이콘 테마 변경 시 호출
fn handle_icon_theme_change(app: &AppHandle, menu_id: &str) {
    let new_theme = match menu_id {
        "icon_light" => MenubarIconTheme::Light,
        "icon_dark" => MenubarIconTheme::Dark,
        _ => return,
    };

    IS_LIGHT_ICON.store(new_theme == MenubarIconTheme::Light, Ordering::Relaxed);

    // 비애니메이션 상태일 때 즉시 아이콘 교체
    if !ANIMATING.load(Ordering::Relaxed) {
        if let Some(tray) = app.tray_by_id("tray") {
            if let Ok(icon) = Image::from_bytes(idle_icon()) {
                let _ = tray.set_icon(Some(icon));
            }
        }
    }

    let mut settings = load_current_settings(app);
    settings.menubar_icon_theme = new_theme;
    save_and_notify(app, &settings, "아이콘 테마 변경");
}

/// 설정 저장 + 변경 알림 공통 헬퍼
fn save_and_notify(app: &AppHandle, settings: &UserSettings, context: &str) {
    if let Err(e) = crate::commands::user_settings::save_user_settings_sync(app, settings) {
        log::error!("트레이 메뉴에서 설정 저장 실패: {e}");
        return;
    }

    crate::salary::notify_settings_changed();
    let _ = app.emit("user-settings-changed", ());
    log::debug!("트레이 메뉴: {context}");
}

/// 메뉴 CheckMenuItem checked 상태 갱신 (ticker에서 호출)
pub fn update_menu_check_states(settings: &UserSettings) {
    if let Ok(guard) = MENU_ITEMS.lock() {
        if let Some(items) = guard.as_ref() {
            let _ = items
                .none_item
                .set_checked(settings.menubar_display_mode == MenubarDisplayMode::None);
            let _ = items
                .daily_item
                .set_checked(settings.menubar_display_mode == MenubarDisplayMode::Daily);
            let _ = items
                .accumulated_item
                .set_checked(settings.menubar_display_mode == MenubarDisplayMode::Accumulated);
            let _ = items
                .icon_light_item
                .set_checked(settings.menubar_icon_theme == MenubarIconTheme::Light);
            let _ = items
                .icon_dark_item
                .set_checked(settings.menubar_icon_theme == MenubarIconTheme::Dark);
        }
    }
}

/// 설정 변경 시 아이콘 테마 동기화 (salary ticker에서 호출)
pub fn refresh_icon_theme(settings: &UserSettings) {
    IS_LIGHT_ICON.store(
        settings.menubar_icon_theme == MenubarIconTheme::Light,
        Ordering::Relaxed,
    );
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
