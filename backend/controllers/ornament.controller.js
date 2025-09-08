const db = require("../db");
const logger = require("../config/logger"); 
exports.getAllOrnaments = async (req, res) => {
  logger.info(`[ORNAMENT] Request received to GET all ornaments.`);
  try {
    const result = await db.query(
      "SELECT ornament_id, ornament_type, ornament_name, material_type, COALESCE(description, 'N/A') AS description FROM datamanagement.ornament_details ORDER BY created_on DESC"
    );
    logger.info(`[ORNAMENT] Successfully retrieved ${result.rows.length} ornaments.`);
    res.json(result.rows);
  } catch (error) {
    logger.error(`[ORNAMENT] Error fetching all ornaments: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error while fetching ornaments." });
  }
};

exports.createOrnament = async (req, res) => {
    const { ornament_type, ornament_name, material_type } = req.body;
    logger.info(`[ORNAMENT] Attempting to CREATE new ornament '${ornament_name}' of type '${ornament_type}'.`);

    if (!ornament_type || !ornament_name || !material_type) {
        logger.warn(`[ORNAMENT] Validation failed for creating ornament '${ornament_name}': Missing required fields.`);
        return res.status(400).json({ message: "Ornament type, name, and material are required." });
    }

    try {
        const query = `
          INSERT INTO datamanagement.ornament_details (ornament_type, ornament_name, material_type, description)
          VALUES ($1, $2, $3, $4) RETURNING ornament_id;
        `;
        const newOrnament = await db.query(query, [ornament_type, ornament_name, material_type, req.body.description || null]);
        const newId = newOrnament.rows[0].ornament_id;
        logger.info(`[ORNAMENT] Successfully CREATED ornament '${ornament_name}' with new ID: ${newId}.`);

        res.status(201).json({ message: "Ornament created successfully!" });
    } catch (error) {
        logger.error(`[ORNAMENT] Error CREATING ornament '${ornament_name}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during ornament creation." });
    }
};
exports.updateOrnamentById = async (req, res) => {
  const { id } = req.params;
  const { ornament_type, ornament_name, material_type, description } = req.body;
  logger.info(`[ORNAMENT] Attempting to UPDATE ornament with ID '${id}' to name '${ornament_name}'.`);
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    logger.warn(`[ORNAMENT] Update failed: Invalid Ornament ID provided: '${id}'.`);
    return res.status(400).json({ message: "Invalid ornament ID." });
  }
  if (!ornament_type || !ornament_name || !material_type) {
    logger.warn(`[ORNAMENT] Validation failed for updating ornament ID '${id}': Missing required fields.`);
    return res.status(400).json({ message: "Ornament type, name, and material are required." });
  }

  try {
    const query = `
      UPDATE datamanagement.ornament_details SET
        ornament_type = $1, ornament_name = $2, material_type = $3, description = $4, updated_on = CURRENT_TIMESTAMP
      WHERE ornament_id = $5;
    `;
    const result = await db.query(query, [ornament_type, ornament_name, material_type, description || null, parsedId]);

    if (result.rowCount === 0) {
      logger.warn(`[ORNAMENT] Failed to UPDATE ornament: Ornament with ID '${id}' not found.`);
      return res.status(404).json({ message: "Ornament not found." });
    }
    logger.info(`[ORNAMENT] Successfully UPDATED ornament with ID '${id}'.`);
    res.status(200).json({ message: "Ornament updated successfully!" });
  } catch (error) {
    logger.error(`[ORNAMENT] Error UPDATING ornament with ID '${id}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error during update." });
  }
};

exports.deleteOrnamentById = async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);
  logger.info(`[ORNAMENT] Attempting to DELETE ornament with ID: ${id}`);
  if (isNaN(parsedId)) {
    logger.warn(`[ORNAMENT] Delete failed: Invalid Ornament ID provided: '${id}'.`);
    return res.status(400).json({ message: "Invalid ornament ID." });
  }

  try {
    const result = await db.query(
      "DELETE FROM datamanagement.ornament_details WHERE ornament_id = $1",
      [parsedId]
    );
    if (result.rowCount === 0) {
      logger.warn(`[ORNAMENT] Failed to DELETE ornament: Ornament with ID '${id}' not found.`);
      return res.status(404).json({ message: "Ornament not found." });
    }
    logger.info(`[ORNAMENT] Successfully DELETED ornament with ID: ${id}.`);
    res.status(200).json({ message: "Ornament deleted successfully." });
  } catch (error) {
    logger.error(`[ORNAMENT] Error DELETING ornament with ID '${id}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error." });
  }
};

exports.getOrnamentsList = async (req, res) => {
  logger.info(`[ORNAMENT] Request received for ornament dropdown list.`);
  try {
    const result = await db.query(
      "SELECT ornament_id, ornament_name FROM datamanagement.ornament_details ORDER BY ornament_name"
    );
    logger.info(`[ORNAMENT] Successfully retrieved ornament list with ${result.rows.length} entries.`);
    res.json(result.rows);
  } catch (error) {
    logger.error(`[ORNAMENT] Error fetching ornament list: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error." });
  }
};

exports.getAllOrnamentsForLoan = async (req, res) => {
  logger.info(`[ORNAMENT] Request received for all ornament details for loan application.`);
  try {
    const result = await db.query(
      "SELECT ornament_id, ornament_name, ornament_type, material_type FROM datamanagement.ornament_details ORDER BY ornament_name"
    );
    logger.info(`[ORNAMENT] Successfully retrieved ${result.rows.length} ornaments for loan application.`);
    res.json(result.rows);
  } catch (error) {
    logger.error(`[ORNAMENT] Error fetching all ornaments for loan: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error." });
  }
};

exports.exportAllOrnaments = async (req, res) => {
    logger.info(`[ORNAMENT] Request to EXPORT all ornament details.`);
    try {
        const result = await db.query("SELECT * FROM datamanagement.ornament_details ORDER BY ornament_id ASC");
        res.json(result.rows);
    } catch (error) {
        logger.error(`[ORNAMENT] Error exporting ornaments: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during ornament export." });
    }
};