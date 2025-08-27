import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

interface SessionRecord {
  personId: number;
  present: boolean;
}

interface Session {
  id: number;
  date: string;
  closed: boolean;
  records: SessionRecord[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessions = readJSON<Session[]>('sessions.json');
  const session = sessions.find(s => s.id === Number(id));
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { records, closed } = await req.json();
  const sessions = readJSON<Session[]>('sessions.json');
  const session = sessions.find(s => s.id === Number(id));
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (session.closed) {
    return NextResponse.json({ error: 'Session closed' }, { status: 400 });
  }
  if (records) {
    session.records = records;
  }
  if (closed) {
    session.closed = true;
  }
  writeJSON('sessions.json', sessions);
  return NextResponse.json(session);
}
