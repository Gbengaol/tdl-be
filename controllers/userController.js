const knex = require("../db/knex");
const tableNames = require("../utils/tableNames");
const { comparePassword, hashPassword } = require("../utils/bcryptHelper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { sanitizeResponse } = require("../utils/sanitizeResponse");

exports.changePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword, newPasswordAgain } = req.body;

  // Confirm that all compulsory fields are present
  if (!oldPassword || !newPassword || !newPasswordAgain) {
    return next(new AppError("Invalid Request", 400));
  }

  // Check if new passwords supplied match
  if (newPassword !== newPasswordAgain) {
    return next(new AppError("New passwords do not match!", 400));
  }

  // Check if new passwords is not thesame as old password
  if (oldPassword === newPassword) {
    return next(new AppError("New password is thesame as old password!", 400));
  }

  // Check if Old Password is correct
  const userInfo = await knex(tableNames.hash)
    .where({
      user_id: req.user.id,
    })
    .select("password");

  if (!userInfo.length) {
    return next(new AppError("User info is incorrect", 400));
  }

  const isValidPassword = await comparePassword(
    oldPassword,
    userInfo[0].password
  );

  if (!isValidPassword) {
    return next(new AppError("The old password provided is incorrect.", 400));
  }

  const hashedPassword = await hashPassword(newPassword);
  const now = new Date();
  const password_changed_at = new Date(now);
  password_changed_at.setSeconds(password_changed_at.getSeconds() - 1);
  await knex(tableNames.hash)
    .where({
      user_id: req.user.id,
    })
    .update({
      password: hashedPassword,
      password_changed_at,
    });
  res.status(200).json({
    message: "success",
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  const email = req.user.email;

  const user = await knex(tableNames.users)
    .where({
      email,
    })
    .select();

  if (!user.length) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    message: "success",
    user: sanitizeResponse(user[0]),
  });
});

exports.editProfile = catchAsync(async (req, res, next) => {
  const {
    first_name,
    last_name,
    middle_name,
    gender,
    phone_number,
    profile_picture,
    dob,
  } = req.body;

  const newUserInfo = {
    first_name,
    last_name,
    middle_name,
    gender,
    phone_number,
    profile_picture,
    dob,
    updated_at: knex.fn.now(),
  };

  const email = req.user.email;

  const user = await knex(tableNames.users)
    .returning("*")
    .where({ email })
    .update(newUserInfo);

  if (!user.length) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    message: "success",
    user: sanitizeResponse(user[0]),
  });
});

exports.uploadProfilePhoto = catchAsync(async (req, res, next) => {
  const { profile_picture } = req.body;
  if (!profile_picture) {
    return next(new AppError("Bad Request", 400));
  }

  const newUserInfo = {
    profile_picture,
    updated_at: knex.fn.now(),
  };

  const email = req.user.email;

  const user = await knex(tableNames.users)
    .returning("*")
    .where({ email })
    .update(newUserInfo);

  if (!user.length) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    message: "success",
    user: sanitizeResponse(user[0]),
  });
});
