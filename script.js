const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

function show(data) {
  document.getElementById("output").innerText =
    JSON.stringify(data, null, 2);
}

// CREATE
function createAccount() {
  const payload = {
    fullName: document.getElementById("name").value,
    dateOfBirth: document.getElementById("dob").value,
    mobileNumber: document.getElementById("mobile").value,
    email: document.getElementById("email").value,
    address: document.getElementById("address").value,
    adharnumber: document.getElementById("aadhar").value,
    bankName: document.getElementById("bank").value
  };

  fetch(`${BASE_URL}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(show)
    .catch(err => console.error(err));
}

// GET
function getAccount() {
  const acc = document.getElementById("getAcc").value;

  fetch(`${BASE_URL}/accounts/${acc}`)
    .then(res => res.json())
    .then(show)
    .catch(err => console.error(err));
}

// UPDATE
function updateAccount() {
  const acc = document.getElementById("updAcc").value;

  const payload = [{
    FullName: document.getElementById("updName").value,
    mobileNumber: document.getElementById("updMobile").value,
    address: document.getElementById("updAddress").value
  }];

  fetch(`${BASE_URL}/accounts/${acc}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(show)
    .catch(err => console.error(err));
}

// DELETE
function deleteAccount() {
  const acc = document.getElementById("delAcc").value;

  fetch(`${BASE_URL}/accounts/${acc}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(show)
    .catch(err => console.error(err));
}
