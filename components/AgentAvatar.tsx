import React from 'react';

interface AgentAvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

/**
 * Generate a deterministic color from seed string
 */
const generateColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Generate a pattern from seed
 */
const generatePattern = (seed: string): string => {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const patterns = [
    'circle',
    'square',
    'triangle',
    'diamond',
    'hexagon',
    'star',
  ];
  return patterns[hash % patterns.length];
};

/**
 * Agent Avatar Component
 * Generates a unique avatar based on seed without external API calls
 */
export const AgentAvatar: React.FC<AgentAvatarProps> = ({ 
  seed, 
  size = 64,
  className = '' 
}) => {
  const bgColor = generateColor(seed);
  const pattern = generatePattern(seed);
  
  // Generate unique shapes based on seed
  const shapes = React.useMemo(() => {
    const hash = seed.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
    const items = [];
    for (let i = 0; i < 5; i++) {
      const itemHash = (hash + i * 997) % 1000;
      items.push({
        x: 20 + (itemHash % 60),
        y: 20 + ((itemHash * 7) % 60),
        size: 8 + (itemHash % 16),
        rotation: itemHash % 360,
        opacity: 0.3 + (itemHash % 40) / 100,
      });
    }
    return items;
  }, [seed]);

  const renderShape = (shape: string, x: number, y: number, size: number, rotation: number) => {
    const transform = `rotate(${rotation} ${x} ${y})`;
    const fill = 'rgba(255,255,255,0.4)';
    
    switch (shape) {
      case 'circle':
        return <circle key={`${x}-${y}`} cx={x} cy={y} r={size/2} fill={fill} transform={transform} />;
      case 'square':
        return <rect key={`${x}-${y}`} x={x-size/2} y={y-size/2} width={size} height={size} fill={fill} transform={transform} />;
      case 'triangle':
        const points = `${x},${y-size/2} ${x-size/2},${y+size/2} ${x+size/2},${y+size/2}`;
        return <polygon key={`${x}-${y}`} points={points} fill={fill} transform={transform} />;
      case 'diamond':
        const diamondPoints = `${x},${y-size/2} ${x+size/2},${y} ${x},${y+size/2} ${x-size/2},${y}`;
        return <polygon key={`${x}-${y}`} points={diamondPoints} fill={fill} transform={transform} />;
      case 'hexagon':
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 - 30) * Math.PI / 180;
          hexPoints.push(`${x + size/2 * Math.cos(angle)},${y + size/2 * Math.sin(angle)}`);
        }
        return <polygon key={`${x}-${y}`} points={hexPoints.join(' ')} fill={fill} transform={transform} />;
      case 'star':
        const starPoints = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * 36 - 90) * Math.PI / 180;
          const radius = i % 2 === 0 ? size/2 : size/4;
          starPoints.push(`${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`);
        }
        return <polygon key={`${x}-${y}`} points={starPoints.join(' ')} fill={fill} transform={transform} />;
      default:
        return <circle key={`${x}-${y}`} cx={x} cy={y} r={size/2} fill={fill} transform={transform} />;
    }
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100"
      className={`rounded-full ${className}`}
      style={{ background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor.replace('60%', '40%')} 100%)` }}
    >
      {shapes.map((shape, i) => 
        renderShape(pattern, shape.x, shape.y, shape.size, shape.rotation)
      )}
    </svg>
  );
};

export default AgentAvatar;
