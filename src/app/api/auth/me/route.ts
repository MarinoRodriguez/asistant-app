import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const raw = req.cookies.get('session')?.value;
  if (!raw) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const data = JSON.parse(raw) as { id: number; username: string; exp?: number };
    if (!data.exp || Date.now() > data.exp) {
      const res = NextResponse.json({ ok: false }, { status: 401 });
      res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 });
      return res;
    }
    return NextResponse.json({ ok: true, user: { id: data.id, username: data.username } });
  } catch {
    const res = NextResponse.json({ ok: false }, { status: 401 });
    res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
  }
}

