'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useAuth } from '@/context/AuthContext';

export function AuthPanel() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: { preventDefault(): void }, signUp: boolean) {
    event.preventDefault();
    setMessage('Procesando…');
    try {
      if (signUp) {
        const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        await sendEmailVerification(result.user);
        setMessage('Cuenta creada. Revisa tu correo para verificarla.');
      } else {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        setMessage('Sesión iniciada.');
      }
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Ese correo ya tiene una cuenta.',
        'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
        'auth/invalid-email': 'Escribe un correo válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
      };
      setMessage(messages[code] ?? 'No se pudo completar el acceso. Inténtalo de nuevo.');
    }
  }

  async function googleLogin() {
    setMessage('Abriendo Google…');
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      const messages: Record<string, string> = {
        'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Habilita las ventanas emergentes e inténtalo de nuevo.',
        'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
        'auth/unauthorized-domain': 'Este dominio todavía no está autorizado en Firebase.',
      };
      setMessage(messages[code] ?? `No se pudo iniciar sesión con Google${code ? ` (${code})` : '.'}`);
    }
  }

  if (loading) return <p className="text-xs text-gray-400">Comprobando sesión…</p>;

  if (user) {
    return (
      <div className="space-y-3 rounded-2xl border border-emerald-400/30 bg-[linear-gradient(135deg,rgba(6,78,59,0.18),rgba(2,12,20,0.65))] p-3 text-xs shadow-[inset_0_0_20px_rgba(16,185,129,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-emerald-300">
            Conectado como <strong className="break-all">{user.email}</strong>
          </p>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-400/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.12)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.95)]" />
            ON
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-gray-300 transition hover:border-emerald-300/30 hover:text-white"
          onClick={() => signOut(getFirebaseAuth())}
        >
          <FontAwesomeIcon icon={faPowerOff} className="text-[10px]" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-2" onSubmit={(event) => submit(event, false)}>
      <input
        required
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Correo"
        className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:shadow-[0_0_12px_rgba(0,242,234,0.08)]"
      />
      <input
        required
        minLength={8}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:shadow-[0_0_12px_rgba(0,242,234,0.08)]"
      />
      <div className="grid grid-cols-2 gap-2">
        <button type="submit" className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-400/20">Entrar</button>
        <button type="button" onClick={(event) => submit(event, true)} className="rounded-xl border border-white/15 bg-white/[0.025] px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:text-white">Crear cuenta</button>
      </div>
      <button type="button" onClick={googleLogin} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs text-slate-200 transition hover:border-cyan-400/30 hover:bg-white/[0.07]">
        <FontAwesomeIcon icon={faGoogle} />
        <span>Acceso con Google</span>
      </button>
      {message && <p className="text-xs text-amber-200" role="status">{message}</p>}
    </form>
  );
}
