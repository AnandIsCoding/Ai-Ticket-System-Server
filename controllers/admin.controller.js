import chalk from "chalk";
import { StatusCodes } from "http-status-codes";

import User from "../models/user.model.js";

export const updateUsers = async (req, res) => {
  try {
    const { email, role, skills = [] } = req.body;

    // verify email of selected user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `User not found with email ${email}`,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        // only update role if provided, otherwise keep same
        role: role ?? user.role,
        // keep old skills if not passed
        skills: skills.length > 0 ? skills : user.skills,
      },
      { new: true } // return updated doc
    );

    // return success response

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      // Extract validation messages
      const messages = Object.values(error.errors).map((err) => err.message);
      console.error(chalk.bgRed("Validation Error =>>>"), messages);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: messages[0],
        error: messages[0],
      });
    }
    console.log(
      chalk.bgRedBright(
        "Error in UpdateUsers by admin in admin.controller.js ---->> ",
        error
      )
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error !!",
      error: "Error in UpdateUsers in admin.controller.js",
    });
  }
};

// get all users, only admin can get

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res
      .status(StatusCodes.OK)
      .json({
        success: true,
        message: "All Users fetched successfully",
        users,
      });
  } catch (error) {
    console.log(
      chalk.bgRedBright(
        "Error in getAllUsers by admin in admin.controller.js ---->> ",
        error
      )
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error !!",
      error: "Error in getAllUsers in admin.controller.js",
    });
  }
};
