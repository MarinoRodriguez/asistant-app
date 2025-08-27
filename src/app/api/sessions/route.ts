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

export async function GET() {
  const sessions = readJSON<Session[]>('sessions.json');
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const { date } = await req.json();
  const sessions = readJSON<Session[]>('sessions.json');
  const newSession: Session = { id: Date.now(), date, closed: false, records: [] };
  sessions.push(newSession);
  writeJSON('sessions.json', sessions);
  return NextResponse.json(newSession);
}
