const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// COMMON FETCH
async function callAPI(url, method = "GET", body = null) {
  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : null
    });

    const text = await res.text();

    console.log("RAW RESPONSE:", text);

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }

  } catch (err) {
    return { error: "❌ Failed to connect API" };
  }
}

// SHOW OUTPUT
function show(data) {
  output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

// CREATE
async function createAccount() {
  output.innerHTML = "⏳ Creating...";

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
  output.innerHTML = "⏳ Loading...";

  const data = await callAPI(`${BASE_URL}/accounts/${getAcc.value}`);

  show(data);
}

// UPDATE
async function updateAccount() {
  output.innerHTML = "⏳ Updating...";

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
  output.innerHTML = "⏳ Deleting...";

  const data = await callAPI(
    `${BASE_URL}/accounts/${delAcc.value}`,
    "DELETE"
  );

  show(data);
}
