const db = require("../db");
const { logger } = require("../config/logger");
exports.getAllGoldRates = async (req, res) => {
    logger.info(`[GOLD RATE] Request received to GET all karats with their rates.`);
    try {
        const query = `
          SELECT 
              k.karat_id,
              k.karat_name,
              r.rate_id,
              r.today_rate
          FROM 
              datamanagement.gold_karat_details k
          LEFT JOIN 
              datamanagement.gold_rate r ON k.karat_id = r.karat_id
          ORDER BY 
              k.karat_name;
        `;
        const result = await db.query(query);
        logger.info(`[GOLD RATE] Successfully retrieved ${result.rows.length} karats for rate management.`);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[GOLD RATE] Error fetching all karats for rates: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};
exports.createGoldRate = async (req, res) => {
  const { karat_id, today_rate } = req.body;
  logger.info(`[GOLD RATE] Attempting to CREATE a new gold rate for karat_id '${karat_id}' with rate '${today_rate}'.`);
  if (!karat_id || today_rate === undefined) {
    logger.warn(`[GOLD RATE] Validation failed for creating gold rate: Missing karat_id or today_rate.`);
    return res.status(400).json({ message: "Karat ID and rate are required." });
  }

  try {
    const karatDetails = await db.query(
      "SELECT karat_name FROM datamanagement.gold_karat_details WHERE karat_id = $1",
      [karat_id]
    );
    if (karatDetails.rows.length === 0) {
      logger.warn(`[GOLD RATE] Failed to create gold rate: Karat with id '${karat_id}' does not exist.`);
      return res.status(404).json({ message: "Selected Karat does not exist." });
    }
    const karat_name = karatDetails.rows[0].karat_name;

    const query = `
      INSERT INTO datamanagement.gold_rate (karat_id, karat_name, today_rate)
      VALUES ($1, $2, $3);
    `;
    await db.query(query, [karat_id, karat_name, today_rate]);
    logger.info(`[GOLD RATE] Successfully CREATED gold rate for '${karat_name}' (ID: ${karat_id}) with rate: ${today_rate}.`);
    res.status(201).json({ message: "New gold rate added successfully!" });
  } catch (error) {
    logger.error(`[GOLD RATE] Error CREATING gold rate for karat_id '${karat_id}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateGoldRateById = async (req, res) => {
  const { id } = req.params;
  const { today_rate } = req.body;
  logger.info(`[GOLD RATE] Attempting to UPDATE gold rate for rate_id '${id}' to new rate '${today_rate}'.`);
  if (today_rate === undefined || isNaN(parseFloat(today_rate))) {
    logger.warn(`[GOLD RATE] Validation failed for updating rate_id '${id}': A valid rate is required.`);
    return res.status(400).json({ message: "A valid rate is required." });
  }

  try {
    const query = `
      UPDATE datamanagement.gold_rate SET today_rate = $1, updated_on = CURRENT_TIMESTAMP
      WHERE rate_id = $2;
    `;
    const result = await db.query(query, [today_rate, id]);

    if (result.rowCount === 0) {
      logger.warn(`[GOLD RATE] Failed to UPDATE rate: Rate with id '${id}' not found.`);
      return res.status(404).json({ message: "Rate not found." });
    }
    logger.info(`[GOLD RATE] Successfully UPDATED gold rate for rate_id '${id}' to new rate '${today_rate}'.`);
    res.status(200).json({ message: "Gold rate updated successfully!" });
  } catch (error) {
    logger.error(`[GOLD RATE] Error UPDATING gold rate for rate_id '${id}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error." });
  }
};