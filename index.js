import chalk from "chalk"; // Chalk for colored console logs
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { serve } from "inngest/express";  // ✅ this gives you the serve() function

import { StatusCodes } from "http-status-codes";

import { onTicketCreated } from "./inngest/functions/onTicketCreate.js";

import connectToDb from "./configs/database.config.js";
import { PORT } from "./configs/server.config.js";
import { inngest } from "./inngest/client.js";
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.route.js";
import ticketRouter from "./routes/ticket.route.js";

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser middleware
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:7000",
  "https://ai-ticket-system-client.vercel.app"
];
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/ticket", ticketRouter);

app.use(
  "/api/v1/inngest",
  serve({
    client: inngest,
    functions: [onTicketCreated],
  })
);


// database connection
connectToDb()
  .then(() => {
    console.log(
      chalk.bgMagenta("Connected to MongoDB Database successfully ✅ ✅ ")
    );
    app.listen(PORT, () => {
      console.log(
        chalk.bgGreenBright(
          `🚀 Server is listening at http://localhost:${PORT}`
        )
      );
    });
  })
  .catch((error) => {
    console.error(
      chalk.bgRed("❌Error in connecting to MongoDB Database :" + error.message)
    );
    process.exit(1); // exit the process with an error status code 1
  });

app.get("/", (_, res) => {
  return res.status(200).json({ message: "Now Start Building controllers" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: "Something went wrong!" });
});
