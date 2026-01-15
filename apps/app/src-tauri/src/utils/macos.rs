//! macOS-specific menubar panel functionality.
//!
//! This module provides NSPanel integration for the menubar panel,
//! including positioning, appearance, and event handling.

#![allow(deprecated)]

use std::ffi::CString;

use tauri::{AppHandle, Emitter, Listener, Manager, WebviewWindow};
use tauri_nspanel::{
    block::ConcreteBlock,
    cocoa::{
        appkit::{NSMainMenuWindowLevel, NSScreen, NSView, NSWindow, NSWindowCollectionBehavior},
        base::{id, nil, NO},
        foundation::{NSPoint, NSRect},
    },
    objc::{class, msg_send, sel, sel_impl},
    panel_delegate, ManagerExt, WebviewWindowExt,
};

#[allow(non_upper_case_globals)]
const NSWindowStyleMaskNonActivatingPanel: i32 = 1 << 7;

/// Converts the main window to an NSPanel with menubar-appropriate behavior.
pub fn swizzle_to_menubar_panel(app_handle: &AppHandle) {
    let panel_delegate = panel_delegate!(SpotlightPanelDelegate {
        window_did_resign_key
    });

    let window = app_handle.get_webview_window("main").unwrap();

    let panel = window.to_panel().unwrap();

    let handle = app_handle.clone();

    panel_delegate.set_listener(Box::new(move |delegate_name: String| {
        if delegate_name.as_str() == "window_did_resign_key" {
            let _ = handle.emit("menubar_panel_did_resign_key", ());
        }
    }));

    panel.set_level(NSMainMenuWindowLevel + 1);

    panel.set_style_mask(NSWindowStyleMaskNonActivatingPanel);

    panel.set_collection_behaviour(
        NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
    );

    panel.set_delegate(panel_delegate);
}

/// Sets up listeners for hiding the menubar panel when appropriate.
pub fn setup_menubar_panel_listeners(app_handle: &AppHandle) {
    fn hide_menubar_panel(app_handle: &AppHandle) {
        if check_menubar_frontmost() {
            return;
        }

        let panel = app_handle.get_webview_panel("main").unwrap();

        panel.order_out(None);
    }

    let handle = app_handle.clone();

    app_handle.listen_any("menubar_panel_did_resign_key", move |_| {
        hide_menubar_panel(&handle);
    });

    let handle = app_handle.clone();

    let callback = Box::new(move || {
        hide_menubar_panel(&handle);
    });

    register_workspace_listener(
        "NSWorkspaceDidActivateApplicationNotification".into(),
        callback.clone(),
    );

    register_workspace_listener(
        "NSWorkspaceActiveSpaceDidChangeNotification".into(),
        callback,
    );
}

/// Updates the menubar panel appearance (e.g., corner radius).
pub fn update_menubar_appearance(app_handle: &AppHandle) {
    let window = app_handle.get_webview_window("main").unwrap();

    set_corner_radius(&window, 13.0);
}

/// Sets the corner radius for a window's content view.
pub fn set_corner_radius(window: &WebviewWindow, radius: f64) {
    let win: id = window.ns_window().unwrap() as _;

    unsafe {
        let view: id = win.contentView();

        view.wantsLayer();

        let layer: id = view.layer();

        let _: () = msg_send![layer, setCornerRadius: radius];
    }
}

/// Positions the menubar panel below the tray icon.
///
/// Uses the mouse location (click point on tray icon) to center the panel,
/// and places it just below the menu bar.
pub fn position_menubar_panel(app_handle: &AppHandle, padding_top: f64) {
    let window = app_handle.get_webview_window("main").unwrap();
    let handle: id = window.ns_window().unwrap() as _;

    unsafe {
        // Get mouse position (tray icon click point)
        let mouse_location: NSPoint = msg_send![class!(NSEvent), mouseLocation];

        // Get screen info
        let screen: id = NSScreen::mainScreen(nil);
        let screen_frame: NSRect = NSScreen::frame(screen);
        let visible_frame: NSRect = msg_send![screen, visibleFrame];

        // Get current window frame
        let mut win_frame: NSRect = msg_send![handle, frame];

        // Y: Position just below the menu bar
        win_frame.origin.y =
            visible_frame.origin.y + visible_frame.size.height - win_frame.size.height - padding_top;

        // X: Center on mouse position, with screen boundary handling
        let mut x = mouse_location.x - (win_frame.size.width / 2.0);
        x = x.max(screen_frame.origin.x); // Left boundary
        x = x.min(screen_frame.origin.x + screen_frame.size.width - win_frame.size.width); // Right boundary
        win_frame.origin.x = x;

        // Apply the frame
        let _: () = msg_send![handle, setFrame: win_frame display: NO];
    }
}

/// Registers a listener for NSWorkspace notifications.
fn register_workspace_listener(name: String, callback: Box<dyn Fn()>) {
    let workspace: id = unsafe { msg_send![class!(NSWorkspace), sharedWorkspace] };

    let notification_center: id = unsafe { msg_send![workspace, notificationCenter] };

    let block = ConcreteBlock::new(move |_notif: id| {
        callback();
    });

    let block = block.copy();

    let name: id =
        unsafe { msg_send![class!(NSString), stringWithCString: CString::new(name).unwrap()] };

    unsafe {
        let _: () = msg_send![
            notification_center,
            addObserverForName: name object: nil queue: nil usingBlock: block
        ];
    }
}

/// Returns the current application's process ID.
fn app_pid() -> i32 {
    let process_info: id = unsafe { msg_send![class!(NSProcessInfo), processInfo] };

    let pid: i32 = unsafe { msg_send![process_info, processIdentifier] };

    pid
}

/// Returns the frontmost application's process ID.
fn get_frontmost_app_pid() -> i32 {
    let workspace: id = unsafe { msg_send![class!(NSWorkspace), sharedWorkspace] };

    let frontmost_application: id = unsafe { msg_send![workspace, frontmostApplication] };

    let pid: i32 = unsafe { msg_send![frontmost_application, processIdentifier] };

    pid
}

/// Checks if the current app is the frontmost application.
pub fn check_menubar_frontmost() -> bool {
    get_frontmost_app_pid() == app_pid()
}
