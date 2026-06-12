import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  image?:string;
  password: string;        // hashed
  role: 'admin' | 'user';
  refreshToken?: string;
  createdAt: Date;
}

export const getUsersCollection = () => {
  const db = getDb();
  return db.collection<User>('users');
};

// Helper to find user by email (or username)
export async function findUserByEmail(email: string): Promise<User | null> {
  const users = getUsersCollection();
  return await users.findOne({ email });
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt'>): Promise<User> {
  const users = getUsersCollection();
  const newUser: User = {
    ...userData,
    createdAt: new Date(),
  };
  const result = await users.insertOne(newUser);
  return { ...newUser, _id: result.insertedId };
}