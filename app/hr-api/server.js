const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "hrdb",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false, // zet true + opties als je RDS dat vereist
};

console.log("Starting HR API with DB config:", {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: dbConfig.ssl,
});

const pool = new Pool(dbConfig);

app.use(cors());
app.use(express.json());

let dbStatus = "unknown";

// Zorg dat DB schema bestaat, maar KILL de app niet bij fouten
async function initDb() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS employees (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          department VARCHAR(255),
          role VARCHAR(255),
          status VARCHAR(32) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("DB schema ready");
      dbStatus = "up";
    } finally {
      client.release();
    }
  } catch (err) {
    dbStatus = "down";
    console.error("initDb error:", err.message);
  }
}

// HEALTHCHECK – altijd 200, zodat liveness/readiness niet je pod slopen
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT 1").catch((err) => {
      console.error("Healthcheck DB error:", err.message);
      return null;
    });

    if (result) {
      dbStatus = "up";
    } else if (dbStatus !== "up") {
      dbStatus = "down";
    }

    res.json({ status: "ok", db: dbStatus });
  } catch (err) {
    console.error("Unexpected /health error:", err.message);
    // nog steeds 200 teruggeven, anders CrashLoop
    res.json({ status: "ok", db: "down", detail: err.message });
  }
});

// LIST EMPLOYEES
app.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, department, role, status FROM employees ORDER BY id ASC"
    );
    res.json({ employees: result.rows });
  } catch (err) {
    console.error("Error fetching employees:", err.message);
    res.status(500).json({
      error: "internal_error",
      detail: err.message,
    });
  }
});

// ONBOARD
app.post("/onboard", async (req, res) => {
  const { name, email, department, role } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({
      error: "invalid_input",
      detail: "name and email are required",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO employees (name, email, department, role, status)
      VALUES ($1, $2, $3, $4, 'active')
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        role = EXCLUDED.role,
        status = 'active'
      RETURNING id, name, email, department, role, status
      `,
      [name, email, department || null, role || null]
    );

    res.json({ status: "ok", employee: result.rows[0] });
  } catch (err) {
    console.error("Error onboarding employee:", err.message);
    res.status(500).json({
      error: "internal_error",
      detail: err.message,
    });
  }
});

// OFFBOARD
app.post("/offboard", async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({
      error: "invalid_input",
      detail: "email is required",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE employees
      SET status = 'inactive'
      WHERE email = $1
      RETURNING id, name, email, department, role, status
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ status: "not_found" });
    }

    res.json({ status: "ok", employee: result.rows[0] });
  } catch (err) {
    console.error("Error offboarding employee:", err.message);
    res.status(500).json({
      error: "internal_error",
      detail: err.message,
    });
  }
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "internal_error",
    detail: err.message || "unknown",
  });
});

initDb().then(() => {
  app.listen(port, () => {
    console.log(`HR API listening on port ${port}`);
  });
});
