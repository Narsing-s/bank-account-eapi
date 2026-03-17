const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// COMMON API
async function callAPI(url, method = "GET", body = null) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : null
    });

    return await res.json();
  } catch (err) {
    return { error: "❌ API Error" };
  }
}

// UI RENDER
function showResult(data) {
  let html = `<div class="result-card">`;

  if (data.message) {
    html += `<h3>${data.message}</h3>`;
  }

  if (data.accountNumber) {
    html += `<p><b>Account Number:</b> ${data.accountNumber}</p>`;
  }

  if (data.account_data) {
    const a = data.account_data;

    html += `
      <p><b>Name:</b> ${a.FullName}</p>
      <p><b>DOB:</b> ${a.dateOfBirth}</p>
      <p><b>Mobile:</b> ${a.mobileNumber}</p>
      <p><b>Email:</b> ${a.email}</p>
      <p><b>Address:</b> ${a.address}</p>
      <p><b>Balance:</b> ${a.totalbalance}</p>
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
