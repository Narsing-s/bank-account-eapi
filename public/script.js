// ========= Helpers (DECLARE ONCE) =========
const $ = (id) => document.getElementById(id);

// ========= Toast =========
function toast(msg, type = "ok") {
  const wrap = $("toasts");
  if (!wrap) {
    alert(msg);
    return;
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => wrap.removeChild(el), 200);
  }, 2500);
}

// ========= API =========
function API(path) {
  return window.AppConfig.API_BASE + path;
}

// ========= USER STORAGE =========
const USERS_KEY   = "bank.users";
const SESSION_KEY = "bank.currentUser";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}
function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function currentUser() {
  return localStorage.getItem(SESSION_KEY);
}

// ========= LOGIN =========
document.addEventListener("DOMContentLoaded", () => {

  const loginSheet = $("loginSheet");

  // Always enforce login
  if (!currentUser()) loginSheet.classList.remove("hidden");
  else loginSheet.classList.add("hidden");

  $("btnLogin").addEventListener("click", () => {
    const user = $("loginUser").value.trim();
    const pass = $("loginPassword").value.trim();
    const pin  = $("loginPin").value.trim() || null;

    if (!user || !pass) {
      toast("Username and password required", "err");
      return;
    }

    const users = getUsers();

    // Auto-register new users
    if (!users[user]) {
      users[user] = { password: pass, pin };
      setUsers(users);
    }

    // Authenticate
    if (
      users[user].password === pass &&
      (users[user].pin ? users[user].pin === pin : true)
    ) {
      localStorage.setItem(SESSION_KEY, user);
      loginSheet.classList.add("hidden");   // ✅ CRITICAL FIX
      toast(`Welcome ${user}`);
    } else {
      toast("Invalid credentials", "err");
    }
  });
});

// ========= CREATE ACCOUNT =========
$("btnCreate").addEventListener("click", async () => {

  if (!currentUser()) {
    $("loginSheet").classList.remove("hidden");
    return;
  }

  console.log("Create clicked by:", currentUser());
  console.log("Calling Mule:", API("/accounts"));

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

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log("Mule response:", data);
    toast("Account created successfully");

  } catch (e) {
    console.error(e);
    toast("Request failed to reach Mule API", "err");
  }
});
