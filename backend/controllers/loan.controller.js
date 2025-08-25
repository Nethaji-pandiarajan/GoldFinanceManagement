const db = require("../db");
const logger = require("../config/logger");
const axios = require('axios');
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
        const karatRatesRes = await db.query('SELECT karat_name, today_rate FROM datamanagement.gold_rate');
        
        const responseData = {
            goldRates: karatRatesRes.rows,
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
    if (!loanDetails.customer_id) {
        logger.warn(`[LOAN] Create loan failed: Missing customer_id.`);
        return res.status(400).json({ message: "A customer must be selected." });
    }
    if (!loanDetails.scheme_id) {
        logger.warn(`[LOAN] Create loan failed: Missing scheme_id.`);
        return res.status(400).json({ message: "A scheme must be selected." });
    }
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
        const netAmountIssued = parseFloat(loanDetails.amount_issued);
        const loanQuery = `
          INSERT INTO datamanagement.loan_details (loan_id, customer_id, interest_rate, current_interest_rate, due_date, loan_datetime, eligible_amount, amount_issued, loan_application_uuid, processing_fee,  net_amount_issued ,scheme_id, loan_to_value )
          VALUES ($1, $2, $3, $3 , $4, $5, $6, $7, $8, $9, $10 , $11, $12) RETURNING loan_id;
        `;
        const loanResult = await client.query(loanQuery, [
            loanDetails.loan_id, loanDetails.customer_id, loanDetails.interest_rate, loanDetails.due_date,
            loanDetails.loan_datetime, loanDetails.eligible_amount, loanDetails.amount_issued, 
            loanDetails.loan_application_uuid, loanDetails.processing_fee,netAmountIssued, 
            loanDetails.scheme_id, loanDetails.loan_to_value
        ]);
        const newLoanId = loanResult.rows[0].loan_id;
        logger.info(`[LOAN] Intermediate step: Created loan detail with DB loan_id: ${newLoanId}.`);
        const files = req.files || [];
        for (let i = 0; i < ornaments.length; i++) {
            const ornament = ornaments[i];
            const file = files.find((f) => f.fieldname === `ornament_image_${i}`);
            const ornamentQuery = `
              INSERT INTO datamanagement.loan_ornament_details 
              (ornament_id, ornament_type, ornament_name, grams, -- Keep the original grams column
               quantity, gross_weight, stone_weight, net_weight, 
               karat, ornament_image, loan_id, material_type)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
            `;
            await client.query(ornamentQuery, [
                ornament.ornament_id, ornament.ornament_type, ornament.ornament_name,
                ornament.grams,
                ornament.quantity, ornament.gross_weight, ornament.stone_weight, ornament.net_weight,
                ornament.karat, file ? file.buffer : null, newLoanId, ornament.material_type
            ]);
        }
        const startDate = new Date(loanDetails.loan_datetime);
        const principalAmount = parseFloat(loanDetails.amount_issued);
        const annualRate = parseFloat(loanDetails.interest_rate);
        const firstPaymentDate = new Date(startDate);
        firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
        let interestForFirstInstallment = 0;
        if (principalAmount > 0 && annualRate > 0) {
            const perdayInterestAmount = (principalAmount * (annualRate / 100)) / 365;
            interestForFirstInstallment = perdayInterestAmount * 15 ;
        }
        logger.info(`[LOAN] Creating first installment with special 15-day interest: ${interestForFirstInstallment.toFixed(2)}`);
        const paymentQuery = `
          INSERT INTO datamanagement.loan_payments 
          (loan_id, payment_month, loan_balance, interest_amount_due, payment_status, remarks, is_active)
          VALUES ($1, $2, $3, $4, 'Pending', 'First Installment', TRUE);
        `;
        await client.query(paymentQuery, [
            newLoanId, 
            firstPaymentDate.toISOString().split("T")[0], 
            principalAmount.toFixed(2),
            interestForFirstInstallment.toFixed(2)
        ]);
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
        const paymentsQuery = `
            SELECT * FROM datamanagement.loan_payments 
            WHERE 
                loan_id = $1 
                AND DATE_TRUNC('month', payment_month) <= DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') 
            ORDER BY 
                payment_month ASC;
        `;
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
    const principalPaid = parseFloat(principal_payment) || 0;
    const interestPaid = parseFloat(interest_payment) || 0;

    if (isNaN(parsedLoanId) || (principalPaid <= 0 && interestPaid <= 0)) {
        return res.status(400).json({ message: "Valid Loan ID and a positive payment amount are required." });
    }

    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");
        const allPendingInstallmentsRes = await client.query(
            `SELECT * FROM datamanagement.loan_payments 
             WHERE loan_id = $1 AND payment_status = 'Pending'  AND is_active = TRUE
             ORDER BY payment_month ASC`,
            [parsedLoanId]
        );
        const allPendingInstallments = allPendingInstallmentsRes.rows;

        if (allPendingInstallments.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "No pending payments found for this loan." });
        }
        
        const currentInstallment = allPendingInstallments[0];
        const isLastInstallment = allPendingInstallments.length === 1;
        
        const currentBalance = parseFloat(currentInstallment.loan_balance);
        const interestDueThisMonth = parseFloat(currentInstallment.interest_amount_due);
        await client.query(
            `UPDATE datamanagement.loan_payments
             SET principal_amount_paid = $1, interest_amount_paid = $2,
                 payment_status = 'Paid', payment_mode = $3, remarks = $4, payment_date = CURRENT_TIMESTAMP
             WHERE payment_id = $5;`,
            [principalPaid, interestPaid, payment_mode, remarks, currentInstallment.payment_id]
        );

        await client.query(
            `UPDATE datamanagement.loan_details 
             SET principal_amount_paid = principal_amount_paid + $1
             WHERE loan_id = $2;`,
            [principalPaid, parsedLoanId]
        );

        const newBalance = currentBalance - principalPaid;
        logger.info(`[LOAN] New balance for Loan ID '${id}' is ${newBalance.toFixed(2)}.`);

        if (newBalance <= 0.01 && interestPaid >= interestDueThisMonth) {
            logger.info(`[LOAN] Early closure for Loan ID '${id}'.`);
            await client.query(`DELETE FROM datamanagement.loan_payments WHERE loan_id = $1 AND payment_status = 'Pending'  AND is_active = TRUE;`, [parsedLoanId]);
            await client.query(`UPDATE datamanagement.loan_details SET completion_status = 'Completed' WHERE loan_id = $1`, [parsedLoanId]);

        } else if (isLastInstallment && newBalance > 0.01) {
            logger.info(`[LOAN] Extending loan for Loan ID '${id}' with remaining balance ${newBalance.toFixed(2)}.`);
            const loanDetailsRes = await client.query(`SELECT current_interest_rate FROM datamanagement.loan_details WHERE loan_id = $1`, [parsedLoanId]);
            const currentRate = parseFloat(loanDetailsRes.rows[0].current_interest_rate);
            const newMonthlyInterest = (newBalance * (currentRate / 100)) / 12;
            
            const nextMonth = new Date(currentInstallment.payment_month);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            await client.query(
                `INSERT INTO datamanagement.loan_payments
                 (loan_id, payment_month, loan_balance, interest_amount_due, payment_status, remarks , is_active)
                 VALUES ($1, $2, $3, $4, 'Pending', 'Extended Installment', TRUE);`,
                [parsedLoanId, nextMonth.toISOString().split('T')[0], newBalance.toFixed(2), newMonthlyInterest.toFixed(2)]
            );
            await client.query(`UPDATE datamanagement.loan_details SET due_date = $1 WHERE loan_id = $2`, [nextMonth.toISOString().split('T')[0], parsedLoanId]);
            logger.info(`[LOAN] Created new installment for Loan ID '${id}'.`);

        } else if (newBalance > 0.01) {
            const nextInstallment = allPendingInstallments[1];
            if (nextInstallment) {
                await client.query(
                    `UPDATE datamanagement.loan_payments SET loan_balance = $1 WHERE payment_id = $2 AND is_active= TRUE;`,
                    [newBalance.toFixed(2), nextInstallment.payment_id]
                );
                logger.info(`[LOAN] Rolled over balance to next installment #${nextInstallment.payment_id}.`);
            }
        }
        
        await client.query("COMMIT");
        res.status(200).json({ message: "Payment recorded successfully!" });

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`[LOAN] Error RECORDING PAYMENT for Loan ID '${id}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while recording payment." });
    } finally {
        client.release();
    }
};

exports.getPendingLoans = async (req, res) => {
    logger.info(`[LOAN] Request received to GET all PENDING loans with details.`);
    try {
        const query = `
          SELECT
            ld.loan_id,
            c.customer_name,
            c.phone,
            ld.amount_issued,
            ld.principal_amount_paid,
            ld.interest_rate,
            ld.due_date,
            -- Columns from our LATERAL JOIN
            next_payment.payment_month as next_payment_month,
            -- FIX: Use the new 'loan_balance' column for the principal due
            next_payment.loan_balance as principal_due,
            -- FIX: The interest_amount_due is the full amount, no need to subtract
            next_payment.interest_amount_due as interest_due
          FROM 
            datamanagement.loan_details ld
          JOIN 
            datamanagement.customers c ON ld.customer_id = c.customer_id
          -- Use a LATERAL JOIN to get the next ACTIVE pending payment
          JOIN LATERAL (
              SELECT *
              FROM datamanagement.loan_payments lp
              WHERE lp.loan_id = ld.loan_id AND lp.payment_status = 'Pending' AND lp.is_active = TRUE
              ORDER BY lp.payment_month ASC
              LIMIT 1
          ) AS next_payment ON TRUE
          WHERE 
            ld.completion_status = 'Pending'
          ORDER BY 
            next_payment.payment_month ASC;
        `;
        const result = await db.query(query);
        logger.info(`[LOAN] Successfully retrieved ${result.rows.length} PENDING loans with details.`);
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
                loan_balance, 
                principal_amount_paid,
                interest_amount_due,
                interest_amount_paid,
                payment_month
            FROM 
                datamanagement.loan_payments
            WHERE 
                loan_id = $1 AND payment_status != 'Paid' AND is_active = TRUE
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

exports.sendPaymentReminder = async (req, res) => {
    const { loan_id } = req.params;
    const { customer_name, phone, amount_due, interest_due } = req.body;
    logger.info(`[LOAN] Attempting to send payment reminder for Loan ID #${loan_id} to ${customer_name}.`);

    if (!customer_name || !phone || !amount_due || !interest_due) {
        return res.status(400).json({ message: "Customer name, phone, amount due, and interest due are required." });
    }

    const mobileNumber = `91${phone.slice(-10)}`;
    const totalDue = (parseFloat(amount_due) + parseFloat(interest_due)).toFixed(2);

    const msg91ApiUrl = `https://api.msg91.com/api/v5/flow/`;

    const payload = {
        template_id: process.env.MSG91_PAYMENT_REMINDER_TEMPLATE_ID,
        sender: "YOUR_SENDER_ID",
        short_url: "1",
        mobiles: mobileNumber,
        name: customer_name,
        loanid: loan_id,
        amount: totalDue
    };

    try {
        const response = await axios.post(msg91ApiUrl, payload, {
            headers: { 'authkey': process.env.MSG91_AUTH_KEY }
        });

        if (response.data.type === 'success') {
            logger.info(`[LOAN] Successfully sent reminder for Loan ID #${loan_id}.`);
            res.status(200).json({ message: "Payment reminder sent successfully." });
        } else {
            throw new Error(response.data.message || 'MSG91 API error');
        }
    } catch (error) {
        logger.error(`[LOAN] Failed to send reminder for Loan ID #${loan_id}: ${error.message}`);
        res.status(500).json({ message: "Failed to send payment reminder." });
    }
};