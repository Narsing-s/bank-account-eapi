const express = require("express");
const cors = require("cors");
const axios = require("axios");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(compression());

/**
 * Serve static frontend
 */
app.use(express.static(path.join(__dirname, "public")));

/**
 * API Routes
 */
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

app.get("/api/external", async (req, res) => {
  try {
    const response = await axios.get("https://jsonplaceholder.typicode.com/posts/1");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "External fetch failed" });
  }
});

/**
 * Health Check
 */
app.get("/health", (req, res) => {
  res.json({ status: "SUCCESS", message: "Server is running 🚀" });
});

/**
 * SPA fallback — always return index.html
 */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
