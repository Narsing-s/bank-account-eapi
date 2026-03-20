// ========= Utilities =========
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
    setTimeout(()=> wrap.removeChild(el), 250);
  }, 3000);
}

function showLoader(on){ loader.classList.toggle("hidden", !on); }
function blurActive(){ if (document.activeElement?.blur) document.activeElement.blur(); }

// Online status (network + last successful API)
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

// Ripple origin follow pointer
document.addEventListener("pointerdown", e => {
  const el = e.target.closest(".ripple, .tab-btn, .bn-btn, .primary, .danger, .chip, .icon-btn");
  if (!el) return;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--y", `${e.clientY - rect.top}px`);
});

// Convert YYYYMMDD to YYYY-MM-DD (API expects date-only)
function convertDOB(d){
  if(!d) return "";
  const s = String(d).trim();
  if(!/^\d{8}$/.test(s)) return "";
  return `${s.substring(0,4)}-${s.substring(4,6)}-${s.substring(6,8)}`;
}

// Sticky action bar height -> lift toasts
function updateStickyHeight(){
  const activePanel = document.querySelector(".panel.active");
  const bar = activePanel?.querySelector(".action-bar");
  let h = 0;
  if (bar) {
    const rect = bar.getBoundingClientRect();
    const viewportH = window.innerHeight;
    if (rect.bottom > viewportH - 4) h = Math.max(0, rect.height);
  }
  document.documentElement.style.setProperty("--stickyH", `${h}px`);
}
window.addEventListener("resize", updateStickyHeight);
window.addEventListener("scroll", updateStickyHeight);
setInterval(updateStickyHeight, 500);

// Tabs (top) & Bottom nav keep in sync
function activateTab(tabId){
  qa(".tab-btn").forEach(b=> b.classList.toggle("active", b.dataset.tab===tabId));
  qa(".panel").forEach(p=> p.classList.toggle("active", p.id===tabId));
  qa(".bn-btn").forEach(b=> b.classList.toggle("active", b.dataset.tab===tabId));
  setTimeout(()=> $(tabId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  setTimeout(updateStickyHeight, 120);
}
qa(".tab-btn").forEach(btn => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));
qa(".bn-btn").forEach(btn => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));

// Parallax tilt for floating panels
(function enableParallaxTilt(){
  const maxTilt = 6; // degrees
  const cards = qa(".float-card");
  cards.forEach(c => c.classList.add("parallax-tilt"));
  document.addEventListener("pointermove", (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx; // -1 .. 1
    const dy = (e.clientY - cy) / cy; // -1 .. 1
    const rx = (dy * maxTilt);
    const ry = (-dx * maxTilt);
    cards.forEach(c => {
      c.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });
  });
  document.addEventListener("pointerleave", () => {
    cards.forEach(c => c.style.transform = "");
  });
})();

// Confetti
function launchConfetti(count=60){
  const colors = ["#00c6ff","#2bd2ff","#ff61d2","#ff78e1"];
  const fx = $("fx");
  for(let i=0;i<count;i++){
    const c = document.createElement("div");
    c.className = "confetti";
    const size = 6 + Math.random()*8;
    c.style.width = `${size}px`;
    c.style.height = `${size*1.5}px`;
    c.style.left = `${Math.random()*100}vw`;
    c.style.top = `-10px`;
    c.style.position = "fixed";
    c.style.background = colors[(Math.random()*colors.length)|0];
    c.style.opacity = .95;
    c.style.transform = `translateY(-100px) rotate(${Math.random()*360}deg)`;
    c.style.borderRadius = "3px";
    c.style.zIndex = "2000";
    c.style.pointerEvents = "none";
    c.style.animation = `fall ${1.8 + Math.random()*1.6}s linear forwards`;
    fx.appendChild(c);
    setTimeout(()=> fx.removeChild(c), 2600);
  }
}
(function ensureConfettiKeyframes(){
  const style = document.createElement("style");
  style.textContent = `@keyframes fall { to { transform: translateY(110vh) rotate(360deg) } }`;
  document.head.appendChild(style);
})();

