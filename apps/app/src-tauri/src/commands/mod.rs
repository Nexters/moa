//! Tauri command handlers organized by domain.
//!
//! Each submodule contains related commands and their helper functions.
//! Import specific commands via their submodule (e.g., `commands::preferences::greet`).

pub mod app;
pub mod auth;
pub mod confetti;
pub mod menubar;
pub mod notifications;
pub mod preferences;
pub mod recovery;
pub mod user_settings;
