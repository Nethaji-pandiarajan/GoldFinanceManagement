const db = require("../db");

exports.getAllOrnaments = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT ornament_id, ornament_type, ornament_name, material_type, description FROM datamanagement.ornament_details ORDER BY created_on DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching ornaments:", error);
    res.status(500).json({ message: "Server error while fetching ornaments." });
  }
};

exports.createOrnament = async (req, res) => {
  const { ornament_type, ornament_name, material_type, description } = req.body;

  if (!ornament_type || !ornament_name || !material_type) {
    return res.status(400).json({ message: "Ornament type, name, and material are required." });
  }

  try {
    const query = `
      INSERT INTO datamanagement.ornament_details (ornament_type, ornament_name, material_type, description)
      VALUES ($1, $2, $3, $4) RETURNING ornament_id;
    `;
    await db.query(query, [ornament_type, ornament_name, material_type, description || null]);
    res.status(201).json({ message: "Ornament created successfully!" });
  } catch (error) {
    console.error("Error creating ornament:", error);
    res.status(500).json({ message: "Server error during ornament creation." });
  }
};

exports.updateOrnamentById = async (req, res) => {
  const { id } = req.params;
  const { ornament_type, ornament_name, material_type, description } = req.body;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "Invalid ornament ID." });
  }
  if (!ornament_type || !ornament_name || !material_type) {
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
      return res.status(404).json({ message: "Ornament not found." });
    }
    res.status(200).json({ message: "Ornament updated successfully!" });
  } catch (error) {
    console.error("Error updating ornament:", error);
    res.status(500).json({ message: "Server error during update." });
  }
};

exports.deleteOrnamentById = async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "Invalid ornament ID." });
  }

  try {
    const result = await db.query(
      "DELETE FROM datamanagement.ornament_details WHERE ornament_id = $1",
      [parsedId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Ornament not found." });
    }
    res.status(200).json({ message: "Ornament deleted successfully." });
  } catch (error) {
    console.error("Error deleting ornament:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getOrnamentsList = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT ornament_id, ornament_name FROM datamanagement.ornament_details ORDER BY ornament_name"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

exports.getAllOrnamentsForLoan = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT ornament_id, ornament_name, ornament_type, material_type FROM datamanagement.ornament_details ORDER BY ornament_name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching all ornaments:", error);
    res.status(500).json({ message: "Server error." });
  }
};