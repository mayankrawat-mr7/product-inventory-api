const { updatePrice } = require("../services/priceService");
function isValidPrice(price) {
  if (typeof price === "string" && !/^\d+(\.\d{1,2})?$/.test(price)) return false;
  const numericPrice = typeof price === "string" && price.trim() !== "" ? Number(price) : price;
  return (
    typeof numericPrice === "number" &&
    Number.isFinite(numericPrice) &&
    numericPrice > 0 &&
    numericPrice <= 1_000_000_000 &&
    Number(numericPrice.toFixed(2)) === numericPrice
  );
}

async function updatePriceController(req, res) {
  const { productId, variantId, price } = req.body || {};
  const isValidProduct = typeof productId === "string" && /^gid:\/\/shopify\/Product\/\d+$/.test(productId);
  const isValidVariant = typeof variantId === "string" && /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variantId);

  if (!isValidProduct || !isValidVariant || !isValidPrice(price)) {
    return res.status(400).json({
      success: false,
      message: "Provide valid productId, variantId, and a price greater than 0 with at most 2 decimal places",
    });
  }

  try {
    const numericPrice = typeof price === "string" ? Number(price) : price;
    const result = await updatePrice({ productId, variantId, price: numericPrice });

    if (result.kind === "notFound") {
      return res.status(404).json({ success: false, message: result.message });
    }

    if (result.kind === "invalid") {
      return res.status(422).json({ success: false, message: result.message, errors: result.errors });
    }

    if (result.kind === "shopify") {
      return res.status(502).json({
        success: false,
        message: result.message,
        errors: result.errors,
      });
    }

    if (result.userErrors?.length) {
      return res.status(422).json({ success: false, errors: result.userErrors });
    }

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Product price update failed" });
  }
}
module.exports = { updatePriceController };
