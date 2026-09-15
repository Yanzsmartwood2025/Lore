import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faComments, faLock } from '@fortawesome/free-solid-svg-icons';
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
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-4 sm:p-6 pb-48">
      <div className="w-full max-w-4xl flex flex-col space-y-6 mt-4">
        {/* Navegación y Encabezado de la Persona */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Volver
          </Link>
          <span className="text-xs text-cyan-400 font-mono uppercase tracking-widest">
            Protocolo VIP / Persona
          </span>
        </div>

        {/* Tarjeta de Perfil */}
        <GlassCard className="p-6 border-cyan-400/30 bg-gradient-to-r from-cyan-950/20 to-purple-950/20">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border-2 border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
              <FontAwesomeIcon icon={faUser} className="text-4xl" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-extrabold text-white tracking-wide">{model.name}</h1>
              <p className="text-sm text-cyan-300 mt-1">{model.tagline}</p>
            </div>
          </div>
        </GlassCard>

        {/* ========================================================================= */}
        {/* ÁREA DE CHAT INDIVIDUAL (RESERVADA PARA IMPLEMENTACIÓN FUTURA)            */}
        {/* ========================================================================= */}
        {/*
          TODO: En esta sección se integrará la conversación de chat individual para cada persona.
          Cada modelo (Lore, Camila, etc.) manejará su propio contexto, memoria e historial de chat.
          Por ahora se mantiene la plantilla estructural sin la lógica de mensajes.
        */}
        <GlassCard className="p-8 text-center border-white/10 bg-white/5 flex flex-col items-center justify-center min-h-[250px]">
          <FontAwesomeIcon icon={faComments} className="text-4xl text-cyan-400/50 mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-gray-200 mb-1">Área de Chat con {model.name}</h3>
          <p className="text-xs text-gray-400 max-w-md">
            Espacio reservado para el chat individual. En la siguiente fase se conectará la interfaz interactiva de mensajería con la IA de {model.name}.
          </p>
        </GlassCard>
        {/* ========================================================================= */}
      </div>
    </main>
  );
}
