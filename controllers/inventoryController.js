const { updateInventory } = require("../services/inventoryService");
const id = (type) => new RegExp(`^gid://shopify/${type}/\\d+$`);

async function updateInventoryController(req, res) {
  const { variantId, locationId, quantity } = req.body || {};
  if (
    typeof variantId !== "string" ||
    !id("ProductVariant").test(variantId) ||
    typeof locationId !== "string" ||
    !id("Location").test(locationId) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0 || quantity > 1_000_000_000
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide valid variantId, locationId, and quantity from 0 to 1,000,000,000",
    });
  }
  const idempotencyKey = req.headers["x-idempotency-key"];
  if (
    idempotencyKey !== undefined &&
    (typeof idempotencyKey !== "string" ||
      !/^[A-Za-z0-9._:-]{1,255}$/.test(idempotencyKey))
  ) {
    return res.status(400).json({
      success: false,
      message:
        "x-idempotency-key must be 1-255 characters using letters, numbers, ., _, :, or -",
    });
  }
  try {
    const result = await updateInventory({ variantId, locationId, quantity, idempotencyKey });
    if (result?.kind === "notFound" || result?.kind === "conflict") {
      return res
        .status(result.kind === "notFound" ? 404 : 409)
        .json({ success: false, message: result.message });
    }

    if (result?.kind === "shopify") {
      return res
        .status(502)
        .json({ success: false, message: result.message, errors: result.errors });
    }
    if (result?.userErrors?.length) {
      const stale = result.userErrors.some((error) =>
        /CHANGE_FROM_QUANTITY|STALE|QUANTITY.*MISMATCH/i.test(error.code || "") ||
        /change.?from|quantity.*changed|stale/i.test(error.message || "")
      );

      return res
        .status(stale ? 409 : 422)
        .json({ success: false, errors: result.userErrors });
    }
    if (!result) {
      return res.status(502).json({
        success: false,
        message: "Shopify did not return an inventory update result",
      });
    }
    return res.json({ success: true, message: "Inventory updated successfully", quantity });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Inventory update failed" });
  }
}

module.exports = { updateInventoryController };
