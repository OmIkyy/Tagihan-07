import React from 'react';
import { Wifi } from 'lucide-react';
// @ts-ignore
import logoSvg from '../assets/logo.svg';
// @ts-ignore
import logoPng from '../assets/logo.png';
// @ts-ignore
import logoJpg from '../assets/logo.jpg';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  logoType?: 'wifi-classic' | 'wifi-modern' | 'wifi-shield' | 'wifi-globe' | 'custom';
  logoColor?: string;
  customLogoData?: string | null;
}

export default function Logo({
  className = 'w-9 h-9',
  iconClassName = 'w-5 h-5',
  logoType = 'wifi-classic',
  logoColor = '#2563EB',
  customLogoData = null,
}: LogoProps) {
  // Safe color styles
  const styleColor = logoColor || '#2563EB';

  if (logoType === 'custom' && customLogoData) {
    return (
      <div 
        className={`${className} rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-md border border-slate-100 shrink-0`}
      >
        <img 
          src={customLogoData} 
          alt="Custom Logo" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Preset styles
  return (
    <div 
      className={`${className} rounded-xl flex items-center justify-center text-white shrink-0 shadow-md transition-all`}
      style={{ backgroundColor: styleColor }}
    >
      {logoType === 'wifi-classic' && (
        <img 
          src={logoPng || logoJpg || logoSvg} 
          className={`${iconClassName} object-contain rounded-sm`} 
          style={{ filter: (logoPng || logoJpg) ? 'none' : 'brightness(0) invert(1)' }}
          alt="Brand Logo" 
        />
      )}

      {logoType === 'wifi-modern' && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={iconClassName}
        >
          <path d="M5 12a10 10 0 0 1 14 0" strokeOpacity="0.8" />
          <path d="M8.5 15.5a5 5 0 0 1 7 0" />
          <path d="M12 19h.01" strokeWidth="4" fill="currentColor" />
          <circle cx="12" cy="12" r="10" strokeDasharray="2 3" strokeWidth="0.75" strokeOpacity="0.4" />
        </svg>
      )}

      {logoType === 'wifi-shield' && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={iconClassName}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.5" strokeOpacity="0.3" />
          <path d="M9 13a4 4 0 0 1 6 0" />
          <path d="M10.5 15.5a2 2 0 0 1 3 0" />
          <circle cx="12" cy="18" r="1" fill="currentColor" />
        </svg>
      )}

      {logoType === 'wifi-globe' && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={iconClassName}
        >
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" strokeOpacity="0.3" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M2 12h20" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M12 11V6" strokeWidth="2.5" />
          <path d="M9 8a4 4 0 0 1 6 0" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}
