//authcontroller.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { logger } = require("../config/logger");
exports.verifyPassword = async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;
    logger.info(`[AUTH] Password verification attempt for user ID: ${userId}.`);
    if (!password) {
        return res.status(400).json({ message: "Password is required for verification." });
    }
    try {
        const userResult = await db.query("SELECT password FROM datamanagement.users WHERE user_id = $1", [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        
        const hashedPassword = userResult.rows[0].password;
        const isMatch = await bcrypt.compare(password, hashedPassword);

        if (!isMatch) {
            logger.warn(`[AUTH] Password verification FAILED for user ID: ${userId}.`);
            return res.status(401).json({ message: "Incorrect password." });
        }

        logger.info(`[AUTH] Password verification SUCCESSFUL for user ID: ${userId}.`);
        res.json({ success: true, message: "Password verified." });

    } catch (error) {
        logger.error(`[AUTH] Error during password verification for user ID ${userId}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during password verification." });
    }
};

exports.verifyLicense = async (req, res) => {
    const { cpu_brand, mac_address } = req.body;
    
    logger.info(`[LICENSE] Received license verification request for CPU: '${cpu_brand}', MAC: '${mac_address}'.`);

    if (!cpu_brand || !mac_address) {
        logger.warn(`[LICENSE] Verification failed: Missing CPU or MAC address in request.`);
        return res.status(400).json({ message: "CPU brand and MAC address are required." });
    }

    try {
        const query = "SELECT 1 FROM datamanagement.allowed_machines WHERE cpu_serial = $1 AND mac_address = $2";
        const result = await db.query(query, [cpu_brand, mac_address]);

        const isAllowed = result.rows.length > 0;

        if (isAllowed) {
            logger.info(`[LICENSE] Verification SUCCESSFUL for MAC: '${mac_address}'.`);
        } else {
            logger.warn(`[LICENSE] Verification FAILED for MAC: '${mac_address}'. Machine not found in allowed list.`);
        }

        res.json({ isLicensed: isAllowed });
        
    } catch (error) {
        logger.error(`[LICENSE] Error during license verification: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error during license verification." });
    }
};
exports.signup = async (req, res) => {
  const {
    first_name, last_name, user_name, email, password,
    date_of_birth, mobile_number, gender, role,
  } = req.body;
  logger.info(`[AUTH] Attempting to SIGNUP new user with username: '${user_name}' and email: '${email}'.`);
  if (!user_name || !email || !password || !first_name || !role) {
    logger.warn(`[AUTH] Signup validation failed for '${user_name}': Missing required fields.`);
    return res.status(400).json({ message: "Please provide all required fields, including a role." });
  }
  
  try {
    const userExists = await db.query(
      "SELECT * FROM datamanagement.users WHERE email = $1 OR user_name = $2",
      [email, user_name]
    );
    if (userExists.rows.length > 0) {
      logger.warn(`[AUTH] Signup failed for '${user_name}': User with this email or username already exists.`);
      return res.status(409).json({ message: "User with this email or username already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO datamanagement.users (first_name, last_name, user_name, email, password, date_of_birth, mobile_number, gender, role) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING user_id, email, user_name
    `;
    const newUser = await db.query(insertQuery, [
      first_name, last_name || null, user_name, email, hashedPassword,
      date_of_birth || null, mobile_number || null, gender || null, role,
    ]);
    logger.info(`[AUTH] Successfully SIGNED UP user '${user_name}' with role '${role}'.`);
    res.status(201).json({
      message: "User created successfully! You can now log in.",
      user: newUser.rows[0],
    });
  } catch (error) {
    logger.error(`[AUTH] Error during SIGNUP for user '${user_name}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error during registration." });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  logger.info(`[AUTH] Attempting to LOGIN with identifier: '${identifier}'.`);
  if (!identifier || !password) {
    logger.warn(`[AUTH] Login validation failed for '${identifier}': Missing identifier or password.`);
    return res.status(400).json({ message: "Please provide email/username and password." });
  }

  try {
    const result = await db.query(
      "SELECT * FROM datamanagement.users WHERE email = $1 OR user_name = $1",
      [identifier]
    );
    const user = result.rows[0];

    if (!user) {
      logger.warn(`[AUTH] Login failed for identifier '${identifier}': User not found.`);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`[AUTH] Login failed for user '${user.user_name}': Invalid password.`);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const payload = { user: { id: user.user_id, username: user.user_name, role: user.role , firstName: user.first_name } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
    logger.info(`[AUTH] Successfully LOGGED IN user '${user.user_name}' (Role: ${user.role}).`);
    res.json({ token });
  } catch (error) {
    logger.error(`[AUTH] Error during LOGIN for identifier '${identifier}': ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error during login." });
  }
};