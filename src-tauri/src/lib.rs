mod dapp_browser;
mod secure_storage;
mod tray;

use log::info;
use tauri::Manager;

/// Log a message from JavaScript to Rust's stdout
#[tauri::command]
fn js_log(message: String) {
    println!("[JS] {}", message);
}

/// Focus the main wallet window (bring to front)
#[tauri::command]
fn focus_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_focus().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    info!("Starting Miden Wallet desktop application");

    let builder = tauri::Builder::default().plugin(tauri_plugin_shell::init());

    // Add single-instance plugin on desktop platforms
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        // Focus the main window when another instance tries to start
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_focus();
            let _ = window.unminimize();
        }
    }));

    builder
        .setup(|app| {
            info!("Setting up Miden Wallet");

            // Setup system tray
            tray::setup_tray(app)?;

            // Handle window close - minimize to tray instead of quitting
            let main_window = app.get_webview_window("main").unwrap();
            let app_handle = app.handle().clone();

            main_window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    // Prevent the window from closing, hide it instead
                    api.prevent_close();

                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            js_log,
            focus_main_window,
            secure_storage::generate_hardware_key,
            secure_storage::encrypt_with_hardware_key,
            secure_storage::decrypt_with_hardware_key,
            secure_storage::delete_hardware_key,
            secure_storage::is_hardware_security_available,
            secure_storage::has_hardware_key,
            dapp_browser::open_dapp_window,
            dapp_browser::close_dapp_window,
            dapp_browser::dapp_navigate,
            dapp_browser::dapp_get_url,
            dapp_browser::dapp_wallet_request,
            dapp_browser::dapp_wallet_response,
            dapp_browser::show_dapp_confirmation_overlay,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
