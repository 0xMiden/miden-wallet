mod secure_storage;
mod tray;

use log::info;
use tauri::Manager;

/// Log a message from JavaScript to Rust's stdout
#[tauri::command]
fn js_log(message: String) {
    println!("[JS] {}", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    info!("Starting Miden Wallet desktop application");

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init());

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
            secure_storage::generate_hardware_key,
            secure_storage::encrypt_with_hardware_key,
            secure_storage::decrypt_with_hardware_key,
            secure_storage::delete_hardware_key,
            secure_storage::is_hardware_security_available,
            secure_storage::has_hardware_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
