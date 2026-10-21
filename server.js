require("dotenv").config();
const app = require("./app");
const port = process.env.PORT || 3000;
const required = ["API_KEY", "SHOPIFY_STORE_DOMAIN", "SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
if (!/^[a-z0-9-]+\.myshopify\.com$/.test(process.env.SHOPIFY_STORE_DOMAIN)) {
  throw new Error("SHOPIFY_STORE_DOMAIN must be a hostname like mystore.myshopify.com");
}
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
