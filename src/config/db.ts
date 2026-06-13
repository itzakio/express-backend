import { MongoClient, Db } from "mongodb";

let db: Db;

export async function connectToDatabase(): Promise<Db> {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  db = client.db();
  console.log("Connected to MongoDB");
  // Create TTL index for passwordresets collection
  const passwordResetsCollection = db.collection("passwordresets");
  await passwordResetsCollection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }, // Documents expire exactly at the 'expiresAt' time
  );
  console.log("TTL index created on passwordresets collection");
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error("Database not connected");
  return db;
}
