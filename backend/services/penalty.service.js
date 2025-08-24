const cron = require("node-cron");
const db = require("../db");
const logger = require("../config/logger");

const checkAndApplyPenalties = async () => {
  logger.info("[CRON] Starting daily penalty check for defaulted loans...");
  const client = await db.pool.connect();

  try {
    const pendingLoansRes = await client.query(
        `SELECT loan_id, scheme_id, net_amount_issued, principal_amount_paid, interest_rate 
         FROM datamanagement.loan_details 
         WHERE completion_status = 'Pending' AND scheme_id IS NOT NULL;`
    );
    const pendingLoans = pendingLoansRes.rows;

    for (const loan of pendingLoans) {
      try {
        const firstDefaultRes = await client.query(
            `SELECT payment_month FROM datamanagement.loan_payments 
             WHERE loan_id = $1 AND payment_status = 'Pending' AND is_active = TRUE AND payment_month < CURRENT_DATE 
             ORDER BY payment_month ASC LIMIT 1;`,
            [loan.loan_id]
        );
        
        if (firstDefaultRes.rows.length === 0) {
            continue; 
        }

        const firstDefaultDate = new Date(firstDefaultRes.rows[0].payment_month);
        const daysOverdue = Math.floor((new Date() - firstDefaultDate) / (1000 * 60 * 60 * 24));
        if (daysOverdue <= 0) {
            continue;
        }
        const penaltySlabRes = await client.query(
            `SELECT interest_rate FROM datamanagement.loan_scheme_slab 
             WHERE scheme_id = $1 AND start_day <= $2 AND end_day >= $2;`,
            [loan.scheme_id, daysOverdue]
        );
        
        if (penaltySlabRes.rows.length === 0) {
            logger.info(`[CRON] Loan #${loan.loan_id}: No penalty slab found for ${daysOverdue} days overdue. No action taken.`);
            continue;
        }
        const newInterestRate = penaltySlabRes.rows[0].interest_rate;
        logger.info(`[CRON] Loan #${loan.loan_id}: Matched slab. New rate: ${newInterestRate}%. Applying penalty.`);
        await client.query("BEGIN");
        const nextActiveInstallmentRes = await client.query(
            `SELECT payment_id FROM datamanagement.loan_payments
             WHERE loan_id = $1 AND payment_month >= CURRENT_DATE AND is_active = TRUE
             ORDER BY payment_month ASC LIMIT 1;`,
            [loan.loan_id]
        );
        if (nextActiveInstallmentRes.rows.length === 0) {
            logger.warn(`[CRON] Loan #${loan.loan_id}: Has defaults but no future installments to update. Rolling back.`);
            await client.query("ROLLBACK");
            continue;
        }
        const nextActiveInstallmentId = nextActiveInstallmentRes.rows[0].payment_id;
        await client.query(
            `UPDATE datamanagement.loan_payments SET is_active = FALSE WHERE loan_id = $1 AND payment_month < CURRENT_DATE AND is_active = TRUE;`,
            [loan.loan_id]
        );
        await client.query(
            `UPDATE datamanagement.loan_details SET current_interest_rate = $1, penalty_applied_on = CURRENT_DATE WHERE loan_id = $2;`,
            [newInterestRate, loan.loan_id]
        );
        const remainingPrincipal = parseFloat(loan.net_amount_issued) - parseFloat(loan.principal_amount_paid);
        const newMonthlyInterest = (remainingPrincipal * (parseFloat(newInterestRate) / 100)) / 12;
        await client.query(
            `UPDATE datamanagement.loan_payments
             SET interest_amount_due = $1, remarks = 'Recalculated-Penalty'
             WHERE loan_id = $2 AND payment_month >= CURRENT_DATE AND is_active = TRUE;`,
            [newMonthlyInterest.toFixed(2), loan.loan_id]
        );
        logger.info(`[CRON] Loan #${loan.loan_id}: Updated future installments with new interest.`);
        await client.query(
            `UPDATE datamanagement.loan_payments SET loan_balance = $1 WHERE payment_id = $2;`,
            [remainingPrincipal.toFixed(2), nextActiveInstallmentId]
        );
        await client.query(
            `UPDATE datamanagement.loan_payments SET loan_balance = 0 WHERE loan_id = $1 AND payment_id != $2 AND payment_month > CURRENT_DATE AND is_active = TRUE;`,
            [loan.loan_id, nextActiveInstallmentId]
        );
        logger.info(`[CRON] Loan #${loan.loan_id}: Consolidated balance onto installment #${nextActiveInstallmentId}.`);
        await client.query("COMMIT");
      } catch (loanError) {
        await client.query("ROLLBACK");
        logger.error(
          `[CRON] Failed to process penalty for Loan #${loan.loan_id}. Error: ${loanError.message}`
        );
      }
    }
  } catch (error) {
    logger.error(`[CRON] Error during penalty check: ${error.message}`, {
      stack: error.stack,
    });
  } finally {
    client.release();
    logger.info("[CRON] Daily penalty check finished.");
  }
};

exports.startPenaltyCheckJob = () => {
  cron.schedule(
    "*/15 * * * *",
    () => {
      checkAndApplyPenalties();
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );

  logger.info("[CRON] Penalty check job has been scheduled to run daily");
};
