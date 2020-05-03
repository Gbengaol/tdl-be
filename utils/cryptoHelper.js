const crypto = require("crypto");

exports.createToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
