// Tauri v2 application entry point (shared lib so desktop + mobile targets reuse it).
//
// The web app persists data via browser storage (localStorage/IndexedDB) inside the
// webview today, so no custom commands are required to ship a working desktop build.
// Future native persistence (SQLite + git-sync) plugs in here via `.invoke_handler(...)`
// behind the app's storage interface — see docs/desktop/TAURI.md.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
