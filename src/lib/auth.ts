// ==========================================
// CurrículoPRO — Auth Services (Supabase Users)
// ==========================================

import crypto from 'crypto';
import { getSql } from '@/lib/db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'curriculopro_super_secret_jwt_key_2026';
const COOKIE_NAME = 'curriculopro_session';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function hashPassword(password: string): string {
  const salt = 'curriculopro_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function signToken(user: AuthUser): string {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Date.now() > data.exp) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export async function loginUser(email: string, password: string): Promise<AuthUser | null> {
  const sql = getSql();
  const passwordHash = hashPassword(password);

  const [user] = await sql<AuthUser[]>`
    SELECT id, email, name, role FROM users WHERE email = ${email.toLowerCase().trim()} AND password_hash = ${passwordHash}
  `;

  return user || null;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}
