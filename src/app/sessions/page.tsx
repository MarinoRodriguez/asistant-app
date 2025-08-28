'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  useEffect(() => { load(); }, []);

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
    <div className="d-grid gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-secondary" onClick={() => router.back()}>← Volver</button>
        <h1 className="h4 m-0">Sesiones</h1>
        <div style={{ width: 90 }} />
      </div>

      <div className="card shadow-sm"><div className="card-body">
        <form className="d-flex gap-2" onSubmit={create}>
          <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <button type="submit" className="btn btn-primary" onClick={(e) => { if (!window.confirm('¿Crear nueva sesión con la fecha seleccionada?')) { e.preventDefault(); } }}>Crear sesión</button>
        </form>
      </div></div>

      <div className="card shadow-sm"><div className="card-body">
        <h2 className="h5">Todas las sesiones</h2>
        <ul className="list-group mt-2">
          {sessions.map(s => (
            <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                {!s.closed && <span className="badge text-bg-primary">Activa</span>}
                <div>
                  <div className="fw-semibold">{s.date}</div>
                  <div className="text-body-secondary small">{s.closed ? 'Cerrada' : 'Abierta'}</div>
                </div>
              </div>
              <Link className="btn btn-sm btn-primary" href={`/sessions/${s.id}`}>Detalles</Link>
            </li>
          ))}
          {sessions.length === 0 && <li className="list-group-item text-body-secondary">Sin sesiones aún</li>}
        </ul>
      </div></div>
    </div>
  );
}
