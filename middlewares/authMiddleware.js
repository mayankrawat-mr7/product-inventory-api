const crypto = require("crypto");
function authenticateApiKey(req, res, next) {
  const provided = req.headers["x-api-key"]; const expected = process.env.API_KEY;
  const providedDigest = crypto.createHash("sha256").update(typeof provided === "string" ? provided : "").digest();
  const expectedDigest = crypto.createHash("sha256").update(typeof expected === "string" ? expected : "").digest();
  const valid = typeof provided === "string" && typeof expected === "string" && crypto.timingSafeEqual(providedDigest, expectedDigest);
  if (!valid) {
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid or missing API key" });
  }
  next();
}

module.exports = { authenticateApiKey };
