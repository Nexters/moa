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
        appkit::{NSMainMenuWindowLevel, NSView, NSWindow, NSWindowCollectionBehavior},
        base::{id, nil},
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
