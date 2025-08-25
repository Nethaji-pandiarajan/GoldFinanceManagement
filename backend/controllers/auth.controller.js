//authcontroller.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const logger = require("../config/logger");

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