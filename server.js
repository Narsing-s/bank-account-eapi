const express = require("express");
const cors = require("cors");
const axios = require("axios");
const morgan = require("morgan");
const compression = require("compression");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * ✅ Middleware
 */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(compression());

/**
 * ✅ Health Check Route
 */
app.get("/", (req, res) => {
  res.json({
    status: "SUCCESS",
    message: "Server is running 🚀"
  });
});

/**
 * ✅ Sample API Route
 */
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working ✅"
  });
});

/**
 * ✅ Example External API Call
 */
app.get("/api/external", async (req, res) => {
  try {
    const response = await axios.get("https://jsonplaceholder.typicode.com/posts/1");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch external data"
    });
  }
});

/**
 * ❌ 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

/**
 * ❌ Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error: "Internal Server Error"
  });
});

/**
 * ✅ Start Server (FIXED)
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
