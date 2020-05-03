const tableNames = require("../../utils/tableNames");
const { hashPassword } = require("../../utils/bcryptHelper");
/**
 * @param {Knex} knex
 */
exports.seed = async (knex) => {
  // Deletes ALL existing entries
  await knex(tableNames.users).del();
  await knex(tableNames.hash).del();
  await knex(tableNames.todos).del();

  const password = "password";
  const email = "gbengacodes@gmail.com";

  const user = {
    first_name: "Gbenga",
    last_name: "Olufeyimi",
    middle_name: "Olatunde",
    gender: "male",
    email,
  };
  const insertedUser = await knex(tableNames.users).insert(user).returning("*");
  const userId = insertedUser[0].id;

  const hashedUser = {
    user_id: userId,
    password: await hashPassword(password),
  };
  await knex(tableNames.hash).insert(hashedUser);

  const todo = {
    todo_item: "Gbenga is trying out all these",
    description: 500,
    priority: "high",
    user_id: userId,
  };

  await knex(tableNames.todos).insert(todo);
};
