const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// SAFE PARSER (handles all bad cases)
function parseResponse(text) {
  if (!text || text.trim() === "") return { message: "Empty response" };

  try {
    return JSON.parse(text);
  } catch {
    try {
      // fix broken JSON like }{
      const fixed = text.replace(/}{/g, "}|SPLIT|{").split("|SPLIT|");
      return fixed.map(x => JSON.parse(x));
    } catch {
      return { raw: text };
    }
  }
}

// COMMON API CALL
async function callAPI(url, method = "GET", body = null) {
  status.innerText = "⏳ Processing...";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : null
    });

    const text = await res.text();

    console.log("RAW:", text);

    const data = parseResponse(text);

    status.innerText = "✅ Success";
    return data;

  } catch (err) {
    status.innerText = "❌ API Failed";
    return { error: err.message };
  }
}

// DISPLAY
function show(data) {
  output.textContent = JSON.stringify(data, null, 2);
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
      address: address.value
    }
  );

  show(data);
}

// GET
async function getAccount() {
  const data = await callAPI(
    `${BASE_URL}/accounts/${getAcc.value}`
  );

  show(data);
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

  show(data);
}

// DELETE
async function deleteAccount() {
  const data = await callAPI(
    `${BASE_URL}/accounts/${delAcc.value}`,
    "DELETE"
  );

  show(data);
}
