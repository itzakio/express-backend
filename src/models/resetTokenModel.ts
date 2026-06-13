import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';

export interface ResetToken {
  _id?: ObjectId;
  email: string;
  token: string;      // a short-lived JWT or random string
  expiresAt: Date;
  createdAt: Date;
}

export const getResetTokenCollection = () => {
  const db = getDb();
  return db.collection<ResetToken>('resettokens');
};

export async function createResetToken(email: string, token: string, expiresInMinutes = 5) {
  const collection = getResetTokenCollection();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  await collection.insertOne({
    email,
    token,
    expiresAt,
    createdAt: new Date(),
  });
}

export async function findValidResetToken(email: string, token: string) {
  const collection = getResetTokenCollection();
  return await collection.findOne({
    email,
    token,
    expiresAt: { $gt: new Date() },
  });
}

export async function deleteResetToken(email: string, token?: string) {
  const collection = getResetTokenCollection();
  if (token) {
    await collection.deleteOne({ email, token });
  } else {
    await collection.deleteMany({ email });
  }
}