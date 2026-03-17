const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// SHOW RESPONSE
function show(data) {
  document.getElementById("output").innerText =
    JSON.stringify(data, null, 2);
}

// LOADING
function loading() {
  document.getElementById("output").innerText = "⏳ Loading...";
}

// ERROR
function handleError(err) {
  document.getElementById("output").innerText = "❌ Error: " + err;
}

// CREATE
function createAccount() {
  loading();

  const payload = {
    FullName: document.getElementById("name").value,
    dateOfBirth: document.getElementById("dob").value,
    mobileNumber: document.getElementById("mobile").value,
    email: document.getElementById("email").value,
    address: document.getElementById("address").value
  };

  const aadhar = document.getElementById("aadhar").value;
  const bank = document.getElementById("bank").value;

  fetch(`${BASE_URL}/accounts?adharNumber=${aadhar}&bankName=${bank}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(show)
  .catch(handleError);
}

// GET (AUTO FIX PATH / QUERY)
function getAccount() {
  loading();

  const acc = document.getElementById("getAcc").value;

  if (!acc) {
    alert("Enter Account Number");
    return;
  }

  console.log("Fetching:", acc);

  // Try PATH param
  fetch(`${BASE_URL}/accounts/${acc}`)
    .then(res => {
      if (!res.ok) throw "Trying query param...";
      return res.json();
    })
    .then(show)
    .catch(() => {
      // Fallback to QUERY param
      fetch(`${BASE_URL}/accounts?accountNumber=${acc}`)
        .then(res => res.json())
        .then(show)
        .catch(handleError);
    });
}

// UPDATE
function updateAccount() {
  loading();

  const acc = document.getElementById("updAcc").value;

  const payload = {
    FullName: document.getElementById("updName").value,
    mobileNumber: document.getElementById("updMobile").value,
    address: document.getElementById("updAddress").value
  };

  fetch(`${BASE_URL}/accounts/${acc}`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(show)
  .catch(handleError);
}

// DELETE
function deleteAccount() {
  loading();

  const acc = document.getElementById("delAcc").value;

  fetch(`${BASE_URL}/accounts/${acc}`, {
    method: "DELETE"
  })
  .then(res => res.json())
  .then(show)
  .catch(handleError);
}
