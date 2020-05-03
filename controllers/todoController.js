const knex = require("../db/knex");
const tableNames = require("../utils/tableNames");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { sanitizeResponse } = require("../utils/sanitizeResponse");

exports.getAllTodos = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  try {
    const { size, page } = req.query;
    let { search } = req.query;
    search = search ? search : "";
    const count = await knex(tableNames.todos)
      .count("id")
      .whereNull("deleted_at")
      .where({
        user_id: id,
      });
    const todos = await knex
      .select()
      .table(tableNames.todos)
      .where({
        user_id: id,
      })
      .whereRaw(`LOWER(todo_item) LIKE ?`, `%${search.toLowerCase()}%`)
      .whereNull("deleted_at")
      .limit(size ? Number(size) : 10)
      .offset(page ? Number((page - 1) * size) : 0);
    if (todos.length) {
      res.status(200).json({
        message: "success",
        length: todos.length,
        count: count[0].count,
        todos: todos,
      });
    } else {
      res.status(200).json({
        message: "success",
        todos: [],
      });
    }
  } catch (error) {
    next(new AppError("Internal Server Error", 500));
  }
});

exports.getArchivedTodos = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  try {
    const { size, page } = req.query;
    let { search } = req.query;
    search = search ? search : "";
    const count = await knex(tableNames.todos)
      .count("id")
      .whereNotNull("deleted_at")
      .where({
        user_id: id,
      });
    const todos = await knex
      .select()
      .table(tableNames.todos)
      .where({
        user_id: id,
      })
      .whereRaw(`LOWER(todo_item) LIKE ?`, `%${search.toLowerCase()}%`)
      .whereNotNull("deleted_at")
      .limit(size ? Number(size) : 10)
      .offset(page ? Number((page - 1) * size) : 0);
    if (todos.length) {
      res.status(200).json({
        message: "success",
        length: todos.length,
        count: count[0].count,
        todos: todos,
      });
    } else {
      res.status(200).json({
        message: "success",
        todos: [],
      });
    }
  } catch (error) {
    next(new AppError("Internal Server Error", 500));
  }
});

exports.addTodoItem = catchAsync(async (req, res, next) => {
  const { todo_item, description, priority } = req.body;
  const todo = {
    todo_item,
    description,
    priority,
    user_id: req.user.id,
  };
  try {
    const newTodo = await knex(tableNames.todos).returning("*").insert(todo);
    if (newTodo) {
      res.status(201).json({
        message: "success",
        todo: sanitizeResponse(newTodo[0]),
      });
    } else {
      next(new AppError("Bad Request", 400));
    }
  } catch (error) {
    next(new AppError("Internal Server Error", 500));
  }
});

exports.editTodoItem = catchAsync(async (req, res, next) => {
  const { todo_item, description, priority, status } = req.body;
  const todo = {
    todo_item,
    description,
    priority,
    status,
    updated_at: knex.fn.now(),
  };
  try {
    const updatedTodo = await knex(tableNames.todos)
      .returning("*")
      .where("id", req.params.id)
      .update(todo);
    if (updatedTodo.length) {
      res.status(200).json({
        message: "success",
        todo: sanitizeResponse(updatedTodo[0]),
      });
    } else {
      next(new AppError("Bad Request", 400));
    }
  } catch (error) {
    next(new AppError("Internal Server Error", 500));
  }
});

exports.archiveItem = catchAsync(async (req, res, next) => {
  try {
    const archivedTodo = await knex(tableNames.todos)
      .where("id", req.params.id)
      .update({
        deleted_at: req.query.status === "true" ? knex.fn.now() : null,
      });
    if (archivedTodo) {
      res.status(200).json({
        message: "success",
        todo: sanitizeResponse(archivedTodo[0]),
      });
    } else {
      next(new AppError("Bad Request", 400));
    }
  } catch (error) {
    next(new AppError("Internal Server Error", 500));
  }
});

exports.getATodo = catchAsync(async (req, res, next) => {
  try {
    const todo = await knex
      .where("id", req.params.id)
      .whereNull("deleted_at")
      .select()
      .table(tableNames.todos);
    if (todo.length) {
      res.status(200).json({
        message: "success",
        todo: sanitizeResponse(todo[0]),
      });
    } else {
      next(new AppError("Not Found", 404));
    }
  } catch (error) {
    next(new AppError("Internal Server Error", 500));
  }
});

exports.deleteTodo = catchAsync(async (req, res, next) => {
  try {
    const todo = await knex(tableNames.todos).where("id", req.params.id).del();
    if (todo) {
      res.status(204).json({
        message: "success",
      });
    } else {
      next(new AppError("Not Found", 500));
    }
  } catch (error) {
    next(new AppError("Internal Server Error", 500));
  }
});
