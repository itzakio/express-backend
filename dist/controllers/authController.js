"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userModel_1 = require("../models/userModel");
const generateTokens_1 = require("../utils/generateTokens");
const mongodb_1 = require("mongodb");
// Register
async function register(req, res) {
    try {
        const { username, email, password, role = 'user' } = req.body;
        // Check existing user
        const existing = await (0, userModel_1.findUserByEmail)(email);
        if (existing) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const newUser = await (0, userModel_1.createUser)({
            username,
            email,
            password: hashedPassword,
            role: role === 'admin' ? 'admin' : 'user', // only allow admin via special logic
        });
        // Generate tokens
        const payload = { userId: newUser._id.toString(), role: newUser.role };
        const accessToken = (0, generateTokens_1.generateAccessToken)(payload);
        const refreshToken = (0, generateTokens_1.generateRefreshToken)(payload);
        // Save refresh token in DB
        const users = (0, userModel_1.getUsersCollection)();
        await users.updateOne({ _id: newUser._id }, { $set: { refreshToken } });
        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(201).json({ accessToken, user: { id: newUser._id, username, email, role: newUser.role } });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
// Login
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await (0, userModel_1.findUserByEmail)(email);
        if (!user)
            return res.status(401).json({ message: 'Invalid credentials' });
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ message: 'Invalid credentials' });
        const payload = { userId: user._id.toString(), role: user.role };
        const accessToken = (0, generateTokens_1.generateAccessToken)(payload);
        const refreshToken = (0, generateTokens_1.generateRefreshToken)(payload);
        // Save new refresh token
        const users = (0, userModel_1.getUsersCollection)();
        await users.updateOne({ _id: user._id }, { $set: { refreshToken } });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ accessToken, user: { id: user._id, username: user.username, email, role: user.role } });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
// Refresh token endpoint
async function refresh(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
        return res.status(401).json({ message: 'No refresh token' });
    const decoded = (0, generateTokens_1.verifyRefreshToken)(refreshToken);
    if (!decoded)
        return res.status(403).json({ message: 'Invalid refresh token' });
    const users = (0, userModel_1.getUsersCollection)();
    const user = await users.findOne({ _id: new mongodb_1.ObjectId(decoded.userId), refreshToken });
    if (!user)
        return res.status(403).json({ message: 'Invalid refresh token' });
    const newPayload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = (0, generateTokens_1.generateAccessToken)(newPayload);
    res.json({ accessToken: newAccessToken });
}
// Logout
async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        const decoded = (0, generateTokens_1.verifyRefreshToken)(refreshToken);
        if (decoded) {
            const users = (0, userModel_1.getUsersCollection)();
            await users.updateOne({ _id: new mongodb_1.ObjectId(decoded.userId) }, { $unset: { refreshToken: "" } });
        }
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
}
//# sourceMappingURL=authController.js.map