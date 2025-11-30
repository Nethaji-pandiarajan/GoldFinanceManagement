// backend/services/interestUpdate.service.js

const cron = require("node-cron");
const db = require("../db");
const { logger } = require("../config/logger");

const updateInterestForAllPendingLoans = async () => {
  logger.info("[CRON] Starting daily interest update for all pending loans...");
  const client = await db.pool.connect();

  try {
    const pendingLoansRes = await client.query(
        `SELECT loan_id, loan_datetime, net_amount_issued, principal_amount_paid, interest_rate, current_interest_rate, scheme_id ,due_date
         FROM datamanagement.loan_details 
         WHERE completion_status = 'Pending';`
    );
    const pendingLoans = pendingLoansRes.rows;

    for (const loan of pendingLoans) {
      const loanStartDate = new Date(loan.loan_datetime);
      const today = new Date();
      
      const timeDiff = today.getTime() - loanStartDate.getTime();
      const daysSinceStart = Math.floor(timeDiff / (1000 * 3600 * 24));

      const currentInstallmentRes = await client.query(
          `SELECT payment_id, payment_month FROM datamanagement.loan_payments
           WHERE loan_id = $1 AND payment_status = 'Pending' AND is_active = TRUE
           LIMIT 1;`, [loan.loan_id]
      );
      
      if (currentInstallmentRes.rows.length === 0) {
        logger.warn(`[CRON] Loan #${loan.loan_id}: No active pending installment found. Skipping.`);
        continue;
      }
      const currentInstallment = currentInstallmentRes.rows[0];
      const principalAmount = parseFloat(loan.net_amount_issued);
      const initialAnnualRate = parseFloat(loan.interest_rate);

      let interestToUpdate = 0;

      if (daysSinceStart >= 0 && daysSinceStart <= 15) {
        const dailyInterest = (principalAmount * initialAnnualRate / 100) / 365;
        interestToUpdate = dailyInterest * 15;
        logger.info(`[CRON] Loan #${loan.loan_id} (Case 1: 0-15 days): No changes needed remains interest amount: ${interestToUpdate.toFixed(2)}`);
      }
      else if (daysSinceStart >= 16 && daysSinceStart <= 30) {
        const dailyInterest = (principalAmount * initialAnnualRate / 100) / 365;
        interestToUpdate = dailyInterest * daysSinceStart;
        logger.info(`[CRON] Loan #${loan.loan_id} (Case 2: 16-30 days): Pro-rata interest for ${daysSinceStart} days: ${interestToUpdate.toFixed(2)}`);
        await client.query(
            `UPDATE datamanagement.loan_payments 
             SET interest_amount_due = $1 
             WHERE payment_id = $2;`,
            [interestToUpdate.toFixed(2), currentInstallment.payment_id]
        );
        logger.info(`[CRON] Loan #${loan.loan_id} (Case 2: 16-30 days): Updated interest_amount_due for payment #${currentInstallment.payment_id} to ${interestToUpdate.toFixed(2)}`);
      }
      else {
        logger.info(`[CRON] Loan #${loan.loan_id} (Case 3: >30 days): Entering overdue installment creation logic.`);
        
        const lastPaidRes = await client.query(
            `SELECT payment_date FROM datamanagement.loan_payments WHERE loan_id = $1 AND payment_status = 'Paid' ORDER BY payment_date DESC LIMIT 1;`, 
            [loan.loan_id]
        );

        let anchorDate = lastPaidRes.rows.length > 0 ? new Date(lastPaidRes.rows[0].payment_date) : new Date(loan.loan_datetime);
        const daysOverdue = Math.floor((today.getTime() - anchorDate.getTime()) / (1000 * 3600 * 24));
        
        const penaltySlabRes = await client.query(
            `SELECT interest_rate FROM datamanagement.loan_scheme_slab WHERE scheme_id = $1 AND start_day <= $2 AND end_day >= $2;`,
            [loan.scheme_id, daysOverdue]
        );

        if (penaltySlabRes.rows.length > 0) {
            const penaltyRate = parseFloat(penaltySlabRes.rows[0].interest_rate);
            const remainingPrincipal = principalAmount - parseFloat(loan.principal_amount_paid);
            await client.query("BEGIN");
            await client.query(`UPDATE datamanagement.loan_details SET current_interest_rate = $1 WHERE loan_id = $2;`, [penaltyRate, loan.loan_id]);
            const finalOverdueInterest = (remainingPrincipal * penaltyRate / 100) / 12;
            await client.query(
                `UPDATE datamanagement.loan_payments 
                SET interest_amount_due = $1, payment_status = 'Overdue', remarks = 'Overdue interest finalized' 
                WHERE payment_id = $2;`,
                [finalOverdueInterest.toFixed(2), currentInstallment.payment_id]
            );
            logger.info(`[CRON] Loan #${loan.loan_id}: Finalized and marked overdue installment #${currentInstallment.payment_id}. It remains active.`);
            const lastDueDate = new Date(currentInstallment.payment_month);
            const nextDueDate = new Date(lastDueDate.setMonth(lastDueDate.getMonth() + 1));
            const finalLoanDueDate = new Date(loan.due_date);

            if (nextDueDate <= finalLoanDueDate) {
                const newMonthlyInterest = (remainingPrincipal * penaltyRate / 100) / 12;
                await client.query(
                    `INSERT INTO datamanagement.loan_payments (loan_id, payment_month, loan_balance, interest_amount_due, payment_status, remarks, is_active) VALUES ($1, $2, $3, $4, 'Pending', 'Generated after overdue', TRUE);`,
                    [loan.loan_id, nextDueDate.toISOString().split('T')[0], remainingPrincipal.toFixed(2), newMonthlyInterest.toFixed(2)]
                );
                logger.info(`[CRON] Loan #${loan.loan_id}: Created new active installment.`);
            } else {
                logger.warn(`[CRON] Loan #${loan.loan_id}: Not creating new installment as it would exceed final loan due date.`);
            }
            await client.query("COMMIT");
        } else {
            logger.warn(`[CRON] Loan #${loan.loan_id}: No penalty slab found for ${daysOverdue} days. No action taken.`);
        }
      }
    }
  } catch (error) {
    logger.error(`[CRON] Error during daily interest update: ${error.message}`, {
      stack: error.stack,
    });
  } finally {
    client.release();
    logger.info("[CRON] Daily interest update finished.");
  }
};

exports.startInterestUpdateJob = () => {
  cron.schedule(
    "*/10 * * * * ", 
    () => {
      updateInterestForAllPendingLoans();
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    } 
  );
  logger.info("[CRON] Daily interest update job has been scheduled.");
};