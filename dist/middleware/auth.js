"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const generateTokens_1 = require("../utils/generateTokens");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token)
        return res.status(401).json({ message: 'Access token missing' });
    const payload = (0, generateTokens_1.verifyAccessToken)(token);
    if (!payload)
        return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = payload;
    next();
}
function authorize(roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: insufficient role' });
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map