const bcrypt = require("bcrypt");

exports.hashPassword = (password) => {
  return bcrypt.hash(password, 12);
};

exports.comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};
