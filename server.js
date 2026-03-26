const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(compression());

app.use(express.static(path.join(__dirname, "public")));

/**
 * -----------------------
 * In‑Memory User Storage
 * -----------------------
 * Replace with MongoDB, MySQL or PostgreSQL later.
 */
const USERS = {};          // { emailOrMobile: { email, mobile, passwordHash } }
const ACTIVE_OTP = {};     // { emailOrMobile: "123456" }

const crypto = require("crypto");

/**
 * Utility — Hash Password
 */
function hashPassword(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Utility — Generate OTP (6 digits)
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * -----------------------
 * Nodemailer Transporter
 * -----------------------
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * -----------------------
 * AUTH API — REGISTER
 * -----------------------
 */
app.post("/auth/register", (req, res) => {
  const { email, mobile, password } = req.body;

  if (!email || !mobile || !password) {
    return res.status(400).json({ ok: false, message: "All fields are required" });
  }

  const id = email.toLowerCase();

  if (USERS[id]) {
    return res.status(400).json({ ok: false, message: "User already exists" });
  }

  USERS[id] = {
    email,
    mobile,
    passwordHash: hashPassword(password)
  };

  res.json({ ok: true, message: "Registered successfully" });
});

/**
 * -----------------------
 * AUTH API — SEND OTP
 * -----------------------
 */
app.post("/auth/send-otp", async (req, res) => {
  const { user } = req.body;

  if (!user) return res.status(400).json({ ok: false, message: "User required" });

  const id = user.toLowerCase();
  if (!USERS[id]) {
    return res.status(400).json({ ok: false, message: "User not found" });
  }

  const otp = generateOTP();
  ACTIVE_OTP[id] = otp;

  try {
    await transporter.sendMail({
      from: `"Bank Portal" <${process.env.SMTP_USER}>`,
      to: USERS[id].email,
      subject: "Your Login OTP",
      text: `Your OTP is: ${otp}`
    });

    res.json({ ok: true, message: "OTP sent successfully" });
  } catch (err) {
    console.log("Email error:", err);
    res.status(500).json({ ok: false, message: "Failed to send OTP" });
  }
});

/**
 * -----------------------
 * AUTH API — VERIFY OTP
 * -----------------------
 */
app.post("/auth/verify-otp", (req, res) => {
  const { user, otp } = req.body;

  const id = user.toLowerCase();
  if (!ACTIVE_OTP[id]) return res.status(400).json({ ok: false, message: "OTP expired or invalid" });

  if (ACTIVE_OTP[id] !== otp) {
    return res.status(400).json({ ok: false, message: "Invalid OTP" });
  }

  delete ACTIVE_OTP[id];

  res.json({ ok: true, message: "OTP login successful", token: "user-session-token" });
});

/**
 * -----------------------
 * AUTH API — PASSWORD LOGIN
 * -----------------------
 */
app.post("/auth/login", (req, res) => {
  const { user, password } = req.body;

  const id = user.toLowerCase();
  if (!USERS[id]) return res.status(400).json({ ok: false, message: "User not found" });

  if (USERS[id].passwordHash !== hashPassword(password)) {
    return res.status(400).json({ ok: false, message: "Incorrect password" });
  }

  res.json({ ok: true, message: "Login successful", token: "user-session-token" });
});

/**
 * -----------------------
 * DUMMY BANK API ROUTES (your existing CRUD)
 * -----------------------
 */
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

app.get("/health", (req, res) => {
  res.json({ status: "SUCCESS", message: "Server is running 🚀" });
});

/**
 * SPA fallback
 */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
