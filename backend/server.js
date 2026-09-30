require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Frankfurter currency conversion API for week 5
const CURRENCY_SERVICE_URL = process.env.CURRENCY_SERVICE_URL || "http://localhost:3001";

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "appuser",
    password: process.env.DB_PASSWORD || "apppassword",
    database: process.env.DB_NAME || "cloudapp",
    waitForConnections: true,
    connectionLimit: 10
});

// Simple backend health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "backend"
    });
});

// Read data from MySQL
app.get("/api/status", async (req, res) => {
    try {
        const [timeRows] = await pool.query(
            "SELECT NOW() AS serverTime"
        );

        const [counterRows] = await pool.query(
            "SELECT value FROM counter WHERE id = 1"
        );

        res.json({
            backend: "connected",
            database: "connected",
            serverTime: timeRows[0].serverTime,
            currency: "connected",
            counter: counterRows[0].value
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            backend: "connected",
            database: "error",
            error: "Could not communicate with database"
        });
    }
});

// Write data to MySQL
app.post("/api/counter/increment", async (req, res) => {
    try {
        await pool.query(
            "UPDATE counter SET value = value + 1 WHERE id = 1"
        );

        const [rows] = await pool.query(
            "SELECT value FROM counter WHERE id = 1"
        );

        res.json({
            counter: rows[0].value
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            error: "Could not update counter"
        });
    }
});

// Get list of currencies, used for populating dropdowns
app.get("/api/currency/currencies", async (req, res) => {
    try {
        const response = await fetch(
            `${CURRENCY_SERVICE_URL}/currencies`,
            {
                signal: AbortSignal.timeout(5000)
            }
        );

        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        console.error("Currency service error:", error);

        res.status(502).json({
            error: "Currency service is unavailable"
        });
    }
});

// Perform conversion
app.get("/api/currency/convert", async (req, res) => {
    try {
        const params = new URLSearchParams({
            amount: req.query.amount || "",
            from: req.query.from || "",
            to: req.query.to || ""
        });

        const response = await fetch(
            `${CURRENCY_SERVICE_URL}/convert?${params}`,
            {
                signal: AbortSignal.timeout(5000)
            }
        );

        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        console.error("Currency service error:", error);

        res.status(502).json({
            error: "Currency service is unavailable"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
});