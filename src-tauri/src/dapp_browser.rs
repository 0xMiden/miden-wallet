//! dApp Browser module for opening external dApps in a separate window
//!
//! This module provides Tauri commands for:
//! - Opening a dApp in a new webview window with wallet API injection
//! - Navigation controls (back, forward, refresh)
//! - Closing the dApp window
//! - Handling wallet requests from dApps

use log::info;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

/// The initialization script injected into dApp pages
/// This includes the toolbar and wallet API
const DAPP_INJECTION_SCRIPT: &str = include_str!("../scripts/dapp-injection.js");

/// Default dApp browser window size (larger than main wallet for comfortable browsing)
const DAPP_WINDOW_WIDTH: f64 = 1200.0;
const DAPP_WINDOW_HEIGHT: f64 = 800.0;

/// Open a dApp in a new browser window
///
/// Creates a new Tauri webview window that loads the specified URL
/// with the wallet injection script for toolbar and wallet API
#[tauri::command]
pub async fn open_dapp_window(url: String, app: AppHandle) -> Result<(), String> {
    info!("Opening dApp window for URL: {}", url);

    // Check if dApp window already exists
    if let Some(existing) = app.get_webview_window("dapp-browser") {
        // Focus existing window and navigate to new URL
        existing.set_focus().map_err(|e| e.to_string())?;
        existing
            .eval(&format!("window.location.href = '{}';", url))
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Get main window position to place dApp window nearby
    let main_window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    let position = main_window.outer_position().map_err(|e| e.to_string())?;

    // Parse URL
    let parsed_url: url::Url = url.parse().map_err(|e| format!("Invalid URL: {}", e))?;

    // Create the dApp browser window with larger size for comfortable browsing
    let dapp_window = WebviewWindowBuilder::new(
        &app,
        "dapp-browser",
        WebviewUrl::External(parsed_url),
    )
    .title("dApp Browser - Miden Wallet")
    .inner_size(DAPP_WINDOW_WIDTH, DAPP_WINDOW_HEIGHT)
    .position(
        position.x as f64 + 50.0,
        position.y as f64 + 50.0,
    )
    .initialization_script(DAPP_INJECTION_SCRIPT)
    .resizable(true)
    .decorations(true)
    .visible(true)
    .build()
    .map_err(|e| e.to_string())?;

    // Focus the new window
    dapp_window.set_focus().map_err(|e| e.to_string())?;

    info!("dApp window created successfully ({}x{})", DAPP_WINDOW_WIDTH, DAPP_WINDOW_HEIGHT);
    Ok(())
}

/// Close the dApp browser window
#[tauri::command]
pub async fn close_dapp_window(app: AppHandle) -> Result<(), String> {
    info!("Closing dApp window");

    if let Some(window) = app.get_webview_window("dapp-browser") {
        window.close().map_err(|e| e.to_string())?;
        info!("dApp window closed");
    } else {
        info!("dApp window not found (already closed)");
    }

    Ok(())
}

/// Navigate the dApp browser (back, forward, refresh)
#[tauri::command]
pub async fn dapp_navigate(action: String, app: AppHandle) -> Result<(), String> {
    info!("dApp navigate: {}", action);

    if let Some(webview) = app.get_webview_window("dapp-browser") {
        match action.as_str() {
            "back" => {
                webview
                    .eval("history.back()")
                    .map_err(|e| e.to_string())?;
            }
            "forward" => {
                webview
                    .eval("history.forward()")
                    .map_err(|e| e.to_string())?;
            }
            "refresh" => {
                webview
                    .eval("location.reload()")
                    .map_err(|e| e.to_string())?;
            }
            _ => {
                return Err(format!("Unknown navigation action: {}", action));
            }
        }
    } else {
        return Err("dApp window not found".to_string());
    }

    Ok(())
}

/// Get the current URL of the dApp browser
#[tauri::command]
pub async fn dapp_get_url(app: AppHandle) -> Result<String, String> {
    if let Some(webview) = app.get_webview_window("dapp-browser") {
        webview
            .url()
            .map(|url| url.to_string())
            .map_err(|e| e.to_string())
    } else {
        Err("dApp window not found".to_string())
    }
}

/// Handle a wallet request from a dApp
///
/// This command is called from the dApp window's injected script.
/// It forwards the request to the main wallet window via events.
#[tauri::command]
pub async fn dapp_wallet_request(request: String, app: AppHandle) -> Result<String, String> {
    info!("dApp wallet request received: {}", &request[..std::cmp::min(100, request.len())]);

    // Get the origin from the dApp window
    let origin = if let Some(dapp_window) = app.get_webview_window("dapp-browser") {
        dapp_window
            .url()
            .map(|url| {
                let url_str = url.to_string();
                url::Url::parse(&url_str)
                    .map(|u| format!("{}://{}", u.scheme(), u.host_str().unwrap_or("unknown")))
                    .unwrap_or_else(|_| "unknown".to_string())
            })
            .unwrap_or_else(|_| "unknown".to_string())
    } else {
        "unknown".to_string()
    };

    info!("dApp origin: {}", origin);

    // Emit request event to main window
    let main_window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    // Create payload with request and origin
    let payload = serde_json::json!({
        "request": request,
        "origin": origin
    });

    main_window
        .emit("dapp-wallet-request", payload)
        .map_err(|e| e.to_string())?;

    // For now, return empty - the actual response will come via event
    // The injection script handles this asynchronously
    Ok("{}".to_string())
}

/// Send a response back to the dApp window
///
/// Called from the main window to send wallet responses back to the dApp
#[tauri::command]
pub async fn dapp_wallet_response(response: String, app: AppHandle) -> Result<(), String> {
    info!("Sending wallet response to dApp: {}", &response[..std::cmp::min(100, response.len())]);

    if let Some(dapp_window) = app.get_webview_window("dapp-browser") {
        // Call the response handler in the dApp window
        let script = format!(
            "if (window.__midenWalletResponse) {{ window.__midenWalletResponse({}); }}",
            serde_json::to_string(&response).map_err(|e| e.to_string())?
        );
        dapp_window.eval(&script).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("dApp window not found".to_string())
    }
}
