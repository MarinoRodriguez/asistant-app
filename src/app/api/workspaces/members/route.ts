import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveWorkspaceId,
  getCurrentUser,
  getRoles,
  listMemberships,
  saveMemberships,
  type Role,
} from '@/lib/auth-server';

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!roles.includes('owner')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const members = listMemberships().filter(m => m.workspaceId === wsId);
  return NextResponse.json(members);
}

export async function PUT(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!roles.includes('owner')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { userId, roles: newRoles } = await req.json();
  if (!Array.isArray(newRoles)) return NextResponse.json({ error: 'roles inválidos' }, { status: 400 });
  const allowed: Role[] = ['viewer', 'people_manager', 'session_manager'];
  const rolesClean = Array.from(new Set(newRoles.filter((r: any) => allowed.includes(r))));
  const memberships = listMemberships();
  const m = memberships.find(x => x.workspaceId === wsId && x.userId === Number(userId));
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  m.roles = rolesClean;
  saveMemberships(memberships);
  return NextResponse.json(m);
}

export async function DELETE(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!roles.includes('owner')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { userId } = await req.json();
  let memberships = listMemberships();
  const before = memberships.length;
  memberships = memberships.filter(m => !(m.workspaceId === wsId && m.userId === Number(userId)));
  if (memberships.length === before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  saveMemberships(memberships);
  return NextResponse.json({ ok: true });
}

