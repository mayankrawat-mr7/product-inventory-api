const { setProductMetafield } = require("../services/metafieldService");

async function setMetafieldController(req, res) {
  const { productId, namespace, key, type, value } = req.body || {};
  const isInvalid =
    typeof productId !== "string" ||
    !/^gid:\/\/shopify\/Product\/\d+$/.test(productId) ||
    typeof namespace !== "string" ||
    !namespace.trim() ||
    typeof key !== "string" ||
    !key.trim() ||
    typeof type !== "string" ||
    !type.trim() ||
    value == null ||
    (typeof value === "string" && !value.trim());

  if (isInvalid) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid productId, namespace, key, type, and value",
    });
  }

  try {
    const result = await setProductMetafield({ productId, namespace, key, type, value });

    if (result?.kind === "shopify") {
      return res
        .status(502)
        .json({ success: false, message: result.message, errors: result.errors });
    }

    if (!result) {
      return res.status(502).json({
        success: false,
        message: "Shopify did not return a metafield result",
      });
    }

    if (result.userErrors?.length) {
      return res.status(422).json({
        success: false,
        message: "Shopify could not save the metafield",
        errors: result.userErrors,
      });
    }

    return res.json({
      success: true,
      message: "Metafield saved successfully",
      metafield: result.metafields?.[0],
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Product metafield request failed" });
  }
}

module.exports = { setMetafieldController };
