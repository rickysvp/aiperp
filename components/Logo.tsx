import React from 'react';

export const Logo: React.FC<{ size?: number }> = ({ size = 32 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#836EF9" />
                <stop offset="100%" stopColor="#00FF9D" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Central Hex Node */}
        <path 
            d="M20 4L34 12V28L20 36L6 28V12L20 4Z" 
            stroke="url(#logoGradient)" 
            strokeWidth="2.5" 
            fill="rgba(131, 110, 249, 0.1)"
            filter="url(#glow)"
        />
        
        {/* Circuit Lines */}
        <path d="M20 4V16" stroke="#836EF9" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <path d="M20 36V24" stroke="#00FF9D" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <path d="M6 12L16 18" stroke="#836EF9" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <path d="M34 28L24 22" stroke="#00FF9D" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

        {/* Central Spark/Brain */}
        <circle cx="20" cy="20" r="3" fill="#fff" filter="url(#glow)" />
        
        {/* Lightning/Chart Detail */}
        <path 
            d="M14 20L18 24L22 16L26 20" 
            stroke="white" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.9" 
        />
    </svg>
  );
};
