// ==========================================
// CurrículoPRO — Login API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { loginUser, signToken, getSessionCookieName } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const user = await loginUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }

    const token = signToken(user);
    const response = NextResponse.json({ success: true, user });

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao realizar login' },
      { status: 500 }
    );
  }
}
