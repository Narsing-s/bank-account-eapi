// ===================== Shortcuts =====================
const $ = (id) => document.getElementById(id);
const qa = (sel) => Array.from(document.querySelectorAll(sel));

function API(path) {
  const cfg = window.AppConfig || { mode: "web", WEB_PREFIX: "/api", ANDROID_BASE: "" };
  if (cfg.mode === "android" && cfg.ANDROID_BASE) return `${cfg.ANDROID_BASE}${path}`;
  const prefix = window.API_PREFIX || cfg.WEB_PREFIX || "/api";
  return `${prefix}${path}`;
}

// ===================== Toasts =====================
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
  const loader = $("loader");
  if (loader) loader.classList.toggle("hidden", !on);
}
function blurActive() {
  if (document.activeElement?.blur) document.activeElement.blur();
}

// ===================== Online Indicator =====================
const statusDot = $("statusDot");
const statusText = $("statusText");

function setOnline(online) {
  statusDot?.classList.toggle("online", online);
  statusDot?.classList.toggle("offline", !online);
  statusText.textContent = online ? "Online" : "Offline";
}

let lastSuccess = 0;
setOnline(navigator.onLine);

// ===================== API Helper =====================
async function doFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }
  return { res, data, text };
}

// ===================== LOGIN SYSTEM =====================
const loginSheet = $("loginSheet");

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

requireUnlock();

// -------- SWITCH LOGIN MODES --------
$("btnLoginOtp").onclick = () => {
  $("otpBox").classList.remove("hidden");
  $("passwordBox").classList.add("hidden");
};
$("btnShowPasswordBox").onclick = () => {
  $("passwordBox").classList.remove("hidden");
  $("otpBox").classList.add("hidden");
};

// -------- REGISTER USER --------
$("btnRegister").onclick = async () => {
  const email = $("regEmail").value.trim();
  const mobile = $("regMobile").value.trim();
  const password = $("regPassword").value.trim();

  if (!email || !mobile || !password) {
    return toast("All fields required", "err");
  }

  showLoader(true);

  const { data } = await doFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, mobile, password })
  });

  showLoader(false);

  if (data.ok) {
    toast("Registered! Login now.");
  } else {
    toast(data.message || "Failed", "err");
  }
};

// -------- SEND OTP --------
$("btnSendOtp").onclick = async () => {
  const user = $("loginUser").value.trim();
  if (!user) return toast("Enter email or mobile", "err");

  showLoader(true);
  const { data } = await doFetch("/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user })
  });
  showLoader(false);

  toast(data.message || "OTP Sent");
};

// -------- VERIFY OTP --------
$("btnVerifyOtp").onclick = async () => {
  const user = $("loginUser").value.trim();
  const otp = $("otpCode").value.trim();

  if (!otp) return toast("Enter OTP", "err");

  showLoader(true);
  const { data } = await doFetch("/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, otp })
  });
  showLoader(false);

  if (data.ok) {
    toast("Login Successful");
    setUnlocked(true);
  } else {
    toast(data.message || "OTP Failed", "err");
  }
};

// -------- PASSWORD LOGIN --------
$("btnPasswordLogin").onclick = async () => {
  const user = $("loginUser").value.trim();
  const password = $("loginPassword").value.trim();

  if (!password) return toast("Enter password", "err");

  showLoader(true);
  const { data } = await doFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, password })
  });
  showLoader(false);

  if (data.ok) {
    toast("Login Successful");
    setUnlocked(true);
  } else {
    toast(data.message || "Login Failed", "err");
  }
};

// ===================== Navigation =====================
function activateTab(id) {
  qa(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  qa(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.screen === id));
}
qa(".nav-item").forEach((btn) =>
  btn.addEventListener("click", () => activateTab(btn.dataset.screen))
);

// ===================== CRUD OPERATIONS =====================

// Convert YYYYMMDD to YYYY-MM-DD
function convertDOB(d) {
  if (!/^\d{8}$/.test(d)) return "";
  return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
}

