const { shopifyGraphQL } = require("../config/shopify");

async function updatePrice({ productId, variantId, price }) {
  const lookup = await shopifyGraphQL(
    `
      query GetProductVariant($variantId: ID!) {
        productVariant(id: $variantId) {
          id
          title
          price
          product { id title }
        }
      }
    `,
    { variantId }
  );
  if (lookup.errors) {
    return {
      kind: "shopify",
      message: "Shopify product lookup failed",
      errors: lookup.errors,
    };
  }
  const variant = lookup.data?.productVariant;
  if (!variant?.product || variant.product.id !== productId) {
    return {
      kind: "notFound",
      message: "Product or variant not found, or variant does not belong to this product",
    };
  }

  const result = await shopifyGraphQL(
    `
      mutation UpdateVariantPrice(
        $productId: ID!
        $variants: [ProductVariantsBulkInput!]!
      ) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id title price }
          userErrors { field message }
        }
      }
    `,
    {
      productId,
      variants: [{ id: variantId, price: Number(price).toFixed(2) }],
    }
  );
  if (result.errors) {
    return {
      kind: "shopify",
      message: "Shopify rejected the price update",
      errors: result.errors,
    };
  }
  const mutationResult = result.data?.productVariantsBulkUpdate;
  if (mutationResult?.userErrors?.length) return { kind: "invalid", message: "Shopify could not update the price", errors: mutationResult.userErrors };
  const updated = mutationResult?.productVariants?.[0];
  if (!updated) return { kind: "invalid", message: "Shopify did not return the updated variant" };
  return { product: variant.product.title, variant: updated.title, oldPrice: variant.price, newPrice: updated.price };
}

module.exports = { updatePrice };
