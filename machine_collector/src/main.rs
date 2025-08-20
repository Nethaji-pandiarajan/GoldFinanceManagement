use mac_address::get_mac_address;
use sysinfo::{System, Cpu};
use tokio_postgres::{NoTls, Error};
use native_tls::TlsConnector;
use postgres_native_tls::MakeTlsConnector;
#[tokio::main]
async fn main() -> Result<(), Error> {

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

    println!("CPU: {}", cpu_brand);
    println!("MAC: {}", mac_address);
    let conn_str = "host=dpg-d2ibtnuuk2gs73ddjab0-a.singapore-postgres.render.com \
                    user=maya_gold_finance_user \
                    password=lMUPfVHBycKGhIIQAt9iPjYzWr0hLxTc \
                    dbname=maya_gold_finance \
                    port=5432 sslmode=require";

    let connector = TlsConnector::builder()
        .build()
        .unwrap();
    let tls = MakeTlsConnector::new(connector);

    let (client, connection) = tokio_postgres::connect(conn_str, tls).await?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });
    client.execute(
        "INSERT INTO datamanagement.allowed_machines (cpu_serial, mac_address) 
        VALUES ($1, $2) 
        ON CONFLICT DO NOTHING",
        &[&cpu_brand, &mac_address],
    ).await?;

    println!("✅ Machine info saved to DB");

    Ok(())
}
