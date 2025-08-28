import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getCurrentUser,
  listMemberships,
  listWorkspaces,
  saveMemberships,
  saveWorkspaces,
  type Workspace,
  type Membership,
} from '@/lib/auth-server';

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaces = listWorkspaces();
  const memberships = listMemberships().filter(m => m.userId === user.id);
  const myWorkspaces = memberships
    .map(m => workspaces.find(w => w.id === m.workspaceId))
    .filter(Boolean);
  return NextResponse.json(myWorkspaces);
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name } = await req.json();
  if (!name || String(name).trim().length === 0) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  }
  const workspaces = listWorkspaces();
  const memberships = listMemberships();
  const newWs: Workspace = {
    id: Date.now(),
    name: String(name).trim(),
    ownerUserId: user.id,
    createdAt: Date.now(),
  };
  workspaces.push(newWs);
  const member: Membership = { workspaceId: newWs.id, userId: user.id, roles: ['owner'] };
  memberships.push(member);
  saveWorkspaces(workspaces);
  saveMemberships(memberships);
  const res = NextResponse.json(newWs, { status: 201 });
  // Set as active workspace
  res.cookies.set('ws', String(newWs.id), { path: '/', sameSite: 'lax' });
  return res;
}

