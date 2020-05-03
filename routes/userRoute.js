const express = require("express");
const { protectRoute } = require("../controllers/authController");
const {
  changePassword,
  getProfile,
  editProfile,
} = require("../controllers/userController");

const router = express.Router();

router.route("/change-password").post(protectRoute, changePassword);
router
  .route("/profile")
  .get(protectRoute, getProfile)
  .patch(protectRoute, editProfile);

module.exports = router;
