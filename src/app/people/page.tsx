'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

interface Person { id: number; name: string; }

export default function PeoplePage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState('');
  const [filter, setFilter] = useState('');
  const [preview, setPreview] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const load = async () => {
    const res = await fetch('/api/people');
    setPeople(await res.json());
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => people.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())), [people, filter]);
  const totalPages = useMemo(() => (pageSize > 0 ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1), [filtered.length, pageSize]);
  const pageItems = useMemo(() => {
    if (pageSize <= 0) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const confirm = async (title: string, text?: string) => {
    const res = await Swal.fire({ icon: 'question', title, text, showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'Cancelar' });
    return res.isConfirmed;
  };

  const toast = (title: string, icon: 'success'|'error'|'info'|'warning' = 'success') => Swal.fire({ title, icon, timer: 1400, showConfirmButton: false });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!(await confirm('Crear persona', `Nombre: ${name}`))) return;
    await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
    setName('');
    await load();
    toast('Persona creada');
  };

  const startEdit = (p: Person) => { setEditingId(p.id); setDraftName(p.name); };
  const cancelEdit = (p: Person) => { setEditingId(null); setDraftName(''); };
  const savePerson = async (p: Person) => {
    const newName = draftName.trim();
    if (newName === p.name) { cancelEdit(p); return; }
    if (!(await confirm('Guardar cambios', `${p.name} → ${newName}`))) return;
    await fetch(`/api/people/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
    await load();
    cancelEdit(p);
    toast('Persona actualizada');
  };

  const deletePerson = async (p: Person) => {
    if (!(await confirm('Eliminar persona', `${p.name}`))) return;
    await fetch(`/api/people/${p.id}`, { method: 'DELETE' });
    await load();
    toast('Persona eliminada');
  };

  const parseFileToNames = async (file: File): Promise<string[]> => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'csv' || ext === 'txt') {
      const text = await file.text();
      return text.split(/\r?\n/).map(r => r.split(',')[0]).map(s => s.trim()).filter(Boolean);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      return rows.map(r => (Array.isArray(r) ? String(r[0] ?? '').trim() : '')).filter(Boolean).filter((v, i) => (i === 0 ? v.toLowerCase() !== 'name' : true));
    }
    return [];
  };

  const handleImport = async () => {
    setPreview([]);
    const fileStep = await Swal.fire({
      title: 'Importar personas',
      text: 'Selecciona un archivo CSV, TXT o XLSX',
      input: 'file',
      inputAttributes: { accept: '.csv,.txt,.xlsx,.xls' },
      showCancelButton: true,
      confirmButtonText: 'Previsualizar',
      cancelButtonText: 'Cancelar',
    });
    if (!fileStep.isConfirmed || !fileStep.value) { setPreview([]); return; }
    const file: File = fileStep.value as File;
    const names = await parseFileToNames(file);
    if (!names.length) { await Swal.fire({ icon: 'warning', title: 'Archivo vacío o inválido' }); setPreview([]); return; }
    setPreview(names);
    const html = `<div style="max-height:300px; overflow:auto; text-align:left"><ol>${names.map(n => `<li>${n.replace(/</g,'&lt;')}</li>`).join('')}</ol></div>`;
    const confirmStep = await Swal.fire({
      title: `Previsualización (${names.length})`,
      html,
      width: 600,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Importar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmStep.isConfirmed) { setPreview([]); return; }
    // Import
    for (const n of names) {
      await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n }) });
    }
    setPreview([]);
    await Swal.fire({ icon: 'success', title: 'Importación completa' });
    router.replace('/people');
  };

  return (
    <div className="d-grid gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-secondary" onClick={() => router.back()}>← Volver</button>
        <h1 className="h4 m-0">Personas</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={async () => {
            // Descargar plantilla XLSX
            const ws = XLSX.utils.aoa_to_sheet([["name"],["Juan Perez"],["Maria Lopez"]]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'People');
            const blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'people_template.xlsx'; a.click();
          }}>Plantilla XLSX</button>
          <a className="btn btn-outline-secondary" href="/templates/people_template.csv" download>Plantilla CSV</a>
          <button className="btn btn-primary" onClick={handleImport}>Importar</button>
        </div>
      </div>

      <div className="card shadow-sm"><div className="card-body">
        <form className="d-flex gap-2" onSubmit={add}>
          <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
          <button type="submit" className="btn btn-primary">Agregar</button>
        </form>
      </div></div>

      <div className="card shadow-sm"><div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2 gap-2">
          <div className="d-flex align-items-center gap-2">
            <h2 className="h5 m-0">Listado</h2>
            <span className="text-body-secondary">({filtered.length})</span>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <input className="form-control" placeholder="Buscar" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} style={{ maxWidth: 220 }} />
            <select className="form-select" style={{ width: 140 }} value={pageSize}
              onChange={e => { const v = e.target.value; setPageSize(v === '0' ? 0 : Number(v)); setPage(1); }}>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={0}>Todos</option>
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th style={{ width: '60%' }}>Nombre</th>
                <th className="text-end" style={{ width: '40%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(p => (
                <tr key={p.id}>
                  <td>
                    <input
                      className="form-control"
                      value={editingId === p.id ? draftName : p.name}
                      onChange={e => setDraftName(e.target.value)}
                      disabled={editingId !== p.id}
                    />
                  </td>
                  <td className="text-end">
                    {editingId === p.id ? (
                      <div className="d-inline-flex gap-2">
                        <button className="btn btn-outline-secondary" onClick={() => cancelEdit(p)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={() => savePerson(p)}>Guardar</button>
                      </div>
                    ) : (
                      <div className="d-inline-flex gap-2">
                        <button className="btn btn-outline-primary" onClick={() => startEdit(p)}>Editar</button>
                        <button className="btn btn-outline-danger" onClick={() => deletePerson(p)}>Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={2} className="text-body-secondary">Sin personas</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pageSize > 0 && totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-body-secondary small">Página {page} de {totalPages}</div>
            <div className="btn-group">
              <button className="btn btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</button>
              <button className="btn btn-outline-secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</button>
            </div>
          </div>
        )}
      </div></div>
    </div>
  );
}
