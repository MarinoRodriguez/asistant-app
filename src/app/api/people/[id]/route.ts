import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

interface Person {
  id: number;
  name: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const people = readJSON<Person[]>('people.json');
  const person = people.find(p => p.id === Number(id));
  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(person);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const people = readJSON<Person[]>('people.json');
  const person = people.find(p => p.id === Number(id));
  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (body.name) person.name = String(body.name);
  writeJSON('people.json', people);
  return NextResponse.json(person);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let people = readJSON<Person[]>('people.json');
  const before = people.length;
  people = people.filter(p => p.id !== Number(id));
  if (people.length === before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  writeJSON('people.json', people);
  return NextResponse.json({ ok: true });
}

