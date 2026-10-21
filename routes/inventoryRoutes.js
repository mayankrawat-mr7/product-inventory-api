const router = require("express").Router();
const { authenticateApiKey } = require("../middlewares/authMiddleware");
const { updateInventoryController } = require("../controllers/inventoryController");
router.post("/update-inventory", authenticateApiKey, updateInventoryController);
module.exports = router;
