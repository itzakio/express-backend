import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';

// Extend Express Request type to include user (from your auth middleware)
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export async function searchUsers(req: AuthRequest, res: Response) {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required and must be a string' });
  }

  const db = getDb();
  try {
    const users = await db.collection('users').find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: new ObjectId(req.user?.userId) } // exclude current user
    })
    .project({ password: 0, refreshToken: 0 })
    .toArray();

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
}