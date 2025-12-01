// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
//   pool: pool,
// };

const { Pool } = require("pg");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

const caCertPath = path.join(__dirname, 'certs/ca.pem');

console.log(`[DB] Attempting to read Aiven CA certificate from: ${caCertPath}`);

let caCertContent;
try {
    caCertContent = fs.readFileSync(caCertPath).toString();
    console.log("[DB] Successfully read CA certificate file.");
} catch (error) {
    console.error("[DB] !!! CRITICAL ERROR: FAILED TO READ ca.pem CERTIFICATE FILE !!!");
    console.error(`[DB] Reason: ${error.message}`);
    process.exit(1); 
}

const sslConfig = {
  rejectUnauthorized: true, 
  ca: caCertContent,
};



const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: sslConfig,
});

console.log("[DB] Database pool created with SSL configuration for Aiven.");

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};