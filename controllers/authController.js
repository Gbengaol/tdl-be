const crypto = require("crypto");
const knex = require("../db/knex");
const tableNames = require("../utils/tableNames");
const { hashPassword, comparePassword } = require("../utils/bcryptHelper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generateAndSendToken, validateToken } = require("../utils/jwtHelper");
const { createToken } = require("../utils/cryptoHelper");
const Email = require("../utils/emails");

exports.registerUser = catchAsync(async (req, res, next) => {
  const {
    first_name,
    last_name,
    middle_name,
    password,
    passwordAgain,
    email,
    gender,
  } = req.body;
  if (
    !first_name ||
    !last_name ||
    !password ||
    !passwordAgain ||
    !email ||
    !gender
  ) {
    return next(new AppError("There is a missing field in your request", 400));
  }

  if (password !== passwordAgain) {
    return next(new AppError("Passwords do not match", 400));
  }
  const user = {
    first_name,
    last_name,
    middle_name,
    email,
    gender,
  };
  const hashedPassword = await hashPassword(password);
  knex
    .transaction((trx) => {
      knex
        .insert(user)
        .returning("*")
        .into(tableNames.users)
        .transacting(trx)
        .then(async (user) => {
          await new Email(user[0]).welcomeEmail();
          await generateAndSendToken(user[0].id, 201, res, user[0]);
          return knex(tableNames.hash)
            .insert({ password: hashedPassword, user_id: user[0].id })
            .transacting(trx);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .then(async (inserts) => {
      if (!inserts) {
        next(new AppError("Bad Request", 400));
      }
    })
    .catch(function (error) {
      if (error.code === "23505") {
        res.status(500).json({
          message: "Email already exists",
        });
      } else if (error.code === "23502") {
        res.status(400).json({
          message: "There is a missing field in your request",
        });
      } else if (error.code === "22001") {
        res.status(400).json({
          message:
            "You have exceeded a field limit. Please check your request and try again!",
        });
      } else {
        next(new AppError("Internal Server Error", 500));
      }
    });
});

exports.loginUser = catchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await knex
      .select("*")
      .from(tableNames.users)
      .where("email", email);

    if (!user.length) {
      next(new AppError("Email or Password is incorrect", 400));
    }
    const hashedDetails = await knex
      .select("password")
      .from(tableNames.hash)
      .where("user_id", user[0].id);
    if (!hashedDetails.length) {
      next(new AppError("Email or Password is incorrect", 400));
    }
    const isValidUser = await comparePassword(
      password,
      hashedDetails[0].password
    );

    if (!isValidUser) {
      next(new AppError("Email or Password is incorrect", 400));
    }
    await generateAndSendToken(user[0].id, 200, res, user[0]);
  } catch (error) {
    next(new AppError("Internal Server Error", 500));
  }
});

exports.protectRoute = catchAsync(async (req, res, next) => {
  let token;

  // Check if Authorization is present in the header and if it starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access", 401)
    );
  }

  // Validate the token with JWT and get user Info from hasehed table
  const decoded = await validateToken(token);
  const freshUser = await knex(tableNames.users)
    .join("hash", "users.id", "hash.user_id")
    .select("users.id", "hash.password_changed_at", "users.email")
    .where({ user_id: decoded.data });

  if (!freshUser) {
    return next(new AppError("The user with this token no longer exists", 401));
  }

  // Check if user hasn't changed his/her password
  const password_changed_at = parseInt(
    freshUser[0].password_changed_at.getTime() / 1000
  );

  if (password_changed_at > decoded.iat) {
    return next(
      new AppError(
        "You recently changed your password, please log in again!",
        401
      )
    );
  }

  // Add the user to the request
  req.user = {
    email: freshUser[0].email,
    id: freshUser[0].id,
  };
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await knex(tableNames.users)
    .where({
      email,
    })
    .select("*");

  if (!user.length) {
    return next(new AppError("There is no user with that email", 400));
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = await createToken(token);
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setMinutes(expiryDate.getMinutes() + 1); // Password expires in the next one minute
  await knex(tableNames.hash).where({ user_id: user[0].id }).update({
    password_reset_token: hashedToken,
    password_expires_on: expiryDate,
  });
  // Send an email containing the url and token
  const url = `${process.env.frontend_reset_password_url}/${token}`;
  await new Email({ url, ...user[0] }).forgotPassword();
  res.status(200).json({
    message: "success",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { newPassword, newPasswordAgain } = req.body;

  if (!token || !newPassword || !newPasswordAgain) {
    return next(new AppError("Invalid Request", 400));
  }
  if (newPassword !== newPasswordAgain) {
    return next(new AppError("New passwords do not match!", 400));
  }
  const hashedToken = await createToken(token);
  const tokenInfo = await knex(tableNames.hash)
    .where({
      password_reset_token: hashedToken,
    })
    .select("password_expires_on", "user_id");

  if (!tokenInfo.length) {
    return next(new AppError("Invalid Token", 400));
  }

  const expired = new Date(tokenInfo[0].password_expires_on) < new Date();

  if (expired) {
    return next(
      new AppError(
        "Password reset token has expired. Please repeat forgot password process.",
        400
      )
    );
  }

  const hashedPassword = await hashPassword(newPassword);
  await knex(tableNames.hash).where({ user_id: tokenInfo[0].user_id }).update({
    password_reset_token: null,
    password_expires_on: null,
    password_changed_at: knex.fn.now(),
    password: hashedPassword,
  });

  await generateAndSendToken(tokenInfo[0].user_id, 200, res, null);
});
