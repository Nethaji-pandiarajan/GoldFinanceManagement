const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const logger = require("../config/logger");
exports.getAllCustomers = async (req, res) => {
  logger.info(`[CUSTOMER] Request received to GET all customers.`);
  try {
    const query = `
      SELECT c.customer_uuid, c.customer_name, c.phone AS phone_number,
             c.gender, c.date_of_birth AS dob, n.nominee_name, n.nominee_mobile
      FROM datamanagement.customers c
      LEFT JOIN datamanagement.nominees n ON c.nominee_id = n.nominee_id
      ORDER BY c.created_on DESC
    `;
    const customers = await db.query(query);
    logger.info(
      `[CUSTOMER] Successfully retrieved ${customers.rows.length} customers.`
    );
    res.json(customers.rows);
  } catch (error) {
    logger.error(`[CUSTOMER] Error fetching all customers: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ message: "Server error while fetching customers." });
  }
};

exports.createCustomer = async (req, res) => {
  const {
    customer_name,
    email,
    phone,
    gender,
    description,
    address,
    government_proof,
    proof_id,
    date_of_birth,
    nominee_name,
    nominee_mobile,
    nominee_relationship,
    nominee_age,
    nominee_gender,
  } = req.body;
  logger.info(
    `[CUSTOMER] Attempting to CREATE customer '${customer_name}' with email '${email}'.`
  );
  const customerImageFile = req.files["customer_image"]
    ? req.files["customer_image"][0]
    : null;
  const proofImageFile = req.files["proof_image"]
    ? req.files["proof_image"][0]
    : null;

  if (!customer_name || !nominee_name) {
    logger.warn(
      `[CUSTOMER] Validation failed for creating customer '${customer_name}': Missing required names.`
    );
    return res
      .status(400)
      .json({ message: "Customer and Nominee names are required." });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const nomineeQuery = `
        INSERT INTO datamanagement.nominees (nominee_name, nominee_mobile, nominee_relationship, nominee_age, nominee_gender, nominee_uuid)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING nominee_id;
      `;
    const nomineeResult = await client.query(nomineeQuery, [
      nominee_name,
      nominee_mobile || null,
      nominee_relationship || null,
      nominee_age || null,
      nominee_gender || null,
      uuidv4(),
    ]);
    const newNomineeId = nomineeResult.rows[0].nominee_id;

    const customerQuery = `
        INSERT INTO datamanagement.customers (
          customer_name, customer_image, email, phone, gender, description, address,
          government_proof, proof_id, proof_image, date_of_birth, nominee_id, customer_uuid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
      `;
    await client.query(customerQuery, [
      customer_name,
      customerImageFile ? customerImageFile.buffer : null,
      email,
      phone,
      gender || null,
      description || null,
      address || null,
      government_proof || null,
      proof_id || null,
      proofImageFile ? proofImageFile.buffer : null,
      date_of_birth || null,
      newNomineeId,
      uuidv4(),
    ]);
    logger.info(
      `[CUSTOMER] Successfully CREATED customer '${customer_name}' and nominee '${nominee_name}'.`
    );
    await client.query("COMMIT");
    res.status(201).json({ message: "Customer created successfully!" });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(
      `[CUSTOMER] Error CREATING customer '${customer_name}': ${error.message}`,
      { stack: error.stack }
    );
    res.status(500).json({ message: "Server error during customer creation." });
  } finally {
    client.release();
  }
};

exports.getCustomerByUuid = async (req, res) => {
  const { uuid } = req.params;
  logger.info(`[CUSTOMER] Request received to GET customer by UUID: ${uuid}`);
  try {
    const query = `
          SELECT c.*, n.* FROM datamanagement.customers c
          LEFT JOIN datamanagement.nominees n ON c.nominee_id = n.nominee_id
          WHERE c.customer_uuid = $1;
        `;
    const result = await db.query(query, [uuid]);
    if (result.rows.length === 0) {
      logger.warn(
        `[CUSTOMER] GET failed: Customer with UUID '${uuid}' not found.`
      );
      return res.status(404).json({ message: "Customer not found." });
    }
    logger.info(
      `[CUSTOMER] Successfully retrieved customer with UUID: ${uuid}`
    );
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(
      `[CUSTOMER] Error GETTING customer with UUID ${uuid}: ${error.message}`,
      { stack: error.stack }
    );
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateCustomerByUuid = async (req, res) => {
  const { uuid } = req.params;
  const {
    customer_name,
    email,
    phone,
    gender,
    description,
    address,
    government_proof,
    proof_id,
    date_of_birth,
    nominee_id,
    nominee_name,
    nominee_mobile,
    nominee_relationship,
    nominee_age,
    nominee_gender,
  } = req.body;
  logger.info(`[CUSTOMER] Attempting to UPDATE customer with UUID: ${uuid}`);
  const customerImageFile = req.files["customer_image"]
    ? req.files["customer_image"][0]
    : null;
  const proofImageFile = req.files["proof_image"]
    ? req.files["proof_image"][0]
    : null;

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const parsedNomineeId = parseInt(nominee_id, 10);
    if (!isNaN(parsedNomineeId)) {
      const parsedNomineeAge = nominee_age ? parseInt(nominee_age, 10) : null;
      const nomineeQuery = `
              UPDATE datamanagement.nominees SET
                nominee_name = $1, nominee_mobile = $2, nominee_relationship = $3,
                nominee_age = $4, nominee_gender = $5
              WHERE nominee_id = $6;
            `;
      await client.query(nomineeQuery, [
        nominee_name,
        nominee_mobile,
        nominee_relationship,
        isNaN(parsedNomineeAge) ? null : parsedNomineeAge,
        nominee_gender,
        parsedNomineeId,
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
      customer_name,
      email,
      phone,
      gender,
      description,
      address,
      government_proof,
      proof_id,
      date_of_birth,
      customerImageFile ? customerImageFile.buffer : null,
      proofImageFile ? proofImageFile.buffer : null,
      uuid,
    ]);
    await client.query("COMMIT");
    logger.info(`[CUSTOMER] Successfully UPDATED customer with UUID: ${uuid}`);
    res.status(200).json({ message: "Customer updated successfully!" });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(
      `[CUSTOMER] Error UPDATING customer with UUID ${uuid}: ${error.message}`,
      { stack: error.stack }
    );
    res.status(500).json({ message: "Server error during update." });
  } finally {
    client.release();
  }
};

exports.deleteCustomerByUuid = async (req, res) => {
  const { uuid } = req.params;
  logger.info(`[CUSTOMER] Attempting to DELETE customer with UUID: ${uuid}`);
  try {
    const result = await db.query(
      "DELETE FROM datamanagement.customers WHERE customer_uuid = $1",
      [uuid]
    );
    if (result.rowCount === 0) {
      logger.warn(
        `[CUSTOMER] Failed DELETE attempt: Customer with UUID '${uuid}' not found.`
      );
      return res.status(404).json({ message: "Customer not found." });
    }
    logger.info(`[CUSTOMER] Successfully DELETED customer with UUID: ${uuid}`);
    res.status(200).json({ message: "Customer deleted successfully." });
  } catch (error) {
    logger.error(
      `[CUSTOMER] Error DELETING customer with UUID ${uuid}: ${error.message}`,
      { stack: error.stack }
    );
    res.status(500).json({ message: "Server error." });
  }
};

exports.getCustomersList = async (req, res) => {
    logger.info(`[CUSTOMER] Request received for customer dropdown list.`);
    try {
        const query = `
            SELECT 
                c.customer_id, 
                c.customer_name, 
                c.phone,
                n.nominee_id,  -- Add nominee_id
                n.nominee_name
            FROM 
                datamanagement.customers c
            LEFT JOIN 
                datamanagement.nominees n ON c.nominee_id = n.nominee_id
            ORDER BY 
                c.customer_name;
        `;
        const result = await db.query(query);
        const formattedCustomers = result.rows.map(c => ({
            id: c.customer_id,
            name: c.customer_name,
            phone: c.phone,
            nominee_id: c.nominee_id,
            nominee_name: c.nominee_name
        }));

        logger.info(`[CUSTOMER] Successfully retrieved customer list with ${formattedCustomers.length} entries.`);
        res.json(formattedCustomers);
    } catch (error) {
        logger.error(`[CUSTOMER] Error fetching customer list: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: "Server error." });
    }
};
exports.checkEmail = async (req, res) => {
  const { email, customerUuid } = req.body;
  logger.info(`[CUSTOMER] Checking if email exists: ${email}`);
  if (!email) {
    logger.warn(`[CUSTOMER] Email check failed: No email provided.`);
    return res.status(400).json({ message: "Email is required." });
  }
  try {
    let query;
    let params;
    if (customerUuid) {
      query =
        "SELECT 1 FROM datamanagement.customers WHERE email = $1 AND customer_uuid != $2";
      params = [email, customerUuid];
    } else {
      query = "SELECT 1 FROM datamanagement.customers WHERE email = $1";
      params = [email];
    }
    const result = await db.query(query, params);
    logger.info(
      `[CUSTOMER] Email check for '${email}' completed. Exists: ${exists}`
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (error) {
    logger.error(
      `[CUSTOMER] Error checking email '${email}': ${error.message}`,
      { stack: error.stack }
    );
    res.status(500).json({ message: "Server error while checking email." });
  }
};

exports.checkPhone = async (req, res) => {
  const { phone, customerUuid } = req.body;
  logger.info(`[CUSTOMER] Checking if phone exists: ${phone}`);
  if (!phone) {
    logger.warn(`[CUSTOMER] Phone check failed: No phone number provided.`);
    return res.status(400).json({ message: "Phone number is required." });
  }
  try {
    let query;
    let params;
    if (customerUuid) {
      query =
        "SELECT 1 FROM datamanagement.customers WHERE phone = $1 AND customer_uuid != $2";
      params = [phone, customerUuid];
    } else {
      query = "SELECT 1 FROM datamanagement.customers WHERE phone = $1";
      params = [phone];
    }
    const result = await db.query(query, params);
    logger.info(
      `[CUSTOMER] Phone check for '${phone}' completed. Exists: ${exists}`
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (error) {
    logger.error(
      `[CUSTOMER] Error checking phone number '${phone}': ${error.message}`,
      { stack: error.stack }
    );
    res
      .status(500)
      .json({ message: "Server error while checking phone number." });
  }
};
