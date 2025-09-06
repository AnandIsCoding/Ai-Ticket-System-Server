import express from "express";
import { StatusCodes } from "http-status-codes";

import { logoutController, registerWithGoogleController } from "../controllers/auth.controller.js";
import { isAuthenticatedUser } from "../middlewares/auth.middleware.js";
import User from "../models/user.model.js";

const authRouter = express.Router();

authRouter.post("/login", registerWithGoogleController);
authRouter.delete("/logout", isAuthenticatedUser, logoutController)


authRouter.get("/profile", isAuthenticatedUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message || "Internal Server Error",
    });
  }
});

export default authRouter;