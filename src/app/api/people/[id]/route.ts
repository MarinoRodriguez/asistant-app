import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';
import { getActiveWorkspaceId, getCurrentUser, getRoles } from '@/lib/auth-server';

interface Person {
  id: number;
  name: string;
  workspaceId: number;
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
  const people = readJSON<Person[]>('people.json');
  const person = people.find(p => p.id === Number(id) && p.workspaceId === wsId);
  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(person);
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
  if (!(roles.includes('owner') || roles.includes('people_manager'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const people = readJSON<Person[]>('people.json');
  const person = people.find(p => p.id === Number(id) && p.workspaceId === wsId);
  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (body.name) person.name = String(body.name);
  writeJSON('people.json', people);
  return NextResponse.json(person);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const wsId = getActiveWorkspaceId();
  if (!wsId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  const roles = getRoles(user.id, wsId);
  if (!(roles.includes('owner') || roles.includes('people_manager'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  let people = readJSON<Person[]>('people.json');
  const before = people.length;
  people = people.filter(p => !(p.id === Number(id) && p.workspaceId === wsId));
  if (people.length === before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  writeJSON('people.json', people);
  return NextResponse.json({ ok: true });
}
