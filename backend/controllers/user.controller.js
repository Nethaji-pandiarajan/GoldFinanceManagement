const db = require("../db");
const logger = require("../config/logger"); 
exports.getUsersProcessedAmounts = async (req, res) => {
  logger.info(`[USER] Request received to GET all users with their processed amounts.`);
  try {
    const query = `
      SELECT u.user_id, u.user_name, u.email,
             COALESCE(SUM(p.processed_amount), 0) AS total_invested
      FROM datamanagement.users u
      LEFT JOIN datamanagement.processed_amounts p ON u.user_id = p.user_id
      GROUP BY u.user_id, u.user_name, u.email
      ORDER BY u.user_name;
    `;
    const result = await db.query(query);
    logger.info(`[USER] Successfully retrieved processed amounts for ${result.rows.length} users.`);
    res.json(result.rows);
  } catch (error) {
    logger.error(`[USER] Error fetching user processed amounts: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error while fetching data." });
  }
};

exports.recordTransaction = async (req, res) => {
  const { user_id, amount } = req.body;
  const parsedUserId = parseInt(user_id, 10);
  const parsedAmount = parseFloat(amount);
  logger.info(`[USER] Attempting to ${action} processed amount for user_id '${user_id}'. Amount: ${amount}.`);
  if (isNaN(parsedUserId) || isNaN(parsedAmount)) {
    logger.warn(`[USER] Validation failed for recording transaction for user_id '${user_id}': Invalid user ID or amount.`);
    return res.status(400).json({ message: "Valid User ID and amount are required." });
  }

  try {
    const query = `
      INSERT INTO datamanagement.processed_amounts (user_id, processed_amount)
      VALUES ($1, $2);
    `;
    await db.query(query, [parsedUserId, parsedAmount]);
    logger.info(`[USER] Successfully recorded transaction for user_id '${user_id}'. Amount: ${parsedAmount}.`);
    res.status(201).json({ message: "Transaction recorded successfully!" });
  } catch (error) {
    logger.error(`[USER] Error recording transaction for user_id '${user_id}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error during transaction." });
  }
};