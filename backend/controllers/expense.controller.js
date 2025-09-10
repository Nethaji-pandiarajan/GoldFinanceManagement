const db = require("../db");
const logger = require("../config/logger");

exports.getExpensesGroupedByMonth = async (req, res) => {
    logger.info(`[EXPENSE] Request to GET all expenses grouped by month.`);
    try {
        const expensesQuery = `
             WITH RankedExpenses AS (
                SELECT
                    e.*,
                    ROW_NUMBER() OVER(PARTITION BY month_year ORDER BY id DESC) as rn
                FROM
                    datamanagement.manage_expenses e
            )
            SELECT 
                g.month_year,
                g.total_expenses,
                g.transactions,
                re.remaining_balance AS month_end_balance -- Get the balance from the last transaction
            FROM (
                SELECT 
                    month_year,
                    SUM(price) as total_expenses,
                    json_agg(
                        json_build_object(
                            'id', e.id,
                            'item', e.item,
                            'quantity', e.quantity,
                            'description', e.description,
                            'price', e.price,
                            'created_date', e.created_date,
                            'added_by', u.user_name
                        ) ORDER BY e.created_date DESC
                    ) as transactions
                FROM 
                    datamanagement.manage_expenses e
                JOIN
                    datamanagement.users u ON e.added_by = u.user_id
                GROUP BY 
                    month_year
            ) AS g
            LEFT JOIN 
                RankedExpenses re ON g.month_year = re.month_year AND re.rn = 1
            ORDER BY 
                g.month_year DESC;
        `;
        const balanceQuery = `
            SELECT remaining_balance 
            FROM datamanagement.manage_expenses
            ORDER BY id DESC LIMIT 1;
        `;
        const [expensesResult, balanceResult] = await Promise.all([
            db.query(expensesQuery),
            db.query(balanceQuery)
        ]);

        const netAvailableBalance = balanceResult.rows.length > 0 ? balanceResult.rows[0].remaining_balance : "0.00";

        res.json({
            monthlyExpenses: expensesResult.rows,
            netAvailableBalance: netAvailableBalance
        });
        logger.info(`[EXPENSE] Successfully fetched grouped expenses.`);
    } catch (error) {
        logger.error(`[EXPENSE] Error fetching grouped expenses: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.addExpense = async (req, res) => {
    const { item, quantity, description, price } = req.body;
    const addedById = req.user.id;

    logger.info(`[EXPENSE] Attempting to ADD expense '${item}' by user ID ${addedById}.`);

    const expensePrice = parseFloat(price);
    if (!item || isNaN(expensePrice) || expensePrice <= 0) {
        return res.status(400).json({ message: "Item name and a valid positive price are required." });
    }

    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");
        const investmentRes = await client.query("SELECT current_balance FROM datamanagement.investment_history ORDER BY id DESC LIMIT 1");
        const totalInvested = investmentRes.rows.length > 0 ? parseFloat(investmentRes.rows[0].current_balance) : 0;
        const expensesRes = await client.query("SELECT SUM(price) as total_spent FROM datamanagement.manage_expenses");
        const totalSpent = expensesRes.rows.length > 0 && expensesRes.rows[0].total_spent ? parseFloat(expensesRes.rows[0].total_spent) : 0;
        const availableBalance = totalInvested - totalSpent;

        if (expensePrice > availableBalance) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: `Expense amount (${expensePrice}) exceeds available balance (${availableBalance}).` });
        }
        
        const remainingBalanceSnapshot = availableBalance - expensePrice;

        const monthYear = new Date().toISOString().slice(0, 7);
        const insertQuery = `
            INSERT INTO datamanagement.manage_expenses 
            (item, quantity, description, price, month_year, remaining_balance, added_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;
        await client.query(insertQuery, [item, quantity || 1, description || null, expensePrice, monthYear, remainingBalanceSnapshot, addedById]);

        await client.query("COMMIT");
        logger.info(`[EXPENSE] Successfully added expense '${item}'. New remaining balance snapshot: ${remainingBalanceSnapshot}.`);
        res.status(201).json({ message: "Expense recorded successfully." });

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`[EXPENSE] Error adding expense transaction: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during transaction." });
    } finally {
        client.release();
    }
};