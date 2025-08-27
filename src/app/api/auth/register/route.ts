import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

interface User {
  id: number;
  username: string;
  password: string;
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const users = readJSON<User[]>('users.json');
  if (users.find(u => u.username === username)) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }
  const newUser: User = { id: Date.now(), username, password };
  users.push(newUser);
  writeJSON('users.json', users);
  return NextResponse.json({ ok: true });
}
