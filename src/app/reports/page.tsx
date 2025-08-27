'use client';
import { useEffect, useState } from 'react';

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

export default function ReportsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [personId, setPersonId] = useState('all');

  useEffect(() => {
    fetch('/api/people').then(r => r.json()).then(setPeople);
    fetch('/api/sessions').then(r => r.json()).then(setSessions);
  }, []);

  const filtered = sessions.filter(s => {
    if (!s.closed) return false;
    if (start && s.date < start) return false;
    if (end && s.date > end) return false;
    return true;
  });

  const personFilter = personId === 'all' ? null : Number(personId);

  const rows = people
    .filter(p => !personFilter || p.id === personFilter)
    .map(p => {
      let present = 0;
      let total = 0;
      filtered.forEach(s => {
        const rec = s.records.find(r => r.personId === p.id);
        if (rec) {
          total += 1;
          if (rec.present) present += 1;
        }
      });
      return { name: p.name, present, total };
    });

  return (
    <div>
      <h1>Reports</h1>
      <div>
        <input type="date" value={start} onChange={e => setStart(e.target.value)} />
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
        <select value={personId} onChange={e => setPersonId(e.target.value)}>
          <option value="all">All</option>
          {people.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Present</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.present}</td>
              <td>{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
