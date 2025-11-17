const express = require("express");
const fs = require("fs");
const app = express();

// Nastavitve
app.set("view engine", "ejs");

// Static files
app.use("/js", express.static("js"));
app.use("/css", express.static("css"));
app.use("/data", express.static("data"));

// 🔵 ROUTES ✔

// Home page
app.get("/", (req, res) => {
  const products = JSON.parse(fs.readFileSync("products.json", "utf-8"));
  res.render("index", { products });
});

// Stats page (PC-Axis graf)
app.get("/stats", (req, res) => {
  res.render("stats");
});

// 🔵 Strežnik
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🌐 Strežnik teče na http://localhost:${PORT}`)
);
