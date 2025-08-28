'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

interface Person { id: number; name: string; }

export default function PeoplePage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState('');
  const [filter, setFilter] = useState('');
  const [preview, setPreview] = useState<string[]>([]);

  const load = async () => {
    const res = await fetch('/api/people');
    setPeople(await res.json());
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (!confirm('¿Crear persona?')) return;
    await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setName('');
    load();
  };

  const savePerson = async (id: number, newName: string) => {
    if (!confirm('¿Guardar cambios de la persona?')) return;
    await fetch(`/api/people/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
    load();
  };

  const deletePerson = async (id: number) => {
    if (!confirm('¿Eliminar persona? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/people/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = useMemo(() => people.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())), [people, filter]);

  const handleFile = async (f: File) => {
    const ext = f.name.toLowerCase().split('.').pop();
    if (ext === 'csv' || ext === 'txt') {
      const text = await f.text();
      const rows = text.split(/\r?\n/).map(r => r.split(',')[0]).map(s => s.trim()).filter(Boolean);
      setPreview(rows);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const arrayBuffer = await f.arrayBuffer();
      const wb = XLSX.read(arrayBuffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      const names = rows.map(r => (Array.isArray(r) ? String(r[0] ?? '').trim() : '')).filter(Boolean).filter((v, i) => (i === 0 ? v.toLowerCase() !== 'name' : true));
      setPreview(names);
    } else {
      alert('Formato no soportado. Usa CSV, TXT o XLSX.');
      setPreview([]);
    }
  };

  const doImport = async () => {
    if (preview.length === 0) return;
    if (!confirm(`¿Importar ${preview.length} personas?`)) return;
    for (const n of preview) {
      await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n }) });
    }
    setPreview([]);
    load();
  };

  return (
    <div className="d-grid gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-secondary" onClick={() => router.back()}>← Volver</button>
        <h1 className="h4 m-0">Personas</h1>
        <div style={{ width: 90 }} />
      </div>

      <div className="card shadow-sm"><div className="card-body">
        <form className="d-flex gap-2" onSubmit={add}>
          <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
          <button type="submit" className="btn btn-primary">Agregar</button>
        </form>
      </div></div>

      <div className="card shadow-sm"><div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 m-0">Listado</h2>
          <input className="form-control" placeholder="Buscar" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 220 }} />
        </div>
        <ul className="list-group">
          {filtered.map(p => (
            <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <input className="form-control" defaultValue={p.name} onBlur={(e) => { if (e.currentTarget.value !== p.name) savePerson(p.id, e.currentTarget.value); }} style={{ minWidth: 220, maxWidth: 420 }} />
              <button className="btn btn-outline-danger" onClick={() => deletePerson(p.id)}>Eliminar</button>
            </li>
          ))}
          {filtered.length === 0 && <li className="list-group-item text-body-secondary">Sin personas</li>}
        </ul>
      </div></div>

      <div className="card shadow-sm"><div className="card-body">
        <h2 className="h5">Importar personas</h2>
        <p className="text-body-secondary">Sube CSV, TXT o XLSX (una persona por línea). La primer columna debe ser "name".</p>
        <div className="d-flex gap-2 align-items-center">
          <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <button className="btn btn-outline-primary" disabled={!preview.length} onClick={doImport}>Importar</button>
          <button className="btn btn-outline-secondary" onClick={() => {
            const ws = XLSX.utils.aoa_to_sheet([["name"],["Juan Perez"],["Maria Lopez"]]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'People');
            const blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'people_template.xlsx'; a.click();
          }}>Descargar plantilla XLSX</button>
          <a className="btn btn-outline-secondary" href="/templates/people_template.csv" download>Plantilla CSV</a>
        </div>
        <div className="mt-3">
          <strong>Previsualización ({preview.length})</strong>
          <ul className="list-group mt-2" style={{ maxHeight: 300, overflow: 'auto' }}>
            {preview.map((n, i) => (<li key={i} className="list-group-item">{n}</li>))}
            {preview.length === 0 && <li className="list-group-item text-body-secondary">Carga un archivo para ver los datos</li>}
          </ul>
        </div>
      </div></div>

      <div className="d-flex justify-content-center">
        <button className="btn btn-outline-secondary" onClick={() => router.push('/sessions')}>Ir a sesiones</button>
      </div>
    </div>
  );
}
