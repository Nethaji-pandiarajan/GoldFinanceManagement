#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use mac_address::get_mac_address;
use sysinfo::System;
use std::env;
use serde::Serialize;
fn get_machine_info() -> (String, String) {
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
    
    (cpu_brand, mac_address)
}
#[derive(Serialize)]
struct MachineInfo {
  cpu_brand: String,
  mac_address: String,
}
#[tauri::command]
fn get_machine_details() -> MachineInfo {
  let (cpu, mac) = get_machine_info();
  MachineInfo {
    cpu_brand: cpu,
    mac_address: mac,
  }
}
// #[tauri::command]
// async fn check_license() -> Result<bool, String> {
//     let (cpu_brand, mac_address) = get_machine_info();
//     let conn_str = "host=localhost user=postgres password=sathvik2004 dbname=goldfinancemanagement port=5432";

//     // let conn_str = format!(
//     //     "host={} user={} password={} dbname={} port={}",
//     //     env::var("DB_HOST").unwrap_or_else(|_| "localhost".to_string()),
//     //     env::var("DB_USER").unwrap_or_else(|_| "postgres".to_string()),
//     //     env::var("DB_PASSWORD").unwrap_or_default(),
//     //     env::var("DB_DATABASE").unwrap_or_default(),
//     //     env::var("DB_PORT").unwrap_or_else(|_| "5432".to_string()),
//     // );
    
//     let (client, connection) = tokio_postgres::connect(&conn_str, NoTls)
//         .await
//         .map_err(|e| format!("DB Connection Error: {}", e))?;

//     tokio::spawn(async move {
//         if let Err(e) = connection.await {
//             eprintln!("DB connection task error: {}", e);
//         }
//     });
//     let query = "SELECT 1 FROM datamanagement.allowed_machines WHERE cpu_serial = $1 AND mac_address = $2";
    
//     let rows = client.query(query, &[&cpu_brand, &mac_address])
//         .await
//         .map_err(|e| format!("DB Query Error: {}", e))?;

//     Ok(!rows.is_empty())
// }

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        get_machine_details
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}