#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde::Serialize;
use mac_address::get_mac_address;
use sysinfo::{System};

#[derive(Serialize)]
struct MachineInfo {
  cpu_brand: String,
  mac_address: String,
}

#[tauri::command]
fn get_machine_details() -> MachineInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_brand = sys.cpus()
        .first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or("Unknown CPU".to_string());

    let mac_address = get_mac_address()
        .ok()
        .flatten()
        .map(|ma| ma.to_string())
        .unwrap_or("Unknown MAC".to_string());

    MachineInfo {
        cpu_brand,
        mac_address,
    }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        get_machine_details
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}