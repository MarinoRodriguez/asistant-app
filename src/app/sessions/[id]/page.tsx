'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Person {
  id: number;
  name: string;
}

interface Record {
  personId: number;
  present: boolean;
}

interface Session {
  id: number;
  date: string;
  closed: boolean;
  records: Record[];
}

export default function SessionPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      const sres = await fetch(`/api/sessions/${id}`);
      const pres = await fetch('/api/people');
      const sData = await sres.json();
      const pData = await pres.json();
      setSession(sData);
      setPeople(pData);
    };
    load();
  }, [id]);

  const toggle = (personId: number) => {
    if (!session) return;
    const records = [...session.records];
    const rec = records.find(r => r.personId === personId);
    if (rec) {
      rec.present = !rec.present;
    } else {
      records.push({ personId, present: true });
    }
    setSession({ ...session, records });
  };

  const save = async () => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: session?.records })
    });
  };

  const close = async () => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: session?.records, closed: true })
    });
    router.push('/sessions');
  };

  if (!session) return <div>Loading...</div>;

  const filtered = people.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <h1>Session {session.date}</h1>
      {!session.closed && (
        <div>
          <input placeholder="Search" value={filter} onChange={e => setFilter(e.target.value)} />
          <ul style={{ maxHeight: '300px', overflow: 'auto' }}>
            {filtered.map(p => {
              const rec = session.records.find(r => r.personId === p.id);
              return (
                <li key={p.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={rec?.present || false}
                      onChange={() => toggle(p.id)}
                    />
                    {p.name}
                  </label>
                </li>
              );
            })}
          </ul>
          <button onClick={save}>Save</button>
          <button onClick={close}>Close</button>
        </div>
      )}
      {session.closed && (
        <ul>
          {people.map(p => {
            const rec = session.records.find(r => r.personId === p.id);
            return (
              <li key={p.id}>
                {p.name}: {rec?.present ? 'present' : 'absent'}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
