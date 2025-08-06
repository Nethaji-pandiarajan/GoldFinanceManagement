//server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); 

app.post('/api/auth/signup', async (req, res) => {
  const {
    first_name,
    last_name,
    user_name,
    email,
    password,
    date_of_birth,
    mobile_number,
    gender,
    role
  } = req.body;

  if (!user_name || !email || !password || !first_name || !role) {
    return res.status(400).json({ message: 'Please provide all required fields, including a role.' });
  }

  try {
    const userExists = await db.query('SELECT * FROM datamanagement.users WHERE email = $1 OR user_name = $2', [email, user_name]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email or username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO datamanagement.users 
        (first_name, last_name, user_name, email, password, date_of_birth, mobile_number, gender, role) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING user_id, email, user_name
    `;

    const newUser = await db.query(insertQuery, [
      first_name,
      last_name || null,
      user_name,
      email,
      hashedPassword,
      date_of_birth || null,
      mobile_number || null,
      gender || null,
      role 
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
app.get('/api/customers', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.customer_uuid,
        c.customer_name,
        c.phone AS phone_number,
        c.gender,
        c.date_of_birth AS dob,
        n.nominee_name,
        n.nominee_mobile
      FROM 
        datamanagement.customers c
      LEFT JOIN 
        datamanagement.nominees n ON c.nominee_id = n.nominee_id
      ORDER BY 
        c.created_on DESC
    `;
    const customers = await db.query(query);
    res.json(customers.rows);
  } catch (error){
    console.error('Error fetching customer details:', error);
    res.status(500).json({ message: 'Server error while fetching customers.' });
  }
});
app.post(
  '/api/customers',
  upload.fields([
    { name: 'customer_image', maxCount: 1 },
    { name: 'proof_image', maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      customer_name, email, phone, gender, description, address,
      government_proof, proof_id, date_of_birth,
      nominee_name, nominee_mobile, nominee_relationship, nominee_age, nominee_gender
    } = req.body;
    const customerImageFile = req.files['customer_image'] ? req.files['customer_image'][0] : null;
    const proofImageFile = req.files['proof_image'] ? req.files['proof_image'][0] : null;

    if (!customer_name || !nominee_name) {
      return res.status(400).json({ message: 'Customer and Nominee names are required.' });
    }
    
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const nomineeQuery = `
        INSERT INTO datamanagement.nominees (nominee_name, nominee_mobile, nominee_relationship, nominee_age, nominee_gender, nominee_uuid)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING nominee_id; 
      `;
      const nomineeResult = await client.query(nomineeQuery, [
        nominee_name, nominee_mobile || null, nominee_relationship || null,
        nominee_age || null, nominee_gender || null, uuidv4()
      ]);
      const newNomineeId = nomineeResult.rows[0].nominee_id;

      const customerQuery = `
        INSERT INTO datamanagement.customers (
          customer_name, customer_image, email, phone, gender, description, address, 
          government_proof, proof_id, proof_image, date_of_birth, nominee_id, customer_uuid
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
      `;
      await client.query(customerQuery, [
        customer_name,
        customerImageFile ? customerImageFile.buffer : null,
        email, phone, gender || null, description || null, address || null,
        government_proof || null, proof_id || null,
        proofImageFile ? proofImageFile.buffer : null,
        date_of_birth || null, newNomineeId, uuidv4()
      ]);

      await client.query('COMMIT');
      res.status(201).json({ message: 'Customer created successfully!' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating customer:', error);
      res.status(500).json({ message: 'Server error during customer creation.' });
    } finally {
      client.release();
    }
  }
);
app.get('/api/customers/:uuid', async (req, res) => {
  const { uuid } = req.params;
  try {
    const query = `
      SELECT 
        c.*, -- Select all columns from customers
        n.*  -- Select all columns from nominees
      FROM 
        datamanagement.customers c
      LEFT JOIN 
        datamanagement.nominees n ON c.nominee_id = n.nominee_id
      WHERE 
        c.customer_uuid = $1;
    `;
    const result = await db.query(query, [uuid]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching single customer:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});
app.delete('/api/customers/:uuid', async (req, res) => {
  const { uuid } = req.params;
  try {
    const result = await db.query('DELETE FROM datamanagement.customers WHERE customer_uuid = $1', [uuid]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.status(200).json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});
app.put(
  '/api/customers/:uuid',
  upload.fields([
    { name: 'customer_image', maxCount: 1 },
    { name: 'proof_image', maxCount: 1 },
  ]),
  async (req, res) => {
    const { uuid } = req.params;
    const {
      customer_name, email, phone, gender, description, address,
      government_proof, proof_id, date_of_birth, nominee_id,
      nominee_name, nominee_mobile, nominee_relationship, nominee_age, nominee_gender
    } = req.body;
    
    const customerImageFile = req.files['customer_image'] ? req.files['customer_image'][0] : null;
    const proofImageFile = req.files['proof_image'] ? req.files['proof_image'][0] : null;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const parsedNomineeId = parseInt(nominee_id, 10);
      if (!isNaN(parsedNomineeId)) {
        const parsedNomineeAge = nominee_age ? parseInt(nominee_age, 10) : null;

        const nomineeQuery = `
          UPDATE datamanagement.nominees SET
            nominee_name = $1, nominee_mobile = $2, nominee_relationship = $3, nominee_age = $4, nominee_gender = $5
          WHERE nominee_id = $6;
        `;
        await client.query(nomineeQuery, [
          nominee_name, nominee_mobile, nominee_relationship, 
          isNaN(parsedNomineeAge) ? null : parsedNomineeAge,
          nominee_gender, 
          parsedNomineeId
        ]);
      }
      const customerQuery = `
        UPDATE datamanagement.customers SET
          customer_name = $1, email = $2, phone = $3, gender = $4, description = $5, address = $6,
          government_proof = $7, proof_id = $8, date_of_birth = $9,
          customer_image = COALESCE($10, customer_image),
          proof_image = COALESCE($11, proof_image),
          updated_on = CURRENT_TIMESTAMP
        WHERE customer_uuid = $12;
      `;
      await client.query(customerQuery, [
        customer_name, email, phone, gender, description, address,
        government_proof, proof_id, date_of_birth,
        customerImageFile ? customerImageFile.buffer : null,
        proofImageFile ? proofImageFile.buffer : null,
        uuid
      ]);
      await client.query('COMMIT');
      res.status(200).json({ message: 'Customer updated successfully!' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating customer:', error);
      res.status(500).json({ message: 'Server error during update.' });
    } finally {
      client.release();
    }
  }
);

app.get('/api/ornaments', async (req, res) => {
  try {
    const result = await db.query('SELECT ornament_id, ornament_type, ornament_name, description FROM datamanagement.ornament_details ORDER BY created_on DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ornaments:', error);
    res.status(500).json({ message: 'Server error while fetching ornaments.' });
  }
});

app.post('/api/ornaments', async (req, res) => {
  const { ornament_type, ornament_name, description } = req.body;

  if (!ornament_type || !ornament_name) {
    return res.status(400).json({ message: 'Ornament type and name are required.' });
  }

  try {
    const query = `
      INSERT INTO datamanagement.ornament_details (ornament_type, ornament_name, description)
      VALUES ($1, $2, $3)
      RETURNING ornament_id;
    `;
    await db.query(query, [ornament_type, ornament_name, description || null]);
    res.status(201).json({ message: 'Ornament created successfully!' });
  } catch (error) {
    console.error('Error creating ornament:', error);
    res.status(500).json({ message: 'Server error during ornament creation.' });
  }
});
app.put('/api/ornaments/:id', async (req, res) => {
  const { id } = req.params;
  const { ornament_type, ornament_name, description } = req.body;
  
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: 'Invalid ornament ID.' });
  }

  if (!ornament_type || !ornament_name) {
    return res.status(400).json({ message: 'Ornament type and name are required.' });
  }

  try {
    const query = `
      UPDATE datamanagement.ornament_details SET
        ornament_type = $1, ornament_name = $2, description = $3, updated_on = CURRENT_TIMESTAMP
      WHERE ornament_id = $4;
    `;
    const result = await db.query(query, [ornament_type, ornament_name, description || null, parsedId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Ornament not found.' });
    }
    res.status(200).json({ message: 'Ornament updated successfully!' });
  } catch (error) {
    console.error('Error updating ornament:', error);
    res.status(500).json({ message: 'Server error during update.' });
  }
});
app.delete('/api/ornaments/:id', async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({ message: 'Invalid ornament ID.' });
  }

  try {
    const result = await db.query('DELETE FROM datamanagement.ornament_details WHERE ornament_id = $1', [parsedId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Ornament not found.' });
    }
    res.status(200).json({ message: 'Ornament deleted successfully.' });
  } catch (error) {
    console.error('Error deleting ornament:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});
app.get('/api/karats', async (req, res) => {
  try {
    const result = await db.query('SELECT karat_id, karat_name, loan_percentage, description FROM datamanagement.gold_karat_details ORDER BY created_on DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gold karats:', error);
    res.status(500).json({ message: 'Server error while fetching karats.' });
  }
});

app.post('/api/karats', async (req, res) => {
  const { karat_name, loan_percentage, description } = req.body;

  if (!karat_name || loan_percentage === undefined) {
    return res.status(400).json({ message: 'Karat name and loan percentage are required.' });
  }

  try {
    const query = `
      INSERT INTO datamanagement.gold_karat_details (karat_name, loan_percentage, description)
      VALUES ($1, $2, $3);
    `;
    await db.query(query, [karat_name, loan_percentage, description || null]);
    res.status(201).json({ message: 'Gold karat detail created successfully!' });
  } catch (error) {
    console.error('Error creating gold karat:', error);
    res.status(500).json({ message: 'Server error during creation.' });
  }
});

app.put('/api/karats/:id', async (req, res) => {
  const { id } = req.params;
  const { karat_name, loan_percentage, description } = req.body;
  
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: 'Invalid karat ID.' });
  }

  if (!karat_name || loan_percentage === undefined) {
    return res.status(400).json({ message: 'Karat name and loan percentage are required.' });
  }

  try {
    const query = `
      UPDATE datamanagement.gold_karat_details SET
        karat_name = $1, loan_percentage = $2, description = $3, updated_on = CURRENT_TIMESTAMP
      WHERE karat_id = $4;
    `;
    const result = await db.query(query, [karat_name, loan_percentage, description || null, parsedId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Karat detail not found.' });
    }
    res.status(200).json({ message: 'Karat detail updated successfully!' });
  } catch (error) {
    console.error('Error updating gold karat:', error);
    res.status(500).json({ message: 'Server error during update.' });
  }
});

app.delete('/api/karats/:id', async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({ message: 'Invalid karat ID.' });
  }

  try {
    const result = await db.query('DELETE FROM datamanagement.gold_karat_details WHERE karat_id = $1', [parsedId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Karat detail not found.' });
    }
    res.status(200).json({ message: 'Karat detail deleted successfully.' });
  } catch (error) {
    console.error('Error deleting gold karat:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});
app.get('/api/gold-rates', async (req, res) => {
  try {
    const query = `
      SELECT r.rate_id, r.karat_id, r.today_rate, k.karat_name
      FROM datamanagement.gold_rate r
      JOIN datamanagement.gold_karat_details k ON r.karat_id = k.karat_id
      ORDER BY k.karat_name;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gold rates:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.put('/api/gold-rates/:id', async (req, res) => {
  const { id } = req.params;
  const { today_rate } = req.body;
  
  if (today_rate === undefined || isNaN(parseFloat(today_rate))) {
    return res.status(400).json({ message: 'A valid rate is required.' });
  }

  try {
    const query = `
      UPDATE datamanagement.gold_rate SET today_rate = $1, updated_on = CURRENT_TIMESTAMP
      WHERE rate_id = $2;
    `;
    const result = await db.query(query, [today_rate, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Rate not found.' });
    }
    res.status(200).json({ message: 'Gold rate updated successfully!' });
  } catch (error) {
    console.error('Error updating gold rate:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/api/gold-rates', async (req, res) => {
    const { karat_id, today_rate } = req.body;

    if (!karat_id || today_rate === undefined) {
        return res.status(400).json({ message: 'Karat ID and rate are required.' });
    }

    try {
        const karatDetails = await db.query('SELECT karat_name FROM datamanagement.gold_karat_details WHERE karat_id = $1', [karat_id]);
        if (karatDetails.rows.length === 0) {
            return res.status(404).json({ message: 'Selected Karat does not exist.' });
        }
        const karat_name = karatDetails.rows[0].karat_name;

        const query = `
            INSERT INTO datamanagement.gold_rate (karat_id, karat_name, today_rate)
            VALUES ($1, $2, $3);
        `;
        await db.query(query, [karat_id, karat_name, today_rate]);
        res.status(201).json({ message: 'New gold rate added successfully!' });
    } catch (error) {
        console.error('Error adding gold rate:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

app.get('/api/karats-list', async (req, res) => {
    try {
        const result = await db.query('SELECT karat_id, karat_name FROM datamanagement.gold_karat_details ORDER BY karat_name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});
app.post('/api/check-email', async (req, res) => {
  const { email, customerUuid } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    let query;
    let params;
    if (customerUuid) {
      query = 'SELECT 1 FROM datamanagement.customers WHERE email = $1 AND customer_uuid != $2';
      params = [email, customerUuid];
    } else {
      query = 'SELECT 1 FROM datamanagement.customers WHERE email = $1';
      params = [email];
    }

    const result = await db.query(query, params);
    if (result.rows.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Server error while checking email.' });
  }
});
app.post('/api/check-phone', async (req, res) => {
  const { phone, customerUuid } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    let query;
    let params;
    if (customerUuid) {
      query = 'SELECT 1 FROM datamanagement.customers WHERE phone = $1 AND customer_uuid != $2';
      params = [phone, customerUuid];
    } else {
      query = 'SELECT 1 FROM datamanagement.customers WHERE phone = $1';
      params = [phone];
    }

    const result = await db.query(query, params);

    if (result.rows.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking phone number:', error);
    res.status(500).json({ message: 'Server error while checking phone number.' });
  }
});
app.get('/api/users/processed-amounts', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id,
        u.user_name,
        u.email,
        COALESCE(SUM(p.processed_amount), 0) AS total_invested
      FROM 
        datamanagement.users u
      LEFT JOIN 
        datamanagement.processed_amounts p ON u.user_id = p.user_id
      GROUP BY 
        u.user_id, u.user_name, u.email
      ORDER BY 
        u.user_name;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user processed amounts:', error);
    res.status(500).json({ message: 'Server error while fetching data.' });
  }
});

app.post('/api/processed-amounts', async (req, res) => {
  const { user_id, amount } = req.body;

  const parsedUserId = parseInt(user_id, 10);
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedUserId) || isNaN(parsedAmount)) {
    return res.status(400).json({ message: 'Valid User ID and amount are required.' });
  }

  try {
    const query = `
      INSERT INTO datamanagement.processed_amounts (user_id, processed_amount)
      VALUES ($1, $2);
    `;
    await db.query(query, [parsedUserId, parsedAmount]);
    res.status(201).json({ message: 'Transaction recorded successfully!' });
  } catch (error) {
    console.error('Error recording transaction:', error);
    res.status(500).json({ message: 'Server error during transaction.' });
  }
});
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});