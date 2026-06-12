import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
} from "../controllers/authController";
import { authenticate, authorize } from "../middleware/auth";
import { getUsersCollection } from "../models/userModel";
import { ObjectId } from "mongodb";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Protected example (any authenticated user)
router.get("/profile", authenticate, async (req, res) => {
  try {
    // Get user ID from the JWT payload (added by authenticate middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not found in token" });
    }

    // Fetch full user from database
    const users = getUsersCollection();
    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0, refreshToken: 0 } }, // Exclude sensitive data
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
// Admin only example
router.get("/admin", authenticate, authorize(["admin"]), (req, res) => {
  res.json({ message: "Welcome admin" });
});

export default router;
