import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';
import { getActiveWorkspaceId, getCurrentUser, getRoles } from '@/lib/auth-server';

interface SessionRecord {
  personId: number;
  present: boolean;
  markedAt?: string;
}

interface Session {
  id: number;
  date: string;
  name?: string;
  workspaceId: number;
  closed: boolean;
  records: SessionRecord[];
}

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const sessions = readJSON<Session[]>('sessions.json').filter(s => s.workspaceId === wsId);
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!(roles.includes('owner') || roles.includes('session_manager'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { date, name } = await req.json();
  const sessions = readJSON<Session[]>('sessions.json');
  if (!date || !name || String(name).trim().length === 0) {
    return NextResponse.json({ error: 'Fecha y nombre son requeridos' }, { status: 400 });
  }
  const normalizedName = String(name).trim().toLowerCase();
  const existsSameDayAndName = sessions.some(
    s => s.workspaceId === wsId && s.date === date && (s.name?.trim().toLowerCase() === normalizedName)
  );
  if (existsSameDayAndName) {
    return NextResponse.json({ error: 'Ya existe una sesión con ese nombre en esa fecha' }, { status: 409 });
  }
  const newSession: Session = { id: Date.now(), date, name: String(name).trim(), workspaceId: wsId, closed: false, records: [] };
  sessions.push(newSession);
  writeJSON('sessions.json', sessions);
  return NextResponse.json(newSession);
}

