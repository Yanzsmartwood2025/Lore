'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthPanel } from '@/components/AuthPanel';
import { useAuth } from '@/context/AuthContext';
import { models } from '@/data/models';

type SharedMemory = {
  id: string;
  memory_key: string;
  memory_value: string;
  memory_type: string;
  importance: number;
  learned_by_persona_slug?: string | null;
};

type PersonaMemory = SharedMemory & {
  persona_slug: string;
};

type TimelineMemory = {
  id: string;
  event_key: string;
  title: string;
  details: string;
  event_type: string;
  event_date: string | null;
  recurs_annually: boolean;
  status: string;
  is_pinned: boolean;
  importance: number;
  learned_by_persona_slug?: string | null;
};

type Relationship = {
  persona_slug: string;
  interaction_count: number;
  relationship_stage: string;
};

type MemoryPayload = {
  shared: SharedMemory[];
  persona: PersonaMemory[];
  timeline: TimelineMemory[];
  relationships: Relationship[];
};

const EMPTY_DATA: MemoryPayload = {
  shared: [],
  persona: [],
  timeline: [],
  relationships: [],
};

function personaName(slug?: string | null) {
  if (!slug) return 'Lore';
  return models.find((model) => model.slug === slug)?.name ?? slug;
}

export default function MemoryPage() {
  const { user, getIdToken } = useAuth();
  const [data, setData] = useState<MemoryPayload>(EMPTY_DATA);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Tu sesión venció.');

      const response = await fetch('/api/memory', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      const payload = (await response.json()) as MemoryPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo cargar la memoria.');

      setData(payload);
      setDrafts({
        ...Object.fromEntries(payload.shared.map((item) => [item.id, item.memory_value])),
        ...Object.fromEntries(payload.persona.map((item) => [item.id, item.memory_value])),
        ...Object.fromEntries(payload.timeline.map((item) => [item.id, item.details])),
      });
      setTitleDrafts(
        Object.fromEntries(payload.timeline.map((item) => [item.id, item.title])),
      );
      setDateDrafts(
        Object.fromEntries(payload.timeline.map((item) => [item.id, item.event_date ?? ''])),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la memoria.');
    } finally {
      setLoading(false);
    }
  }, [getIdToken, user]);

  useEffect(() => {
    void loadMemories();
  }, [loadMemories]);

  const personaGroups = useMemo(() => {
    const groups = new Map<string, PersonaMemory[]>();
    for (const memory of data.persona) {
      const current = groups.get(memory.persona_slug) ?? [];
      current.push(memory);
      groups.set(memory.persona_slug, current);
    }
    return [...groups.entries()];
  }, [data.persona]);

  async function saveMemory(
    scope: 'shared' | 'persona' | 'timeline',
    id: string,
  ) {
    setSavingId(id);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Tu sesión venció.');

      const body =
        scope === 'timeline'
          ? {
              scope,
              id,
              title: titleDrafts[id] ?? '',
              details: drafts[id] ?? '',
              eventDate: dateDrafts[id] ?? '',
            }
          : { scope, id, value: drafts[id] ?? '' };

      const response = await fetch('/api/memory', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'No se pudo guardar.');
      await loadMemories();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar.');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteMemory(
    scope: 'shared' | 'persona' | 'timeline',
    id: string,
  ) {
    setSavingId(id);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Tu sesión venció.');

      const response = await fetch('/api/memory', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scope, id }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'No se pudo borrar.');
      await loadMemories();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo borrar.');
    } finally {
      setSavingId(null);
    }
  }

  if (!user) {
    return (
      <main className="min-h-dvh bg-black px-5 py-10 text-white">
        <div className="mx-auto max-w-xl space-y-6">
          <Link href="/" className="text-sm text-cyan-300">← Volver a Lore</Link>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-400/70">Memoria personal</p>
            <h1 className="mt-2 text-3xl font-semibold">Lo que Lore recuerda de mí</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Inicia sesión para revisar, corregir o eliminar recuerdos guardados.
            </p>
          </div>
          <AuthPanel />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-sm text-cyan-300">← Volver a Lore</Link>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-400/70">Memoria personal</p>
          <h1 className="text-3xl font-semibold">Lo que Lore recuerda de mí</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Aquí puedes corregir o borrar recuerdos. Los recuerdos compartidos pueden usarlos todas las chicas; los privados pertenecen solo a la relación indicada.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
            Cargando memoria…
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Fechas y acontecimientos importantes</h2>
                <p className="text-xs text-slate-500">Cumpleaños, aniversarios, metas y momentos de vida.</p>
              </div>
              {data.timeline.length === 0 ? (
                <EmptyState text="Todavía no hay acontecimientos guardados." />
              ) : (
                data.timeline.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-cyan-400/15 bg-cyan-950/10 p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-cyan-300/70">
                      <span>{item.event_type}</span>
                      {item.is_pinned && <span>• permanente</span>}
                      <span>• aprendido por {personaName(item.learned_by_persona_slug)}</span>
                    </div>
                    <input
                      value={titleDrafts[item.id] ?? ''}
                      onChange={(event) =>
                        setTitleDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      className="mb-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    />
                    <textarea
                      value={drafts[item.id] ?? ''}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      rows={3}
                      className="w-full resize-y rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    />
                    <input
                      type="date"
                      value={dateDrafts[item.id] ?? ''}
                      onChange={(event) =>
                        setDateDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      className="mt-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
                    />
                    <MemoryActions
                      busy={savingId === item.id}
                      onSave={() => void saveMemory('timeline', item.id)}
                      onDelete={() => void deleteMemory('timeline', item.id)}
                    />
                  </article>
                ))
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Recuerdos compartidos</h2>
                <p className="text-xs text-slate-500">Datos que pueden recordar Lore, Camila, Luna, Valentina, Salomé y Nicole.</p>
              </div>
              {data.shared.length === 0 ? (
                <EmptyState text="Todavía no hay recuerdos compartidos." />
              ) : (
                data.shared.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                      {item.memory_type} • aprendido por {personaName(item.learned_by_persona_slug)}
                    </p>
                    <textarea
                      value={drafts[item.id] ?? ''}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      rows={2}
                      className="w-full resize-y rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    />
                    <MemoryActions
                      busy={savingId === item.id}
                      onSave={() => void saveMemory('shared', item.id)}
                      onDelete={() => void deleteMemory('shared', item.id)}
                    />
                  </article>
                ))
              )}
            </section>

            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Recuerdos privados por chica</h2>
                <p className="text-xs text-slate-500">Lo que pertenece a la historia específica con cada personaje.</p>
              </div>
              {personaGroups.length === 0 ? (
                <EmptyState text="Todavía no hay recuerdos privados." />
              ) : (
                personaGroups.map(([slug, items]) => {
                  const relationship = data.relationships.find((item) => item.persona_slug === slug);
                  return (
                    <div key={slug} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-pink-200">{personaName(slug)}</h3>
                        {relationship && (
                          <span className="text-[10px] uppercase tracking-wider text-slate-500">
                            etapa {relationship.relationship_stage}
                          </span>
                        )}
                      </div>
                      {items.map((item) => (
                        <article key={item.id} className="rounded-3xl border border-pink-400/15 bg-pink-950/10 p-4">
                          <p className="mb-2 text-[10px] uppercase tracking-wider text-pink-300/60">
                            {item.memory_type}
                          </p>
                          <textarea
                            value={drafts[item.id] ?? ''}
                            onChange={(event) =>
                              setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                            }
                            rows={2}
                            className="w-full resize-y rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-pink-400/50"
                          />
                          <MemoryActions
                            busy={savingId === item.id}
                            onSave={() => void saveMemory('persona', item.id)}
                            onDelete={() => void deleteMemory('persona', item.id)}
                          />
                        </article>
                      ))}
                    </div>
                  );
                })
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
      {text}
    </div>
  );
}

function MemoryActions({
  busy,
  onSave,
  onDelete,
}: {
  busy: boolean;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onSave}
        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 disabled:opacity-50"
      >
        {busy ? 'Guardando…' : 'Guardar corrección'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-200 disabled:opacity-50"
      >
        Borrar recuerdo
      </button>
    </div>
  );
}
