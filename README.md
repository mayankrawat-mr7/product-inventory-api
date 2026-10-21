# Product Inventory API

A REST API built with Node.js and Express that updates Shopify product inventory, variant prices, and product metafields using the Shopify Admin GraphQL API.

## Features

- Update inventory quantity for a product variant at a specific location.
- Update a product variant's price and return the old and new prices.
- Create or update product metafields.
- Authenticate protected endpoints using an API key.
- Validate request data and handle Shopify API errors.
- Obtain and reuse Shopify access tokens automatically.
- Support idempotency keys for inventory update retries.

## Tech Stack

- Node.js
- Express.js
- Shopify Admin GraphQL API
- Axios
- dotenv
- Postman

## Prerequisites

- Node.js and npm installed.
- A Shopify store.
- Shopify app credentials with the required API access scopes.
- Postman for testing the endpoints.

## Installation

Clone the repository and open the project directory:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd product-inventory-api
npm install
```

Create a `.env` file in the project root and configure the following variables:

```env
PORT=3000
API_KEY=your_api_key
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_API_VERSION=2026-10
```

Replace the placeholder values with your own credentials. Do not commit `.env` or share your Shopify credentials.

## Running the Application

Start the server:

```bash
npm start
```

For development, if the development script is configured:

```bash
npm run dev
```

The API runs at:

`http://localhost:3000`

## Authentication

Protected endpoints require the `x-api-key` request header.

Example:

```text
x-api-key: your_api_key
```

The value must match `API_KEY` in the `.env` file.

Inventory update requests should also include a stable `x-idempotency-key` header so that retries can reuse the same key, including after a timeout. Use 1–255 letters, numbers, periods, underscores, colons, or hyphens.

## API Endpoints

All product, variant, and location IDs must use Shopify GraphQL Global IDs (GIDs).

### 1. Update Inventory

**Endpoint:** `POST /api/update-inventory`

Updates the available inventory quantity for a variant at a specific Shopify location.

**Request body:**

```json
{
  "variantId": "gid://shopify/ProductVariant/123",
  "locationId": "gid://shopify/Location/456",
  "quantity": 10
}
```

**Success response:**

```json
{
  "success": true,
  "message": "Inventory updated successfully",
  "quantity": 10
}
```

**Validation:**

- `variantId` is required.
- `locationId` is required.
- `quantity` must be a valid number between 0 and 1,000,000,000.
- Negative quantities are rejected.

### 2. Update Product Variant Price

**Endpoint:** `PUT /api/product-price`

Updates a variant's price and returns the product title, variant title, previous price, and new price.

**Request body:**

```json
{
  "productId": "gid://shopify/Product/123",
  "variantId": "gid://shopify/ProductVariant/456",
  "price": 19.99
}
```

**Success response:**

```json
{
  "success": true,
  "product": "Example product",
  "variant": "Example variant",
  "oldPrice": "14.99",
  "newPrice": "19.99"
}
```

**Validation:**

- Product and variant IDs are required.
- The variant must belong to the specified product.
- `price` must be numeric, greater than zero, no greater than 1,000,000,000, and have at most two decimal places.

### 3. Create or Update Product Metafield

**Endpoint:** `POST /api/product-metafield`

Creates or updates a metafield associated with a Shopify product.

**Request body:**

```json
{
  "productId": "gid://shopify/Product/123",
  "namespace": "custom",
  "key": "color",
  "type": "single_line_text_field",
  "value": "blue"
}
```

**Success response:**

```json
{
  "success": true,
  "message": "Metafield saved successfully",
  "metafield": {
    "id": "gid://shopify/Metafield/789",
    "namespace": "custom",
    "key": "color",
    "type": "single_line_text_field",
    "value": "blue"
  }
}
```

**Validation:**

- `productId`, `namespace`, `key`, and `type` are required.
- `value` must be provided.
- The metafield type and value must be compatible with Shopify's requirements.

Object and array values are JSON-serialized, which is appropriate for JSON metafield types.

### 4. Shopify Authentication Check

**Endpoint:** `GET /api/test-shopify-auth`

A diagnostic endpoint that checks whether the application can obtain a Shopify access token.

This endpoint also requires the `x-api-key` header.

## Error Handling

The API returns appropriate HTTP status codes for validation failures, authentication errors, missing resources, and Shopify API errors.

Common status codes include:

| Status | Meaning |
|---|---|
| `200` | Request succeeded |
| `400` | Invalid request data |
| `401` | Missing or invalid API key |
| `404` | Product or variant not found |
| `422` | Shopify mutation validation error |
| `502` | Shopify API error |

The exact response depends on the endpoint and the error encountered.

## Testing with Postman

Import `Product-Inventory-API.postman_collection.json` into Postman.

1. Set the `baseUrl` variable to `http://localhost:3000`.
2. Configure the API key variable to match `API_KEY` in `.env`.
3. Set valid Shopify product, variant, and location IDs.
4. Run the collection.
5. Verify the responses and test results in the Postman Collection Runner.

The collection includes successful requests and validation tests for inventory, price, and metafield endpoints.

## Project Structure

```text
product-inventory-api/
├── config/
│   └── shopify.js
├── controllers/
│   ├── inventoryController.js
│   ├── priceController.js
│   └── metafieldController.js
├── middlewares/
│   └── authMiddleware.js
├── routes/
│   ├── inventoryRoutes.js
│   ├── priceRoutes.js
│   └── metafieldRoutes.js
├── services/
│   ├── inventoryService.js
│   ├── priceService.js
│   └── metafieldService.js
├── app.js
├   