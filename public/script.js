// ========= Shortcuts =========
const $  = (id) => document.getElementById(id);
const qa = (sel) => Array.from(document.querySelectorAll(sel));

// ========= Toast =========
function toast(msg, type="ok"){
  const wrap = $("toasts");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => wrap.removeChild(el), 220);
  }, 2800);
}// ========= Helpers =========
const $ = (id) => document.getElementById(id);

function toast(msg) {
  alert(msg);
}

// ========= API =========
function API(path) {
  return `${window.AppConfig.API_BASE}${path}`;
}

// ========= USERS =========
const USERS_KEY = "bank.users";
const SESSION_KEY = "bank.session";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}
function setUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}
function currentUser() {
  return localStorage.getItem(SESSION_KEY);
}

// ========= LOGIN =========
$("btnLogin").addEventListener("click", () => {
  const user = $("loginUser").value.trim();
  const pass = $("loginPassword").value.trim();
  const pin  = $("loginPin").value.trim() || null;

  if (!user || !pass) {
    toast("Username and password required");
    return;
  }

  const users = getUsers();

  if (!users[user]) {
    // auto register
    users[user] = { password: pass, pin };
    setUsers(users);
  }

  if (
    users[user].password === pass &&
    (users[user].pin ? users[user].pin === pin : true)
  ) {
    localStorage.setItem(SESSION_KEY, user);
    $("loginSheet").style.display = "none";
    toast("Logged in");
  } else {
    toast("Invalid credentials");
  }
});

// ========= CREATE ACCOUNT =========
$("btnCreate").addEventListener("click", async () => {

  if (!currentUser()) {
    $("loginSheet").style.display = "block";
    return;
  }

  const payload = {
    FullName: $("name").value,
    dateOfBirth: $("dob").value,
    mobileNumber: $("mobile").value,
    email: $("email").value,
    address: $("address").value,
    createdBy: currentUser()
  };

  try {
    const res = await fetch(API("/accounts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    toast("Account created successfully");
    console.log("Mule response:", data);

  } catch (e) {
    console.error(e);
    toast("Failed to reach Mule API");
  }
});

// ========= LOGIN (REPLACEMENT FOR BIOMETRICS) =========
const loginSheet = $("loginSheet");

const MAX_ATTEMPTS = 3;
const LOCK_TIME_MS = 5 * 60 * 1000;

(function initAuth(){
  if (!localStorage.getItem("auth.user")) {
    localStorage.setItem("auth.user", "admin");
    localStorage.setItem("auth.pass", "admin123");
    localStorage.setItem("auth.pin", "1234");
    localStorage.setItem("auth.attempts", "0");
    localStorage.setItem("unlocked", "0");
  }
})();

function unlocked(){
  return localStorage.getItem("unlocked") === "1";
}

function requireUnlock(){
  if (!unlocked()) loginSheet.classList.remove("hidden");
}

function setUnlocked(on){
  localStorage.setItem("unlocked", on ? "1" : "0");
  loginSheet.classList.toggle("hidden", on);
}

function lockAccount(){
  localStorage.setItem("auth.lockUntil", Date.now() + LOCK_TIME_MS);
}

function isLocked(){
  const t = Number(localStorage.getItem("auth.lockUntil") || 0);
  return Date.now() < t;
}

function remainingLockTime(){
  const t = Number(localStorage.getItem("auth.lockUntil") || 0);
  return Math.ceil((t - Date.now()) / 1000);
}

document.addEventListener("DOMContentLoaded", () => {

  requireUnlock();

  $("btnLogin")?.addEventListener("click", () => {

    if (isLocked()) {
      return toast(`Account locked. Try again in ${remainingLockTime()}s`, "err");
    }

    const user = $("loginUser").value.trim();
    const pass = $("loginPassword").value.trim();
    const pin  = $("loginPin").value.trim();

    if (!user || !pass || !pin) {
      return toast("All fields are required", "err");
    }

    if (
      user === localStorage.getItem("auth.user") &&
      pass === localStorage.getItem("auth.pass") &&
      pin  === localStorage.getItem("auth.pin")
    ) {
      localStorage.setItem("auth.attempts", "0");
      localStorage.removeItem("auth.lockUntil");
      setUnlocked(true);
      toast("Login successful");
    } else {
      let attempts = Number(localStorage.getItem("auth.attempts")) + 1;
      localStorage.setItem("auth.attempts", attempts);

      if (attempts >= MAX_ATTEMPTS) {
        lockAccount();
        toast("Too many attempts. Locked for 5 minutes", "err");
      } else {
        toast(`Invalid credentials (${MAX_ATTEMPTS - attempts} left)`, "err");
      }
    }
  });
});
``
