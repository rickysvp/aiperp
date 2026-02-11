import React from 'react';

export const Logo: React.FC<{ size?: number }> = ({ size = 32 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 主渐变 - 从紫色到青色 */}
        <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        
        {/* 发光效果 */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* 强烈发光 */}
        <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* 外圈圆环 */}
      <circle 
        cx="20" 
        cy="20" 
        r="18" 
        stroke="url(#logoGradient)" 
        strokeWidth="1.5" 
        fill="none"
        opacity="0.6"
      />
      
      {/* 内圈圆环 */}
      <circle 
        cx="20" 
        cy="20" 
        r="14" 
        stroke="url(#logoGradient)" 
        strokeWidth="1" 
        fill="none"
        opacity="0.4"
      />
      
      {/* 神经网络节点 - 中心 */}
      <circle cx="20" cy="20" r="4" fill="url(#logoGradient)" filter="url(#strongGlow)" />
      
      {/* 神经网络节点 - 周围 */}
      <circle cx="20" cy="8" r="2.5" fill="#8B5CF6" filter="url(#glow)" />
      <circle cx="20" cy="32" r="2.5" fill="#10B981" filter="url(#glow)" />
      <circle cx="8" cy="20" r="2.5" fill="#06B6D4" filter="url(#glow)" />
      <circle cx="32" cy="20" r="2.5" fill="#06B6D4" filter="url(#glow)" />
      
      {/* 神经网络连接线 */}
      <line x1="20" y1="12" x2="20" y2="16" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.8" />
      <line x1="20" y1="24" x2="20" y2="28" stroke="#10B981" strokeWidth="1.5" opacity="0.8" />
      <line x1="12" y1="20" x2="16" y2="20" stroke="#06B6D4" strokeWidth="1.5" opacity="0.8" />
      <line x1="24" y1="20" x2="28" y2="20" stroke="#06B6D4" strokeWidth="1.5" opacity="0.8" />
      
      {/* 对角线连接 */}
      <line x1="12" y1="12" x2="15" y2="15" stroke="#8B5CF6" strokeWidth="1" opacity="0.5" />
      <line x1="28" y1="12" x2="25" y2="15" stroke="#06B6D4" strokeWidth="1" opacity="0.5" />
      <line x1="12" y1="28" x2="15" y2="25" stroke="#06B6D4" strokeWidth="1" opacity="0.5" />
      <line x1="28" y1="28" x2="25" y2="25" stroke="#10B981" strokeWidth="1" opacity="0.5" />
      
      {/* 上升图表线 - 象征交易 */}
      <polyline 
        points="10,28 16,22 20,24 24,18 30,12" 
        stroke="white" 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
        filter="url(#glow)"
      />
      
      {/* 图表终点箭头 */}
      <polygon points="30,12 28,14 28,10" fill="white" opacity="0.9" />
    </svg>
  );
};
