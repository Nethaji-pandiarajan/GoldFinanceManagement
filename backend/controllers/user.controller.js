const db = require("../db");
const { logger } = require("../config/logger"); 
exports.getUsersWithInvestments = async (req, res) => {
    logger.info(`[USER] Request received to GET all users with their investment amounts.`);
    try {
        const query = `
          SELECT 
              user_id, 
              user_name, 
              email,
              total_invested,
              investment_updated_by
          FROM 
              datamanagement.users
          ORDER BY 
              user_name;
        `;
        const result = await db.query(query);
        logger.info(`[USER] Successfully retrieved investment data for ${result.rows.length} users.`);
        res.json(result.rows);
    } catch (error){
        logger.error(`[USER] Error fetching users with investments: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while fetching data." });
    }
};

exports.updateUserInvestment = async (req, res) => {
    const updatedByUsername = req.user.username; 
    const { user_id, amount_to_add } = req.body;
    
    const action = amount_to_add >= 0 ? 'ADD' : 'REMOVE';
    logger.info(`[USER] Attempting to ${action} investment amount for user_id '${user_id}'. Amount: ${amount_to_add} by user '${updatedByUsername}'.`);

    const parsedUserId = parseInt(user_id, 10);
    const parsedAmount = parseFloat(amount_to_add);

    if (isNaN(parsedUserId) || isNaN(parsedAmount)) {
        logger.warn(`[USER] Validation failed for updating investment for user_id '${user_id}': Invalid user ID or amount.`);
        return res.status(400).json({ message: "Valid User ID and amount are required." });
    }

    try {
        const query = `
          UPDATE datamanagement.users 
          SET 
              total_invested = total_invested + $1,
              investment_updated_by = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE 
              user_id = $3
          RETURNING total_invested;
        `;
        const result = await db.query(query, [parsedAmount, updatedByUsername, parsedUserId]);

        if (result.rowCount === 0) {
            logger.warn(`[USER] Failed to update investment: User with ID '${parsedUserId}' not found.`);
            return res.status(404).json({ message: "User not found." });
        }
        
        logger.info(`[USER] Successfully updated investment for user_id '${parsedUserId}'. New total: ${result.rows[0].total_invested}.`);
        res.status(200).json({ 
            message: "Investment amount updated successfully!",
            newTotal: result.rows[0].total_invested
        });
    } catch (error) {
        logger.error(`[USER] Error updating investment for user_id '${parsedUserId}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during transaction." });
    }
};

exports.getMyProfile = async (req, res) => {
    const userId = req.user.id; 
    logger.info(`[USER] Request received to GET profile for user_id: ${userId}`);
    
    try {
        const result = await db.query(
            "SELECT user_id, first_name, last_name, user_name, email, date_of_birth, mobile_number, gender, role FROM datamanagement.users WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            logger.warn(`[USER] Failed to get profile: User with ID '${userId}' not found.`);
            return res.status(404).json({ message: "User not found." });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error(`[USER] Error fetching profile for user_id '${userId}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.updateMyProfile = async (req, res) => {
    const userId = req.user.id;
    const { first_name, last_name, email, date_of_birth, mobile_number, gender } = req.body;
    logger.info(`[USER] Attempting to UPDATE profile for user_id: ${userId}`);
    if (!first_name || !email) {
        logger.warn(`[USER] Profile update validation failed for user_id '${userId}': Missing required fields.`);
        return res.status(400).json({ message: "First name and email are required." });
    }

    try {
        const emailExists = await db.query(
            "SELECT user_id FROM datamanagement.users WHERE email = $1 AND user_id != $2",
            [email, userId]
        );

        if (emailExists.rows.length > 0) {
            logger.warn(`[USER] Profile update failed for user_id '${userId}': Email '${email}' is already in use.`);
            return res.status(409).json({ message: "This email address is already taken." });
        }
        
        const query = `
            UPDATE datamanagement.users SET
                first_name = $1, last_name = $2, email = $3, 
                date_of_birth = $4, mobile_number = $5, gender = $6
            WHERE user_id = $7
            RETURNING user_id, first_name, last_name, user_name, email, role;
        `;
        
        const result = await db.query(query, [
            first_name, last_name || null, email, date_of_birth || null,
            mobile_number || null, gender || null, userId
        ]);

        logger.info(`[USER] Successfully UPDATED profile for user_id: ${userId}`);
        res.status(200).json({ 
            message: "Profile updated successfully!",
            user: result.rows[0] 
        });
    } catch (error) {
        logger.error(`[USER] Error UPDATING profile for user_id '${userId}': ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};

exports.updateAllInvestments = async (req, res) => {
    const updatedByUsername = req.user.username;
    const { total_amount, action } = req.body; // 'action' will be 'add' or 'remove'
    
    logger.info(`[USER] Attempting to ${action.toUpperCase()} a total of ${total_amount} to all user investments by '${updatedByUsername}'.`);

    const parsedAmount = parseFloat(total_amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        logger.warn(`[USER] Bulk investment update failed: Invalid amount provided.`);
        return res.status(400).json({ message: "A valid positive amount is required." });
    }

    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");

        const usersResult = await client.query('SELECT user_id FROM datamanagement.users');
        const users = usersResult.rows;
        
        if (users.length === 0) {
            logger.warn(`[USER] Bulk investment update failed: No users found to distribute funds.`);
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "No users found to distribute investment." });
        }

        const amountPerUser = Math.floor(parsedAmount / users.length);
        let remainder = parsedAmount % users.length;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            let amountForThisUser = amountPerUser;
            // Distribute the remainder, 1 unit at a time, to the first few users
            if (remainder > 0) {
                amountForThisUser += 1;
                remainder--;
            }

            const finalAmount = action === 'add' ? amountForThisUser : -amountForThisUser;

            const updateQuery = `
                UPDATE datamanagement.users 
                SET 
                    total_invested = total_invested + $1,
                    investment_updated_by = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $3;
            `;
            await client.query(updateQuery, [finalAmount, updatedByUsername, user.user_id]);
        }
        
        await client.query("COMMIT");
        logger.info(`[USER] Successfully performed a bulk investment ${action} by '${updatedByUsername}'.`);
        res.status(200).json({ message: `Investment amount distributed successfully across ${users.length} users!` });

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`[USER] Error during bulk investment update: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during the bulk transaction." });
    } finally {
        client.release();
    }
};