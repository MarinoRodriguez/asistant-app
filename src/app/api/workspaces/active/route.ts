import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getActiveWorkspaceId, getCurrentUser, listMemberships, listWorkspaces } from '@/lib/auth-server';

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ active: null });
  const isMember = listMemberships().some(m => m.userId === user.id && m.workspaceId === wsId);
  if (!isMember) return NextResponse.json({ active: null });
  const ws = listWorkspaces().find(w => w.id === wsId) ?? null;
  return NextResponse.json({ active: ws });
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { workspaceId } = await req.json();
  const wsId = Number(workspaceId);
  if (!Number.isFinite(wsId)) return NextResponse.json({ error: 'workspaceId inválido' }, { status: 400 });
  const memberships = listMemberships();
  const isMember = memberships.some(m => m.userId === user.id && m.workspaceId === wsId);
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('ws', String(wsId), { path: '/', sameSite: 'lax' });
  return res;
}

