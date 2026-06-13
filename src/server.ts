import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectToDatabase } from "./config/db";
import authRoutes from "./routes/authRoutes";
import path from "path";


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // adjust origin

// Routes
// app.get("/", (req, res) => {
//   res.json({
//     message: "Auth API is running",
//     documentation: "See /api/auth/* for authentication endpoints",
//   });
// });
app.use(express.static(path.join(__dirname, "/public")));
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (req, res) => res.send("OK"));

// Global error handler (optional)
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  },
);

// Start server
connectToDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
