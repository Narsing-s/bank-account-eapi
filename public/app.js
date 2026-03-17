const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// COMMON FETCH HANDLER (FIXES YOUR ISSUE)
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);

    const text = await res.text(); // IMPORTANT

    console.log("RAW RESPONSE:", text);

    // Fix multiple JSON issue
    const fixed = text
      .replace(/}{/g, "}#SPLIT#{")
      .split("#SPLIT#")
      .map(x => JSON.parse(x));

    return fixed;

  } catch (err) {
    console.error("Fetch Error:", err);
    throw err;
  }
}

// RENDER TABLE
function renderTable(data) {
  if (!Array.isArray(data)) data = [data];

  let html = `
    <table>
      <tr>
        <th>Name</th>
        <th>DOB</th>
        <th>Mobile</th>
        <th>Email</th>
        <th>Address</th>
      </tr>
  `;

  data.forEach(d => {
    html += `
      <tr>
        <td>${d.FullName || ""}</td>
        <td>${d.dateOfBirth || ""}</td>
        <td>${d.mobileNumber || ""}</td>
        <td>${d.email || ""}</td>
        <td>${d.address || ""}</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("tableContainer").innerHTML = html;
}

// CREATE
async function createAccount() {
  document.getElementById("tableContainer").innerText = "⏳ Creating...";

  const payload = {
    FullName: document.getElementById("name").value,
    dateOfBirth: document.getElementById("dob").value,
    mobileNumber: document.getElementById("mobile").value,
    email: document.getElementById("email").value,
    address: document.getElementById("address").value
  };

  const aadhar = document.getElementById("aadhar").value;
  const bank = document.getElementById("bank").value;

  const data = await safeFetch(
    `${BASE_URL}/accounts?adharNumber=${aadhar}&bankName=${bank}`,
    {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    }
  );

  renderTable(data);
}

// GET
async function getAccount() {
  const acc = document.getElementById("getAcc").value;

  if (!acc) {
    alert("Enter Account Number");
    return;
  }

  document.getElementById("tableContainer").innerText = "⏳ Fetching...";

  try {
    let data;

    try {
      data = await safeFetch(`${BASE_URL}/accounts/${acc}`);
    } catch {
      data = await safeFetch(`${BASE_URL}/accounts?accountNumber=${acc}`);
    }

    renderTable(data);

  } catch (err) {
    document.getElementById("tableContainer").innerText =
      "❌ Error loading data";
  }
}

// UPDATE
async function updateAccount() {
  const acc = document.getElementById("updAcc").value;

  const payload = {
    FullName: document.getElementById("updName").value,
    mobileNumber: document.getElementById("updMobile").value,
    address: document.getElementById("updAddress").value
  };

  document.getElementById("tableContainer").innerText = "⏳ Updating...";

  const data = await safeFetch(`${BASE_URL}/accounts/${acc}`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });

  renderTable(data);
}

// DELETE
async function deleteAccount() {
  const acc = document.getElementById("delAcc").value;

  document.getElementById("tableContainer").innerText = "⏳ Deleting...";

  const data = await safeFetch(`${BASE_URL}/accounts/${acc}`, {
    method: "DELETE"
  });

  renderTable(data);
}
