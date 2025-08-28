'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard(options: { redirectTo?: string } = {}) {
  const router = useRouter();
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        router.replace(options.redirectTo ?? '/login');
      }
    } catch {
      router.replace(options.redirectTo ?? '/login');
    }
  }, [router, options.redirectTo]);
}

export function getUserSafe<T = any>(): T | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

