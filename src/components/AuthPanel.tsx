'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function AuthPanel() {
  const supabase = useMemo(() => createClient(), []);
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: { preventDefault(): void }, signUp: boolean) {
    event.preventDefault();
    setMessage('Procesando…');
    const result = signUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setMessage(result.error ? result.error.message : signUp ? 'Revisa tu correo para confirmar la cuenta.' : 'Sesión iniciada.');
  }

  async function googleLogin() {
    const redirectTo = `${window.location.origin}/auth/callback?next=/`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) setMessage(error.message);
  }

  if (loading) return <p className="text-xs text-gray-400">Comprobando sesión…</p>;
  if (user) return (
    <div className="space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-950/20 p-3 text-xs">
      <p className="text-emerald-300">Conectado como <strong>{user.email}</strong></p>
      <button className="text-gray-300 underline" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
    </div>
  );

  return (
    <form className="space-y-2" onSubmit={(event) => submit(event, false)}>
      <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm" />
      <input required minLength={8} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <button type="submit" className="rounded-xl bg-cyan-500/20 px-3 py-2 text-xs text-cyan-200">Entrar</button>
        <button type="button" onClick={(event) => submit(event, true)} className="rounded-xl border border-white/20 px-3 py-2 text-xs">Crear cuenta</button>
      </div>
      <button type="button" onClick={googleLogin} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs hover:bg-white/20">
        <FontAwesomeIcon icon={faGoogle} /><span>Acceso con Google</span>
      </button>
      {message && <p className="text-xs text-amber-200" role="status">{message}</p>}
    </form>
  );
}
