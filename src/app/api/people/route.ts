import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

interface Person {
  id: number;
  name: string;
}

export async function GET() {
  const people = readJSON<Person[]>('people.json');
  return NextResponse.json(people);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  const people = readJSON<Person[]>('people.json');
  const newPerson: Person = { id: Date.now(), name };
  people.push(newPerson);
  writeJSON('people.json', people);
  return NextResponse.json(newPerson);
}
