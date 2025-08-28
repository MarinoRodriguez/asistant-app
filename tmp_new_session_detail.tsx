'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface Person {
  id: number;
  name: string;
}

interface Record {
  personId: number;
  present: boolean;
  markedAt?: string;
}

interface Session {
  id: number;
  date: string;
  name?: string;
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
  const [dirty, setDirty] = useState(false);

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
      const now = new Date().toISOString();
      rec.present = !rec.present;
      rec.markedAt = rec.present ? now : undefined;
    } else {
      records.push({ personId, present: true, markedAt: new Date().toISOString() });
    }
    setSession({ ...session, records });
    setDirty(true);
    if (typeof window !== 'undefined') (window as any).sessionDirty = true;
  };

  const save = async () => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: session?.records })
    });
    setDirty(false);
    if (typeof window !== 'undefined') (window as any).sessionDirty = false;
    await Swal.fire({ icon: 'success', title: 'Sesión guardada', timer: 1200, showConfirmButton: false });
  };

  const close = async () => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: session?.records, closed: true })
    });
    if (typeof window !== 'undefined') (window as any).sessionDirty = false;
    router.push('/sessions');
  };

  const filtered = useMemo(
    () => people.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())),
    [people, filter]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!session?.closed && dirty) {
        e.preventDefault();
        e.returnValue = '' as any;
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, session?.closed]);

  if (!session) return <div>Loading...</div>;

  return (
    <div className="d-grid gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-secondary" onClick={async () => {
          if (!session.closed && dirty) {
            const res = await Swal.fire({ icon: 'warning', title: 'Cambios sin guardar', text: '¿Salir sin guardar?', showCancelButton: true, confirmButtonText: 'Salir', cancelButtonText: 'Cancelar' });
            if (!res.isConfirmed) return;
          }
          router.back();
        }}>⟵ Volver</button>
        <h1 className="h4 m-0">Sesión {session.name ?? session.date}</h1>
        <div style={{ width: 90 }} />
      </div>
      {!session.closed && (
        <div className="card shadow-sm">
          <div className="card-body d-grid gap-2">
          <input className="form-control" placeholder="Buscar persona" value={filter} onChange={e => setFilter(e.target.value)} />
          <ul className="list-group" style={{ maxHeight: 300, overflow: 'auto' }}>
            {filtered.map(p => {
              const rec = session.records.find(r => r.personId === p.id);
              return (
                <li key={p.id} className="list-group-item d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <input type="checkbox" checked={rec?.present || false} onChange={() => toggle(p.id)} />
                    <div>
                      <div>{p.name}</div>
                      <div className="text-body-secondary small">{rec?.markedAt ? new Date(rec.markedAt).toLocaleTimeString() : '—'}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" disabled={!dirty} onClick={save}>Guardar</button>
            <button className="btn btn-primary" onClick={async () => {
              const res = await Swal.fire({ icon: 'warning', title: 'Cerrar sesión', text: 'No podrás editarla después. ¿Cerrar ahora?', showCancelButton: true, confirmButtonText: 'Cerrar', cancelButtonText: 'Cancelar' });
              if (res.isConfirmed) close();
            }}>Cerrar sesión</button>
          </div>
          </div>
        </div>
      )}

      {session.closed && (
        <div className="card shadow-sm">
          <div className="card-body">
          <ul className="list-group">
            {people.map(p => {
              const rec = session.records.find(r => r.personId === p.id);
              return (
                <li key={p.id} className="list-group-item d-flex justify-content-between">
                  <div>{p.name}</div>
                  <div className="text-body-secondary">{rec?.present ? `Presente a las ${rec?.markedAt ? new Date(rec.markedAt).toLocaleTimeString() : ''}` : 'Ausente'}</div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3">
            <button className="btn btn-outline-primary" onClick={() => {
              const lines = ['name,present,markedAt'];
              people.forEach(p => {
                const rec = session.records.find(r => r.personId === p.id);
                lines.push(`${JSON.stringify(p.name)},${rec?.present ? '1' : '0'},${rec?.markedAt ?? ''}`);
              });
              const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `session-${session.id}.csv`;
              a.click();
            }}>Exportar CSV</button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
