const router = require("express").Router();
const { authenticateApiKey } = require("../middlewares/authMiddleware");
const { setMetafieldController } = require("../controllers/metafieldController");

router.post("/product-metafield", authenticateApiKey, setMetafieldController);

module.exports = router;
