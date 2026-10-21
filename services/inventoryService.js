const crypto = require("crypto");
const { shopifyGraphQL } = require("../config/shopify");

async function updateInventory({ variantId, locationId, quantity, idempotencyKey }) {
  const lookup = await shopifyGraphQL(
    `
      query GetInventoryItem($id: ID!, $locationId: ID!) {
        productVariant(id: $id) {
          inventoryItem {
            id
            inventoryLevel(locationId: $locationId) {
              quantities(names: ["available"]) {
                name
                quantity
              }
            }
          }
        }
      }
    `,
    { id: variantId, locationId }
  );
  if (lookup.errors) {
    return {
      kind: "shopify",
      message: "Shopify inventory lookup failed",
      errors: lookup.errors,
    };
  }
  const inventoryItem = lookup.data?.productVariant?.inventoryItem;
  const level = inventoryItem?.inventoryLevel;
  if (!inventoryItem || !level) {
    return {
      kind: "notFound",
      message: "Variant not found, or inventory is not stocked at this location",
    };
  }
  const currentQuantity = level.quantities.find((item) => item.name === "available")?.quantity;
  if (!Number.isInteger(currentQuantity)) {
    return {
      kind: "conflict",
      message: "Could not determine current available quantity",
    };
  }

  const result = await shopifyGraphQL(
    `
      mutation SetInventory(
        $input: InventorySetQuantitiesInput!
        $idempotencyKey: String!
      ) {
        inventorySetQuantities(input: $input) @idempotent(key: $idempotencyKey) {
          userErrors { field message code }
          inventoryAdjustmentGroup {
            changes { name delta quantityAfterChange }
          }
        }
      }
    `,
    {
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
      input: {
        name: "available",
        reason: "correction",
        quantities: [
          {
            inventoryItemId: inventoryItem.id,
            locationId,
            quantity,
            changeFromQuantity: currentQuantity,
          },
        ],
      },
    }
  );
  if (result.errors) {
    return {
      kind: "shopify",
      message: "Shopify rejected the inventory operation",
      errors: result.errors,
    };
  }
  return result.data?.inventorySetQuantities;
}

module.exports = { updateInventory };
