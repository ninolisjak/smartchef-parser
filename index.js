const express = require("express");
const fs = require("fs");
const app = express();

app.set("view engine", "ejs");
app.use("/Css", express.static("Css"));

app.get("/", (req, res) => {
  const products = JSON.parse(fs.readFileSync("products.json", "utf-8"));
  res.render("index", { products });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🌐 Strežnik teče na http://localhost:${PORT}`));
