const db = require("../db");

exports.getAllGoldRates = async (req, res) => {
  try {
    const query = `
      SELECT r.rate_id, r.karat_id, r.today_rate, k.karat_name
      FROM datamanagement.gold_rate r
      JOIN datamanagement.gold_karat_details k ON r.karat_id = k.karat_id
      ORDER BY k.karat_name;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching gold rates:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.createGoldRate = async (req, res) => {
  const { karat_id, today_rate } = req.body;

  if (!karat_id || today_rate === undefined) {
    return res.status(400).json({ message: "Karat ID and rate are required." });
  }

  try {
    const karatDetails = await db.query(
      "SELECT karat_name FROM datamanagement.gold_karat_details WHERE karat_id = $1",
      [karat_id]
    );
    if (karatDetails.rows.length === 0) {
      return res.status(404).json({ message: "Selected Karat does not exist." });
    }
    const karat_name = karatDetails.rows[0].karat_name;

    const query = `
      INSERT INTO datamanagement.gold_rate (karat_id, karat_name, today_rate)
      VALUES ($1, $2, $3);
    `;
    await db.query(query, [karat_id, karat_name, today_rate]);
    res.status(201).json({ message: "New gold rate added successfully!" });
  } catch (error) {
    console.error("Error adding gold rate:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateGoldRateById = async (req, res) => {
  const { id } = req.params;
  const { today_rate } = req.body;

  if (today_rate === undefined || isNaN(parseFloat(today_rate))) {
    return res.status(400).json({ message: "A valid rate is required." });
  }

  try {
    const query = `
      UPDATE datamanagement.gold_rate SET today_rate = $1, updated_on = CURRENT_TIMESTAMP
      WHERE rate_id = $2;
    `;
    const result = await db.query(query, [today_rate, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Rate not found." });
    }
    res.status(200).json({ message: "Gold rate updated successfully!" });
  } catch (error) {
    console.error("Error updating gold rate:", error);
    res.status(500).json({ message: "Server error." });
  }
};