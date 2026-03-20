// -------- Shortcuts --------
const $  = (id) => document.getElementById(id);
const qa = (sel) => Array.from(document.querySelectorAll(sel));

/** API path resolver (supports android/web via dynamic /config.js) */
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

// Toasts
function toast(msg, type="ok"){
  const wrap = $("toasts");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(()=> wrap.removeChild(el), 220);
  }, 2800);
}

function showLoader(on){ loader.classList.toggle("hidden", !on); }
function blurActive(){ if (document.activeElement?.blur) document.activeElement.blur(); }

// Online status guard
function setOnline(online){
  statusDot.classList.toggle("online", online);
  statusDot.classList.toggle("offline", !online);
  statusText.textContent = online ? "Online" : "Offline";
}
let lastSuccess = 0;
setOnline(navigator.onLine);
window.addEventListener("online", ()=> setOnline(true));
window.addEventListener("offline", ()=> setOnline(false));
setInterval(()=>{
  const online = navigator.onLine && (Date.now()-lastSuccess < 15000);
  setOnline(online);
}, 4000);

// Bottom nav + EFAB route switching
function activateTab(tabId){
  qa(".screen").forEach(s => s.classList.toggle("active", s.id === tabId));
  qa(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.tab === tabId));
  // show EFAB only on create
  $("efab").style.display = tabId === "create" ? "inline-flex" : "none";
  setTimeout(()=> $(tabId)?.scrollIntoView({behavior:"smooth", block:"start"}), 40);
}
qa(".nav-item").forEach(btn => btn.addEventListener("click", ()=> activateTab(btn.dataset.tab)));
$("efab").addEventListener("click", ()=> {
  activateTab("create");
  $("#name")?.focus();
});

// Settings drawer
const settings = $("settings");
$("btnSettings").addEventListener("click", () => settings.classList.remove("hidden"));
$("btnCloseSettings").addEventListener("click", () => settings.classList.add("hidden"));

function applyTheme(theme){
  const html = document.documentElement;
  if (theme === "system") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}
function applyMotion(reduce){
  document.documentElement.classList.toggle("rm", !!reduce);
  localStorage.setItem("reduceMotion", reduce ? "1" : "0");
}
function applyContrast(hc){
  document.documentElement.classList.toggle("hc", !!hc);
  localStorage.setItem("highContrast", hc ? "1" : "0");
}
document.querySelectorAll('[data-theme]').forEach(btn=>{
  btn.addEventListener("click", ()=> applyTheme(btn.dataset.theme));
});
$("toggleMotion").addEventListener("change", (e)=> applyMotion(e.target.checked));
$("toggleContrast").addEventListener("change", (e)=> applyContrast(e.target.checked));
(function initSettings(){
  const theme = localStorage.getItem("theme") || "system";
  const reduce = localStorage.getItem("reduceMotion") === "1";
  const hc = localStorage.getItem("highContrast") === "1";
  applyTheme(theme); applyMotion(reduce); applyContrast(hc);
  $("toggleMotion").checked = reduce; $("toggleContrast").checked = hc;
})();

// Fetch helper
async function doFetch(url, options){
  const res = await fetch(url, options);
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = text; }
  return { res, data, text };
}

// Response Sheet
function showResponse(obj) {
  const pretty = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  respBody.textContent = pretty;
  respOverlay.classList.remove("hidden");
}
function hideResponse(){ respOverlay.classList.add("hidden"); }
$("btnCloseResp").addEventListener("click", hideResponse);
$("btnCopyResp").addEventListener("click", async ()=>{
  try {
    await navigator.clipboard.writeText(respBody.textContent);
    toast("Copied");
  } catch {
    toast("Copy failed","err");
  }
});

// Helpers
function convertDOB(d){
  if(!d) return "";
  const s = String(d).trim();
  if(!/^\d{8}$/.test(s)) return "";
  return `${s.substring(0,4)}-${s.substring(4,6)}-${s.substring(6,8)}`;
}

