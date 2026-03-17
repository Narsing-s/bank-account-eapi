const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("Bank PDF Service Running 🚀");
});

// PDF API
app.post("/download-pdf", async (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).send("HTML content is required");
    }

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=bank-statement.pdf"
    });

    res.send(pdf);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating PDF");
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
