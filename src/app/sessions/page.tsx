'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: number;
  date: string;
  closed: boolean;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [date, setDate] = useState('');

  const load = async () => {
    const res = await fetch('/api/sessions');
    setSessions(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
    const session = await res.json();
    router.push(`/sessions/${session.id}`);
  };

  return (
    <div>
      <h1>Sessions</h1>
      <form onSubmit={create}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button type="submit">Create</button>
      </form>
      <ul>
        {sessions.map(s => (
          <li key={s.id}>
            {s.date} - {s.closed ? 'closed' : 'open'}
            <button onClick={() => router.push(`/sessions/${s.id}`)}>Open</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
