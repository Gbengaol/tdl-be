const Knex = require("knex");
const tableNames = require("../../utils/tableNames");

/**
 * @param {Knex} knex
 */

exports.up = async (knex) => {
  // Create a user table
  await knex.schema.createTable(tableNames.users, (table) => {
    table.increments();
    table.string("first_name", 50).notNullable();
    table.string("last_name", 50).notNullable();
    table.string("middle_name", 50);
    table.enu("gender", ["male", "female"]).notNullable();
    table.string("email", 256).notNullable().unique();
    table.string("phone_number", 15);
    table.text("profile_picture", 500);
    table.dateTime("dob");
    table.dateTime("deleted_at");
    table.timestamps(false, true);
  });

  // Create a table for password hashes
  await knex.schema.createTable(tableNames.hash, (table) => {
    table.increments();
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable(tableNames.users)
      .onDelete("cascade")
      .notNullable();
    table.string("password").notNullable();
    table.timestamp("password_changed_at").defaultTo(knex.fn.now());
    table.string("password_reset_token");
    table.dateTime("password_expires_on");
    table.timestamps(false, true);
  });

  // Create a table for todo items
  await knex.schema.createTable(tableNames.todos, (table) => {
    table.increments();
    table.string("todo_item").notNullable();
    table.text("description", 500);
    table.enu("priority", ["low", "medium", "high"]);
    table.boolean("status").defaultTo(false);
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable(tableNames.users)
      .onDelete("cascade");
    table.dateTime("deleted_at");
    table.timestamps(false, true);
  });
};

/**
 * @param {Knex} knex
 */

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists(tableNames.hash);
  await knex.schema.dropTableIfExists(tableNames.todos);
  await knex.schema.dropTableIfExists(tableNames.users);
};
