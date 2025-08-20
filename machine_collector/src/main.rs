use mac_address::get_mac_address;
use sysinfo::{System, Cpu};
use tokio_postgres::{NoTls, Error};
#[tokio::main]
async fn main() -> Result<(), Error> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_brand = sys
        .cpus()
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

    let (client, connection) = tokio_postgres::connect(
        "host=localhost \
         user=postgres \
         password=sathvik2004 \
         dbname=goldfinancemanagement",
        NoTls,
    )
    .await?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    client
        .execute(
            "INSERT INTO datamanagement.allowed_machines (cpu_serial, mac_address) \
             VALUES ($1, $2) ON CONFLICT DO NOTHING",
            &[&cpu_brand, &mac_address],
        )
        .await?;

    println!("✅ Machine info saved to DB");

    Ok(())
}
