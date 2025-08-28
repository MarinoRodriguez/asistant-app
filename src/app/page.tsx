'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: number;
  date: string;
  closed: boolean;
}

export default function Home() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) {
        router.replace('/login');
        return null;
      }
      setAuthed(true);
      return null;
    }).then(() => fetch('/api/sessions').then(r => r.json()).then(setSessions));
  }, [router]);

  const latest = useMemo(() => {
    return [...sessions].sort((a,b) => b.id - a.id).slice(0,5);
  }, [sessions]);

  if (!authed) return null;

  return (
    <div className="d-grid gap-3">
      <div className="card shadow-sm">
        <div className="card-body">
          <h1 className="h4">Inicio</h1>
          <div className="text-body-secondary">Elige una acción para comenzar</div>
          <div className="d-flex gap-2 flex-wrap mt-3">
            <Link className="btn btn-primary" href="/people">Gestionar personas</Link>
            <Link className="btn btn-outline-secondary" href="/sessions">Ver sesiones</Link>
            <Link className="btn btn-outline-secondary" href="/reports">Consultar reportes</Link>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="h5 m-0">Últimas sesiones</h2>
            <Link href="/sessions" className="btn btn-sm btn-outline-secondary">Ver todas</Link>
          </div>
          <ul className="list-group list-group-flush mt-2">
            {latest.map(s => (
              <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  {!s.closed && (
                    <span className="badge text-bg-primary">Activa</span>
                  )}
                  <div>
                    <div className="fw-semibold">{s.date}</div>
                    <div className="text-body-secondary small">{s.closed ? 'Cerrada' : 'Abierta'}</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => router.push(`/sessions/${s.id}`)}>Detalles</button>
              </li>
            ))}
            {latest.length === 0 && (
              <li className="list-group-item text-body-secondary">Aún no hay sesiones</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
