const db = require("../db");
const logger = require("../config/logger");

exports.getInvestmentData = async (req, res) => {
    logger.info(`[INVESTMENT] Request to GET investment history.`);
    const client = await db.pool.connect();
    try {
        const historyQuery = `
            SELECT h.id, h.added_on, h.amount_added, h.current_balance, h.remarks, u.user_name as added_by
            FROM datamanagement.investment_history h
            JOIN datamanagement.users u ON h.added_by = u.user_id
            ORDER BY h.id DESC;
        `;
        
        const balanceQuery = `
            SELECT current_balance 
            FROM datamanagement.investment_history
            ORDER BY id DESC LIMIT 1;
        `;

        const [historyResult, balanceResult] = await Promise.all([
            client.query(historyQuery),
            client.query(balanceQuery)
        ]);

        const grandTotal = balanceResult.rows.length > 0 ? balanceResult.rows[0].current_balance : "0.00";

        res.json({
            transactions: historyResult.rows,
            grandTotal: grandTotal
        });
    } catch (error) {
        logger.error(`[INVESTMENT] Error fetching investment data: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    } finally {
        client.release();
    }
};

exports.addInvestment = async (req, res) => {
    const { amount, remarks, action } = req.body;
    const addedById = req.user.id;

    logger.info(`[INVESTMENT] Attempting to ${action} investment of ${amount} by user ID ${addedById}.`);

    const amountAdded = action === 'add' ? parseFloat(amount) : -parseFloat(amount);
    if (isNaN(amountAdded)) {
        return res.status(400).json({ message: "Invalid amount provided." });
    }

    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");
        const lastBalanceRes = await client.query("SELECT current_balance FROM datamanagement.investment_history ORDER BY id DESC LIMIT 1");
        const lastBalance = lastBalanceRes.rows.length > 0 ? parseFloat(lastBalanceRes.rows[0].current_balance) : 0;
        
        const newBalance = lastBalance + amountAdded;

        if (newBalance < 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Removal amount cannot exceed the current total balance." });
        }

        const insertQuery = `
            INSERT INTO datamanagement.investment_history (added_on, added_by, amount_added, current_balance, remarks)
            VALUES (CURRENT_TIMESTAMP, $1, $2, $3, $4) RETURNING *;
        `;
        await client.query(insertQuery, [addedById, amountAdded, newBalance, remarks || null]);

        await client.query("COMMIT");
        logger.info(`[INVESTMENT] Successfully processed transaction. New balance: ${newBalance}.`);
        res.status(201).json({ message: "Investment transaction recorded successfully." });

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`[INVESTMENT] Error adding investment transaction: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during transaction." });
    } finally {
        client.release();
    }
};

exports.exportInvestmentHistory = async (req, res) => {
    logger.info(`[INVESTMENT] Request to EXPORT investment history.`);
    try {
        const query = `
            SELECT h.id, h.added_on, h.amount_added, h.current_balance, h.remarks, u.user_name as added_by
            FROM datamanagement.investment_history h
            JOIN datamanagement.users u ON h.added_by = u.user_id
            ORDER BY h.id ASC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[INVESTMENT] Error exporting investment history: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};