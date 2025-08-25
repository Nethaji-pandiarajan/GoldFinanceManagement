//dashboard.controller.js
const db = require("../db");
const logger = require("../config/logger");

exports.getDashboardStats = async (req, res) => {
    logger.info(`[DASHBOARD] Request received to GET dashboard statistics.`);
    const client = await db.pool.connect();
    try {
        const [
            customerCountRes,
            loanStatsRes,
            totalInterestRes,
            totalInvestmentRes,
            goldRate22kRes,
            monthlyLoansRes,
            weeklyCustomersRes
        ] = await Promise.all([
            client.query('SELECT COUNT(*) FROM datamanagement.customers'),
            client.query('SELECT COUNT(*), SUM(net_amount_issued) FROM datamanagement.loan_details'),
            client.query('SELECT SUM(interest_amount_paid) FROM datamanagement.loan_payments'),
            client.query('SELECT SUM(total_invested) FROM datamanagement.users'),
            client.query("SELECT today_rate FROM datamanagement.gold_rate WHERE karat_name = '22K'"),
            
            client.query(`
                SELECT 
                    to_char(loan_datetime, 'YYYY-Mon') AS month,
                    COUNT(*) FILTER (WHERE completion_status = 'Completed') AS "Completed",
                    COUNT(*) FILTER (WHERE completion_status = 'Pending') AS "Pending"
                FROM datamanagement.loan_details
                WHERE loan_datetime > now() - interval '6 months'
                GROUP BY 1
                ORDER BY 1;
            `),
            client.query(`
                SELECT 
                    to_char(date_trunc('week', created_on), 'Mon DD') AS week,
                    COUNT(*) AS "NewCustomers"
                FROM datamanagement.customers
                WHERE created_on > now() - interval '4 weeks'
                GROUP BY 1
                ORDER BY 1;
            `)
        ]);

        const stats = {
            totalCustomers: customerCountRes.rows[0].count || '0',
            totalLoans: loanStatsRes.rows[0].count || '0',
            totalLoanAmount: loanStatsRes.rows[0].sum || '0',
            totalInterest: totalInterestRes.rows[0].sum || '0',
            totalInvestment: totalInvestmentRes.rows[0].sum || '0',
            goldRate22k: goldRate22kRes.rows[0]?.today_rate || '0',
            monthlyLoanData: monthlyLoansRes.rows,
            weeklyCustomerData: weeklyCustomersRes.rows
        };

        logger.info(`[DASHBOARD] Successfully fetched dashboard statistics.`);
        res.json(stats);

    } catch (error) {
        logger.error(`[DASHBOARD] Error fetching dashboard stats: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error fetching dashboard data." });
    } finally {
        client.release();
    }
};