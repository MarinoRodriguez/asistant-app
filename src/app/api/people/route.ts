import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

import { getActiveWorkspaceId, getCurrentUser, getRoles } from '@/lib/auth-server';

interface Person {
  id: number;
  name: string;
  workspaceId: number;
}

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const people = readJSON<Person[]>('people.json').filter(p => p.workspaceId === wsId);
  return NextResponse.json(people);
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!(roles.includes('owner') || roles.includes('people_manager'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { name } = await req.json();
  const people = readJSON<Person[]>('people.json');
  const newPerson: Person = { id: Date.now(), name, workspaceId: wsId };
  people.push(newPerson);
  writeJSON('people.json', people);
  return NextResponse.json(newPerson);
}