// ---------- CREATE ----------
$("btnCreate").addEventListener("click", async ()=>{
  blurActive();
  const FullName     = ($("#name").value || "").trim();
  const dateOfBirth  = convertDOB(($("#dob").value || "").trim());
  const mobileNumber = ($("#mobile").value || "").trim();
  const email        = ($("#email").value || "").trim();
  const address      = ($("#address").value || "").trim();
  const adharNumber  = ($("#aadhaar").value || "").trim();
  const bankName     = ($("#bank").value || "").trim();

  if(!FullName){ toast("Full Name is required", "err"); $("#name").focus(); return; }
  if(!dateOfBirth){ toast("DOB must be YYYYMMDD", "err"); $("#dob").focus(); return; }
  if(!mobileNumber){ toast("Mobile is required", "err"); $("#mobile").focus(); return; }
  if(!email){ toast("Email is required", "err"); $("#email").focus(); return; }
  if(!address){ toast("Address is required", "err"); $("#address").focus(); return; }
  if(!/^\d{12}$/.test(adharNumber)){ toast("Aadhaar must be 12 digits", "err"); $("#aadhaar").focus(); return; }
  if(!["SBI","HDFC","APGIVB","AXIS","ICICI"].includes(bankName)){ toast("Select a valid bank", "err"); $("#bank").focus(); return; }

  const payload = { FullName, dateOfBirth, mobileNumber, email, address };

  const btn = $("btnCreate");
  btn.disabled = true; showLoader(true);
  try{
    const qs = new URLSearchParams({ adharNumber, bankName }).toString();
    const { res, data, text } = await doFetch(API(`/accounts?${qs}`), {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    if(!(res.status === 200 || res.status === 201)){
      showResponse(text || data);
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    showResponse(data);
    toast("Account created");
    lastSuccess = Date.now();
  }catch(e){
    toast(e.message, "err");
  }finally{
    btn.disabled = false; showLoader(false);
  }
});

// ---------- SEARCH ----------
$("btnSearch").addEventListener("click", async ()=>{
  blurActive();
  const id = ($("#getAcc").value || "").trim();
  if(!id){ toast("Account number is required", "err"); return; }

  const cardWrap = $("bankCard");
  cardWrap.classList.remove("placeholder");
  cardWrap.setAttribute("aria-busy", "true");
  cardWrap.innerHTML = `<div class="skeleton title"></div><div class="skeleton line"></div><div class="skeleton line"></div>`;

  showLoader(true);
  try{
    const { res, data, text } = await doFetch(API(`/accounts/${encodeURIComponent(id)}`), { method:"GET" });
    if(!res.ok){
      showResponse(text || data);
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    // normalize possible payload shapes
    const d = (data && data.bankDetails && data.bankDetails.account_data) ? data.bankDetails.account_data : data;
    const fullName = d.FullName || d.fullName || d.FULLNAME || "(No Name)";
    const accountNumber = d.accountNumber || d.ACCOUNTNUMBER;
    const mobile = d.mobileNumber || d.MOBILENUMBER;
    const dob = d.dateOfBirth || d.DATEOFBIRTH;
    const email = d.email || d.EMAIL;
    const address = d.address || d.ADDRESS;

    const inner = `
      <h3>${fullName}</h3>
      <p><b>Account:</b> ${accountNumber ?? "(unknown)"}</p>
      <p><b>Mobile:</b> ${mobile ?? "(unknown)"}</p>
      <p><b>Email:</b> ${email ?? "(unknown)"}</p>
      <p><b>DOB:</b> ${dob ?? "(unknown)"}</p>
      <p><b>Address:</b> ${address ?? "(unknown)"}</p>
    `;
    cardWrap.classList.remove("placeholder");
    cardWrap.innerHTML = inner;
    cardWrap.setAttribute("aria-busy", "false");

    showResponse(d);
    toast("Account fetched");
    lastSuccess = Date.now();
  }catch(e){
    toast(e.message, "err");
  }finally{
    showLoader(false);
  }
});

// ---------- UPDATE ----------
$("btnUpdate").addEventListener("click", async ()=>{
  blurActive();
  const id = ($("#updateAcc").value || "").trim();
  if(!id){ toast("Account number is required", "err"); return; }

  const payload = {
    FullName: ($("#updateName").value || "").trim(),
    email: ($("#updateEmail").value || "").trim(),
    mobileNumber: ($("#updateMobile").value || "").trim()
  };
  Object.keys(payload).forEach(k => payload[k] === "" && delete payload[k]);
  if(Object.keys(payload).length === 0){
    toast("Provide at least one field to update", "err"); return;
  }

  const btn = $("btnUpdate");
  btn.disabled = true; showLoader(true);
  try{
    const { res, data, text } = await doFetch(API(`/accounts/${encodeURIComponent(id)}`), {
      method: "PATCH",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      showResponse(text || data);
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    showResponse(data);
    toast("Account updated");
    lastSuccess = Date.now();
  }catch(e){
    toast(e.message, "err");
  }finally{
    btn.disabled = false; showLoader(false);
  }
});

// ---------- DELETE ----------
$("btnDelete").addEventListener("click", async ()=>{
  blurActive();
  const id = ($("#deleteAcc").value || "").trim();
  if(!id){ toast("Account number is required", "err"); return; }

  const btn = $("btnDelete");
  btn.disabled = true; showLoader(true);
  try{
    const { res, data, text } = await doFetch(API(`/accounts/${encodeURIComponent(id)}`), { method:"DELETE" });
    if(!res.ok){
      showResponse(text || data);
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    showResponse(data);
    toast("Account deleted");
    lastSuccess = Date.now();
  }catch(e){
    toast(e.message, "err");
  }finally{
    btn.disabled = false; showLoader(false);
  }
});
