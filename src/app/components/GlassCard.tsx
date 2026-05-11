import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}
