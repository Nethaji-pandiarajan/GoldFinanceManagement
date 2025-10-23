const db = require("../db");
const { logger } = require("../config/logger");

exports.getProcessingData = async (req, res) => {
    logger.info(`[PROCESSING] Request received to GET all processing amounts data.`);
    const client = await db.pool.connect();
    try {
        const [totalRes, listRes] = await Promise.all([
            client.query('SELECT SUM(processed_amount) AS "grandTotal" FROM datamanagement.processed_amounts'),
            client.query(`
                SELECT 
                    p.process_id,
                    p.user_id,
                    u.user_name,
                    p.processed_amount,
                    p.processed_at
                FROM 
                    datamanagement.processed_amounts p
                JOIN 
                    datamanagement.users u ON p.user_id = u.user_id
                ORDER BY 
                    p.processed_at DESC;
            `)
        ]);

        const responseData = {
            grandTotal: totalRes.rows[0]?.grandTotal || '0',
            transactions: listRes.rows
        };

        logger.info(`[PROCESSING] Successfully retrieved processing data. Total: ${responseData.grandTotal}, Transactions: ${responseData.transactions.length}`);
        res.json(responseData);

    } catch (error) {
        logger.error(`[PROCESSING] Error fetching processing data: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while fetching data." });
    } finally {
        client.release();
    }
};