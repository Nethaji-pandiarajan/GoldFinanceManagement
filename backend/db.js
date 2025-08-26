const { Pool } = require("pg");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

// --- START: SSL Configuration for Aiven ---

// 1. Define the path to your certificate file.
const caCertPath = path.join(__dirname, 'certs/ca.pem');

// 2. Add logging to verify the file path and content.
console.log(`[DB] Attempting to read Aiven CA certificate from: ${caCertPath}`);

let caCertContent;
try {
    caCertContent = fs.readFileSync(caCertPath).toString();
    console.log("[DB] Successfully read CA certificate file.");
} catch (error) {
    console.error("[DB] !!! CRITICAL ERROR: FAILED TO READ ca.pem CERTIFICATE FILE !!!");
    console.error(`[DB] Reason: ${error.message}`);
    // Stop the application if the cert can't be read, as no DB connection will work.
    process.exit(1); 
}

// 3. Create the SSL configuration object.
const sslConfig = {
  // `rejectUnauthorized: true` is the secure default. It means we MUST verify the server's identity.
  rejectUnauthorized: true, 
  // Provide the Certificate Authority content we just read from the file.
  ca: caCertContent,
};

// --- END: SSL Configuration for Aiven ---


// 4. Create the connection pool with the SSL configuration.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: sslConfig, // Apply the SSL configuration here.
});

console.log("[DB] Database pool created with SSL configuration for Aiven.");

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};