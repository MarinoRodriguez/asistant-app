import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveWorkspaceId,
  getCurrentUser,
  getRoles,
  listInvitations,
  saveInvitations,
} from '@/lib/auth-server';

function generateCode(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!roles.includes('owner')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const invitations = listInvitations().filter(i => i.workspaceId === wsId);
  return NextResponse.json(invitations);
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!roles.includes('owner')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const maxUses = Math.max(1, Number(body?.maxUses ?? 1));
  let expiresAt: number | undefined;
  if (body?.expiresAt) {
    const t = new Date(body.expiresAt).getTime();
    if (Number.isFinite(t)) expiresAt = t; else return NextResponse.json({ error: 'expiresAt inválido' }, { status: 400 });
  } else if (body?.ttlHours) {
    const h = Number(body.ttlHours);
    if (!Number.isFinite(h) || h <= 0) return NextResponse.json({ error: 'ttlHours inválido' }, { status: 400 });
    expiresAt = Date.now() + h * 3600000;
  }
  const all = listInvitations();
  let code = String(body?.code ?? '').trim().toUpperCase();
  if (code) {
    if (all.some(i => i.code === code)) return NextResponse.json({ error: 'El código ya existe' }, { status: 409 });
  } else {
    do { code = generateCode(10); } while (all.some(i => i.code === code));
  }
  const inv = { code, workspaceId: wsId, createdByUserId: user.id, createdAt: Date.now(), expiresAt, maxUses, uses: 0 };
  all.push(inv);
  saveInvitations(all);
  return NextResponse.json(inv, { status: 201 });
}

