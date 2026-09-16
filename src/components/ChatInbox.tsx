'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { models } from '@/data/models';
import { useMedia } from '@/context/MediaContext';
import { isMusicCategory } from '@/lib/music';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

interface ChatInboxProps {
  name: string;
  slug: string;
  avatar?: string;
  tagline?: string;
}

const MAX_STORAGE_MESSAGES = 50;

export function ChatInbox({ name, slug, avatar, tagline }: ChatInboxProps) {
  const { setAmbientCategory } = useMedia();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const storageKey = `${slug}_chat_history`;

  const persona = models.find((m) => m.slug === slug);
  const avatarSrc = avatar || persona?.avatar || '/images/Lore-180x180.png';
  const modelTagline = tagline || persona?.tagline || 'En línea';

  // Cargar historial de localStorage o inicializar con mensaje de bienvenida limpio
  useEffect(() => {
    const welcomeText =
      persona?.welcomeMessage ??
      `¡Hola! Qué bueno tenerte por aquí 😉 ¿Cómo va tu día?`;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validMessages = parsed.filter(
            (m) => m && (m.role === 'user' || m.role === 'assistant') && m.content
          );
          if (validMessages.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration from browser storage
            setMessages(validMessages.slice(-MAX_STORAGE_MESSAGES));
            setIsInitialized(true);
            return;
          }
        }
      }
    } catch {
      // Si falla la lectura, se reinicia
    }

    const defaultWelcomeMessage: ChatMessage = {
      id: 'welcome-msg',
      role: 'assistant',
      content: welcomeText,
    };
    setMessages([defaultWelcomeMessage]);
    setIsInitialized(true);
  }, [slug, storageKey, persona]);

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

    // El ambiente se decide en paralelo: nunca retrasa ni reemplaza la respuesta del chat.
    void fetch('/api/music-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { category?: unknown };
        if (isMusicCategory(data.category)) setAmbientCategory(data.category);
      })
      .catch(() => undefined);

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
          // Ignorar fallo de parseo JSON
        }
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
    <div className="relative w-full rounded-3xl border border-white/20 bg-slate-950/50 backdrop-blur-xl shadow-2xl overflow-hidden text-white flex flex-col h-[calc(100vh-120px)] max-h-[750px] min-h-[500px]">
      {/* Fondo de pantalla de cristal con brillo ambientado y animación */}
      <div className="absolute inset-0 -z-10 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,242,234,0.15)_0%,transparent_70%)]" />
      </div>

      {/* Encabezado compacto con foto oficial del personaje a la derecha */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">{name}</h2>
          <p className="text-xs text-cyan-300/80 font-medium">{modelTagline}</p>
        </div>

        {/* Lado derecho: Círculo con foto oficial y estado en línea */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>En línea</span>
          </div>

          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400/60 shadow-[0_0_12px_rgba(0,242,234,0.4)] shrink-0 bg-slate-800">
            <Image
              src={avatarSrc}
              alt={name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        </div>
      </header>

      {/* Área del Chat sobre cristal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center p-6">
            <p className="text-sm text-cyan-200/70 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
              Escríbele a {name} para comenzar la conversación...
            </p>
          </div>
        )}

        {messages
          .filter((message) => message.content.length > 0)
          .map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed tracking-wide transition-all shadow-lg ${
                  message.role === 'user'
                    ? 'rounded-tr-none bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-slate-950 font-medium backdrop-blur-md border border-cyan-300/40 shadow-[0_4px_15px_rgba(0,242,234,0.2)]'
                    : 'rounded-tl-none bg-slate-900/60 text-slate-100 backdrop-blur-md border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-cyan-400/30 font-sans'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

        {isSending && !isStreamingAssistantResponse && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-none bg-slate-900/60 backdrop-blur-md border border-cyan-400/30 px-4 py-3 text-xs sm:text-sm text-cyan-300 flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,234,0.15)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-300" />
              <span className="ml-1 text-cyan-200/80 font-medium">{name} está escribiendo...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Formulario / Input de texto sobre cristal */}
      <form onSubmit={handleSubmit} className="relative z-10 p-3 sm:p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
        {error && <p className="mb-2 text-xs text-rose-400 font-medium" role="alert">{error}</p>}
        <div className="flex items-center gap-2">
          <label htmlFor="chat-message" className="sr-only">Escribe un mensaje para {name}</label>
          <input
            id="chat-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={2000}
            disabled={isSending}
            placeholder={`Escríbele directamente a ${name}...`}
            className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md px-4 py-3 text-sm sm:text-base text-white placeholder:text-gray-400/70 outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 transition-all disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="inline-flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(0,242,234,0.4)] transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            aria-label="Enviar mensaje"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-base" />
          </button>
        </div>
      </form>
    </div>
  );
}
