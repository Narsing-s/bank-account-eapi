const $ = (id) => document.getElementById(id);

// ---------------- USERS ----------------
const USERS_KEY = "bank.users";
const SESSION_KEY = "bank.user";

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
const setUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const currentUser = () => localStorage.getItem(SESSION_KEY);

// ---------------- VOICE ----------------
let voiceEnabled = false;
function speak(msg) {
  if (!voiceEnabled) return;
  speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
}

// ---------------- SETTINGS ----------------
$("btnSettings").onclick = () => $("settingsSheet").classList.remove("hidden");
function closeSettings() { $("settingsSheet").classList.add("hidden"); }

$("voiceToggle").onchange = (e) => {
  voiceEnabled = e.target.checked;
  speak("Voice enabled");
};

$("languageSelect").onchange = (e) => {
  localStorage.setItem("lang", e.target.value);
  speak("Language changed");
};

// ---------------- LOGIN ----------------
if (!currentUser()) $("loginSheet").classList.remove("hidden");

$("btnLogin").onclick = () => {
  const u = $("loginUser").value.trim();
  const p = $("loginPassword").value.trim();
  const pin = $("loginPin").value.trim() || null;

  const users = getUsers();
  if (!users[u]) users[u] = { password: p, pin };

  if (users[u].password === p && (!users[u].pin || users[u].pin === pin)) {
    setUsers(users);
    localStorage.setItem(SESSION_KEY, u);
    $("loginSheet").classList.add("hidden");
    speak("Login successful");
  } else {
    alert("Invalid login");
  }
};

// ---------------- API HELPER ----------------
const API = (path) => `${window.AppConfig.API_BASE}${path}`;

// ---------------- CREATE ----------------
$("btnCreate").onclick = async () => {
  const payload = {
    FullName: $("name").value,
    dateOfBirth: $("dob").value,
    mobileNumber: $("mobile").value,
    email: $("email").value,
    address: $("address").value
  };

  const qs = `?adharNumber=${$("adharnumber").value}&bankName=${$("bankname").value}`;
  await fetch(API(`/accounts${qs}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  speak("Account created");
};

// ---------------- GET ----------------
$("btnGet").onclick = async () => {
  const acc = $("getAccountNumber").value;
  await fetch(API(`/accounts/${acc}`));
};

// ---------------- UPDATE ----------------
$("btnUpdate").onclick = async () => {
  const acc = $("updateAccountNumber").value;
  const payload = {
    FullName: $("updateName").value,
    mobileNumber: $("updateMobile").value,
    address: $("updateAddress").value
  };

  await fetch(API(`/accounts/${acc}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  speak("Account updated");
};

// ---------------- DELETE ----------------
$("btnDelete").onclick = async () => {
  const acc = $("deleteAccountNumber").value;
  await fetch(API(`/accounts/${acc}`), { method: "DELETE" });
  speak("Account deleted");
};
