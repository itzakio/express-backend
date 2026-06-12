"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersCollection = void 0;
exports.findUserByEmail = findUserByEmail;
exports.createUser = createUser;
const db_1 = require("../config/db");
const getUsersCollection = () => {
    const db = (0, db_1.getDb)();
    return db.collection('users');
};
exports.getUsersCollection = getUsersCollection;
// Helper to find user by email (or username)
async function findUserByEmail(email) {
    const users = (0, exports.getUsersCollection)();
    return await users.findOne({ email });
}
async function createUser(userData) {
    const users = (0, exports.getUsersCollection)();
    const newUser = {
        ...userData,
        createdAt: new Date(),
    };
    const result = await users.insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
}
//# sourceMappingURL=userModel.js.map