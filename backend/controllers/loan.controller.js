const db = require("../db");
const logger = require("../config/logger");
exports.getAllLoans = async (req, res) => {
    logger.info(`[LOAN] Request received to GET all loans.`);
    try {
        const query = `
          SELECT l.loan_id, c.customer_name, l.amount_issued, l.principal_amount_paid,
                 l.interest_rate, l.due_date, l.loan_datetime, l.completion_status,
                 COALESCE(SUM(lip.amount_paid), 0.00) AS interest_paid
          FROM datamanagement.loan_details l
          JOIN datamanagement.customers c ON l.customer_id = c.customer_id
          LEFT JOIN datamanagement.loan_interest_payments lip ON l.loan_id = lip.loan_id
          GROUP BY l.loan_id, c.customer_name
          ORDER BY l.loan_datetime DESC;
        `;
        const result = await db.query(query);
        logger.info(`[LOAN] Successfully retrieved ${result.rows.length} total loans.`);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[LOAN] Error fetching all loans: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while fetching loans." });
    }
};

exports.createLoan = async (req, res) => {
    const { loan_application_uuid, customer_id, amount_issued } = JSON.parse(req.body.loanDetails);
    logger.info(`[LOAN] Attempting to CREATE new loan with Application UUID '${loan_application_uuid}' for customer_id '${customer_id}'.`);

    const client = await db.pool.connect();
    try {
        const loanDetails = JSON.parse(req.body.loanDetails);
        const ornaments = JSON.parse(req.body.ornaments);
        await client.query("BEGIN");

        const loanQuery = `
          INSERT INTO datamanagement.loan_details (
              customer_id, interest_rate, due_date, loan_datetime, 
              eligible_amount, amount_issued, loan_application_uuid
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7) 
          RETURNING loan_id;
        `;
        const loanResult = await client.query(loanQuery, [
            loanDetails.customer_id, loanDetails.interest_rate, loanDetails.due_date,
            loanDetails.loan_datetime, loanDetails.eligible_amount, 
            loanDetails.amount_issued, loanDetails.loan_application_uuid,
        ]);
        const newLoanId = loanResult.rows[0].loan_id;
        logger.info(`[LOAN] Intermediate step: Created loan detail with DB loan_id: ${newLoanId}.`);
        const files = req.files || [];
        for (let i = 0; i < ornaments.length; i++) {
            const ornament = ornaments[i];
            const file = files.find((f) => f.fieldname === `ornament_image_${i}`);
            const ornamentQuery = `
              INSERT INTO datamanagement.loan_ornament_details (ornament_id, ornament_type, ornament_name, grams, karat, ornament_image, loan_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7);
            `;
            await client.query(ornamentQuery, [
                ornament.ornament_id, ornament.ornament_type, ornament.ornament_name,
                ornament.grams, ornament.karat, file ? file.buffer : null, newLoanId,
            ]);
        }
        const monthlyInterest = parseFloat(loanDetails.amount_issued) * (parseFloat(loanDetails.interest_rate) / 100 / 12);
        for (let i = 1; i <= 12; i++) {
            const paymentMonth = new Date(loanDetails.due_date);
            paymentMonth.setMonth(paymentMonth.getMonth() + i - 1);
            const paymentQuery = `
              INSERT INTO datamanagement.loan_interest_payments (loan_id, payment_month, amount_due)
              VALUES ($1, $2, $3);
            `;
            await client.query(paymentQuery, [newLoanId, paymentMonth.toISOString().split("T")[0], monthlyInterest.toFixed(2)]);
        }
        await client.query("COMMIT");
        logger.info(`[LOAN] Successfully CREATED loan with DB ID ${newLoanId} (App UUID: ${loan_application_uuid}).`);
        res.status(201).json({ 
            message: `Loan application #${newLoanId} created successfully!`,
            newLoanId: newLoanId 
        });

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`[LOAN] Error CREATING loan for App UUID '${loan_application_uuid}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during loan creation." });
    } finally {
        client.release();
    }
};

exports.getLoanById = async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    logger.info(`[LOAN] Request received to GET loan by ID: ${id}`);
    if (isNaN(parsedId)) {
        logger.warn(`[LOAN] Get failed: Invalid Loan ID provided: '${id}'.`);
        return res.status(400).json({ message: "Invalid Loan ID." });
    }
    try {
        const loanQuery = `
          SELECT ld.*, c.customer_name FROM datamanagement.loan_details ld
          JOIN datamanagement.customers c ON ld.customer_id = c.customer_id
          WHERE ld.loan_id = $1;
        `;
        const loanResult = await db.query(loanQuery, [parsedId]);

        if (loanResult.rows.length === 0) {
            logger.warn(`[LOAN] Get failed: Loan with ID '${id}' not found.`);
            return res.status(404).json({ message: "Loan not found." });
        }
        const loanData = loanResult.rows[0];

        const paymentsQuery = `
          SELECT * FROM datamanagement.loan_interest_payments
          WHERE loan_id = $1 ORDER BY payment_month ASC;
        `;
        const paymentsResult = await db.query(paymentsQuery, [parsedId]);
        loanData.interest_payments = paymentsResult.rows;
        logger.info(`[LOAN] Successfully retrieved loan details for ID: ${id}`);
        res.json(loanData);
    } catch (error) {
        logger.info(`[LOAN] Successfully retrieved loan details for ID: ${id}`);
        res.status(500).json({ message: "Server error." });
    }
};

exports.deleteLoanById = async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    logger.info(`[LOAN] Attempting to DELETE loan with ID: ${id}`);
    if (isNaN(parsedId)) {
        logger.warn(`[LOAN] Delete failed: Invalid Loan ID provided: '${id}'.`);
        return res.status(400).json({ message: "Invalid Loan ID." });
    }
    try {
        const result = await db.query("DELETE FROM datamanagement.loan_details WHERE loan_id = $1", [parsedId]);
        if (result.rowCount === 0) {
            logger.warn(`[LOAN] Failed to DELETE loan: Loan with ID '${id}' not found.`);
            return res.status(404).json({ message: "Loan not found." });
        }
        logger.info(`[LOAN] Successfully DELETED loan with ID: ${id}.`);
        res.status(200).json({ message: "Loan deleted successfully." });
    } catch (error) {
        logger.error(`[LOAN] Error DELETING loan with ID '${id}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.recordPayment = async (req, res) => {
    const { id } = req.params;
    const { principal_payment, interest_payment, payment_mode, remarks } = req.body;
    const parsedLoanId = parseInt(id, 10);
    const principalAmount = parseFloat(principal_payment) || 0;
    const interestAmount = parseFloat(interest_payment) || 0;
    logger.info(`[LOAN] Attempting to RECORD PAYMENT for loan ID '${id}'. Principal: ${principal_payment}, Interest: ${interest_payment}.`);
    if (isNaN(parsedLoanId) || (principalAmount <= 0 && interestAmount <= 0)) {
        logger.warn(`[LOAN] Payment validation failed for loan ID '${id}': Invalid ID or no positive payment amount provided.`);
        return res.status(400).json({ message: "Valid Loan ID and a positive payment amount are required." });
    }

    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");
        if (principalAmount > 0) {
             
        }
        if (interestAmount > 0) {
             
        }
        if (principalAmount > 0) {
            await client.query(
                `UPDATE datamanagement.loan_details SET principal_amount_paid = principal_amount_paid + $1, updated_on = CURRENT_TIMESTAMP WHERE loan_id = $2;`,
                [principalAmount, parsedLoanId]
            );
            logger.info(`[LOAN] Applied principal payment of ${principalAmount} to loan ID '${id}'.`);
        }
        if (interestAmount > 0) {
            const installmentToUpdate = await client.query(
                `SELECT interest_payment_id FROM datamanagement.loan_interest_payments
                 WHERE loan_id = $1 AND payment_status != 'Paid'
                 ORDER BY payment_month ASC LIMIT 1`,
                [parsedLoanId]
            );
            if (installmentToUpdate.rows.length > 0) {
                const installmentId = installmentToUpdate.rows[0].interest_payment_id;
                await client.query(
                    `UPDATE datamanagement.loan_interest_payments SET
                       amount_paid = amount_paid + $1,
                       payment_status = CASE WHEN amount_due <= (amount_paid + $1) THEN 'Paid' ELSE 'Partial' END,
                       payment_mode = $2, remarks = $3, payment_date = CURRENT_TIMESTAMP, updated_on = CURRENT_TIMESTAMP
                     WHERE interest_payment_id = $4;`,
                    [interestAmount, payment_mode, remarks, installmentId]
                );
            }
            logger.info(`[LOAN] Applied interest payment of ${interestAmount} to loan ID '${id}'.`);
        }
        const loanCheck = await client.query("SELECT amount_issued, principal_amount_paid FROM datamanagement.loan_details WHERE loan_id = $1", [parsedLoanId]);
        const isPrincipalPaid = loanCheck.rows[0].principal_amount_paid >= loanCheck.rows[0].amount_issued;

        const interestCheck = await client.query("SELECT COUNT(*) FROM datamanagement.loan_interest_payments WHERE loan_id = $1 AND payment_status != 'Paid'", [parsedLoanId]);
        const hasNoPendingInterest = parseInt(interestCheck.rows[0].count, 10) === 0;

        if (isPrincipalPaid && hasNoPendingInterest) {
            await client.query("UPDATE datamanagement.loan_details SET completion_status = 'Completed' WHERE loan_id = $1", [parsedLoanId]);
            logger.info(`[LOAN] Loan ID '${id}' status changed to 'Completed' after payment.`);
        }

        await client.query("COMMIT");
        logger.info(`[LOAN] Successfully RECORDED PAYMENT for loan ID '${id}'.`);
        res.status(200).json({ message: "Payment recorded successfully!" });
    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`[LOAN] Error RECORDING PAYMENT for loan ID '${id}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while recording payment." });
    } finally {
        client.release();
    }
};

exports.getPendingLoans = async (req, res) => {
    logger.info(`[LOAN] Request received to GET all PENDING loans.`);
    try {
        const query = `
          SELECT
            l.loan_id, c.customer_name, l.amount_issued, l.principal_amount_paid,
            l.interest_rate, l.due_date, l.completion_status,
            COALESCE(SUM(lip.amount_paid), 0.00) AS interest_paid
          FROM datamanagement.loan_details l
          JOIN datamanagement.customers c ON l.customer_id = c.customer_id
          LEFT JOIN datamanagement.loan_interest_payments lip ON l.loan_id = lip.loan_id
          WHERE l.completion_status = 'Pending'
          GROUP BY l.loan_id, c.customer_name
          ORDER BY l.due_date ASC;
        `;
        const result = await db.query(query);
        logger.info(`[LOAN] Successfully retrieved ${result.rows.length} PENDING loans.`);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[LOAN] Error fetching PENDING loans: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.getClosedLoans = async (req, res) => {
    logger.info(`[LOAN] Request received to GET all CLOSED loans.`);
    try {
        const query = `
          SELECT
            l.loan_id, c.customer_name, l.amount_issued, l.principal_amount_paid,
            l.interest_rate, l.due_date, l.completion_status,
            COALESCE(SUM(lip.amount_paid), 0.00) AS interest_paid
          FROM datamanagement.loan_details l
          JOIN datamanagement.customers c ON l.customer_id = c.customer_id
          LEFT JOIN datamanagement.loan_interest_payments lip ON l.loan_id = lip.loan_id
          WHERE l.completion_status = 'Completed'
          GROUP BY l.loan_id, c.customer_name
          ORDER BY l.updated_on DESC;
        `;
        const result = await db.query(query);
        logger.info(`[LOAN] Successfully retrieved ${result.rows.length} CLOSED loans.`);
        res.json(result.rows);
    } catch (error){
        logger.error(`[LOAN] Error fetching CLOSED loans: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};