/***************** Helpers *****************/
const $ = (id) => document.getElementById(id);

/***************** Toast *****************/
function toast(msg) {
  const d = document.createElement("div");
  d.textContent = msg;
  d.style.background = "#333";
  d.style.color = "#fff";
  d.style.padding = "6px";
  d.style.margin = "4px";
  $("toasts").appendChild(d);
  setTimeout(() => d.remove(), 2500);
}

/***************** API *****************/
const API = (path) => `${window.AppConfig.API_BASE}${path}`;

/***************** USERS *****************/
const USERS_KEY = "bank.users";
const SESSION_KEY = "bank.user";

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
const setUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const currentUser = () => localStorage.getItem(SESSION_KEY);

/***************** LOGIN *****************/
if (!currentUser()) $("loginSheet").classList.remove("hidden");

$("btnLogin").onclick = () => {
  const u = $("loginUser").value.trim();
  const p = $("loginPassword").value.trim();
  const pin = $("loginPin").value.trim() || null;

  if (!u || !p) {
    alert("Username & password required");
    return;
  }

  const users = getUsers();
  if (!users[u]) users[u] = { password: p, pin };
  setUsers(users);

  if (users[u].password === p && (!users[u].pin || users[u].pin === pin)) {
    localStorage.setItem(SESSION_KEY, u);
    $("loginSheet").classList.add("hidden");
    toast("Login successful");
  } else {
    alert("Invalid login");
  }
};

/***************** CREATE *****************/
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

/***************** ✅ GET (FIXED) *****************/
$("btnGet").onclick = async () => {
  const acc = $("getAccountNumber").value.trim();
  if (!acc) {
    alert("Account number required");
    return;
  }

  try {
    const res = await fetch(API(`/accounts/${acc}`), {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);      // ✅ JSON response
    } catch {
      data = raw;                 // ✅ Non‑JSON fallback
    }

    $("getResult").textContent =
      typeof data === "string"
        ? data
        : JSON.stringify(data, null, 2);

    console.log("GET success:", data);

  } catch (e) {
    console.error("GET failed:", e);
    $("getResult").textContent =
      "Failed to fetch account\n\n" + e.message;
  }
};

/***************** UPDATE *****************/
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

  toast("Account updated");
};

/***************** DELETE *****************/
$("btnDelete").onclick = async () => {
  const acc = $("deleteAccountNumber").value;
  await fetch(API(`/accounts/${acc}`), { method: "DELETE" });
  toast("Account deleted");
};
