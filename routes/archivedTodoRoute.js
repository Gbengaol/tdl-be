const express = require("express");
const { getArchivedTodos } = require("../controllers/todoController");
const { protectRoute } = require("../controllers/authController");

const router = express.Router();

router.route("/").get(protectRoute, getArchivedTodos);

module.exports = router;
