import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}

