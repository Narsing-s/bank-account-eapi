const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// API CALL
async function callAPI(url, method = "GET", body = null) {
  status.innerText = "⏳ Processing...";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : null
    });

    const data = await res.json();

    status.innerText = "✅ Success";
    return data;

  } catch (err) {
    status.innerText = "❌ Failed";
    return { error: "API Error" };
  }
}

// DISPLAY RESULT
function showResult(data) {

  let html = `<div class="result-card">`;

  // MESSAGE
  if (data.message) {
    html += `<h3>${data.message}</h3>`;
  }

  // ACCOUNT NUMBER
  if (data.accountNumber) {
    html += `<p><b>Account Number:</b> ${data.accountNumber}</p>`;
  }

  // ACCOUNT DETAILS (CREATE RESPONSE)
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

  // GET RESPONSE (if API returns direct object)
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
