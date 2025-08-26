// backend/controllers/machine.controller.js

const db = require("../db");
const logger = require("../config/logger");

exports.getAllAllowedMachines = async (req, res) => {
    logger.info(`[MACHINE] Request received to GET all allowed machines.`);
    try {
        const result = await db.query("SELECT machine_id, cpu_serial, mac_address, added_on, added_by FROM datamanagement.allowed_machines ORDER BY added_on DESC");
        res.json(result.rows);
    } catch (error) {
        logger.error(`[MACHINE] Error fetching allowed machines: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while fetching machines." });
    }
};

exports.addAllowedMachine = async (req, res) => {
    const { cpu_serial, mac_address } = req.body;
    const addedByUsername = 'SYSTEM_TOOL'

    logger.info(`[MACHINE] Attempting to ADD new allowed machine by '${addedByUsername}'. MAC: '${mac_address}'`);

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

        const query = `
            INSERT INTO datamanagement.allowed_machines (cpu_serial, mac_address, added_by)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const result = await db.query(query, [cpu_serial, mac_address, addedByUsername]);

        logger.info(`[MACHINE] Successfully ADDED new machine. ID: ${result.rows[0].machine_id}, MAC: '${mac_address}'.`);
        res.status(201).json({ message: "Machine added to allowed list successfully!", machine: result.rows[0] });

    } catch (error) {
        logger.error(`[MACHINE] Error adding new machine: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while adding machine." });
    }
};

exports.deleteAllowedMachine = async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    
    logger.info(`[MACHINE] Attempting to DELETE allowed machine with ID: ${id}`);

    if (isNaN(parsedId)) {
        return res.status(400).json({ message: "Invalid machine ID." });
    }

    try {
        const result = await db.query("DELETE FROM datamanagement.allowed_machines WHERE machine_id = $1", [parsedId]);
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