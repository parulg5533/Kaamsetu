import { headers } from 'next/headers';
import { prisma } from './prisma';

export interface AuthSession {
  userId: string;
  role: string;
}

export async function getAuthSession(request?: Request): Promise<AuthSession | null> {
  let authHeader: string | null = null;

  if (request) {
    authHeader = request.headers.get('authorization');
  } else {
    const headersList = headers();
    authHeader = headersList.get('authorization');
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (decoded && decoded.userId) {
      return decoded as AuthSession;
    }
  } catch (err) {
    return null;
  }

  return null;
}
