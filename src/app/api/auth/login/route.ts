import { NextRequest, NextResponse } from 'next/server';
import { readJSON } from '@/lib/db';

interface User {
  id: number;
  username: string;
  password: string;
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const users = readJSON<User[]>('users.json');
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  // Sesión por cookie HTTP-only (8 horas)
  const expMs = 8 * 60 * 60 * 1000;
  const payload = { id: user.id, username: user.username, exp: Date.now() + expMs };
  const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username } });
  res.cookies.set('session', JSON.stringify(payload), {
    httpOnly: true,
    path: '/',
    maxAge: expMs / 1000,
    sameSite: 'lax',
  });
  return res;
}
