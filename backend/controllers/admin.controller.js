// backend/controllers/admin.controller.js
const db = require("../db");
const logger = require("../config/logger");

exports.getAllUsers = async (req, res) => {
    logger.info(`[ADMIN] Super admin '${req.user.username}' requested to GET all users.`);
    try {
        const result = await db.query(
            `SELECT 
                user_id, first_name, last_name, user_name, email, role, 
                date_of_birth, gender, mobile_number 
             FROM datamanagement.users 
             WHERE user_id != $1 
             ORDER BY user_id ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        logger.error(`[ADMIN] Error fetching all users: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while fetching users." });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, role, date_of_birth, gender, mobile_number } = req.body;
    const adminUsername = req.user.username;

    logger.info(`[ADMIN] Super admin '${adminUsername}' attempting to UPDATE user ID: ${id}.`);

    if (!first_name || !email || !role) {
        return res.status(400).json({ message: "First name, email, and role are required." });
    }

    try {
        const query = `
            UPDATE datamanagement.users
            SET first_name = $1, last_name = $2, email = $3, role = $4, 
                date_of_birth = $5, gender = $6, mobile_number = $7, 
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $8
            RETURNING user_id, first_name, last_name, user_name, email, role;
        `;
        const result = await db.query(query, [
            first_name, last_name || null, email, role, 
            date_of_birth || null, gender || null, mobile_number || null,
            id
        ]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        logger.info(`[ADMIN] Successfully UPDATED user ID: ${id}.`);
        res.json({ message: "User updated successfully!", user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            logger.warn(`[ADMIN] Update failed for user ID ${id}: Email '${email}' already exists.`);
            return res.status(409).json({ message: "This email address is already in use by another account." });
        }
        logger.error(`[ADMIN] Error updating user ID ${id}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during user update." });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const adminUsername = req.user.username;

    logger.info(`[ADMIN] Super admin '${adminUsername}' attempting to DELETE user ID: ${id}.`);

    if (parseInt(id, 10) === req.user.id) {
        logger.warn(`[ADMIN] Self-deletion attempt by super admin '${adminUsername}'. Action denied.`);
        return res.status(403).json({ message: "You cannot delete your own account." });
    }

    try {
        const result = await db.query("DELETE FROM datamanagement.users WHERE user_id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        
        logger.info(`[ADMIN] Successfully DELETED user ID: ${id}.`);
        res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        logger.error(`[ADMIN] Error deleting user ID ${id}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error while deleting user." });
    }
};