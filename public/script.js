// ========= Helpers (DECLARE ONCE) =========
const $ = (id) => document.getElementById(id);
const qa = (sel) => Array.from(document.querySelectorAll(sel));

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
    setTimeout(() => wrap.removeChild(el), 220);
  }, 2800);
}

// ========= API =========
function API(path) {
  return `${window.AppConfig.API_BASE}${path}`;
}

// ========= USER STORAGE =========
const USERS_KEY = "bank.users";
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
function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}

// ========= LOGIN =========
document.addEventListener("DOMContentLoaded", () => {

  const loginSheet = $("loginSheet");

  // Always show login if no session
  if (!currentUser()) {
    loginSheet.classList.remove("hidden");
  }

  $("btnLogin").addEventListener("click", () => {
    const user = $("loginUser").value.trim();
    const pass = $("loginPassword").value.trim();
    const pin  = $("loginPin").value.trim() || null;

    if (!user || !pass) {
      toast("Username and password are required", "err");
      return;
    }

    const users = getUsers();

    // Auto-register new user
    if (!users[user]) {
      users[user] = {
        password: pass,
        pin: pin
      };
      setUsers(users);
    }

    // Authenticate
    if (
      users[user].password === pass &&
      (users[user].pin ? users[user].pin === pin : true)
    ) {
      localStorage.setItem(SESSION_KEY, user);
      loginSheet.classList.add("hidden");
      toast(`Welcome ${user}`);
    } else {
      toast("Invalid credentials", "err");
    }
  });

});

// ========= CREATE ACCOUNT =========
$("btnCreate")?.addEventListener("click", async () => {

  if (!currentUser()) {
    $("loginSheet").classList.remove("hidden");
    return;
  }

  const payload = {
    FullName: $("name").value.trim(),
    dateOfBirth: $("dob").value.trim(),
    mobileNumber: $("mobile").value.trim(),
    email: $("email").value.trim(),
    address: $("address").value.trim(),
    createdBy: currentUser()
  };

  if (!payload.FullName || !payload.mobileNumber) {
    toast("Required fields missing", "err");
    return;
  }

  try {
    const res = await fetch(API("/accounts"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("Mule Response:", data);
    toast("Account created successfully");

  } catch (e) {
    console.error(e);
    toast("Failed to reach Mule API", "err");
  }
});// ========= Helpers (DECLARE ONCE) =========
const $ = (id) => document.getElementById(id);
const qa = (sel) => Array.from(document.querySelectorAll(sel));

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
    setTimeout(() => wrap.removeChild(el), 220);
  }, 2800);
}

// ========= API =========
function API(path) {
  return `${window.AppConfig.API_BASE}${path}`;
}

// ========= USER STORAGE =========
const USERS_KEY = "bank.users";
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
function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}

// ========= LOGIN =========
document.addEventListener("DOMContentLoaded", () => {

  const loginSheet = $("loginSheet");

  // Always show login if no session
  if (!currentUser()) {
    loginSheet.classList.remove("hidden");
  }

  $("btnLogin").addEventListener("click", () => {
    const user = $("loginUser").value.trim();
    const pass = $("loginPassword").value.trim();
    const pin  = $("loginPin").value.trim() || null;

    if (!user || !pass) {
      toast("Username and password are required", "err");
      return;
    }

    const users = getUsers();

    // Auto-register new user
    if (!users[user]) {
      users[user] = {
        password: pass,
        pin: pin
      };
      setUsers(users);
    }

    // Authenticate
    if (
      users[user].password === pass &&
      (users[user].pin ? users[user].pin === pin : true)
    ) {
      localStorage.setItem(SESSION_KEY, user);
      loginSheet.classList.add("hidden");
      toast(`Welcome ${user}`);
    } else {
      toast("Invalid credentials", "err");
    }
  });

});

// ========= CREATE ACCOUNT =========
$("btnCreate")?.addEventListener("click", async () => {

  if (!currentUser()) {
    $("loginSheet").classList.remove("hidden");
    return;
  }

  const payload = {
    FullName: $("name").value.trim(),
    dateOfBirth: $("dob").value.trim(),
    mobileNumber: $("mobile").value.trim(),
    email: $("email").value.trim(),
    address: $("address").value.trim(),
    createdBy: currentUser()
  };

  if (!payload.FullName || !payload.mobileNumber) {
    toast("Required fields missing", "err");
    return;
  }

  try {
    const res = await fetch(API("/accounts"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("Mule Response:", data);
    toast("Account created successfully");

  } catch (e) {
    console.error(e);
    toast("Failed to reach Mule API", "err");
  }
});
