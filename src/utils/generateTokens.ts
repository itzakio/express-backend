import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
}

const getSecret = (key: string): string => {
  const secret = process.env[key];
  if (!secret) {
    throw new Error(`${key} is not defined in environment variables`);
  }
  return secret;
};

export function generateAccessToken(payload: TokenPayload): string {
  const options = { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' } as jwt.SignOptions;
  return jwt.sign(payload, getSecret('ACCESS_TOKEN_SECRET'), options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options = { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' } as jwt.SignOptions;
  return jwt.sign(payload, getSecret('REFRESH_TOKEN_SECRET'), options);
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret('ACCESS_TOKEN_SECRET')) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret('REFRESH_TOKEN_SECRET')) as TokenPayload;
  } catch {
    return null;
  }
}