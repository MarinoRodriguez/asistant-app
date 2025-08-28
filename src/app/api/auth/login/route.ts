import { NextRequest, NextResponse } from 'next/server';
import { readJSON } from '@/lib/db';
import { listMemberships } from '@/lib/auth-server';

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
  // Set a default active workspace if user is member of any
  try {
    const ms = listMemberships().filter(m => m.userId === user.id);
    if (ms.length > 0) {
      res.cookies.set('ws', String(ms[0].workspaceId), { path: '/', sameSite: 'lax' });
    }
  } catch {}
  return res;
}
