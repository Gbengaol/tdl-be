const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");

// Routers
const todosRouter = require("./routes/todoRoute");
const archivedTodosRouter = require("./routes/archivedTodoRoute");
const authRouter = require("./routes/authRoute");
const userRouter = require("./routes/userRoute");
const uploadPhotoRouter = require("./routes/uploadPhotoRoute");

dotenv.config();

const app = express();

app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/api/todos", todosRouter);
app.use("/api/archived/todos", archivedTodosRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/photo/upload", uploadPhotoRouter);

//Handling unhandled/non-existing routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Global Error Handling Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Application is running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`
  );
});
