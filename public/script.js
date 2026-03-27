// ========= Helpers =========
const $ = (id) => document.getElementById(id);

// ========= Toast =========
function toast(msg) {
  alert(msg);
}

// ========= Login Logic =========
const loginSheet = $("loginSheet");

const MAX_ATTEMPTS = 3;
const LOCK_TIME_MS = 5 * 60 * 1000;

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

document.addEventListener("DOMContentLoaded", () => {

  if (!unlocked()) loginSheet.classList.remove("hidden");

  $("btnLogin").addEventListener("click", () => {

    if (isLocked()) {
      return toast(`Locked. Try again in ${remainingLockTime()}s`);
    }

    const user = $("loginUser").value.trim();
    const pass = $("loginPassword").value.trim();
    const pin  = $("loginPin").value.trim();

    if (!user || !pass || !pin) {
      return toast("All fields required");
    }

    if (
      user === localStorage.getItem("auth.user") &&
      pass === localStorage.getItem("auth.pass") &&
      pin  === localStorage.getItem("auth.pin")
    ) {
      localStorage.setItem("unlocked", "1");
      localStorage.setItem("auth.attempts", "0");
      loginSheet.classList.add("hidden");
      toast("Login successful");
    } else {
      let attempts = Number(localStorage.getItem("auth.attempts") || "0") + 1;
      localStorage.setItem("auth.attempts", attempts);

      if (attempts >= MAX_ATTEMPTS) {
        lockAccount();
        toast("Too many attempts. Locked for 5 minutes");
      } else {
        toast(`Invalid credentials. ${MAX_ATTEMPTS - attempts} tries left`);
      }
    }
  });

  $("btnLogout").addEventListener("click", () => {
    localStorage.setItem("unlocked", "0");
    loginSheet.classList.remove("hidden");
    toast("Logged out");
  });

});
