// server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const https = require("https");
const morgan = require("morgan");
const compression = require("compression");
const session = require("express-session");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// IMPORTANT: Include /api if Mule listener is /api/*
const API_BASE =
  process.env.API_BASE ||
  "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// Optional (only if API Manager client ID enforcement is enabled)
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";

// WebAuthn Relying Party
const rpID = process.env.RP_ID || "localhost";                // your prod domain
const rpName = process.env.RP_NAME || "Bank Portal";
const expectedOrigin = process.env.ORIGIN || "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io";

const APP_MODE = (process.env.APP_MODE || "web").toLowerCase(); // "web"|"android"
const WEB_PREFIX = process.env.WEB_PREFIX || "/api";
const ANDROID_BASE = process.env.ANDROID_BASE || "";

// Keep-alive improves upstream reliability
const httpsAgent = new https.Agent({ keepAlive: true });

// Core middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(compression());
app.use(morgan("tiny"));

app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // set true if behind HTTPS + reverse proxy; also set app.set('trust proxy', 1)
      sameSite: "lax"
    }
  })
);

/**
 * Serve a dynamic /config.js so window.AppConfig is ALWAYS defined
 */
app.get("/config.js", (req, res) => {
  const q = req.query || {};
  const qMode = (q.mode || "").toLowerCase();
  const qsMode = qMode === "android" || qMode === "web" ? qMode : null;
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  const uaLooksAndroid = ua.includes("android");

  let mode = qsMode || APP_MODE;
  if (!qsMode && APP_MODE === "web" && uaLooksAndroid && ANDROID_BASE) mode = "android";

  const webPrefix = q.webPrefix || WEB_PREFIX;
  const androidBase = q.androidBase || ANDROID_BASE;

  const js = `
    window.AppConfig = window.AppConfig || {
      mode: ${JSON.stringify(mode)},
      WEB_PREFIX: ${JSON.stringify(webPrefix)},
      ANDROID_BASE: ${JSON.stringify(androidBase)}
    };
  `;
  res.type("application/javascript").send(js);
});

// Health check
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------------------------
// WebAuthn endpoints (Passkeys) using SimpleWebAuthn (server)
// ----------------------------------------------------------
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require("@simplewebauthn/server");
const { v4: uuidv4 } = require("uuid");

// in-memory demo stores (replace with DB for prod)
const users = new Map();      // username -> { id, credentials: [] }
const challenges = new Map(); // username -> { regOptions?, authOptions? }

app.get("/webauthn/register/options", (req, res) => {
  const username = String(req.query.username || "").trim();
  if (!username) return res.status(400).json({ message: "username required" });

  let user = users.get(username);
  if (!user) {
    user = { id: uuidv4(), username, credentials: [] };
    users.set(username, user);
  }

  const options = generateRegistrationOptions({
    rpID,
    rpName,
    userID: user.id,
    userName: username,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required"
    },
    excludeCredentials: user.credentials.map((c) => ({
      id: Buffer.from(c.credID, "base64url"),
      type: "public-key"
    }))
  });
  challenges.set(username, { regOptions: options });
  res.json(options);
});

app.post("/webauthn/register/verify", async (req, res) => {
  const { username, attResp } = req.body || {};
  const ch = challenges.get(username)?.regOptions;
  if (!ch) return res.status(400).json({ message: "no reg challenge" });

  try {
    const vr = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: ch.challenge,
      expectedOrigin,
      expectedRPID: rpID
    });

    const { credentialID, credentialPublicKey, counter } = vr.registrationInfo;
    const user = users.get(username);
    user.credentials.push({
      credID: Buffer.from(credentialID).toString("base64url"),
      publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
      counter
    });
    challenges.delete(username);
    req.session.user = { id: user.id, username };
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.get("/webauthn/login/options", (req, res) => {
  const username = String(req.query.username || "").trim();
  const user = users.get(username);
  if (!user || user.credentials.length === 0)
    return res.status(404).json({ message: "not registered" });

  const options = generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: user.credentials.map((c) => ({
      id: Buffer.from(c.credID, "base64url"),
      type: "public-key"
    }))
  });
  challenges.set(username, { authOptions: options });
  res.json(options);
});

app.post("/webauthn/login/verify", async (req, res) => {
  const { username, assertion } = req.body || {};
  const ch = challenges.get(username)?.authOptions;
  const user = users.get(username);
  if (!user || !ch) return res.status(400).json({ message: "no auth challenge" });

  const dbCred = user.credentials.find((c) => c.credID === assertion.id);
  if (!dbCred) return res.status(400).json({ message: "credential not found" });

  try {
    const vr = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: ch.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(dbCred.credID, "base64url"),
        credentialPublicKey: Buffer.from(dbCred.publicKey, "base64url"),
        counter: dbCred.counter
      }
    });
    dbCred.counter = vr.authenticationInfo.newCounter;
    challenges.delete(username);
    req.session.user = { id: user.id, username };
    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
});

// -----------------------------------------------
// Proxy: /api/* -> CloudHub (API_BASE)
// with diagnostics + optional client_id/secret
// -----------------------------------------------
app.use("/api", async (req, res) => {
  const upstreamUrl = API_BASE + req.url; // req.url includes /accounts...
  const headers = {
    "Content-Type": req.get("Content-Type") || "application/json",
    Accept: req.get("Accept") || "application/json",
    Authorization: req.get("Authorization"),
    "x-forwarded-for": req.ip,
    "x-forwarded-host": req.get("host")
  };
  if (CLIENT_ID) headers["client_id"] = CLIENT_ID;
  if (CLIENT_SECRET) headers["client_secret"] = CLIENT_SECRET;

  console.log(`[PROXY] ${req.method} ${upstreamUrl}`);
  try {
    const ax = await axios({
      method: req.method,
      url: upstreamUrl,
      data: ["POST", "PUT", "PATCH"].includes(req.method) ? req.body : undefined,
      headers,
      httpsAgent,
      timeout: 30000,
      validateStatus: () => true
    });
    console.log(`[PROXY] <- ${ax.status} ${upstreamUrl}`);
    const ct = ax.headers["content-type"] || "application/json";
    res.status(ax.status).set("Content-Type", ct);
    if (ct.includes("application/json") && typeof ax.data === "object") {
      res.json(ax.data);
    } else {
      res.send(ax.data);
    }
  } catch (e) {
    console.error("[PROXY] error:", e.message);
    res.status(502).json({ message: "Upstream unavailable", detail: e.message });
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`UI server running on http://localhost:${PORT}`);
  console.log(`Proxy target (API_BASE): ${API_BASE}`);
  console.log(`App mode (APP_MODE): ${APP_MODE}`);
  if (APP_MODE === "android" || ANDROID_BASE) {
    console.log(`Android base (ANDROID_BASE): ${ANDROID_BASE || "(not set)"}`);
  }
  console.log(`WebAuthn RP_ID: ${rpID}, ORIGIN: ${expectedOrigin}`);
});