// ------- CREATE -------
$("btnCreate").onclick = async () => {
  if (!unlocked()) return requireUnlock();

  blurActive();
  const FullName = $("name").value.trim();
  const dateOfBirth = convertDOB($("dob").value.trim());
  const mobileNumber = $("mobile").value.trim();
  const email = $("email").value.trim();
  const address = $("address").value.trim();
  const adharNumber = $("aadhaar").value.trim();
  const bankName = $("bank").value.trim();

  if (!FullName || !dateOfBirth || !mobileNumber || !email || !address || !adharNumber) {
    return toast("Complete all fields", "err");
  }

  showLoader(true);

  const { res, data } = await doFetch(
    API(`/accounts?${new URLSearchParams({ adharNumber, bankName })}`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ FullName, dateOfBirth, mobileNumber, email, address })
    }
  );

  showLoader(false);

  if (res.ok) toast("Account created");
  else toast(data.message || "Failed", "err");
};

// ------- SEARCH -------
$("btnSearch").onclick = async () => {
  if (!unlocked()) return requireUnlock();
  blurActive();

  const id = $("getAcc").value.trim();
  if (!id) return toast("Enter account number", "err");

  $("bankCard").innerHTML = "Loading...";

  const { res, data } = await doFetch(API(`/accounts/${id}`), { method: "GET" });

  if (!res.ok) return toast("Not found", "err");

  const d = data.bankDetails?.account_data || data;

  $("bankCard").innerHTML = `
    <h3>${d.FullName}</h3>
    <p><b>Account:</b> ${d.accountNumber}</p>
    <p><b>Mobile:</b> ${d.mobileNumber}</p>
    <p><b>Email:</b> ${d.email}</p>
    <p><b>DOB:</b> ${d.dateOfBirth}</p>
    <p><b>Address:</b> ${d.address}</p>
  `;
};

// ------- UPDATE -------
$("btnUpdate").onclick = async () => {
  if (!unlocked()) return requireUnlock();

  const id = $("updateAcc").value.trim();
  const payload = {
    FullName: $("updateName").value.trim(),
    email: $("updateEmail").value.trim(),
    mobileNumber: $("updateMobile").value.trim()
  };
  Object.keys(payload).forEach((k) => !payload[k] && delete payload[k]);

  if (!id) return toast("Account number required", "err");
  if (Object.keys(payload).length === 0) return toast("Nothing to update", "err");

  showLoader(true);
  const { res, data } = await doFetch(API(`/accounts/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  showLoader(false);

  if (res.ok) toast("Updated");
  else toast(data.message || "Failed", "err");
};

// ------- DELETE -------
$("btnDelete").onclick = async () => {
  if (!unlocked()) return requireUnlock();

  const id = $("deleteAcc").value.trim();
  if (!id) return toast("Enter account number", "err");

  showLoader(true);
  const { res, data } = await doFetch(API(`/accounts/${id}`), { method: "DELETE" });
  showLoader(false);

  if (res.ok) toast("Deleted");
  else toast(data.message || "Failed", "err");
};

// ===================== Transactions =====================
let txCursor = null;
let lastAcc = "";

$("btnTxRefresh").onclick = async () => {
  const id = $("getAcc").value || $("updateAcc").value || $("deleteAcc").value || lastAcc;

  if (!id) return toast("Search an account first", "err");

  lastAcc = id;
  loadTxns(id, true);
};

async function loadTxns(acc, reset = false) {
  if (reset) $("txList").innerHTML = "Loading...";

  const { res, data } = await doFetch(API(`/accounts/${acc}/transactions?limit=50`), {
    method: "GET"
  });

  if (!res.ok) return toast("Failed", "err");

  const list = $("txList");
  list.innerHTML = "";

  (data.items || []).forEach((tx) => {
    const row = document.createElement("div");
    row.className = "txn-row";
    row.innerHTML = `
      <div class="left">
        <div>${tx.desc}</div>
        <small>${new Date(tx.ts).toLocaleString()}</small>
      </div>
      <div class="amt ${tx.amount >= 0 ? "cred" : "deb"}">
        ${tx.amount >= 0 ? "+" : ""}${tx.amount}
      </div>
    `;
    list.appendChild(row);
  });
}
