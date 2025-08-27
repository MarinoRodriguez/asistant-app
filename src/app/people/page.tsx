'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Person {
  id: number;
  name: string;
}

export default function PeoplePage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState('');

  const load = async () => {
    const res = await fetch('/api/people');
    const data = await res.json();
    setPeople(data);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    setName('');
    load();
  };

  return (
    <div>
      <h1>People</h1>
      <form onSubmit={add}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {people.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      <button onClick={() => router.push('/sessions')}>Sessions</button>
    </div>
  );
}
