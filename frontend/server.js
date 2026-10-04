require("dotenv").config();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const fs = require("fs");
const path = require("path");

const VERSION = fs
    .readFileSync(path.join(__dirname, "VERSION"), "utf8")
    .trim();

const app = express();

app.use((req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            service: "frontend",
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Date.now() - startTime
        }));
    });

    next();
});

const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

app.get("/version", (req, res) => {
    res.json({
        service: "frontend",
        version: VERSION
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "frontend"
    });
});

app.get("/ready", async (req, res) => {
    try {
        const response = await fetch(
            `${BACKEND_URL}/api/health`,
            {
                signal: AbortSignal.timeout(3000)
            }
        );

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        res.json({
            status: "ready",
            service: "frontend",
            backend: "connected"
        });
    } catch (error) {
        res.status(503).json({
            status: "not ready",
            service: "frontend",
            backend: "unavailable"
        });
    }
});

// Forward /api requests to the backend
app.use(
    "/api",
    createProxyMiddleware({
        target: BACKEND_URL,
        changeOrigin: true,
        pathRewrite: (path, req) => req.originalUrl
    })
);

// Serve the website
app.use(express.static("public"));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend running on port ${PORT}`);
    console.log(`Backend target: ${BACKEND_URL}`);
});