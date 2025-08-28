import { NextRequest, NextResponse } from 'next/server';
import {
  listInvitations,
  saveInvitations,
  getCurrentUser,
  listMemberships,
  saveMemberships,
} from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { code } = await req.json();
  const all = listInvitations();
  const inv = all.find(i => i.code === String(code).trim().toUpperCase());
  if (!inv) return NextResponse.json({ error: 'Código inválido' }, { status: 404 });
  if (inv.expiresAt && Date.now() > inv.expiresAt) return NextResponse.json({ error: 'Código expirado' }, { status: 410 });
  if (inv.uses >= inv.maxUses) return NextResponse.json({ error: 'Código agotado' }, { status: 409 });

  // Add membership if not already
  const memberships = listMemberships();
  const existing = memberships.find(m => m.userId === user.id && m.workspaceId === inv.workspaceId);
  if (!existing) {
    memberships.push({ workspaceId: inv.workspaceId, userId: user.id, roles: ['viewer'] });
    saveMemberships(memberships);
  }
  inv.uses += 1;
  saveInvitations(all);
  return NextResponse.json({ ok: true, workspaceId: inv.workspaceId });
}

