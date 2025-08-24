const db = require("../db");
const logger = require("../config/logger");

exports.getAllKarats = async (req, res) => {
  logger.info(`[KARAT] Request received to GET all karats.`);
  try {
    const result = await db.query(
      "SELECT karat_id, karat_name, description , purity FROM datamanagement.gold_karat_details ORDER BY created_on DESC"
    );
    logger.info(`[KARAT] Successfully retrieved ${result.rows.length} karat details.`);
    res.json(result.rows);
  } catch (error) {
    logger.error(`[KARAT] Error fetching all karats: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error while fetching karats." });
  }
};

exports.createKarat = async (req, res) => {
    const { karat_name,   purity, description } = req.body; 
    logger.info(`[KARAT] Attempting to CREATE new karat '${karat_name}' with   purity '${purity}%'.`);

    if (!karat_name ||  purity === undefined) {
        logger.warn(`[KARAT] Validation failed for creating karat '${karat_name}': Missing required fields.`);
        return res.status(400).json({ message: "Karat name,  loan to value, and purity are required." });
    }

    try {
        const existingKarat = await db.query("SELECT 1 FROM datamanagement.gold_karat_details WHERE karat_name = $1", [karat_name]);
        if (existingKarat.rows.length > 0) {
            logger.warn(`[KARAT] Create failed: Karat with name '${karat_name}' already exists.`);
            return res.status(409).json({ message: `A karat with the name '${karat_name}' already exists.` });
        }
        const query = `
          INSERT INTO datamanagement.gold_karat_details (karat_name,  description, purity)
          VALUES ($1, $2, $3);
        `;
        await db.query(query, [karat_name,  description || null, purity]);
        
        logger.info(`[KARAT] Successfully CREATED karat '${karat_name}'.`);
        res.status(201).json({ message: "Gold karat detail created successfully!" });
    } catch (error) {
        if (error.code === '23505') {
             logger.error(`[KARAT] Unique constraint violation for karat '${karat_name}': ${error.message}`);
             return res.status(409).json({ message: `A karat with the name '${karat_name}' already exists.` });
        }
        logger.error(`[KARAT] Error CREATING karat '${karat_name}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during creation." });
    }
};

exports.updateKaratById = async (req, res) => {
  const { id } = req.params;
  const {  description  , purity } = req.body;
  const parsedId = parseInt(id, 10);
  logger.info(`[KARAT] Attempting to UPDATE karat with ID '${id}'`);
  if (isNaN(parsedId)) {
    logger.warn(`[KARAT] Update failed: Invalid Karat ID provided: '${id}'.`);
    return res.status(400).json({ message: "Invalid karat ID." });
  }
  if (  purity === undefined) {
      logger.warn(`[KARAT] Validation failed for updating karat ID '${id}': Missing purity.`);
      return res.status(400).json({ message: " purity are required." });
  }

  try {
    const query = `
          UPDATE datamanagement.gold_karat_details SET
            description = $1, purity = $2, updated_on = CURRENT_TIMESTAMP
          WHERE karat_id = $3;
        `;
    const result = await db.query(query, [ description || null, purity, parsedId]);

    if (result.rowCount === 0) {
      logger.warn(`[KARAT] Failed to UPDATE karat: Karat with ID '${id}' not found.`);
      return res.status(404).json({ message: "Karat detail not found." });
    }
    logger.info(`[KARAT] Successfully UPDATED karat with ID '${id}'.`);
    res.status(200).json({ message: "Karat detail updated successfully!" });
  } catch (error) {
    logger.error(`[KARAT] Error UPDATING karat with ID '${id}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error during update." });
  }
};

exports.deleteKaratById = async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);
  logger.info(`[KARAT] Attempting to DELETE karat with ID: ${id}`);
  if (isNaN(parsedId)) {
    logger.warn(`[KARAT] Delete failed: Invalid Karat ID provided: '${id}'.`);
    return res.status(400).json({ message: "Invalid karat ID." });
  }

  try {
    const result = await db.query(
      "DELETE FROM datamanagement.gold_karat_details WHERE karat_id = $1",
      [parsedId]
    );
    if (result.rowCount === 0) {
      logger.warn(`[KARAT] Failed to DELETE karat: Karat with ID '${id}' not found.`);
      return res.status(404).json({ message: "Karat detail not found." });
    }
    logger.info(`[KARAT] Successfully DELETED karat with ID: ${id}.`);
    res.status(200).json({ message: "Karat detail deleted successfully." });
  } catch (error) {
    logger.error(`[KARAT] Error DELETING karat with ID '${id}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error." });
  }
};

exports.getKaratsList = async (req, res) => {
  logger.info(`[KARAT] Request received for karat dropdown list.`);
  try {
    const result = await db.query(
      "SELECT karat_id, karat_name FROM datamanagement.gold_karat_details ORDER BY karat_name"
    );
    logger.info(`[KARAT] Successfully retrieved karat list with ${result.rows.length} entries.`);
    res.json(result.rows);
  } catch (error) {
    logger.error(`[KARAT] Error fetching karat list: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error." });
  }
};