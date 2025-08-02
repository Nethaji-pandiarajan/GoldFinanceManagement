// my-travel-app-backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); 

app.post('/api/auth/signup', async (req, res) => {
  // Destructure all new fields from the request body
  const {
    first_name,
    last_name,
    user_name,
    email,
    password,
    date_of_birth,
    mobile_number,
    gender
  } = req.body;

  // Basic validation for required fields remains the same
  if (!user_name || !email || !password || !first_name) {
    return res.status(400).json({ message: 'First name, username, email, and password are required.' });
  }

  try {
    const userExists = await db.query('SELECT * FROM datamanagement.users WHERE email = $1 OR user_name = $2', [email, user_name]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email or username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // UPDATED SQL QUERY to include all the new fields
    const insertQuery = `
      INSERT INTO datamanagement.users 
        (first_name, last_name, user_name, email, password, date_of_birth, mobile_number, gender, role) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING user_id, email, user_name
    `;

    // UPDATED parameters array to match the query. Use || null to handle optional fields gracefully.
    const newUser = await db.query(insertQuery, [
      first_name,
      last_name || null,
      user_name,
      email,
      hashedPassword,
      date_of_birth || null,
      mobile_number || null,
      gender || null,
      'user' // Default role
    ]);

    res.status(201).json({
      message: 'User created successfully! You can now log in.',
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Please provide email/username and password.' });
  }

  try {    const result = await db.query('SELECT * FROM datamanagement.users WHERE email = $1 OR user_name = $1', [identifier]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const payload = {
      user: {
        id: user.user_id,
        username: user.user_name,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});


app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});