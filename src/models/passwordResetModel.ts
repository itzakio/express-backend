import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';

export interface PasswordReset {
  _id?: ObjectId;
  email: string;
  otp: string;        // In production, store a hashed version!
  expiresAt: Date;
  createdAt: Date;
}

export const getPasswordResetCollection = () => {
  const db = getDb();
  return db.collection<PasswordReset>('passwordresets');
};

export async function createPasswordReset(email: string, otp: string, expiresInMinutes = 10) {
  const collection = getPasswordResetCollection();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  const newReset: PasswordReset = {
    email,
    otp,   // In production, store a hashed version!
    expiresAt,
    createdAt: new Date()
  };
  await collection.insertOne(newReset);
  return newReset;
}

export async function findValidResetRequest(email: string, otp: string) {
  const collection = getPasswordResetCollection();
  return await collection.findOne({
    email,
    otp,
    expiresAt: { $gt: new Date() }
  });
}

export async function deleteResetRequest(email: string) {
  const collection = getPasswordResetCollection();
  await collection.deleteMany({ email });
}