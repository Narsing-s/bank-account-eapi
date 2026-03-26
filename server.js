```js
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

/**
 * ✅ ENV CONFIG (FIXED)
 */
const API_BASE =
  process.env.API_BASE ||
  "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// 🔥 MUST match your Render domain
const rpID = process.env.RP_ID || "your-render-app.onrender.com";
const expectedOrigin =
  process.env.ORIGIN || "https://your-render-app.onrender.com";

const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";

const httpsAgent = new https.Agent({ keepAlive: true });

/**
 * ✅ MIDDLEWARE
 */
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(compression());
app.use(morgan("tiny"));

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,        // 🔥 required for HTTPS (Render)
      sameSite: "none"     // 🔥 required for cross-site cookies
    }
  })
);

/**
 * ✅ HEALTH CHECK
 */
app.get("/healthz", (_req, res) => res.json({ ok: true }));

/**
 * ✅ STATIC FILES
 */
app.use(express.static(path.join(__dirname, "public")));

/**
 * ----------------------------------------------------------
 * ✅ WebAuthn (Passkeys)
 * ----------------------------------------------------------
 */
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require("@simplewebauthn/server");

const { v4: uuidv4 } = require("uuid");

const users = new Map();
const challenges = new Map();

/**
 * REGISTER OPTIONS
 */
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
    rpName: "Bank Portal",
    userID: user.id,
    userName: username,
    attestationType: "none"
  });

  challenges.set(username, options);
  res.json(options);
});

/**
 * REGISTER VERIFY
 */
app.post("/webauthn/register/verify", async (req, res) => {
  const { username, attResp } = req.body;
  const expected = challenges.get(username);

  try {
    const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: expected.challenge,
      expectedOrigin,
      expectedRPID: rpID
    });

    const user = users.get(username);

    user.credentials.push({
      credID: verification.registrationInfo.credentialID,
      publicKey: verification.registrationInfo.credentialPublicKey,
      counter: verification.registrationInfo.counter
    });

    req.session.user = user;
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/**
 * LOGIN OPTIONS
 */
app.get("/webauthn/login/options", (req, res) => {
  const username = req.query.username;
  const user = users.get(username);

  if (!user) return res.status(404).json({ message: "not registered" });

  const options = generateAuthenticationOptions({
    rpID,
    allowCredentials: user.credentials.map(c => ({
      id: c.credID,
      type: "public-key"
    }))
  });

  challenges.set(username, options);
  res.json(options);
});

/**
 * LOGIN VERIFY
 */
app.post("/webauthn/login/verify", async (req, res) => {
  const { username, assertion } = req.body;
  const expected = challenges.get(username);
  const user = users.get(username);

  try {
    const credential = user.credentials[0];

    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: expected.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: credential
    });

    credential.counter = verification.authenticationInfo.newCounter;
    req.session.user = user;

    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
});

/**
 * ----------------------------------------------------------
 * ✅ PROXY TO MULESOFT
 * ----------------------------------------------------------
 */
app.use("/api", async (req, res) => {
  const url = API_BASE + req.url;

  try {
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: {
        "Content-Type": "application/json",
        ...(CLIENT_ID && { client_id: CLIENT_ID }),
        ...(CLIENT_SECRET && { client_secret: CLIENT_SECRET })
      },
      httpsAgent,
      validateStatus: () => true
    });

    res.status(response.status).json(response.data);
  } catch (e) {
    console.error("Proxy error:", e.message);
    res.status(500).json({ message: "API error", detail: e.message });
  }
});

/**
 * ✅ SPA FALLBACK
 */
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * ✅ START SERVER
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API_BASE: ${API_BASE}`);
  console.log(`RP_ID: ${rpID}`);
  console.log(`ORIGIN: ${expectedOrigin}`);
});
```
