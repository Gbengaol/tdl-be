const express = require("express");
const {
  getAllTodos,
  addTodoItem,
  editTodoItem,
  archiveItem,
  getATodo,
  deleteTodo,
} = require("../controllers/todoController");
const { protectRoute } = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(protectRoute, getAllTodos)
  .post(protectRoute, addTodoItem);
router
  .route("/:id")
  .put(protectRoute, editTodoItem)
  .patch(protectRoute, archiveItem)
  .get(protectRoute, getATodo)
  .delete(protectRoute, deleteTodo);

module.exports = router;
