const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// COMMON API CALL
async function callAPI(url, method = "GET", body = null) {

  status.innerText = "⏳ Loading...";

  try {
    const options = {
      method: method
    };

    // ⚠️ ONLY add headers/body when needed (prevents OPTIONS issue)
    if (body) {
      options.headers = {
        "Content-Type": "application/json"
      };
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);

    // HANDLE NON-JSON
    let data;
    try {
      data = await res.json();
    } catch {
      data = { message: "No JSON response" };
    }

    if (!res.ok) {
      throw new Error(data.message || "API Error");
    }

    status.innerText = "✅ Success";
    return data;

  } catch (err) {
    status.innerText = "❌ " + err.message;
    return { error: err.message };
  }
}

// SHOW RESULT
function showResult(data) {

  if (data.error) {
    result.innerHTML = `<div class="result-card">❌ ${data.error}</div>`;
    return;
  }

  let html = `<div class="result-card">`;

  if (data.message) {
    html += `<h3>${data.message}</h3>`;
  }

  if (data.accountNumber) {
    html += `<p><b>Account:</b> ${data.accountNumber}</p>`;
  }

  if (data.account_data) {
    const a = data.account_data;

    html += `
      <table>
        <tr><td>Name</td><td>${a.FullName}</td></tr>
        <tr><td>DOB</td><td>${a.dateOfBirth}</td></tr>
        <tr><td>Mobile</td><td>${a.mobileNumber}</td></tr>
        <tr><td>Email</td><td>${a.email}</td></tr>
        <tr><td>Address</td><td>${a.address}</td></tr>
        <tr><td>Balance</td><td>${a.totalbalance}</td></tr>
      </table>
    `;
  }

  if (data.FullName) {
    html += `
      <table>
        <tr><td>Name</td><td>${data.FullName}</td></tr>
        <tr><td>DOB</td><td>${data.dateOfBirth}</td></tr>
        <tr><td>Mobile</td><td>${data.mobileNumber}</td></tr>
        <tr><td>Email</td><td>${data.email}</td></tr>
        <tr><td>Address</td><td>${data.address}</td></tr>
      </table>
    `;
  }

  result.innerHTML = html + "</div>";
}

// CREATE
async function createAccount() {
  const data = await callAPI(
    `${BASE_URL}/accounts?adharNumber=${aadhar.value}&bankName=${bank.value}`,
    "POST",
    {
      FullName: name.value,
      dateOfBirth: dob.value,
      mobileNumber: mobile.value,
      email: email.value,
      address: address.value,
      totalbalance: balance.value
    }
  );
  showResult(data);
}

// GET
async function getAccount() {
  const data = await callAPI(
    `${BASE_URL}/accounts/${getAcc.value}`
  );
  showResult(data);
}

// UPDATE
async function updateAccount() {
  const data = await callAPI(
    `${BASE_URL}/accounts/${updAcc.value}`,
    "PATCH",
    {
      FullName: updName.value,
      mobileNumber: updMobile.value,
      address: updAddress.value
    }
  );
  showResult(data);
}

// DELETE
async function deleteAccount() {
  const data = await callAPI(
    `${BASE_URL}/accounts/${delAcc.value}`,
    "DELETE"
  );
  showResult(data);
}
