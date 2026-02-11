import React from 'react';

interface PnLChartProps {
  data: { time: string; value: number }[];
  width?: number;
  height?: number;
}

export const PnLChart: React.FC<PnLChartProps> = ({ data, width = 280, height = 80 }) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-black/20 rounded-lg border border-white/5"
        style={{ width, height }}
      >
        <span className="text-xs text-slate-500">No data available</span>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  
  const isPositive = values[values.length - 1] >= 0;
  const color = isPositive ? '#34d399' : '#fb7185'; // emerald-400 or rose-400
  
  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - minValue) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  }).join(' ');

  // Calculate area for fill
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${isPositive ? 'pos' : 'neg'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <polygon 
          points={areaPoints} 
          fill={`url(#gradient-${isPositive ? 'pos' : 'neg'})`}
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Current value dot */}
        <circle
          cx={width}
          cy={height - ((values[values.length - 1] - minValue) / range) * height * 0.8 - height * 0.1}
          r="4"
          fill={color}
          className="animate-pulse"
        />
      </svg>
      
      {/* Time labels */}
      <div className="flex justify-between text-[9px] text-slate-500 mt-1 px-1">
        <span>24h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
};
