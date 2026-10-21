require("dotenv").config();
const express = require("express");
const inventoryRoutes = require("./routes/inventoryRoutes");
const priceRoutes = require("./routes/priceRoutes");
const metafieldRoutes = require("./routes/metafieldRoutes");
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.json({ success: true, message: "Product Inventory API is running" }));
app.get("/api/test-shopify-auth", require("./middlewares/authMiddleware").authenticateApiKey, async (req, res) => { try { const { getShopifyAccessToken } = require("./config/shopify"); await getShopifyAccessToken(); res.json({ success: true, message: "Shopify access token obtained successfully", tokenReceived: true }); } catch { res.status(500).json({ success: false, message: "Failed to authenticate with Shopify" }); } });
app.use("/api", inventoryRoutes, priceRoutes, metafieldRoutes);
app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || error.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal server error" : error.message,
  });
});
module.exports = app;
