const axios = require("axios");

const {
  SHOPIFY_STORE_DOMAIN,
  SHOPIFY_CLIENT_ID,
  SHOPIFY_CLIENT_SECRET,
  SHOPIFY_API_VERSION = "2026-10",
} = process.env;

let cachedToken;
let tokenExpiresAt = 0;
let tokenRequest;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const MAX_RETRY_AFTER_MS = 5000;

function isThrottled(response) {
  return (
    response?.status === 429 ||
    response?.data?.errors?.some(
      (error) =>
        error.extensions?.code === "THROTTLED" ||
        /throttl/i.test(error.message || "")
    )
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getShopifyAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  if (tokenRequest) return tokenRequest;

  tokenRequest = axios.post(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: REQUEST_TIMEOUT_MS,
    }
  )
    .then((response) => {
      cachedToken = response.data.access_token;
      tokenExpiresAt =
        Date.now() + Math.max(response.data.expires_in - 60, 1) * 1000;
      return cachedToken;
    })
    .finally(() => {
      tokenRequest = undefined;
    });

  return tokenRequest;
}

function getShopifyGraphQLEndpoint() {
  return `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

async function shopifyGraphQL(query, variables = {}) {
  let token = await getShopifyAccessToken();
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await axios.post(
        getShopifyGraphQLEndpoint(),
        { query, variables },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
          },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );
      if (!isThrottled(response) || attempt === MAX_RETRIES) return response.data;
      await wait(250 * 2 ** attempt);
    } catch (error) {
      if (error.response?.status === 401 && attempt === 0) {
        cachedToken = undefined;
        tokenExpiresAt = 0;
        token = await getShopifyAccessToken();
        continue;
      }
      if (!isThrottled(error.response) || attempt === MAX_RETRIES) throw error;
      const retryAfter = Number(error.response.headers?.["retry-after"]);
      await wait(
        Math.min(
          Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt,
          MAX_RETRY_AFTER_MS
        )
      );
    }
  }
}

module.exports = { getShopifyAccessToken, getShopifyGraphQLEndpoint, shopifyGraphQL };
