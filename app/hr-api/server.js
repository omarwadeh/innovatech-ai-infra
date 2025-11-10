const express = require("express");
const { Pool } = require("pg");

const {
  DB_HOST,
  DB_PORT = 5432,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
} = process.env;

if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
  console.warn("⚠️ Missing one or more DB_* env vars");
}

const app = express();
app.use(express.json());

// Gebruik SSL voor RDS (no pg_hba.conf / no encryption fix)
const useSsl = DB_HOST && DB_HOST.includes("rds.amazonaws.com");

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

// Healthcheck: check DB connectie
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ok", db: "up" });
  } catch (err) {
    console.error("Healthcheck DB error:", err.message);
    return res.status(500).json({ status: "error", db: "down" });
  }
});

// Demo endpoint (hier zou je echte HR-data gebruiken)
app.get("/employees", async (req, res) => {
  try {
    const result = await pool.query("SELECT 'demo-user' AS name");
    return res.json({ employees: result.rows });
  } catch (err) {
    console.error("Employees DB error:", err.message);
    return res.status(500).json({ error: "db_error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`HR API listening on port ${port}`);
});
