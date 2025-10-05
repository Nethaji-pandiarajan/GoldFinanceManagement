const db = require("../db");
const { logger } = require("../config/logger");

exports.getAccountsSummary = async (req, res, next) => {
  logger.info(
    `[ACCOUNTS] User '${req.user.username}' requested to GET accounts summary.`
  );
  const client = await db.pool.connect();

  try {
    const dailyDataQuery = `
      -- WITH clause to define temporary summaries
      WITH 
      DateSeries AS (
        -- Create a master list of all unique DATES (time is stripped)
        SELECT DISTINCT payment_date::date AS txn_date FROM datamanagement.loan_payments WHERE payment_date IS NOT NULL
        UNION
        SELECT DISTINCT processed_at::date AS txn_date FROM datamanagement.processed_amounts WHERE processed_at IS NOT NULL
        UNION
        SELECT DISTINCT created_date::date AS txn_date FROM datamanagement.manage_expenses WHERE created_date IS NOT NULL
      ),
      PrincipalSummary AS (
        -- 1. Aggregate principal by DATE (time is stripped)
        SELECT
          payment_date::date AS txn_date,
          SUM(principal_amount_paid) AS total_principal
        FROM datamanagement.loan_payments
        WHERE principal_amount_paid > 0 AND (payment_status = 'Paid' OR payment_status = 'Partial')
        GROUP BY payment_date::date -- Group by DATE only
      ),
      InterestSummary AS (
        -- 2. Aggregate interest by DATE (time is stripped)
        SELECT
          payment_date::date AS txn_date,
          SUM(interest_amount_paid) AS total_interest
        FROM datamanagement.loan_payments
        WHERE interest_amount_paid > 0 AND (payment_status = 'Paid' OR payment_status = 'Partial')
        GROUP BY payment_date::date -- Group by DATE only
      ),
      ProcessingSummary AS (
        -- 3. Aggregate processing fees by DATE (time is stripped)
        SELECT
          processed_at::date AS txn_date,
          SUM(processed_amount) AS total_processing
        FROM datamanagement.processed_amounts
        GROUP BY processed_at::date -- Group by DATE only
      ),
      ExpenseSummary AS (
        -- 4. Aggregate expenses by DATE (time is stripped)
        SELECT
          created_date::date AS txn_date,
          SUM(price * quantity) AS total_expense
        FROM datamanagement.manage_expenses
        GROUP BY created_date::date -- Group by DATE only
      )
      -- Final assembly: Join all summaries by DATE
      SELECT
        d.txn_date,
        COALESCE(ps.total_principal, 0) AS principal_paid,
        COALESCE(is2.total_interest, 0) AS interest_paid,
        COALESCE(pr.total_processing, 0) AS processing_amount,
        COALESCE(es.total_expense, 0) AS expense,
        (
          COALESCE(ps.total_principal, 0) +
          COALESCE(is2.total_interest, 0) +
          COALESCE(pr.total_processing, 0) -
          COALESCE(es.total_expense, 0)
        ) AS total
      FROM DateSeries d
      LEFT JOIN PrincipalSummary ps ON d.txn_date = ps.txn_date
      LEFT JOIN InterestSummary is2 ON d.txn_date = is2.txn_date
      LEFT JOIN ProcessingSummary pr ON d.txn_date = pr.txn_date
      LEFT JOIN ExpenseSummary es ON d.txn_date = es.txn_date
      WHERE d.txn_date IS NOT NULL
      ORDER BY d.txn_date DESC;
    `;

    const { rows } = await client.query(dailyDataQuery);
    logger.info(
      `[ACCOUNTS] Successfully fetched and aggregated accounts summary for user '${req.user.username}'.`
    );
    res.status(200).json(rows);
  } catch (error) {
    logger.error(
      `[ACCOUNTS] Error fetching accounts summary: ${error.message}`,
      { stack: error.stack }
    );
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
};
