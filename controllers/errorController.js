const AppError = require("../utils/appError");

const handleJWTError = () => {
  return new AppError("Invalid token. Please log in again!", 401);
};

const handleJWTExpiredError = () => {
  return new AppError("Your token has expired. Please log in again!", 401);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => {
    return el.message;
  });
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  //A.) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  //B.) RENDERED WEBSITE
  console.error("ERROR 🔥", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // a.) API
  if (req.originalUrl.startsWith("/api")) {
    //A.) Operational Error : Send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //B.)  Programming error: Don't leak the error
    // 1.) Log error
    console.error("ERROR 🔥", err);

    // 2.) Generic Error, send generic mesage
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
  }

  // b.) RENDERED WEBSITE
  //Operational Error : Send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: err.message,
    });
  }
  // Programming error: Don't leak the error
  // 1.) Log error
  console.error("ERROR 🔥", err);

  // 2.) Generic Error, send generic mesage
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    msg: "Please try again later",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    console.log(error);
    error.message = err.message;

    // Handling invalid database IDs error
    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }
    // Handling duplicate database fields error
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    // Handling Validation errors
    if (error.name === "ValidationError") {
      error = handleValidationErrorDB(error);
    }
    // Handling Web Token Error
    if (error.name === "JsonWebTokenError") {
      error = handleJWTError();
    }
    // Handling Token Expiry Error
    if (error.name === "TokenExpiredError") {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res);
  }
};
