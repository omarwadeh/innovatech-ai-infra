// app/hr-api/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const { invokeOnboardLambda } = require("./lambdaClient");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// DB-config uit env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// DB init – employees tabel aanmaken als die nog niet bestaat
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT,
        role TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("DB: employees table ready");
  } finally {
    client.release();
  }
}

// Health endpoint
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT 1 AS ok");
    if (result.rows[0].ok === 1) {
      return res.json({ status: "ok", db: "up" });
    }
    return res.status(500).json({ status: "error", db: "weird" });
  } catch (err) {
    console.error("Healthcheck DB error:", err);
    return res.status(500).json({ status: "error", db: "down" });
  }
});

// Alle employees
app.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, department, role, status FROM employees ORDER BY id ASC"
    );
    res.json({ status: "ok", employees: result.rows });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch employees" });
  }
});

// Onboard employee
app.post("/onboard", async (req, res) => {
  const { name, email, department, role } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({
      status: "error",
      message: "Name and email are required",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // UPSERT: bestaand email → update, anders insert
    const result = await client.query(
      `
      INSERT INTO employees (name, email, department, role, status)
      VALUES ($1, $2, $3, $4, 'active')
      ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          department = EXCLUDED.department,
          role = EXCLUDED.role,
          status = 'active'
      RETURNING id, name, email, department, role, status;
      `,
      [name, email, department || null, role || null]
    );

    const employee = result.rows[0];

    await client.query("COMMIT");

    // ===== Lambda aanroep met rijke payload =====
    const lambdaPayload = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      status: employee.status,
      action: "onboard",
    };

    let lambdaResult;
    try {
      lambdaResult = await invokeOnboardLambda(lambdaPayload);
      console.log("[Onboard] Lambda response:", lambdaResult);
    } catch (lambdaErr) {
      console.error("[Onboard] Lambda call failed:", lambdaErr);
      lambdaResult = { status: "lambda-error" };
    }

    return res.json({
      status: "ok",
      employee,
      automation: lambdaResult.status || "queued",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error onboarding employee:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to onboard employee",
    });
  } finally {
    client.release();
  }
});

// Offboard employee
app.post("/offboard", async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({
      status: "error",
      message: "Email is required",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE employees
      SET status = 'inactive'
      WHERE email = $1
      RETURNING id, name, email, department, role, status;
      `,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    const employee = result.rows[0];

    // ===== Lambda offboard aanroep =====
    const lambdaPayload = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      status: employee.status,
      action: "offboard",
    };

    let lambdaResult;
    try {
      lambdaResult = await invokeOnboardLambda(lambdaPayload);
      console.log("[Offboard] Lambda response:", lambdaResult);
    } catch (lambdaErr) {
      console.error("[Offboard] Lambda call failed:", lambdaErr);
      lambdaResult = { status: "lambda-error" };
    }

    return res.json({
      status: "ok",
      employee,
      automation: lambdaResult.status || "queued",
    });
  } catch (err) {
    console.error("Error offboarding employee:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to offboard employee",
    });
  }
});

// Server starten
app.listen(port, async () => {
  console.log(`HR API listening on port ${port}`);
  try {
    await initDb();
  } catch (err) {
    console.error("Failed to init DB:", err);
  }
});
