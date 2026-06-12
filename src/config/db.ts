import { MongoClient, Db } from 'mongodb';

let db: Db;

export async function connectToDatabase(): Promise<Db> {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB');
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected');
  return db;
}