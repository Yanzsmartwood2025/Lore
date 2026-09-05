import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-lg backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}