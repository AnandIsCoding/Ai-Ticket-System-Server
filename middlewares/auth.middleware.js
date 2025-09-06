import chalk from "chalk";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

import { SECRET_KEY } from "../configs/server.config.js";

// Auth
export const isAuthenticatedUser = async (req, res, next) => {
  try {
    //extract token
    const { userToken } = req.cookies;

    // if token not available
    if (!userToken)
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,

        message: "Unauthorized, userToken not found !!",
        error: "userToken not found",
      });
    //verify userToken
    try {
      const decodedData = jwt.verify(userToken, SECRET_KEY);
      const { _id, role } = decodedData;
      req.user = { userId: _id, role };
    } catch (error) {
      console.log(
        "Error in decodingjwt in authenticationMiddleware ----> ",
        error.message
      );
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized access",
        error: "Unauthorized access",
      });
    }

    next();
  } catch (error) {
    console.log(
      chalk.bgRedBright(
        "Error in authenticationMiddleware function in auth.middleware.js --->> ",
        error.message
      )
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
      error: "Internal Server Error",
    });
  }
};

// isAdmin

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    const { role } = req.user;
    if (user.role !== "admin") {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized to access Admin routes",
        error: "Unauthorized to access Admin routes",
      });
    }
    next();
  } catch (error) {
    console.log(
      chalk.bgRedBright(
        "Error in isAdminMiddleware function in auth.middleware.js --->> ",
        error.message
      )
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error, Can't find user's role",
      error: "Internal Server Error",
    });
  }
};
