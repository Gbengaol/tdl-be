const jwt = require("jsonwebtoken");

exports.generateAndSendToken = (data, status, res, user) => {
  const jwt_token = jwt.sign({ data }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
  };
  res.cookie("token", jwt_token, cookieOptions);
  res.status(status).json({
    token: jwt_token,
    message: "success",
    user,
  });
};

exports.validateToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
