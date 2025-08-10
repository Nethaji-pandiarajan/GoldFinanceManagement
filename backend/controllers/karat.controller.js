const db = require("../db");

exports.getAllKarats = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT karat_id, karat_name, loan_percentage, description FROM datamanagement.gold_karat_details ORDER BY created_on DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching gold karats:", error);
    res.status(500).json({ message: "Server error while fetching karats." });
  }
};

exports.createKarat = async (req, res) => {
  const { karat_name, loan_percentage, description } = req.body;

  if (!karat_name || loan_percentage === undefined) {
    return res.status(400).json({ message: "Karat name and loan percentage are required." });
  }

  try {
    const query = `
      INSERT INTO datamanagement.gold_karat_details (karat_name, loan_percentage, description)
      VALUES ($1, $2, $3);
    `;
    await db.query(query, [karat_name, loan_percentage, description || null]);
    res.status(201).json({ message: "Gold karat detail created successfully!" });
  } catch (error) {
    console.error("Error creating gold karat:", error);
    res.status(500).json({ message: "Server error during creation." });
  }
};

exports.updateKaratById = async (req, res) => {
  const { id } = req.params;
  const { karat_name, loan_percentage, description } = req.body;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "Invalid karat ID." });
  }
  if (!karat_name || loan_percentage === undefined) {
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
      return res.status(404).json({ message: "Karat detail not found." });
    }
    res.status(200).json({ message: "Karat detail updated successfully!" });
  } catch (error) {
    console.error("Error updating gold karat:", error);
    res.status(500).json({ message: "Server error during update." });
  }
};

exports.deleteKaratById = async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "Invalid karat ID." });
  }

  try {
    const result = await db.query(
      "DELETE FROM datamanagement.gold_karat_details WHERE karat_id = $1",
      [parsedId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Karat detail not found." });
    }
    res.status(200).json({ message: "Karat detail deleted successfully." });
  } catch (error) {
    console.error("Error deleting gold karat:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getKaratsList = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT karat_id, karat_name FROM datamanagement.gold_karat_details ORDER BY karat_name"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};