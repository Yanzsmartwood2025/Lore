'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/components/GlassCard';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

interface ChatInboxProps {
  name: string;
  slug: string;
}

export function ChatInbox({ name, slug }: ChatInboxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content };
    const history = messages.map(({ role, content: messageContent }) => ({
      role,
      content: messageContent,
    }));

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? 'No pudimos enviar tu mensaje.');
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { id: crypto.randomUUID(), role: 'assistant', content: data.reply },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No pudimos enviar tu mensaje.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <GlassCard className="overflow-hidden border-cyan-400/25 bg-gradient-to-b from-cyan-950/20 to-purple-950/10">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Chat privado</p>
          <h2 className="mt-1 text-xl font-bold text-white">{name}</h2>
        </div>
        <span className="flex items-center gap-2 text-xs text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> En línea
        </span>
      </header>

      <div className="h-[420px] overflow-y-auto p-4 sm:p-5" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-xs text-sm leading-6 text-gray-300">
              {name} está aquí. Dile hola y deja que la conversación empiece con chispa.
            </p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === 'user'
                    ? 'rounded-br-sm bg-cyan-500 text-slate-950'
                    : 'rounded-bl-sm border border-white/10 bg-white/10 text-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/10 px-4 py-3 text-sm text-cyan-200">
                {name} está escribiendo<span className="animate-pulse">...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 sm:p-4">
        {error && <p className="mb-2 text-xs text-red-300" role="alert">{error}</p>}
        <div className="flex items-center gap-2">
          <label htmlFor="chat-message" className="sr-only">Escribe un mensaje para {name}</label>
          <input
            id="chat-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={2000}
            disabled={isSending}
            placeholder={`Escríbele a ${name}...`}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Enviar mensaje"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
