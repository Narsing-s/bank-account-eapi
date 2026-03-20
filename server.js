// --- WebAuthn/passkeys setup ---
const { generateRegistrationOptions, verifyRegistrationResponse,
        generateAuthenticationOptions, verifyAuthenticationResponse } =
  require('@simplewebauthn/server');
const { v4: uuidv4 } = require('uuid');

// In-memory demo stores (replace with DB in prod)
const users = new Map();          // username/email -> { id, credentials: [] }
const challenges = new Map();     // username -> { regOptions, authOptions }

// Relying Party config
const rpID = process.env.RP_ID || 'localhost';              // your domain in prod
const rpName = process.env.RP_NAME || 'Bank Portal';
const expectedOrigin = process.env.ORIGIN || 'http://localhost:8080';

// --- Registration (create credential) ---
app.get('/webauthn/register/options', (req, res) => {
  const username = String(req.query.username || '').trim();
  if (!username) return res.status(400).json({ message: 'username required' });

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
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
    excludeCredentials: user.credentials.map(c => ({ id: Buffer.from(c.credID, 'base64url'), type: 'public-key' })),
  });
  challenges.set(username, { regOptions: options });
  res.json(options);
});

app.post('/webauthn/register/verify', async (req, res) => {
  const { username, attResp } = req.body || {};
  const ch = challenges.get(username)?.regOptions;
  if (!ch) return res.status(400).json({ message: 'no reg challenge' });

  try {
    const vr = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: ch.challenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    const { credentialID, credentialPublicKey, counter } = vr.registrationInfo;
    const user = users.get(username);
    user.credentials.push({
      credID: Buffer.from(credentialID).toString('base64url'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      counter
    });
    challenges.delete(username);
    req.session = req.session || {};
    req.session.user = { id: user.id, username };
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// --- Authentication (assertion) ---
app.get('/webauthn/login/options', (req, res) => {
  const username = String(req.query.username || '').trim();
  const user = users.get(username);
  if (!user || user.credentials.length === 0) return res.status(404).json({ message: 'not registered' });

  const options = generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: user.credentials.map(c => ({
      id: Buffer.from(c.credID, 'base64url'),
      type: 'public-key'
    }))
  });
  challenges.set(username, { authOptions: options });
  res.json(options);
});

app.post('/webauthn/login/verify', async (req, res) => {
  const { username, assertion } = req.body || {};
  const ch = challenges.get(username)?.authOptions;
  const user = users.get(username);
  if (!user || !ch) return res.status(400).json({ message: 'no auth challenge' });

  const dbCred = user.credentials.find(c => c.credID === assertion.id);
  if (!dbCred) return res.status(400).json({ message: 'credential not found' });

  try {
    const vr = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: ch.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(dbCred.credID, 'base64url'),
        credentialPublicKey: Buffer.from(dbCred.publicKey, 'base64url'),
        counter: dbCred.counter
      }
    });
    dbCred.counter = vr.authenticationInfo.newCounter;
    challenges.delete(username);
    req.session = req.session || {};
    req.session.user = { id: user.id, username };
    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
});
