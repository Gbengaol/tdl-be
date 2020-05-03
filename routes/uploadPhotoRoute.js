const express = require("express");
const { protectRoute } = require("../controllers/authController");
const { uploadProfilePhoto } = require("../controllers/userController");

const router = express.Router();

router.route("/").patch(protectRoute, uploadProfilePhoto);

module.exports = router;
