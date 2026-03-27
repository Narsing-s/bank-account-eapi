/*************************
 * Shortcuts & Config
 *************************/
const $ = (id) => document.getElementById(id);
const qa = (sel) => Array.from(document.querySelectorAll(sel));

/*************************
 * API (CloudHub only)
 *************************/
function API(path) {
  return `${window.AppConfig.API_BASE}${path}`;
}

/*************************
 * UI Helpers
 *************************/
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
  $("loader").classList.toggle("hidden", !on);
}
function blurActive() {
  document.activeElement?.blur();
}

/*************************
 * Login / Multi‑User Auth
 *************************/
const USERS_KEY = "bank.users";
const SESSION_KEY = "bank.sessionUser";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}
function setUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}
function currentUser() {
  return localStorage.getItem(SESSION_KEY);
}

document.addEventListener("DOMContentLoaded", () => {
  const loginSheet = $("loginSheet");

  if (!currentUser()) {
    loginSheet.classList.remove("hidden");
  }

  $("btnLogin").addEventListener("click", () => {
    const user = $("loginUser").value.trim();
    const pass = $("loginPassword").value.trim();
    const pin  = $("loginPin").value.trim() || null;

    if (!user || !pass) {
      toast("Username and password required", "err");
      return;
    }

    const users = getUsers();

    // Auto‑register
    if (!users[user]) {
      users[user] = { password: pass, pin };
      setUsers(users);
    }

    if (
      users[user].password === pass &&
      (!users[user].pin || users[user].pin === pin)
    ) {
      localStorage.setItem(SESSION_KEY, user);
      loginSheet.classList.add("hidden");
      toast(`Welcome ${user}`);
    } else {
      toast("Invalid credentials", "err");
    }
  });
});

/*************************
 * Helpers
 *************************/
function convertDOB(d) {
  if (!d) return "";
  if (!/^\d{8}$/.test(d)) return "";
  return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6)}`;
}

async function doFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { data = text; }
  return { res, data };
}

/*************************
 * CREATE ACCOUNT
 *************************/
$("btnCreate").addEventListener("click", async () => {
  if (!currentUser()) {
    $("loginSheet").classList.remove("hidden");
    return;
  }

  const FullName     = $("name").value.trim();
  const dateOfBirth  = convertDOB($("dob").value.trim());
  const mobileNumber = $("mobile").value.trim();
  const email        = $("email").value.trim();
  const address      = $("address").value.trim();
  const adharNumber  = $("aadhaar").value.trim();
  const bankName     = $("bank").value;

  if (!FullName || !dateOfBirth || !mobileNumber || !email || !address) {
    toast("All fields are required", "err");
    return;
  }

  const payload = { FullName, dateOfBirth, mobileNumber, email, address };
  const qs = new URLSearchParams({ adharNumber, bankName }).toString();

  try {
    showLoader(true);
    const { res, data } = await doFetch(
      API(`/accounts?${qs}`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) throw new Error(data.message || "Create failed");

    toast("Account created successfully");
    console.log("Create Response:", data);
  } catch (e) {
    toast(e.message, "err");
  } finally {
    showLoader(false);
  }
});

/*************************
 * SEARCH ACCOUNT
 *************************/
$("btnSearch").addEventListener("click", async () => {
  const acc = $("getAcc").value.trim();
  if (!acc) return toast("Account number required", "err");

  try {
    showLoader(true);
    const { data } = await doFetch(API(`/accounts/${acc}`), { method: "GET" });
    $("bankCard").textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    toast("Search failed", "err");
  } finally {
    showLoader(false);
  }
});

/*************************
 * UPDATE ACCOUNT
 *************************/
$("btnUpdate").addEventListener("click", async () => {
  const acc = $("updateAcc").value.trim();
  if (!acc) return toast("Account number required", "err");

  const payload = {
    FullName: $("updateName").value.trim(),
    mobileNumber: $("updateMobile").value.trim()
  };

  try {
    showLoader(true);
    await doFetch(API(`/accounts/${acc}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    toast("Account updated");
  } catch {
    toast("Update failed", "err");
  } finally {
    showLoader(false);
  }
});

/*************************
 * DELETE ACCOUNT
 *************************/
$("btnDelete").addEventListener("click", async () => {
  const acc = $("deleteAcc").value.trim();
  if (!acc) return toast("Account number required", "err");

  try {
    showLoader(true);
    await doFetch(API(`/accounts/${acc}`), { method: "DELETE" });
    toast("Account deleted");
  } catch {
    toast("Delete failed", "err");
  } finally {
    showLoader(false);
  }
});