// Particles (soft)
(function particles(){
  const canvas = $("bgParticles");
  const ctx = canvas.getContext("2d");
  let w, h, particles = [];
  function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  function init(){
    particles = Array.from({length: Math.min(80, Math.floor(w*h/30000))}).map(()=>({
      x: Math.random()*w, y: Math.random()*h,
      r: Math.random()*2+0.5, a: Math.random()*360, s: 0.2 + Math.random()*0.8
    }));
  }
  function tick(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(p=>{
      p.x += Math.cos(p.a)*p.s*0.2; p.y += Math.sin(p.a)*p.s*0.2; p.a+=0.01;
      if(p.x<0) p.x=w; if(p.x>w) p.x=0; if(p.y<0) p.y=h; if(p.y>h) p.y=0;
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);
      g.addColorStop(0, "rgba(255,97,210,.18)");
      g.addColorStop(1, "rgba(0,198,255,.05)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  window.addEventListener("resize", ()=>{ resize(); init(); });
  resize(); init(); tick();
})();

// Fetch wrapper
async function doFetch(url, options){
  const res = await fetch(url, options);
  const text = await res.text();
  let data; try{ data = text ? JSON.parse(text) : {}; } catch{ data = text; }
  return {res, data, text};
}

// Response Viewer
function showResponse(obj) {
  const pretty = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  respBody.textContent = pretty;
  respOverlay.classList.remove("hidden");
}
function hideResponse(){
  respOverlay.classList.add("hidden");
}
$("btnCloseResp").addEventListener("click", hideResponse);
$("btnCopyResp").addEventListener("click", async ()=>{
  try {
    await navigator.clipboard.writeText(respBody.textContent);
    toast("Copied");
  } catch {
    toast("Copy failed","err");
  }
});

// Settings
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

// Init settings
(function initSettings(){
  const theme = localStorage.getItem("theme") || "system";
  const reduce = localStorage.getItem("reduceMotion") === "1";
  const hc = localStorage.getItem("highContrast") === "1";
  applyTheme(theme); applyMotion(reduce); applyContrast(hc);
  $("toggleMotion").checked = reduce;
  $("toggleContrast").checked = hc;
})();

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
  if(!mobileNumber){ toast("Mobile number is required", "err"); $("#mobile").focus(); return; }
  if(!email){ toast("Email is required", "err"); $("#email").focus(); return; }
  if(!address){ toast("Address is required", "err"); $("#address").focus(); return; }
  if(!/^\d{12}$/.test(adharNumber)){ toast("Aadhaar must be 12 digits", "err"); $("#aadhaar").focus(); return; }
  if(!["SBI","HDFC","APGIVB","AXIS","ICICI"].includes(bankName)){ toast("Select a valid bank", "err"); $("#bank").focus(); return; }

  const payload = { FullName, dateOfBirth, mobileNumber, email, address };
  const btn = $("btnCreate");
  btn.disabled = true; showLoader(true);
  try{
    const qs = new URLSearchParams({ adharNumber, bankName }).toString();
    const {res, data, text} = await doFetch(API(`/accounts?${qs}`), {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    if(!(res.status === 200 || res.status === 201)){
      showResponse(text || data);
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    showResponse(data);
    toast("Account created 🎉");
    launchConfetti(80);
    lastSuccess = Date.now();
  }catch(e){
    toast(e.message, "err");
  }finally{
    btn.disabled = false; showLoader(false); updateStickyHeight();
  }
});

// ---------- SEARCH ----------
$("btnSearch").addEventListener("click", async ()=>{
  blurActive();
  const id = ($("#getAcc").value || "").trim();
  if(!id){ toast("Account number is required", "err"); return; }

  const cardWrap = $("bankCard");
  cardWrap.classList.remove("placeholder");
  cardWrap.innerHTML = `<div class="skeleton title"></div><div class="skeleton line"></div><div class="skeleton line"></div>`;

  showLoader(true);
  try{
    const {res, data, text} = await doFetch(API(`/accounts/${encodeURIComponent(id)}`), { method:"GET" });
    if(!res.ok){
      showResponse(text || data);
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    // normalize
    const d = (data && data.bankDetails && data.bankDetails.account_data) ? data.bankDetails.account_data : data;
    const fullName = d.FullName || d.fullName || d.FULLNAME || "(No Name)";
    const accountNumber = d.accountNumber || d.ACCOUNTNUMBER;
    const mobile = d.mobileNumber || d.MOBILENUMBER;
    const dob = d.dateOfBirth || d.DATEOFBIRTH;
    const email = d.email || d.EMAIL;
    const address = d.address || d.ADDRESS;

    const card = document.createElement("div"); card.className = "bankCard float-card";
    const h3 = document.createElement("h3"); h3.textContent = fullName;
    const pAcc = document.createElement("p"); pAcc.textContent = `Account: ${accountNumber ?? "(unknown)"}`;
    const pMob = document.createElement("p"); pMob.textContent = `Mobile: ${mobile ?? "(unknown)"}`;
    const pEmail = document.createElement("p"); pEmail.textContent = `Email: ${email ?? "(unknown)"}`;
    const pDob = document.createElement("p"); pDob.textContent = `DOB: ${dob ?? "(unknown)"}`;
    const pAddr = document.createElement("p"); pAddr.textContent = `Address: ${address ?? "(unknown)"}`;
    card.append(h3,pAcc,pMob,pEmail,pDob,pAddr);
    cardWrap.innerHTML = ""; cardWrap.appendChild(card);

    showResponse(d);
    toast("Account fetched");
    lastSuccess = Date.now();
  }catch(e){
    toast(e.message, "err");
  }finally{
    showLoader(false); updateStickyHeight();
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
    const {res, data, text} = await doFetch(API(`/accounts/${encodeURIComponent(id)}`), {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      showResponse(text || data);
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    showResponse(data);
    toast("Account updated ✔");
    launchConfetti(50);
    lastSuccess = Date.now();
  }catch(e){
    toast(e.message, "err");
  }finally{
    btn.disabled = false; showLoader(false); updateStickyHeight();
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
    const {res, data, text} = await doFetch(API(`/accounts/${encodeURIComponent(id)}`), { method:"DELETE" });
    if(!res.ok){
      showResponse(text || data);
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    showResponse(data);
    toast("Account deleted 🗑️");
    launchConfetti(40);
    lastSuccess = Date.now();
  }catch(e){
    toast(e.message, "err");
  }finally{
    btn.disabled = false; showLoader(false); updateStickyHeight();
  }
});

window.addEventListener("load", updateStickyHeight);
