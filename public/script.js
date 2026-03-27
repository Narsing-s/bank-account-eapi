/******************** Helpers ********************/
const $ = (id) => document.getElementById(id);

/******************** Toast ********************/
function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.background = "#333";
  t.style.color = "#fff";
  t.style.padding = "8px";
  t.style.margin = "5px";
  $("toasts").appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

/******************** API ********************/
const API = (path) => `${window.AppConfig.API_BASE}${path}`;

/******************** USERS ********************/
const USERS_KEY = "bank.users";
const SESSION_KEY = "bank.user";

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
const setUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const currentUser = () => localStorage.getItem(SESSION_KEY);

/******************** VOICE ********************/
let voiceEnabled = false;
function speak(msg) {
  if (!voiceEnabled) return;
  speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
}

/******************** SETTINGS ********************/
$("btnSettings").onclick = () => $("settingsSheet").classList.remove("hidden");
$("closeSettings").onclick = () => $("settingsSheet").classList.add("hidden");

$("voiceToggle").onchange = (e) => {
  voiceEnabled = e.target.checked;
  speak("Voice enabled");
};

$("languageSelect").onchange = () => speak("Language changed");

/******************** LOGIN ********************/
if (!currentUser()) $("loginSheet").classList.remove("hidden");

$("btnLogin").onclick = () => {
  const u = $("loginUser").value.trim();
  const p = $("loginPassword").value.trim();
  const pin = $("loginPin").value.trim() || null;

  if (!u || !p) return alert("Username & password required");

  const users = getUsers();
  if (!users[u]) users[u] = { password: p, pin };
  setUsers(users);

  if (users[u].password === p && (!users[u].pin || users[u].pin === pin)) {
    localStorage.setItem(SESSION_KEY, u);
    $("loginSheet").classList.add("hidden");
    speak("Login successful");
  } else {
    alert("Invalid login");
  }
};

/******************** CREATE ********************/
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

  toast("Account created");
};

/******************** GET (✅ FIXED) ********************/
$("btnGet").onclick = async () => {
  const acc = $("getAccountNumber").value.trim();
  if (!acc) return alert("Account number required");

  try {
    const res = await fetch(API(`/accounts/${acc}`));
    if (!res.ok) throw new Error("Not found");

    const data = await res.json();

    // ✅ SHOW DATA IN UI
    $("getResult").textContent = JSON.stringify(data, null, 2);
    console.log("GET response:", data);
  } catch (e) {
    $("getResult").textContent = "Failed to fetch account";
  }
};

/******************** UPDATE ********************/
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

/******************** DELETE ********************/
$("btnDelete").onclick = async () => {
  const acc = $("deleteAccountNumber").value;
  await fetch(API(`/accounts/${acc}`), { method: "DELETE" });
  speak("Account deleted");
};
``
