const express = require("express");

const app = express();

app.use((req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            service: "currency-service",
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Date.now() - startTime
        }));
    });

    next();
});

const PORT = Number(process.env.PORT || 3001);
const FRANKFURTER_API_URL =
    process.env.FRANKFURTER_API_URL || "https://api.frankfurter.dev";

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "currency-service"
    });
});

app.get("/ready", (req, res) => {
    try {
        new URL(FRANKFURTER_API_URL);

        res.json({
            status: "ready",
            service: "currency-service"
        });
    } catch (error) {
        res.status(503).json({
            status: "not ready",
            service: "currency-service"
        });
    }
});

app.get("/currencies", async (req, res) => {
    try {
        const response = await fetch(
            `${FRANKFURTER_API_URL}/v2/currencies`,
            {
                signal: AbortSignal.timeout(5000)
            }
        );

        if (!response.ok) {
            return res.status(502).json({
                error: "Currency provider returned an error"
            });
        }

        const data = await response.json();

        const currencies = data
            .map(currency => ({
                code: currency.iso_code,
                name: currency.name,
                symbol: currency.symbol
            }))
            .sort((a, b) => a.code.localeCompare(b.code));

        res.json({ currencies });
    } catch (error) {
        console.error("Currency provider error:", error);

        res.status(502).json({
            error: "Could not retrieve currencies"
        });
    }
});

app.get("/convert", async (req, res) => {
    const amount = Number(req.query.amount);
    const from = String(req.query.from || "").toUpperCase();
    const to = String(req.query.to || "").toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
            error: "Amount must be greater than zero"
        });
    }

    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
        return res.status(400).json({
            error: "Invalid currency code"
        });
    }

    if (from === to) {
        return res.json({
            amount,
            from,
            to,
            rate: 1,
            result: amount,
            date: null
        });
    }

    try {
        const response = await fetch(
            `${FRANKFURTER_API_URL}/v2/rate/${from.toLowerCase()}/${to.toLowerCase()}`,
            {
                signal: AbortSignal.timeout(5000)
            }
        );

        if (!response.ok) {
            return res.status(response.status === 422 ? 400 : 502).json({
                error: "Could not retrieve exchange rate"
            });
        }

        const data = await response.json();
        const result = Number((amount * data.rate).toFixed(2));

        res.json({
            amount,
            from,
            to,
            rate: data.rate,
            result,
            date: data.date
        });
    } catch (error) {
        console.error("Currency provider error:", error);

        res.status(502).json({
            error: "Could not retrieve exchange rate"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Currency service running on port ${PORT}`);
    console.log(`Currency provider: ${FRANKFURTER_API_URL}`);
});