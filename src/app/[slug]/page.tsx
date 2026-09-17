import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faLock } from '@fortawesome/free-solid-svg-icons';
import { ChatInbox } from '@/components/ChatInbox';
import { GlassCard } from '@/components/GlassCard';
import { models } from '@/data/models';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ModelPage({ params }: PageProps) {
  const { slug } = await params;
  const model = models.find((m) => m.slug === slug);

  if (!model) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <GlassCard className="max-w-md p-8 border-red-500/30">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Persona no encontrada</h1>
          <p className="text-sm text-gray-400 mb-6">El perfil que estás buscando no existe o ha sido movido.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Volver al Inicio
          </Link>
        </GlassCard>
      </main>
    );
  }

  if (!model.isActive) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <GlassCard className="max-w-md p-8 border-pink-500/30">
          <div className="w-16 h-16 rounded-full bg-pink-950/40 border border-pink-500/30 flex items-center justify-center mx-auto mb-4 text-pink-400">
            <FontAwesomeIcon icon={faLock} className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{model.name}</h1>
          <span className="inline-block text-xs uppercase tracking-widest font-semibold text-pink-400 bg-pink-950/60 px-3 py-1 rounded-full border border-pink-500/30 mb-4">
            Próximamente
          </span>
          <p className="text-sm text-gray-400 mb-6">
            El espacio individual de {model.name} estará disponible muy pronto. ¡Mantente al tanto!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Volver al Inicio
          </Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent text-white flex flex-col items-center p-2 sm:p-4 md:p-6 pb-32 relative z-10">
      <div className="w-full max-w-4xl flex flex-col space-y-3">
        {/* Navegación discreta superior */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-cyan-400/80 hover:text-cyan-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Volver
          </Link>
          <span className="text-[10px] text-cyan-400/70 font-mono uppercase tracking-widest">
            Chat VIP
          </span>
        </div>

        <ChatInbox
          name={model.name}
          slug={model.slug}
          avatar={model.avatar}
          tagline={model.tagline}
        />
      </div>
    </main>
  );
}
