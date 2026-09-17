'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { models } from '@/data/models';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { AuthPanel } from '@/components/AuthPanel';
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
}

const MAX_STORAGE_MESSAGES = 50;

export function ChatInbox({ name, slug, avatar }: ChatInboxProps) {
  const { setAmbientCategory } = useMedia();
  const { user, getIdToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const storageKey = `${slug}_chat_history`;
  const persona = models.find((m) => m.slug === slug);
  const avatarSrc = avatar || persona?.avatar || '/images/Lore-180x180.png';
  const signatureSrc = persona?.signature;

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
            (m) => m && (m.role === 'user' || m.role === 'assistant') && m.content,
          );
          if (validMessages.length > 0) {
            setMessages(validMessages.slice(-MAX_STORAGE_MESSAGES));
            setIsInitialized(true);
            return;
          }
        }
      }
    } catch {
      // Si falla la lectura, se reinicia.
    }

    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: welcomeText,
      },
    ]);
    setIsInitialized(true);
  }, [slug, storageKey, persona]);

  useEffect(() => {
    if (!isInitialized || messages.length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_STORAGE_MESSAGES)));
    } catch {
      // Manejar error de cuota si ocurre.
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

    if (!user) {
      setError('Inicia sesión para usar el chat.');
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
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

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessagePlaceholder,
    ]);
    setInput('');
    setError(null);
    setIsSending(true);

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
      const idToken = await getIdToken();
      if (!idToken) throw new Error('Tu sesión venció. Inicia sesión otra vez.');

      const response = await fetch(`/api/chat/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, history }),
      });

      if (!response.ok) {
        let errorMessage = 'No pudimos enviar tu mensaje.';
        try {
          const errorData = (await response.json()) as { error?: string };
          if (errorData.error) errorMessage = errorData.error;
        } catch {
          // Ignorar fallo de parseo JSON.
        }
        setMessages((current) =>
          current.filter((msg) => msg.id !== assistantMessageId),
        );
        throw new Error(errorMessage);
      }

      if (!response.body) {
        setMessages((current) =>
          current.filter((msg) => msg.id !== assistantMessageId),
        );
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
            // Ignorar líneas SSE malformadas.
          }
        }
      }

      if (!receivedAnyText) {
        setMessages((current) =>
          current.filter((msg) => msg.id !== assistantMessageId),
        );
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
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-white/25 bg-transparent text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      {/* Escenario interior independiente: hoy queda limpio y negro; aquí irá el video de cada persona. */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-black" data-persona-video-stage aria-hidden="true" />

      <header
        data-youtube-gesture-zone="true"
        className="relative z-10 flex items-center justify-between border-b border-white/15 bg-white/[0.035] px-4 py-3 backdrop-blur-[3px]"
      >
        <Link
          href="/"
          aria-label={`Volver al inicio desde el chat de ${name}`}
          title="Volver al inicio"
          className="group inline-flex min-w-0 items-center rounded-xl px-1 py-0.5 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {signatureSrc ? (
            <img
              src={signatureSrc}
              alt={`Firma de ${name}`}
              className="h-9 w-32 object-contain object-left drop-shadow-[0_0_7px_rgba(255,255,255,0.20)] sm:h-10 sm:w-36"
              draggable={false}
            />
          ) : (
            <span className="truncate text-base font-semibold tracking-wide text-white">
              {name}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.045] px-2.5 py-1 text-[11px] font-medium text-white/90 shadow-[inset_0_0_12px_rgba(255,255,255,0.035)]">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
            <span>En línea</span>
          </div>

          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/35 bg-white/[0.035] shadow-[0_0_14px_rgba(255,255,255,0.10)]">
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

      <div
        className="relative z-10 flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="rounded-2xl border border-white/15 bg-white/[0.045] px-4 py-2 text-sm text-white/75">
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
                className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed tracking-wide text-white shadow-[0_6px_18px_rgba(0,0,0,0.14)] sm:max-w-[75%] sm:text-base ${
                  message.role === 'user'
                    ? 'rounded-tr-none border-white/30 bg-white/[0.14]'
                    : 'rounded-tl-none border-white/18 bg-white/[0.055]'
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
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-white/20 bg-white/[0.055] px-4 py-3 text-xs text-white/80 shadow-[0_6px_18px_rgba(0,0,0,0.12)] sm:text-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:300ms]" />
              <span className="ml-1 font-medium text-white/75">
                {name} está escribiendo...
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!user && (
        <div className="relative z-10 border-t border-white/15 bg-white/[0.035] p-3 sm:p-4">
          <p className="mb-3 text-xs font-medium text-white/80">
            Inicia sesión para conversar con {name}.
          </p>
          <AuthPanel />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative z-10 border-t border-white/15 bg-white/[0.035] p-3 backdrop-blur-[3px] sm:p-4"
      >
        {error && (
          <p className="mb-2 text-xs font-medium text-rose-300" role="alert">
            {error}
          </p>
        )}
        <div className="flex items-center gap-2">
          <label htmlFor="chat-message" className="sr-only">
            Escribe un mensaje para {name}
          </label>
          <input
            id="chat-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={2000}
            disabled={isSending}
            placeholder={`Escríbele directamente a ${name}...`}
            className="min-w-0 flex-1 rounded-2xl border border-white/20 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/45 focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/[0.11] text-white shadow-[0_0_14px_rgba(255,255,255,0.08)] transition-all hover:bg-white/[0.17] active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/[0.11] sm:h-12 sm:w-12"
            aria-label="Enviar mensaje"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-base" />
          </button>
        </div>
      </form>
    </div>
  );
}
