const db = require("../db");
const logger = require("../config/logger");
exports.checkEmail = async (req, res) => {
    const { email, customerUuid } = req.body;
    const context = customerUuid ? `(excluding customer UUID: ${customerUuid})` : '(new customer)';
    logger.info(`[UTILITY] Checking if email exists: ${email} ${context}`);
    if (!email) {
        logger.warn(`[UTILITY] Email check failed: No email provided in request.`);
        return res.status(400).json({ message: "Email is required." });
    }
    try {
        let query;
        let params;
        if (customerUuid) {
            query = "SELECT 1 FROM datamanagement.customers WHERE email = $1 AND customer_uuid != $2";
            params = [email, customerUuid];
        } else {
            query = "SELECT 1 FROM datamanagement.customers WHERE email = $1";
            params = [email];
        }
        const result = await db.query(query, params);
        logger.info(`[UTILITY] Email check for '${email}' completed. Exists: ${exists}`);
        res.json({ exists: result.rows.length > 0 });
    } catch (error) {
        logger.error(`[UTILITY] Error checking email '${email}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while checking email." });
    }
};

exports.checkPhone = async (req, res) => {
    const { phone, customerUuid } = req.body;
    const context = customerUuid ? `(excluding customer UUID: ${customerUuid})` : '(new customer)';
    logger.info(`[UTILITY] Checking if phone number exists: ${phone} ${context}`);
    if (!phone) {
        logger.warn(`[UTILITY] Phone check failed: No phone number provided in request.`);
        return res.status(400).json({ message: "Phone number is required." });
    }
    try {
        let query;
        let params;
        if (customerUuid) {
            query = "SELECT 1 FROM datamanagement.customers WHERE phone = $1 AND customer_uuid != $2";
            params = [phone, customerUuid];
        } else {
            query = "SELECT 1 FROM datamanagement.customers WHERE phone = $1";
            params = [phone];
        }
        const result = await db.query(query, params);
        logger.info(`[UTILITY] Phone check for '${phone}' completed. Exists: ${exists}`);
        res.json({ exists: result.rows.length > 0 });
    } catch (error) {
        logger.error(`[UTILITY] Error checking phone number '${phone}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while checking phone number." });
    }
};

exports.getCustomersList = async (req, res) => {
    logger.info(`[UTILITY] Request received for customer dropdown list.`);
    try {
        const result = await db.query("SELECT customer_id, customer_name FROM datamanagement.customers ORDER BY customer_name");
        logger.info(`[UTILITY] Successfully retrieved customer list with ${result.rows.length} entries.`);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[UTILITY] Error fetching customer list: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.getNomineesList = async (req, res) => {
    logger.info(`[UTILITY] Request received for nominee dropdown list.`);
    try {
        const result = await db.query(
            "SELECT nominee_id, nominee_name, nominee_mobile FROM datamanagement.nominees ORDER BY nominee_name"
        );
        const formattedNominees = result.rows.map(n => ({
            id: n.nominee_id,
            name: n.nominee_name,
            phone: n.nominee_mobile
        }));
        logger.info(`[UTILITY] Successfully retrieved nominee list with ${formattedNominees.length} entries.`);
        res.json(formattedNominees);
    } catch (error) {
        logger.error(`[UTILITY] Error fetching nominee list: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};