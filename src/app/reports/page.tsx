'use client';
import { useEffect, useMemo, useState } from 'react';

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
  const [selected, setSelected] = useState<number[]>([]);

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

  const selectedPeople = useMemo(() => (
    selected.length ? people.filter(p => selected.includes(p.id)) : people
  ), [people, selected]);

  const rows = selectedPeople
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
    <div className="d-grid gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-secondary" onClick={() => history.back()}>← Volver</button>
        <h1 className="h4 m-0">Reportes</h1>
        <div style={{ width: 90 }} />
      </div>
      <div className="card shadow-sm">
        <div className="card-body d-flex gap-2 flex-wrap align-items-center">
          <input className="form-control" type="date" value={start} onChange={e => setStart(e.target.value)} />
          <input className="form-control" type="date" value={end} onChange={e => setEnd(e.target.value)} />
          <button className="btn btn-outline-secondary" onClick={() => { setStart(''); setEnd(''); }}>Limpiar</button>
          <button className="btn btn-outline-primary" onClick={() => {
            const lines = ['name,present,total'];
            rows.forEach(r => lines.push(`${JSON.stringify(r.name)},${r.present},${r.total}`));
            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'reporte.csv';
            a.click();
          }}>Exportar CSV</button>
        </div>
        <div className="px-3 pb-3">
          <strong>Selecciona personas (opcional)</strong>
          <ul className="list-group mt-2" style={{ maxHeight: 300, overflow: 'auto' }}>
            {people.map(p => (
              <li key={p.id} className="list-group-item">
                <label className="d-flex align-items-center gap-2">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={e => {
                    setSelected(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id));
                  }} />
                  {p.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <table className="table table-striped">
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
