const db = require("../db");
const logger = require("../config/logger");
exports.getNextLoanId = async (req, res) => {
    logger.info(`[LOAN] Request received to GET next loan ID.`);
    try {
        const result = await db.query("SELECT nextval('datamanagement.loan_details_loan_id_seq') as next_id");
        res.json(result.rows[0]);
    } catch (error) {
        logger.error(`[LOAN] Error fetching next loan ID: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};
exports.getCalculationData = async (req, res) => {
    logger.info(`[LOAN] Request received to GET data for loan calculations.`);
    try {
        const [karatRatesRes, karatsLTVRes] = await Promise.all([
            db.query('SELECT karat_name, today_rate FROM datamanagement.gold_rate'),
            db.query('SELECT karat_name, loan_to_value FROM datamanagement.gold_karat_details')
        ]);
        
        const responseData = {
            goldRates: karatRatesRes.rows,
            karatLTVs: karatsLTVRes.rows
        };
        res.json(responseData);
    } catch (error) {
        logger.error(`[LOAN] Error fetching calculation data: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};
exports.getAllLoans = async (req, res) => {
    logger.info(`[LOAN] Request received to GET all loans.`);
    try {
        const query = `
          SELECT
              ld.loan_id,
              c.customer_name,
              ld.net_amount_issued, -- Use the new net amount
              ld.completion_status,
              -- Calculate total interest due for the entire loan
              (SELECT SUM(interest_amount_due) FROM datamanagement.loan_payments lp WHERE lp.loan_id = ld.loan_id) as total_interest_due,
              -- Calculate total interest paid
              (SELECT SUM(interest_amount_paid) FROM datamanagement.loan_payments lp WHERE lp.loan_id = ld.loan_id) as total_interest_paid
          FROM 
              datamanagement.loan_details ld
          JOIN 
              datamanagement.customers c ON ld.customer_id = c.customer_id
          ORDER BY 
              ld.loan_datetime DESC;
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
    const createdByUserId = req.user.id; 
    const loanDetails = JSON.parse(req.body.loanDetails);
    const { current_address } = loanDetails;
    logger.info(`[LOAN] Attempting to CREATE new loan for customer_id '${loanDetails.customer_id}'.`);
    const client = await db.pool.connect();
    try {
        const ornaments = JSON.parse(req.body.ornaments);
        await client.query("BEGIN");
        const customerResult = await client.query(
            'SELECT address, current_address FROM datamanagement.customers WHERE customer_id = $1',
            [loanDetails.customer_id]
        );
        const dbCustomer = customerResult.rows[0];
        if (current_address && current_address !== dbCustomer.current_address) {
            await client.query(
                'UPDATE datamanagement.customers SET current_address = $1 WHERE customer_id = $2',
                [current_address, loanDetails.customer_id]
            );
            logger.info(`[CUSTOMER] Updated current_address for customer_id '${loanDetails.customer_id}'.`);
        }
        const netAmountIssued = parseFloat(loanDetails.amount_issued) - parseFloat(loanDetails.processing_fee);
        const loanQuery = `
          INSERT INTO datamanagement.loan_details (loan_id, customer_id, interest_rate, due_date, loan_datetime, eligible_amount, amount_issued, loan_application_uuid, processing_fee,  net_amount_issued)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING loan_id;
        `;
        const loanResult = await client.query(loanQuery, [
            loanDetails.loan_id, loanDetails.customer_id, loanDetails.interest_rate, loanDetails.due_date,
            loanDetails.loan_datetime, loanDetails.eligible_amount, loanDetails.amount_issued, 
            loanDetails.loan_application_uuid, loanDetails.processing_fee,netAmountIssued
        ]);
        const newLoanId = loanResult.rows[0].loan_id;
        logger.info(`[LOAN] Intermediate step: Created loan detail with DB loan_id: ${newLoanId}.`);
        const files = req.files || [];
        for (let i = 0; i < ornaments.length; i++) {
            const ornament = ornaments[i];
            const file = files.find((f) => f.fieldname === `ornament_image_${i}`);
            const ornamentQuery = `
              INSERT INTO datamanagement.loan_ornament_details 
              (ornament_id, ornament_type, ornament_name, grams, karat, ornament_image, loan_id, material_type)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `;
            await client.query(ornamentQuery, [
                ornament.ornament_id, ornament.ornament_type, ornament.ornament_name,
                ornament.grams, ornament.karat, file ? file.buffer : null, newLoanId,ornament.material_type
            ]);
        }
        const startDate = new Date(loanDetails.loan_datetime);
        const endDate = new Date(loanDetails.due_date);
        let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months -= startDate.getMonth();
        months += endDate.getMonth();
        const totalMonths = months <= 0 ? 1 : months + 1;
        const monthlyPrincipal = parseFloat(netAmountIssued) / totalMonths;
        const monthlyInterest = (netAmountIssued * (parseFloat(loanDetails.interest_rate) / 100)) / 12;

        for (let i = 0; i < totalMonths; i++) {
            const paymentMonth = new Date(startDate);
            paymentMonth.setMonth(paymentMonth.getMonth() + i + 1);

            const paymentQuery = `
              INSERT INTO datamanagement.loan_payments 
              (loan_id, payment_month, principal_amount_due, interest_amount_due)
              VALUES ($1, $2, $3, $4);
            `;
            await client.query(paymentQuery, [
                newLoanId, 
                paymentMonth.toISOString().split("T")[0], 
                monthlyPrincipal.toFixed(2),
                monthlyInterest.toFixed(2)
            ]);
        }
        if (parseFloat(loanDetails.processing_fee) > 0) {
            const processingFeeLogQuery = `
                INSERT INTO datamanagement.processed_amounts 
                (user_id, processed_amount) 
                VALUES ($1, $2);
            `;
            await client.query(processingFeeLogQuery, [
                createdByUserId, 
                parseFloat(loanDetails.processing_fee)
            ]);
            logger.info(`[PROCESSING] Logged processing fee of ${loanDetails.processing_fee} for Loan ID ${newLoanId}, processed by User ID ${createdByUserId}.`);
        }
        await client.query("COMMIT");
        logger.info(`[LOAN] Successfully CREATED loan application with ID ${newLoanId}.`);
        res.status(201).json({ message: `Loan #${newLoanId} created successfully!`, newLoanId });
    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`[LOAN] Error CREATING loan: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during loan creation." });
    } finally {
        client.release();
    }
};

exports.getLoanById = async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) return res.status(400).json({ message: "Invalid Loan ID." });

    logger.info(`[LOAN] Request received to GET complete details for loan ID: ${id}`);
    try {
        const loanQuery = `
          SELECT 
              ld.*, -- All loan details
              c.*,  -- All customer details
              n.nominee_name, -- Specific nominee details
              n.nominee_mobile
          FROM 
              datamanagement.loan_details ld
          JOIN 
              datamanagement.customers c ON ld.customer_id = c.customer_id
          LEFT JOIN
              datamanagement.nominees n ON c.nominee_id = n.nominee_id
          WHERE 
              ld.loan_id = $1;
        `;
        const loanResult = await db.query(loanQuery, [parsedId]);

        if (loanResult.rows.length === 0) {
            logger.warn(`[LOAN] Get failed: Loan with ID '${id}' not found.`);
            return res.status(404).json({ message: "Loan not found." });
        }
        const loanData = loanResult.rows[0];
        const paymentsQuery = `SELECT * FROM datamanagement.loan_payments WHERE loan_id = $1 ORDER BY payment_month ASC;`;
        const paymentsResult = await db.query(paymentsQuery, [parsedId]);
        loanData.payments = paymentsResult.rows;
        const ornamentsQuery = `SELECT * FROM datamanagement.loan_ornament_details WHERE loan_id = $1;`;
        const ornamentsResult = await db.query(ornamentsQuery, [parsedId]);
        loanData.ornaments = ornamentsResult.rows;

        logger.info(`[LOAN] Successfully retrieved complete details for loan ID: ${id}`);
        res.json(loanData);
    } catch (error) {
        logger.error(`[LOAN] Error GETTING complete details for loan ID ${id}: ${error.message}`, { stack: error.stack });
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
    logger.info(`[LOAN] Attempting to RECORD PAYMENT for loan ID '${id}'. Principal: ${principal_payment}, Interest: ${interest_payment}.`);

    const parsedLoanId = parseInt(id, 10);
    const principalAmount = parseFloat(principal_payment) || 0;
    const interestAmount = parseFloat(interest_payment) || 0;

    if (isNaN(parsedLoanId) || (principalAmount <= 0 && interestAmount <= 0)) {
        logger.warn(`[LOAN] Payment validation failed for loan ID '${id}': Invalid ID or no positive payment amount provided.`);
        return res.status(400).json({ message: "Valid Loan ID and a positive payment amount are required." });
    }

    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");
        if (principalAmount > 0) {
            await client.query(
                `UPDATE datamanagement.loan_details SET principal_amount_paid = principal_amount_paid + $1, updated_on = CURRENT_TIMESTAMP WHERE loan_id = $2;`,
                [principalAmount, parsedLoanId]
            );
            logger.info(`[LOAN] Applied total principal payment of ${principalAmount} to loan ID '${id}'.`);
        }
        if (interestAmount > 0 || principalAmount > 0) {
            const installmentToUpdate = await client.query(
                `SELECT payment_id FROM datamanagement.loan_payments WHERE loan_id = $1 AND payment_status != 'Paid' ORDER BY payment_month ASC LIMIT 1`,
                [parsedLoanId]
            );

            if (installmentToUpdate.rows.length > 0) {
                const installmentId = installmentToUpdate.rows[0].payment_id;
                
                await client.query(
                    `UPDATE datamanagement.loan_payments SET
                       principal_amount_paid = principal_amount_paid + $1::DECIMAL,
                       interest_amount_paid = interest_amount_paid + $2::DECIMAL,
                       payment_status = CASE 
                                        WHEN (principal_amount_due + interest_amount_due) <= (principal_amount_paid + $1::DECIMAL + interest_amount_paid + $2::DECIMAL)
                                        THEN 'Paid' 
                                        ELSE 'Partial' 
                                      END,
                       payment_mode = $3, 
                       remarks = $4, 
                       payment_date = CURRENT_TIMESTAMP, 
                       updated_on = CURRENT_TIMESTAMP
                     WHERE payment_id = $5;`,
                    [principalAmount, interestAmount, payment_mode, remarks, installmentId]
                );
                logger.info(`[LOAN] Applied payment to installment ID '${installmentId}'. Principal: ${principalAmount}, Interest: ${interestAmount}.`);
            } else {
                 logger.warn(`[LOAN] No unpaid installments found for loan ID '${id}' to apply payment.`);
            }
        }
        const loanTotals = await client.query(
            "SELECT net_amount_issued, principal_amount_paid FROM datamanagement.loan_details WHERE loan_id = $1",
            [parsedLoanId]
        );

        const interestCheck = await client.query(
            "SELECT COUNT(*) FROM datamanagement.loan_payments WHERE loan_id = $1 AND payment_status != 'Paid'",
            [parsedLoanId]
        );

        const isPrincipalFullyPaid = parseFloat(loanTotals.rows[0].principal_amount_paid) >= parseFloat(loanTotals.rows[0].net_amount_issued);
        const hasNoPendingInstallments = parseInt(interestCheck.rows[0].count, 10) === 0;

        if (isPrincipalFullyPaid && hasNoPendingInstallments) {
            await client.query(
                "UPDATE datamanagement.loan_details SET completion_status = 'Completed' WHERE loan_id = $1",
                [parsedLoanId]
            );
            logger.info(`[LOAN] Loan ID '${id}' status changed to 'Completed' after final payment.`);
        }
        
        await client.query("COMMIT");
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
            ld.loan_id,
            c.customer_name,
            ld.amount_issued,
            ld.principal_amount_paid,
            (SELECT SUM(lp.interest_amount_paid) FROM datamanagement.loan_payments lp WHERE lp.loan_id = ld.loan_id) as interest_paid,
            ld.interest_rate,
            ld.due_date,
            ld.completion_status
          FROM 
            datamanagement.loan_details ld
          JOIN 
            datamanagement.customers c ON ld.customer_id = c.customer_id
          WHERE 
            ld.completion_status = 'Pending'
          ORDER BY 
            ld.due_date ASC;
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
            ld.loan_id,
            c.customer_name,
            ld.amount_issued,
            ld.principal_amount_paid,
            (SELECT SUM(lp.interest_amount_paid) FROM datamanagement.loan_payments lp WHERE lp.loan_id = ld.loan_id) as interest_paid,
            ld.interest_rate,
            ld.due_date,
            ld.completion_status
          FROM 
            datamanagement.loan_details ld
          JOIN 
            datamanagement.customers c ON ld.customer_id = c.customer_id
          WHERE 
            ld.completion_status = 'Completed'
          ORDER BY 
            ld.updated_on DESC;
        `;
        const result = await db.query(query);
        logger.info(`[LOAN] Successfully retrieved ${result.rows.length} CLOSED loans.`);
        res.json(result.rows);
    } catch (error){
        logger.error(`[LOAN] Error fetching CLOSED loans: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.getNextPaymentDue = async (req, res) => {
    const { id } = req.params;
    logger.info(`[LOAN] Request to GET next payment due for loan ID: ${id}`);
    try {
        const query = `
            SELECT 
                principal_amount_due, 
                principal_amount_paid,
                interest_amount_due,
                interest_amount_paid,
                payment_month
            FROM 
                datamanagement.loan_payments
            WHERE 
                loan_id = $1 AND payment_status != 'Paid'
            ORDER BY 
                payment_month ASC
            LIMIT 1;
        `;
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            logger.warn(`[LOAN] No pending payments found for loan ID: ${id}`);
            return res.status(404).json({ message: "No pending payments found for this loan." });
        }
        res.json(result.rows[0]);
    } catch (error) {
        logger.error(`[LOAN] Error fetching next payment due for loan ID ${id}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};