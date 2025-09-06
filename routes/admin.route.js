import express from "express";

import { getAllUsers, updateUsers } from "../controllers/admin.controller.js";
import {
  isAdmin,
  isAuthenticatedUser,
} from "../middlewares/auth.middleware.js";

const adminRouter = express.Router();

adminRouter.post("/update-users", isAuthenticatedUser, isAdmin, updateUsers);
adminRouter.get("/allusers", isAuthenticatedUser, isAdmin, getAllUsers);

export default adminRouter;
