'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError('Completa usuario y contraseña');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    // if (!window.confirm('¿Crear cuenta?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'No pudimos registrar');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (r.ok) router.replace('/'); });
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body">
          <div className="text-center mb-3">
            <h1 className="h4 mb-1">Crear cuenta</h1>
            <div className="text-body-secondary">Regístrate para empezar</div>
          </div>
        <form onSubmit={submit} className="d-grid gap-2 mt-2">
          <div>
            <label htmlFor="username" className="form-label">Usuario</label>
            <input
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="form-label">Contraseña</label>
            <input
              id="password"
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crea una contraseña"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label htmlFor="confirm" className="form-label">Confirmar contraseña</label>
            <input
              id="confirm"
              className="form-control"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              required
            />
          </div>
          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
        <div className="text-center text-body-secondary mt-3">
          ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
        </div>
        </div>
      </div>
    </div>
  );
}
