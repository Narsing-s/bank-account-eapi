const BASE_URL = "https://bank-account-eapi-jik9pb.5sc6y6-4.usa-e2.cloudhub.io/api";

// FETCH ACCOUNT
function getAccount() {
  const acc = document.getElementById("getAcc").value;

  if (!acc) {
    alert("Enter Account Number");
    return;
  }

  document.getElementById("tableContainer").innerHTML = "⏳ Loading...";

  fetch(`${BASE_URL}/accounts/${acc}`)
    .then(res => res.text()) // IMPORTANT (handle bad API response)
    .then(data => {
      console.log("RAW RESPONSE:", data);

      // FIX: split multiple JSONs
      const jsonArray = data
        .replace(/}{/g, "}#SPLIT#{")
        .split("#SPLIT#")
        .map(item => JSON.parse(item));

      renderTable(jsonArray);
    })
    .catch(err => {
      document.getElementById("tableContainer").innerHTML =
        "❌ Error fetching data";
      console.error(err);
    });
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
