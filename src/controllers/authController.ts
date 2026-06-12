import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser, getUsersCollection } from '../models/userModel';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateTokens';
import { ObjectId } from 'mongodb';

// Register
export async function register(req: Request, res: Response) {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Check existing user
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await createUser({
      username,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',  // only allow admin via special logic
    });

    // Generate tokens
    const payload = { userId: newUser._id!.toString(), role: newUser.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token in DB
    const users = getUsersCollection();
    await users.updateOne(
      { _id: newUser._id },
      { $set: { refreshToken } }
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ accessToken, user: { id: newUser._id, username, email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { userId: user._id!.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save new refresh token
    const users = getUsersCollection();
    await users.updateOne({ _id: user._id }, { $set: { refreshToken } });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ accessToken, user: { id: user._id, username: user.username, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Refresh token endpoint
export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) return res.status(403).json({ message: 'Invalid refresh token' });

  const users = getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(decoded.userId), refreshToken });
  if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

  const newPayload = { userId: user._id!.toString(), role: user.role };
  const newAccessToken = generateAccessToken(newPayload);

  res.json({ accessToken: newAccessToken });
}

// Logout
export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded) {
      const users = getUsersCollection();
      await users.updateOne({ _id: new ObjectId(decoded.userId) }, { $unset: { refreshToken: "" } });
    }
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
}