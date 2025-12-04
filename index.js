const express = require("express");
const fs = require("fs");
const app = express();

// Nastavitve
app.set("view engine", "ejs");

// Static files
app.use("/js", express.static("js"));
app.use("/css", express.static("css"));
app.use("/data", express.static("data"));

// Middleware za JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔵 GRPC INTEGRACIJA ✔
const { startServer } = require('./grpc/server');
const grpcClient = require('./grpc/client');

// Zaganjamo gRPC strežnik
startServer();

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

// gRPC Test page
app.get("/grpc", (req, res) => {
  res.render("grpc-test");
});

// 🔵 gRPC API ENDPOINTS ✔

// 1. Search products via gRPC
app.post("/api/grpc/search", async (req, res) => {
  try {
    const { query, category, maxResults } = req.body;
    const result = await grpcClient.searchProducts(query || "", category || "", maxResults || 10);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get products by category via gRPC
app.post("/api/grpc/category", async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.body;
    const result = await grpcClient.getProductsByCategory(
      category || "",
      minPrice || 0,
      maxPrice || 100
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get product stats via gRPC
app.post("/api/grpc/stats", async (req, res) => {
  try {
    const { productId } = req.body;
    const result = await grpcClient.getProductStats(productId || "");
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get all products via gRPC
app.get("/api/grpc/all", async (req, res) => {
  try {
    const result = await grpcClient.getAllProducts();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Watch price updates via gRPC (streaming)
app.post("/api/grpc/watch", async (req, res) => {
  try {
    const { category } = req.body;
    const result = await grpcClient.watchPriceUpdates(category || "");
    res.json({ success: true, data: result, message: "Streaming posodobitev zaključen" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔵 Strežnik
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🌐 Strežnik teče na http://localhost:${PORT}`)
);
