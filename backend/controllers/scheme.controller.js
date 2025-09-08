const db = require("../db");
const logger = require("../config/logger");

exports.getAllSchemes = async (req, res) => {
    logger.info(`[SCHEME] Request to GET all schemes.`);
    try {
        const query = `
            SELECT 
                scheme_id, scheme_name, COALESCE(description, 'N/A') AS description, created_on, created_by, updated_on, updated_by
            FROM datamanagement.scheme_details
            ORDER BY created_on DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[SCHEME] Error fetching all schemes: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.getSchemeById = async (req, res) => {
    const { id } = req.params;
    logger.info(`[SCHEME] Request to GET scheme by ID: ${id}`);
    try {
        const schemeQuery = `SELECT * FROM datamanagement.scheme_details WHERE scheme_id = $1;`;
        const slabsQuery = `SELECT * FROM datamanagement.loan_scheme_slab WHERE scheme_id = $1 ORDER BY start_day ASC;`;

        const [schemeResult, slabsResult] = await Promise.all([
            db.query(schemeQuery, [id]),
            db.query(slabsQuery, [id]),
        ]);

        if (schemeResult.rows.length === 0) {
            return res.status(404).json({ message: "Scheme not found." });
        }

        const schemeData = schemeResult.rows[0];
        schemeData.slabs = slabsResult.rows;

        res.json(schemeData);
    } catch (error) {
        logger.error(`[SCHEME] Error fetching scheme by ID ${id}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.createScheme = async (req, res) => {
    const { scheme_name, description } = req.body;
    const createdByUsername = req.user.username; // From auth middleware
    logger.info(`[SCHEME] Attempting to CREATE new scheme '${scheme_name}' by user '${createdByUsername}'.`);

    if (!scheme_name) {
        return res.status(400).json({ message: "Scheme name is required." });
    }

    try {
        const query = `
            INSERT INTO datamanagement.scheme_details (scheme_name, description, created_by, updated_by)
            VALUES ($1, $2, $3, $3) RETURNING *;
        `;
        const result = await db.query(query, [scheme_name, description || null, createdByUsername]);
        res.status(201).json({ message: "Scheme created successfully!", scheme: result.rows[0] });
    } catch (error) {
        logger.error(`[SCHEME] Error creating scheme '${scheme_name}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.updateScheme = async (req, res) => {
    const { id } = req.params;
    const { scheme_name, description, slabs } = req.body;
    const updatedByUsername = req.user.username;
    logger.info(`[SCHEME] Attempting to UPDATE scheme ID '${id}' by user '${updatedByUsername}'.`);

    if (!scheme_name || !slabs || !Array.isArray(slabs)) {
        return res.status(400).json({ message: "Scheme name and a valid slab array are required." });
    }

    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `UPDATE datamanagement.scheme_details 
             SET scheme_name = $1, description = $2, updated_by = $3, updated_on = CURRENT_TIMESTAMP 
             WHERE scheme_id = $4;`,
            [scheme_name, description || null, updatedByUsername, id]
        );

        await client.query(`DELETE FROM datamanagement.loan_scheme_slab WHERE scheme_id = $1;`, [id]);

        for (const slab of slabs) {
            if (slab.start_day && slab.end_day && slab.interest_rate) {
                const slabQuery = `
                    INSERT INTO datamanagement.loan_scheme_slab (scheme_id, start_day, end_day, interest_rate)
                    VALUES ($1, $2, $3, $4);
                `;
                await client.query(slabQuery, [id, slab.start_day, slab.end_day, slab.interest_rate]);
            }
        }

        await client.query("COMMIT");
        res.status(200).json({ message: "Scheme and slabs updated successfully!" });

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`[SCHEME] Error updating scheme ID ${id}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during update." });
    } finally {
        client.release();
    }
};

exports.deleteScheme = async (req, res) => {
    const { id } = req.params;
    logger.info(`[SCHEME] Attempting to DELETE scheme ID: ${id}`);
    try {
        const result = await db.query("DELETE FROM datamanagement.scheme_details WHERE scheme_id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Scheme not found." });
        }
        res.status(200).json({ message: "Scheme deleted successfully." });
    } catch (error) {
        logger.error(`[SCHEME] Error deleting scheme ID ${id}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};
exports.getSchemesList = async (req, res) => {
    logger.info(`[SCHEME] Request to GET schemes list for dropdown.`);
    try {
        const query = `SELECT scheme_id, scheme_name FROM datamanagement.scheme_details ORDER BY scheme_name ASC;`;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[SCHEME] Error fetching schemes list: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.exportAllSchemes = async (req, res) => {
    logger.info(`[SCHEME] Request to EXPORT all schemes and slabs.`);
    try {
        const query = `
            SELECT 
                sd.scheme_id,
                sd.scheme_name,
                sd.description,
                sd.created_by,
                sd.updated_by,
                ss.start_day,
                ss.end_day,
                ss.interest_rate AS slab_interest_rate
            FROM 
                datamanagement.scheme_details sd
            LEFT JOIN 
                datamanagement.loan_scheme_slab ss ON sd.scheme_id = ss.scheme_id
            ORDER BY 
                sd.scheme_id, ss.start_day;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[SCHEME] Error exporting schemes: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during scheme export." });
    }
};