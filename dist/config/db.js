"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.getDb = getDb;
const mongodb_1 = require("mongodb");
let db;
async function connectToDatabase() {
    const client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
    return db;
}
function getDb() {
    if (!db)
        throw new Error('Database not connected');
    return db;
}
//# sourceMappingURL=db.js.map