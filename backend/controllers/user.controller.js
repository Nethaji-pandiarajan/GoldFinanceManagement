const db = require("../db");

exports.getUsersProcessedAmounts = async (req, res) => {
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
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching user processed amounts:", error);
    res.status(500).json({ message: "Server error while fetching data." });
  }
};

exports.recordTransaction = async (req, res) => {
  const { user_id, amount } = req.body;
  const parsedUserId = parseInt(user_id, 10);
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedUserId) || isNaN(parsedAmount)) {
    return res.status(400).json({ message: "Valid User ID and amount are required." });
  }

  try {
    const query = `
      INSERT INTO datamanagement.processed_amounts (user_id, processed_amount)
      VALUES ($1, $2);
    `;
    await db.query(query, [parsedUserId, parsedAmount]);
    res.status(201).json({ message: "Transaction recorded successfully!" });
  } catch (error) {
    console.error("Error recording transaction:", error);
    res.status(500).json({ message: "Server error during transaction." });
  }
};