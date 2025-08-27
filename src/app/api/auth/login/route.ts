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
  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username } });
}
