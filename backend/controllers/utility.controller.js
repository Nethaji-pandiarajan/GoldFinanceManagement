const db = require("../db");

exports.checkEmail = async (req, res) => {
    const { email, customerUuid } = req.body;
    if (!email) {
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
        res.json({ exists: result.rows.length > 0 });
    } catch (error) {
        console.error("Error checking email:", error);
        res.status(500).json({ message: "Server error while checking email." });
    }
};

exports.checkPhone = async (req, res) => {
    const { phone, customerUuid } = req.body;
    if (!phone) {
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
        res.json({ exists: result.rows.length > 0 });
    } catch (error) {
        console.error("Error checking phone number:", error);
        res.status(500).json({ message: "Server error while checking phone number." });
    }
};

exports.getCustomersList = async (req, res) => {
    try {
        const result = await db.query("SELECT customer_id, customer_name FROM datamanagement.customers ORDER BY customer_name");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
};