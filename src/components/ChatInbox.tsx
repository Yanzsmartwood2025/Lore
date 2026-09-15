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

import { models } from '@/data/models';

const MAX_STORAGE_MESSAGES = 50;

export function ChatInbox({ name, slug }: ChatInboxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const storageKey = `${slug}_chat_history`;

  // Cargar historial de localStorage o inicializar con mensaje de bienvenida
  useEffect(() => {
    const persona = models.find((m) => m.slug === slug);
    const welcomeText =
      persona?.welcomeMessage ??
      `¡Hola! Qué bueno tenerte aquí conmigo 😉 Me encanta conocer gente nueva y compartir momentos especiales... cuéntame, ¿qué te trae por aquí hoy?`;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-MAX_STORAGE_MESSAGES));
          setIsInitialized(true);
          return;
        }
      }
    } catch {
      // Si falla la lectura, se reinicia con el mensaje de bienvenida
    }

    const defaultWelcomeMessage: ChatMessage = {
      id: 'welcome-msg',
      role: 'assistant',
      content: welcomeText,
    };
    setMessages([defaultWelcomeMessage]);
    setIsInitialized(true);
  }, [slug, storageKey]);

  // Guardar en localStorage cuando cambien los mensajes
  useEffect(() => {
    if (!isInitialized || messages.length === 0) return;
    try {
      const toSave = messages.slice(-MAX_STORAGE_MESSAGES);
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {
      // Manejar error de cuota si ocurre
    }
  }, [messages, isInitialized, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const isStreamingAssistantResponse =
    isSending &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].content.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content };
    const history = messages.map(({ role, content: messageContent }) => ({
      role,
      content: messageContent,
    }));

    const assistantMessageId = crypto.randomUUID();
    const assistantMessagePlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    setMessages((currentMessages) => [...currentMessages, userMessage, assistantMessagePlaceholder]);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
      });

      if (!response.ok) {
        let errorMessage = 'No pudimos enviar tu mensaje.';
        try {
          const errorData = (await response.json()) as { error?: string };
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignorar fallo de parseo JSON si la respuesta no era JSON
        }
        // Remover el placeholder del asistente si ni siquiera pudimos iniciar la respuesta
        setMessages((current) => current.filter((msg) => msg.id !== assistantMessageId));
        throw new Error(errorMessage);
      }

      if (!response.body) {
        setMessages((current) => current.filter((msg) => msg.id !== assistantMessageId));
        throw new Error('No se recibió la transmisión del chat.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let receivedAnyText = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const textChunk = parsed.choices?.[0]?.delta?.content;
            if (textChunk) {
              receivedAnyText = true;
              setMessages((current) =>
                current.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + textChunk }
                    : msg,
                ),
              );
            }
          } catch {
            // Ignorar líneas SSE malformadas
          }
        }
      }

      if (!receivedAnyText) {
        // Si no se recibió ningún texto del stream, limpiar mensaje vacío
        setMessages((current) => current.filter((msg) => msg.id !== assistantMessageId));
        throw new Error('El chat no devolvió ninguna respuesta.');
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Ocurrió un error inesperado al enviar el mensaje.',
      );
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
          {messages
            .filter((message) => message.content.length > 0)
            .map((message) => (
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
          {isSending && !isStreamingAssistantResponse && (
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
