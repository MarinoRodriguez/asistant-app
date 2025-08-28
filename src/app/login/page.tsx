'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!username || !password) {
      setError('Ingresa usuario y contraseña');
      return false;
    }
    return true;
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (r.ok) router.replace('/'); });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        // Cookie de sesión se establece en el servidor (8h)
        router.replace('/');
      } else {
        const data = await res.json();
        setError(data.error || 'No pudimos iniciar sesión');
      }
    } catch (err) {
      setError('Error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body">
          <div className="text-center mb-3">
            <h1 className="h4 mb-1">Inicia sesión</h1>
            <div className="text-body-secondary">Bienvenido de vuelta. Accede para continuar.</div>
          </div>
        

        <form onSubmit={submit} className="d-grid gap-2">
          <div className="mb-2">
            <label htmlFor="username" className="form-label">Usuario</label>
            <input
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario"
              autoComplete="username"
              aria-invalid={!!error && !username}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <div className="position-relative">
              <input
                id="password"
                className="form-control"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                aria-invalid={!!error && !password}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary position-absolute"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                style={{ right: 6, top: 6, height: 'calc(2.4rem - 12px)' }}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="text-body-secondary">Recordarme</span>
            </label>
            <Link href="#" className="text-body-secondary">¿Olvidaste tu contraseña?</Link>
          </div>

          {error && (
            <div className="alert alert-danger py-2" role="alert" aria-live="polite">{error}</div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <div className="text-center text-body-secondary mt-3">
          ¿No tienes cuenta? <Link href="/register">Crea una</Link>
        </div>
        </div>
      </div>
    </div>
  );
}
