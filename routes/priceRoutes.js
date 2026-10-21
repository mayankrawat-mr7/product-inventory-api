const router = require("express").Router();
const { authenticateApiKey } = require("../middlewares/authMiddleware");
const { updatePriceController } = require("../controllers/priceController");
router.put("/product-price", authenticateApiKey, updatePriceController);
module.exports = router;
