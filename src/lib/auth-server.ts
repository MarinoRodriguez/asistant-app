import { cookies } from 'next/headers';
import { readJSON, writeJSON } from '@/lib/db';

export interface User {
  id: number;
  username: string;
  password: string;
}

export interface Workspace {
  id: number;
  name: string;
  ownerUserId: number;
  createdAt: number;
}

export type Role = 'owner' | 'viewer' | 'people_manager' | 'session_manager';

export interface Membership {
  workspaceId: number;
  userId: number;
  roles: Role[];
}

export interface Invitation {
  code: string;
  workspaceId: number;
  createdByUserId: number;
  createdAt: number;
  expiresAt?: number; // timestamp ms
  maxUses: number; // >=1
  uses: number;
}

export function getCurrentUser(): User | null {
  const raw = cookies().get('session')?.value;
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { id: number; username: string; exp?: number };
    if (!data.exp || Date.now() > data.exp) return null;
    const users = readJSON<User[]>('users.json');
    return users.find(u => u.id === data.id) ?? null;
  } catch {
    return null;
  }
}

export function getActiveWorkspaceId(): number | null {
  const raw = cookies().get('ws')?.value;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function listMemberships(): Membership[] {
  return readJSON<Membership[]>('memberships.json');
}

export function listWorkspaces(): Workspace[] {
  return readJSON<Workspace[]>('workspaces.json');
}

export function listInvitations(): Invitation[] {
  return readJSON<Invitation[]>('invitations.json');
}

export function saveMemberships(m: Membership[]) {
  writeJSON('memberships.json', m);
}

export function saveWorkspaces(w: Workspace[]) {
  writeJSON('workspaces.json', w);
}

export function saveInvitations(i: Invitation[]) {
  writeJSON('invitations.json', i);
}

export function isMember(userId: number, workspaceId: number): boolean {
  const ms = listMemberships();
  return ms.some(m => m.userId === userId && m.workspaceId === workspaceId);
}

export function getRoles(userId: number, workspaceId: number): Role[] {
  const ms = listMemberships();
  const m = ms.find(x => x.userId === userId && x.workspaceId === workspaceId);
  return m?.roles ?? [];
}

export function hasRole(userId: number, workspaceId: number, role: Role): boolean {
  const roles = getRoles(userId, workspaceId);
  return roles.includes('owner') || roles.includes(role);
}

