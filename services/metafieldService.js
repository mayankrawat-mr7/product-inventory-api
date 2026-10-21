const { shopifyGraphQL } = require("../config/shopify");

async function setProductMetafield({ productId, namespace, key, type, value }) {
  const serializedValue =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  const result = await shopifyGraphQL(
    `
      mutation SetProductMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key type value }
          userErrors { field message code }
        }
      }
    `,
    {
      metafields: [
        {
          ownerId: productId,
          namespace: namespace.trim(),
          key: key.trim(),
          type: type.trim(),
          value: serializedValue,
        },
      ],
    }
  );
  if (result.errors) {
    return {
      kind: "shopify",
      message: "Shopify metafield request failed",
      errors: result.errors,
    };
  }
  return result.data?.metafieldsSet;
}

module.exports = { setProductMetafield };
