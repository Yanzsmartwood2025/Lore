'use client';

import { useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic } from '@fortawesome/free-solid-svg-icons';
import { useMedia } from '@/context/MediaContext';

interface MusicRequestFormProps {
  onRequested?: () => void;
}

export function MusicRequestForm({ onRequested }: MusicRequestFormProps) {
  const { setActiveTab, playRequestedVideo } = useMedia();
  const [musicRequest, setMusicRequest] = useState('');
  const [requestError, setRequestError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const submitMusicRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = musicRequest.trim();
    if (!message || isRequesting) return;

    setIsRequesting(true);
    setRequestError('');

    try {
      const response = await fetch('/api/music-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data: { videoId?: string } = await response.json();

      if (!response.ok || !data.videoId) throw new Error('No video found');

      setActiveTab('music');
      playRequestedVideo(data.videoId);
      setMusicRequest('');
      onRequested?.();
    } catch {
      setRequestError('No encontré esa canción, ¿puedes ser más específico?');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#f000b8]/35 bg-black/55 p-3 text-left shadow-[0_0_20px_rgba(240,0,184,0.15)]">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00f2ea]">
        <FontAwesomeIcon icon={faMusic} /> Pedir video musical
      </p>
      <form onSubmit={submitMusicRequest} className="flex gap-2">
        <input
          id="music-request"
          type="text"
          value={musicRequest}
          onChange={(event) => setMusicRequest(event.target.value)}
          placeholder="Pide una canción"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#00f2ea]/60"
          disabled={isRequesting}
        />
        <button
          type="submit"
          className="rounded-lg border border-[#00f2ea]/45 bg-[#00f2ea]/15 px-3 text-xs font-semibold text-[#00f2ea] disabled:opacity-50"
          disabled={!musicRequest.trim() || isRequesting}
        >
          {isRequesting ? 'Buscando...' : 'Reproducir'}
        </button>
      </form>
      {requestError && <p className="mt-2 text-xs text-red-300" role="alert">{requestError}</p>}
    </div>
  );
}
