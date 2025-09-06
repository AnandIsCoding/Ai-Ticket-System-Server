import chalk from 'chalk'
import { OAuth2Client } from "google-auth-library";
import {StatusCodes} from 'http-status-codes';
import jwt from "jsonwebtoken";

import { CLIENT_ID } from "../configs/server.config.js";


const client = new OAuth2Client(CLIENT_ID);



import userRegistrationSuccessEmail from "../mail/templates/userRegistrationSuccessEmail.js";
import User from "../models/user.model.js";
import mailSender from "../utils/mailSender.utils.js";

export const registerWithGoogleController = async (req, res) => {
  try {
    // access token from request body
    const { token } = req.body;
    const LoginTicket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = LoginTicket.getPayload();
    const { sub, name, email, picture } = payload;
    let user = await User.findOne({ email });
    let userExists = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId: sub,
        email,
        fullName: name,
        profilePic: picture,
      });
    }
    // generate token
    const userToken = jwt.sign({ _id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });
    // assign token in cookie
    res.cookie("userToken", userToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production",
    });
    // send registration mail to new user
    try {
      if (!userExists) {
        await mailSender(
          user.email,
          "Welcome to Ai-Ticket-Raiser Platform 🤖",
          userRegistrationSuccessEmail(user.fullName)
        );
      }
    } catch (error) {
      console.log(
        chalk.bgRedBright(
          "Error in sending mail to user in registerWithGoogleController", error
        )
      );
    }
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Login Successfull", user });
  } catch (error) {
    // Error handling, error response
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
        "Error in registerWithGoogleController in auth.controller.js ---->> ",
        error
      )
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error !!",
      error: "Error in registerWithGoogleController in auth.controller.js",
    });
  }
};




// logout controller
export const logoutController = async (req, res) => {
  try {
    res.cookie("userToken", null, { expires: new Date(Date.now()) });
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "User logout successfully" });
  } catch (error) {
    // Handle other errors
    console.log(
      chalk.bgRedBright(
        "Error in logoutController in auth.controller.js ---->> ",
        error
      )
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error !!",
      error: "Error in logoutController in auth.controller.js",
    });
  }
};