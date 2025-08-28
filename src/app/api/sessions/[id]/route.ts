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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const { id } = await params;
  const sessions = readJSON<Session[]>('sessions.json');
  const session = sessions.find(s => s.id === Number(id) && s.workspaceId === wsId);
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!(roles.includes('owner') || roles.includes('session_manager'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const { records, closed } = await req.json();
  const sessions = readJSON<Session[]>('sessions.json');
  const session = sessions.find(s => s.id === Number(id) && s.workspaceId === wsId);
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
