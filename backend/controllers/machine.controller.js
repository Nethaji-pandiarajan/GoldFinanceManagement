// backend/controllers/machine.controller.js

const db = require("../db");
const { logger } = require("../config/logger");

// GET all allowed machines
exports.getAllAllowedMachines = async (req, res) => {
    logger.info(`[MACHINE] Request received to GET all allowed machines.`);
    try {
        // Use the correct column names from your table: deviceid, created_at
        const result = await db.query("SELECT deviceid, cpu_serial, mac_address, created_at FROM datamanagement.allowed_machines ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        logger.error(`[MACHINE] Error fetching allowed machines: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while fetching machines." });
    }
};

// ADD a new allowed machine
exports.addAllowedMachine = async (req, res) => {
    const { cpu_serial, mac_address } = req.body;

    logger.info(`[MACHINE] Attempting to ADD new allowed machine via public API. MAC: '${mac_address}'`);

    if (!cpu_serial || !mac_address) {
        logger.warn(`[MACHINE] Add failed: Missing cpu_serial or mac_address.`);
        return res.status(400).json({ message: "CPU Serial and MAC Address are required." });
    }

    try {
        const existingMachine = await db.query("SELECT 1 FROM datamanagement.allowed_machines WHERE mac_address = $1", [mac_address]);
        if (existingMachine.rows.length > 0) {
            logger.warn(`[MACHINE] Add failed: Machine with MAC address '${mac_address}' already exists.`);
            return res.status(409).json({ message: "A machine with this MAC address is already in the allowed list." });
        }

        // --- START OF CORRECTION ---
        // The INSERT statement now ONLY includes the columns that actually exist in your table.
        // The `created_at` column will be filled automatically if it has a DEFAULT.
        const query = `
            INSERT INTO datamanagement.allowed_machines (cpu_serial, mac_address)
            VALUES ($1, $2) RETURNING *;
        `;
        const result = await db.query(query, [cpu_serial, mac_address]);
        // --- END OF CORRECTION ---

        logger.info(`[MACHINE] Successfully ADDED new machine. ID: ${result.rows[0].deviceid}, MAC: '${mac_address}'.`);
        res.status(201).json({ message: "Machine added to allowed list successfully!", machine: result.rows[0] });

    } catch (error) {
        logger.error(`[MACHINE] Error adding new machine: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while adding machine." });
    }
};

// DELETE an allowed machine
exports.deleteAllowedMachine = async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    
    logger.info(`[MACHINE] Attempting to DELETE allowed machine with ID: ${id}`);

    if (isNaN(parsedId)) {
        return res.status(400).json({ message: "Invalid machine ID." });
    }

    try {
        // Use the correct primary key column name: deviceid
        const result = await db.query("DELETE FROM datamanagement.allowed_machines WHERE deviceid = $1", [parsedId]);
        if (result.rowCount === 0) {
            logger.warn(`[MACHINE] Delete failed: Machine with ID '${id}' not found.`);
            return res.status(404).json({ message: "Machine not found." });
        }
        
        logger.info(`[MACHINE] Successfully DELETED machine with ID: ${id}.`);
        res.status(200).json({ message: "Machine removed from allowed list successfully." });
    } catch (error) {
        logger.error(`[MACHINE] Error deleting machine with ID '${id}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while deleting machine." });
    }
};