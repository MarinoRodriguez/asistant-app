'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

declare global {
  interface Window { sessionDirty?: boolean }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) setAuthed(true);
      else setAuthed(false);
    }).catch(() => setAuthed(false));
  }, [pathname]);

  const nav = (href: string) => {
    if (typeof window !== 'undefined' && window.sessionDirty) {
      if (!confirm('Tienes cambios sin guardar en la sesión. ¿Salir de todos modos?')) {
        return;
      }
      window.sessionDirty = false;
    }
    setOpen(false);
    router.push(href);
  };

  const logout = async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false);
    router.replace('/login');
  };

  return (
    <div>
      {authed && (
        <button
          type="button"
          aria-label="Abrir menú"
          className="btn btn-outline-secondary position-fixed"
          style={{ top: 12, left: 12, zIndex: 1051 }}
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      {authed && (
        <>
          <div
            className="position-fixed bg-white border-end shadow"
            style={{ top: 0, bottom: 0, left: open ? 0 : -280, width: 260, zIndex: 1052, transition: 'left .2s ease' }}
            aria-hidden={!open}
          >
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
              <strong>Menú</strong>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="list-group list-group-flush">
              <button className="list-group-item list-group-item-action" onClick={() => nav('/')}>Inicio</button>
              <button className="list-group-item list-group-item-action" onClick={() => nav('/people')}>Personas</button>
              <button className="list-group-item list-group-item-action" onClick={() => nav('/sessions')}>Sesiones</button>
              <button className="list-group-item list-group-item-action" onClick={() => nav('/reports')}>Reportes</button>
            </div>
            <div className="p-3">
              <button className="btn btn-outline-danger w-100" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>
          {open && (
            <div
              className="position-fixed"
              style={{ inset: 0, background: 'rgba(0,0,0,.2)', zIndex: 1051 }}
              onClick={() => setOpen(false)}
            />
          )}
        </>
      )}

      <main className="py-4">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}

