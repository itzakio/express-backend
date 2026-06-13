import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { findUserByEmail, getUsersCollection } from "../models/userModel";
import {
  createPasswordReset,
  findValidResetRequest,
  deleteResetRequest,
} from "../models/passwordResetModel";
import {
  createResetToken,
  findValidResetToken,
  deleteResetToken,
} from "../models/resetTokenModel";
import { sendOTPEmail } from "../config/email";

// 1. Request OTP (unchanged)
export async function requestPasswordReset(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const genericMessage =
    "If a user with that email exists, an OTP has been sent.";

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(200).json({ message: genericMessage });

    const otp = crypto.randomInt(100000, 999999).toString();
    console.log(`OTP for ${email}: ${otp}`); // remove in production

    await deleteResetRequest(email);
    await createPasswordReset(email, otp);
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// 2. Verify OTP and issue a short‑lived reset token
export async function verifyOtpAndGetResetToken(req: Request, res: Response) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const validRequest = await findValidResetRequest(email, otp);
    if (!validRequest) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Generate a short‑lived JWT (or a random string) that can only be used to reset password
    const resetToken = jwt.sign(
      { email, purpose: "password_reset" },
      process.env.ACCESS_TOKEN_SECRET!, // use a different secret if you want
      { expiresIn: "5m" }, // 5 minutes to complete reset
    );

    // Store it in the database so we can invalidate after use
    await createResetToken(email, resetToken, 5);

    // Delete the OTP so it cannot be reused
    await deleteResetRequest(email);

    res
      .status(200)
      .json({
        resetToken,
        message: "OTP verified. Use this token to reset your password.",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// 3. Reset password using the reset token
export async function resetPasswordWithToken(req: Request, res: Response) {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email, reset token, and new password are required" });
  }
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Verify the reset token (JWT)
    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, process.env.ACCESS_TOKEN_SECRET!);
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    if (decoded.email !== email || decoded.purpose !== "password_reset") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    // Check if token exists and is still valid in DB (optional but extra security)
    const validDbToken = await findValidResetToken(email, resetToken);
    if (!validDbToken) {
      return res
        .status(400)
        .json({ message: "Reset token has already been used or expired" });
    }

    // Find the user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const users = getUsersCollection();
    await users.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } },
    );

    // Invalidate the used reset token
    await deleteResetToken(email, resetToken);

    // Optional: Also invalidate all refresh tokens for this user
    await users.updateOne({ _id: user._id }, { $unset: { refreshToken: "" } });

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
