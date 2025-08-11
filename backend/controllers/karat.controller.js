const db = require("../db");
const logger = require("../config/logger");

exports.getAllKarats = async (req, res) => {
  logger.info(`[KARAT] Request received to GET all karats.`);
  try {
    const result = await db.query(
      "SELECT karat_id, karat_name, loan_percentage, description FROM datamanagement.gold_karat_details ORDER BY created_on DESC"
    );
    logger.info(`[KARAT] Successfully retrieved ${result.rows.length} karat details.`);
    res.json(result.rows);
  } catch (error) {
    logger.error(`[KARAT] Error fetching all karats: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error while fetching karats." });
  }
};

exports.createKarat = async (req, res) => {
  const { karat_name, loan_percentage, description } = req.body;
  logger.info(`[KARAT] Attempting to CREATE new karat '${karat_name}' with loan percentage '${loan_percentage}%'.`);
  if (!karat_name || loan_percentage === undefined) {
    logger.warn(`[KARAT] Validation failed for creating karat '${karat_name}': Missing name or loan percentage.`);
    return res.status(400).json({ message: "Karat name and loan percentage are required." });
  }

  try {
    const query = `
      INSERT INTO datamanagement.gold_karat_details (karat_name, loan_percentage, description)
      VALUES ($1, $2, $3);
    `;
    await db.query(query, [karat_name, loan_percentage, description || null]);
    logger.info(`[KARAT] Successfully CREATED karat '${karat_name}'.`);
    res.status(201).json({ message: "Gold karat detail created successfully!" });
  } catch (error) {
    logger.error(`[KARAT] Error CREATING karat '${karat_name}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error during creation." });
  }
};

exports.updateKaratById = async (req, res) => {
  const { id } = req.params;
  const { karat_name, loan_percentage, description } = req.body;
  const parsedId = parseInt(id, 10);
  logger.info(`[KARAT] Attempting to UPDATE karat with ID '${id}' to name '${karat_name}' and percentage '${loan_percentage}%'.`);
  if (isNaN(parsedId)) {
    logger.warn(`[KARAT] Update failed: Invalid Karat ID provided: '${id}'.`);
    return res.status(400).json({ message: "Invalid karat ID." });
  }
  if (!karat_name || loan_percentage === undefined) {
    logger.warn(`[KARAT] Validation failed for updating karat ID '${id}': Missing name or loan percentage.`);
    return res.status(400).json({ message: "Karat name and loan percentage are required." });
  }

  try {
    const query = `
      UPDATE datamanagement.gold_karat_details SET
        karat_name = $1, loan_percentage = $2, description = $3, updated_on = CURRENT_TIMESTAMP
      WHERE karat_id = $4;
    `;
    const result = await db.query(query, [karat_name, loan_percentage, description || null, parsedId]);

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