//! System tray functionality for Miden Wallet
//!
//! Provides a system tray icon with menu for quick access:
//! - Show/hide the main window
//! - Lock the wallet
//! - Quit the application

use log::info;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

/// Setup the system tray icon and menu
pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    info!("Setting up system tray");

    // Create menu items
    let show = MenuItem::with_id(app, "show", "Show Miden Wallet", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
    let separator = MenuItem::with_id(app, "sep1", "---", false, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Miden Wallet", true, None::<&str>)?;

    // Build the menu
    let menu = Menu::with_items(app, &[&show, &hide, &separator, &quit])?;

    // Build the tray icon
    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            info!("Tray menu event: {:?}", event.id.as_ref());

            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.unminimize();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
                "quit" => {
                    info!("Quit requested from tray menu");
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            // Left-click on tray icon shows the window (works on Windows)
            // On macOS, click typically shows the menu which is handled separately
            match event {
                tauri::tray::TrayIconEvent::Click {
                    button: tauri::tray::MouseButton::Left,
                    ..
                }
                | tauri::tray::TrayIconEvent::DoubleClick { .. } => {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.unminimize();
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    info!("System tray setup complete");
    Ok(())
}
