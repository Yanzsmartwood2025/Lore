import Link from 'next/link';
import { ReactNode } from 'react';

interface NeonButtonProps {
  href: string;
  variant: 'fan' | 'vip';
  icon?: ReactNode;
  children: ReactNode;
  subtitle?: string;
}

export function NeonButton({ href, variant, icon, children, subtitle }: NeonButtonProps) {
  const isFan = variant === 'fan';

  const baseClasses = "flex justify-center items-center w-[85%] max-w-[320px] h-[90px] border-2 rounded-2xl text-[1.4rem] font-extrabold uppercase tracking-[0.1em] transition-all duration-300 cursor-pointer relative overflow-hidden glass-panel";

  const fanClasses = "border-[#00f2ea] text-[#00f2ea] shadow-[0_0_15px_rgba(0,242,234,0.2)] hover:bg-[#00f2ea]/10 hover:shadow-[0_0_30px_rgba(0,242,234,0.6)] active:scale-98 hover:scale-98";

  const vipClasses = "border-[#f000b8] text-[#f000b8] shadow-[0_0_15px_rgba(240,0,184,0.2)] hover:bg-[#f000b8]/10 hover:shadow-[0_0_30px_rgba(240,0,184,0.6)] active:scale-98 hover:scale-98";

  return (
    <div className="w-full flex flex-col items-center group">
      <Link href={href} className={`${baseClasses} ${isFan ? fanClasses : vipClasses}`}>
        {icon && <span className="mr-3">{icon}</span>}
        {children}
      </Link>
      {subtitle && (
        <p className={`text-[10px] mt-2 uppercase tracking-widest opacity-70 ${isFan ? 'text-cyan-500/70' : 'text-fuchsia-500/70'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}