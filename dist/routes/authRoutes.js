"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/refresh', authController_1.refresh);
router.post('/logout', authController_1.logout);
// Protected example (any authenticated user)
router.get('/profile', auth_1.authenticate, (req, res) => {
    res.json({ user: req.user });
});
// Admin only example
router.get('/admin', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (req, res) => {
    res.json({ message: 'Welcome admin' });
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map