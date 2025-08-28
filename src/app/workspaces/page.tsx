'use client';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface Workspace {
  id: number;
  name: string;
}

interface Invitation {
  code: string;
  workspaceId: number;
  createdAt: number;
  expiresAt?: number;
  maxUses: number;
  uses: number;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [active, setActive] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  const load = async () => {
    const wsRes = await fetch('/api/workspaces');
    if (wsRes.ok) setWorkspaces(await wsRes.json());
    const activeRes = await fetch('/api/workspaces/active');
    if (activeRes.ok) {
      const data = await activeRes.json();
      setActive(data.active);
      // Try to load invitations list (only owners can see)
      const invRes = await fetch('/api/invitations');
      if (invRes.ok) {
        setInvitations(await invRes.json());
        setIsOwner(true);
      } else {
        setInvitations([]);
        setIsOwner(false);
      }
    }
  };

  useEffect(() => { load(); }, []);

  const createWs = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/workspaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as any));
      await Swal.fire({ icon: 'error', title: 'No se pudo crear', text: err?.error ?? 'Error' });
      return;
    }
    setName('');
    await Swal.fire({ icon: 'success', title: 'Workspace creado', timer: 1200, showConfirmButton: false });
    await load();
  };

  const switchWs = async (id: number) => {
    const res = await fetch('/api/workspaces/active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId: id }) });
    if (!res.ok) return Swal.fire({ icon: 'error', title: 'No se pudo cambiar', timer: 1200, showConfirmButton: false });
    await load();
  };

  const genInvite = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Crear invitación',
      html: `
        <div class="d-grid gap-2">
          <input id="ttl" class="form-control" placeholder="Horas de validez (opcional)" type="number" min="1" />
          <input id="max" class="form-control" placeholder="Usos máximos (por defecto 1)" type="number" min="1" />
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const ttl = (document.getElementById('ttl') as HTMLInputElement).value;
        const max = (document.getElementById('max') as HTMLInputElement).value;
        return { ttlHours: ttl ? Number(ttl) : undefined, maxUses: max ? Number(max) : undefined };
      },
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
    });
    if (!formValues) return;
    const res = await fetch('/api/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formValues) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as any));
      return Swal.fire({ icon: 'error', title: 'Error', text: err?.error ?? 'No se pudo crear' });
    }
    const inv = await res.json();
    await Swal.fire({ icon: 'success', title: 'Invitación creada', text: inv.code });
    await load();
  };

  const redeem = async () => {
    const { value: code } = await Swal.fire({ title: 'Unirse con código', input: 'text', inputLabel: 'Código de invitación', showCancelButton: true });
    if (!code) return;
    const res = await fetch('/api/invitations/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as any));
      return Swal.fire({ icon: 'error', title: 'No se pudo unir', text: err?.error ?? 'Error' });
    }
    await Swal.fire({ icon: 'success', title: 'Unido al workspace', timer: 1200, showConfirmButton: false });
    await load();
  };

  return (
    <div className="d-grid gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="h4 m-0">Workspaces</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={redeem}>Unirme con código</button>
        </div>
      </div>

      <div className="card shadow-sm"><div className="card-body">
        <form className="d-flex gap-2" onSubmit={createWs}>
          <input className="form-control" placeholder="Nombre del workspace" value={name} onChange={e => setName(e.target.value)} required />
          <button type="submit" className="btn btn-primary">Crear</button>
        </form>
      </div></div>

      <div className="card shadow-sm"><div className="card-body">
        <h2 className="h5">Mis workspaces</h2>
        <ul className="list-group mt-2">
          {workspaces.map(w => (
            <li key={w.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">{w.name}</div>
                {active?.id === w.id && <div className="text-body-secondary small">Activo</div>}
              </div>
              {active?.id === w.id ? (
                <button className="btn btn-sm btn-outline-secondary" disabled>Activo</button>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => switchWs(w.id)}>Activar</button>
              )}
            </li>
          ))}
          {workspaces.length === 0 && <li className="list-group-item text-body-secondary">Aún no tienes workspaces</li>}
        </ul>
      </div></div>

      {active && isOwner && (
        <div className="card shadow-sm"><div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="h5 m-0">Invitaciones (workspace activo)</h2>
            <button className="btn btn-sm btn-primary" onClick={genInvite}>Nueva invitación</button>
          </div>
          <ul className="list-group mt-2">
            {invitations.map(i => (
              <li key={i.code} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{i.code}</div>
                  <div className="text-body-secondary small">
                    Usos: {i.uses}/{i.maxUses}
                    {i.expiresAt && ` · Expira: ${new Date(i.expiresAt).toLocaleString()}`}
                  </div>
                </div>
              </li>
            ))}
            {invitations.length === 0 && <li className="list-group-item text-body-secondary">Sin invitaciones</li>}
          </ul>
        </div></div>
      )}
    </div>
  );
}

