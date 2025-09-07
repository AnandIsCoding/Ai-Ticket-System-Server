import chalk from "chalk"; // Chalk for colored console logs
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { StatusCodes } from "http-status-codes";
import { serve } from "inngest/express"; // ✅ this gives you the serve() function

import connectToDb from "./configs/database.config.js";
import { inngest } from "./inngest/client.js";
import { onTicketCreated } from "./inngest/functions/onTicketCreate.js";
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.route.js";
import ticketRouter from "./routes/ticket.route.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:7000",
  "https://ai-ticket-system-client.vercel.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      // Allow server-to-server requests (like Inngest) with no origin
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Also allow preflight requests
app.options("*", cors(corsOptions));


// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/ticket", ticketRouter);

// Inngest webhook
app.use(
  "/api/v1/inngest",
  serve({
    client: inngest,
    functions: [onTicketCreated],
  })
);

// Root route
app.get("/", (_, res) =>
  res.status(200).json({ message: "Server is running!" })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: "Something went wrong!" });
});

// Connect to MongoDB immediately (Vercel will reuse DB connection for serverless invocations)
connectToDb()
  .then(() =>
    console.log(chalk.bgMagenta("Connected to MongoDB Database successfully ✅ ✅"))
  )
  .catch((error) => {
    console.error(chalk.bgRed("❌Error connecting to MongoDB: " + error.message));
    process.exit(1);
  });

export default app; // ✅ Export for Vercel serverless
