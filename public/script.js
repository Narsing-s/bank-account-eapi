// ========= Shortcuts & Config =========
const $  = (id) => document.getElementById(id);
const qa = (sel) => Array.from(document.querySelectorAll(sel));

function API(path) {
  const cfg = window.AppConfig || { mode: "web", WEB_PREFIX: "/api", ANDROID_BASE: "" };
  if (cfg.mode === "android" && cfg.ANDROID_BASE) return `${cfg.ANDROID_BASE}${path}`;
  const prefix = window.API_PREFIX || cfg.WEB_PREFIX || "/api";
  return `${prefix}${path}`;
}

const statusDot   = $("statusDot");
const statusText  = $("statusText");
const loader      = $("loader");
const respOverlay = $("respOverlay");
const respBody    = $("respBody");

function toast(msg, type = "ok") {
  const wrap = $("toasts");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => wrap.removeChild(el), 220);
  }, 2800);
}

function showLoader(on) {
  loader.classList.toggle("hidden", !on);
}
function blurActive() {
  if (document.activeElement?.blur) document.activeElement.blur();
}

// ========= Simple Login + Attempt Limit + Change Credentials =========
const loginSheet = $("loginSheet");

const MAX_ATTEMPTS = 3;
const LOCK_TIME_MS = 5 * 60 * 1000;

// ---- Init defaults safely ----
(function initAuth() {
  if (localStorage.getItem("auth.user") === null) {
    localStorage.setItem("auth.user", "admin");
    localStorage.setItem("auth.pass", "admin123");
    localStorage.setItem("auth.pin", "1234");
    localStorage.setItem("auth.attempts", "0");
    localStorage.setItem("unlocked", "0");
  }
})();

function unlocked() {
  return localStorage.getItem("unlocked") === "1";
}

function requireUnlock() {
  if (!unlocked()) loginSheet.classList.remove("hidden");
}

function setUnlocked(on) {
  localStorage.setItem("unlocked", on ? "1" : "0");
  loginSheet.classList.toggle("hidden", on);
}

function lockAccount() {
  localStorage.setItem("auth.lockUntil", Date.now() + LOCK_TIME_MS);
}

function isLocked() {
  const t = Number(localStorage.getItem("auth.lockUntil") || 0);
  return Date.now() < t;
}

function remainingLockTime() {
  const t = Number(localStorage.getItem("auth.lockUntil") || 0);
  return Math.ceil((t - Date.now()) / 1000);
}

// Always enforce login
requireUnlock();

// ---- Login ----
$("btnLogin")?.addEventListener("click", () => {
  if (isLocked()) {
    return toast(`Account locked. Try again in ${remainingLockTime()}s`, "err");
  }

  const user = ($("#loginUser").value || "").trim();
  const pass = ($("#loginPassword").value || "").trim();
  const pin  = ($("#loginPin").value || "").trim();

  if (!user || !pass || !pin) {
    return toast("All fields are required", "err");
  }

  const sUser = localStorage.getItem("auth.user");
  const sPass = localStorage.getItem("auth.pass");
  const sPin  = localStorage.getItem("auth.pin");

  if (user === sUser && pass === sPass && pin === sPin) {
    localStorage.setItem("auth.attempts", "0");
    localStorage.removeItem("auth.lockUntil");
    setUnlocked(true);
    toast("Login successful");
  } else {
    let attempts = Number(localStorage.getItem("auth.attempts") || "0") + 1;
    localStorage.setItem("auth.attempts", String(attempts));

    if (attempts >= MAX_ATTEMPTS) {
      lockAccount();
      toast("Too many attempts. Locked for 5 minutes", "err");
    } else {
      toast(`Invalid credentials (${MAX_ATTEMPTS - attempts} attempts left)`, "err");
    }
  }
});

// ---- Logout ----
$("btnLogout")?.addEventListener("click", () => {
  setUnlocked(false);
  toast("Logged out");
});

// ---- Change Password & PIN ----
$("btnChangeCreds")?.addEventListener("click", () => {
  const oldPass = ($("#oldPassword").value || "").trim();
  const oldPin  = ($("#oldPin").value || "").trim();
  const newPass = ($("#newPassword").value || "").trim();
  const newPin  = ($("#newPin").value || "").trim();

  if (!oldPass || !oldPin || !newPass || !newPin) {
    return toast("All fields are required", "err");
  }

  if (
    oldPass !== localStorage.getItem("auth.pass") ||
    oldPin  !== localStorage.getItem("auth.pin")
  ) {
    return toast("Old password or PIN incorrect", "err");
  }

  if (!/^\d{4,}$/.test(newPin)) {
    return toast("PIN must be at least 4 digits", "err");
  }

  localStorage.setItem("auth.pass", newPass);
  localStorage.setItem("auth.pin", newPin);
  toast("Password & PIN updated");
});

// ========= CRUD Buttons =========
// ✅ Everything else in your original file remains unchanged
