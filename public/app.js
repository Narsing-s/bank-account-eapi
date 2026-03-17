const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// SAFE FETCH (handles bad JSON)
async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  console.log("RAW:", text);

  const fixed = text
    .replace(/}{/g, "}#SPLIT#{")
    .split("#SPLIT#")
    .map(x => JSON.parse(x));

  return fixed;
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
  const payload = {
    FullName: name.value,
    dateOfBirth: dob.value,
    mobileNumber: mobile.value,
    email: email.value,
    address: address.value
  };

  const data = await safeFetch(
    `${BASE_URL}/accounts?adharNumber=${aadhar.value}&bankName=${bank.value}`,
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
  const acc = getAcc.value;

  try {
    let data;

    try {
      data = await safeFetch(`${BASE_URL}/accounts/${acc}`);
    } catch {
      data = await safeFetch(`${BASE_URL}/accounts?accountNumber=${acc}`);
    }

    renderTable(data);

  } catch {
    tableContainer.innerHTML = "❌ Error loading data";
  }
}

// UPDATE
async function updateAccount() {
  const data = await safeFetch(`${BASE_URL}/accounts/${updAcc.value}`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      FullName: updName.value,
      mobileNumber: updMobile.value,
      address: updAddress.value
    })
  });

  renderTable(data);
}

// DELETE
async function deleteAccount() {
  const data = await safeFetch(`${BASE_URL}/accounts/${delAcc.value}`, {
    method: "DELETE"
  });

  renderTable(data);
}
