import React, { useEffect, useRef } from 'react';
import { Agent, MarketState, LootEvent, BattleLog } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface BattlefieldProps {
  agents: Agent[];
  market: MarketState;
  lootEvent?: LootEvent | null;
  logs: BattleLog[];
}

// Configuration
const WIDTH = 1200;
const HEIGHT = 600;
const MAX_DRAWN_AGENTS_PER_SIDE = 120;

// Colors
const COLOR_LONG = '#00FF9D';
const COLOR_SHORT = '#FF0055';
const COLOR_PROFIT = '#00FF9D';
const COLOR_LOSS = '#FF0055';

// Pooling & Limits
const MAX_PARTICLES = 200;
const MAX_BEAMS = 40;
const MAX_TRAILS = 150;
const MAX_TEXTS = 20;
const MAX_FLOATING_PROFITS = 100;

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'smoke' | 'explosion';
}

interface Beam {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

interface Trail {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  agentId: string;
}

interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  text: string;
  subText: string;
  color: string;
  life: number;
  scale: number;
}

interface FloatingProfit {
  active: boolean;
  x: number;
  y: number;
  amount: number;
  life: number;
  maxLife: number;
  velocityY: number;
  agentId: string;
}

interface RenderableAgent {
  agent: Agent;
  seed: number;
  tier: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  isUser: boolean;
  isLong: boolean;
  row: number;
  col: number;
  isEntering: boolean; // New: agent is flying in
  entryProgress: number; // New: 0 to 1 entry animation
}

// Create agent sprite
const createAgentSprite = (isLong: boolean, tier: number): HTMLCanvasElement => {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cx = size / 2;
  const cy = size / 2;

  ctx.translate(cx, cy);
  const scale = 0.8 + (tier * 0.15);
  ctx.scale(scale, scale);

  const baseColor = isLong ? COLOR_LONG : COLOR_SHORT;
  const glowColor = isLong ? 'rgba(0, 255, 157, 0.5)' : 'rgba(255, 0, 85, 0.5)';

  ctx.shadowBlur = 8;
  ctx.shadowColor = glowColor;

  if (tier === 0) {
    // Small drone - triangle shape
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    if (isLong) {
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, -4);
    } else {
      ctx.moveTo(-8, 0);
      ctx.lineTo(4, 4);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, -4);
    }
    ctx.closePath();
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(isLong ? -2 : 2, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (tier === 1) {
    // Medium fighter
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    if (isLong) {
      ctx.moveTo(10, 0);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-2, 2);
      ctx.lineTo(-8, 4);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-2, -2);
      ctx.lineTo(-4, -6);
    } else {
      ctx.moveTo(-10, 0);
      ctx.lineTo(4, 6);
      ctx.lineTo(2, 2);
      ctx.lineTo(8, 4);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, -4);
      ctx.lineTo(2, -2);
      ctx.lineTo(4, -6);
    }
    ctx.closePath();
    ctx.fill();
    
    // Engine
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(isLong ? -4 : 4, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Heavy ship
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    if (isLong) {
      ctx.moveTo(12, 0);
      ctx.lineTo(-2, 8);
      ctx.lineTo(-6, 4);
      ctx.lineTo(-10, 6);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-10, -6);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-2, -8);
    } else {
      ctx.moveTo(-12, 0);
      ctx.lineTo(2, 8);
      ctx.lineTo(6, 4);
      ctx.lineTo(10, 6);
      ctx.lineTo(8, 0);
      ctx.lineTo(10, -6);
      ctx.lineTo(6, -4);
      ctx.lineTo(2, -8);
    }
    ctx.closePath();
    ctx.fill();
    
    // Core glow
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
};

export const Battlefield: React.FC<BattlefieldProps> = ({ agents, market, lootEvent }) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<{ long: HTMLCanvasElement[], short: HTMLCanvasElement[] }>({ long: [], short: [] });
  const prevSymbolRef = useRef<string>(market.symbol);

  const gameState = useRef({
    battlePosition: 50,
    targetBattlePosition: 50,
    velocity: 0,
    lastPrice: market.price,
    priceTrend: 0,
    time: 0,

    particles: Array.from({ length: MAX_PARTICLES }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
      color: '#fff', size: 1, type: 'spark' as const
    })),
    beams: Array.from({ length: MAX_BEAMS }, () => ({
      active: false, startX: 0, startY: 0, endX: 0, endY: 0,
      life: 0, maxLife: 1, color: '#fff', width: 2
    })),
    trails: Array.from({ length: MAX_TRAILS }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0,
      color: '#fff', size: 1, agentId: ''
    })),
    floatingTexts: Array.from({ length: MAX_TEXTS }, () => ({
      active: false, x: 0, y: 0, text: '', subText: '',
      color: '#fff', life: 0, scale: 1
    })),
    floatingProfits: Array.from({ length: MAX_FLOATING_PROFITS }, () => ({
      active: false, x: 0, y: 0, amount: 0, life: 0, maxLife: 1, velocityY: 0, agentId: ''
    })),

    agentFlashes: new Map<string, { color: string; life: number }>(),
    prevPnL: new Map<string, number>(),
    prevFactionPnL: { long: 0, short: 0 } as { long: number; short: number },
    renderableAgents: [] as RenderableAgent[]
  });

  // Reset on asset change
  useEffect(() => {
    if (prevSymbolRef.current !== market.symbol) {
      prevSymbolRef.current = market.symbol;
      gameState.current.battlePosition = 50;
      gameState.current.targetBattlePosition = 50;
      gameState.current.velocity = 0;
      gameState.current.lastPrice = market.price;
      gameState.current.priceTrend = 0;
      gameState.current.particles.forEach(p => p.active = false);
      gameState.current.beams.forEach(b => b.active = false);
      gameState.current.trails.forEach(t => t.active = false);
      gameState.current.floatingTexts.forEach(t => t.active = false);
      gameState.current.floatingProfits.forEach(p => p.active = false);
      gameState.current.agentFlashes.clear();
      gameState.current.prevPnL.clear();
      gameState.current.prevFactionPnL = { long: 0, short: 0 };
      gameState.current.renderableAgents = [];
    }
  }, [market.symbol]);

  // Spawn helpers
  const spawnParticle = (x: number, y: number, color: string, speed: number = 3, type: Particle['type'] = 'spark') => {
    const p = gameState.current.particles.find(p => !p.active);
    if (p) {
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = (Math.random() - 0.5) * speed;
      p.vy = (Math.random() - 0.5) * speed;
      p.life = 1;
      p.maxLife = 1;
      p.color = color;
      p.size = Math.random() * 2 + 0.5;
      p.type = type;
    }
  };

  const spawnBeam = (startX: number, startY: number, endX: number, endY: number, color: string, width: number = 2) => {
    const b = gameState.current.beams.find(b => !b.active);
    if (b) {
      b.active = true;
      b.startX = startX;
      b.startY = startY;
      b.endX = endX;
      b.endY = endY;
      b.life = 1;
      b.maxLife = 1;
      b.color = color;
      b.width = width;
    }
  };

  // Subtle battle line glow - minimal visual effect
  const spawnBattleLineGlow = (x: number, color: string, intensity: number) => {
    const b = gameState.current.beams.find(b => !b.active);
    if (b) {
      b.active = true;
      b.startX = x;
      b.startY = HEIGHT * 0.3; // Start from top of battle area
      b.endX = x;
      b.endY = HEIGHT * 0.7;   // End at bottom of battle area
      b.life = 0.8;
      b.maxLife = 0.8;
      b.color = color;
      b.width = Math.min(80, 20 + intensity); // Subtle width
    }
  };

  const spawnTrail = (x: number, y: number, vx: number, vy: number, color: string, agentId: string) => {
    const t = gameState.current.trails.find(t => !t.active);
    if (t) {
      t.active = true;
      t.x = x;
      t.y = y;
      t.vx = vx;
      t.vy = vy;
      t.life = 1;
      t.color = color;
      t.size = Math.random() * 2 + 1;
      t.agentId = agentId;
    }
  };

  const spawnText = (x: number, y: number, text: string, sub: string, color: string) => {
    const t = gameState.current.floatingTexts.find(t => !t.active);
    if (t) {
      t.active = true;
      t.x = x;
      t.y = y;
      t.text = text;
      t.subText = sub;
      t.color = color;
      t.life = 1;
      t.scale = 0.1;
    }
  };

  const spawnFloatingProfit = (x: number, y: number, amount: number, agentId: string) => {
    const p = gameState.current.floatingProfits.find(p => !p.active);
    if (p) {
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 30; // Slight random offset
      p.y = y - 20;
      p.amount = amount;
      p.life = 1;
      p.maxLife = 1;
      p.velocityY = -0.5 - Math.random() * 0.5; // Float upward
      p.agentId = agentId;
    }
  };

  // Init sprites
  useEffect(() => {
    spritesRef.current.long = [createAgentSprite(true, 0), createAgentSprite(true, 1), createAgentSprite(true, 2)];
    spritesRef.current.short = [createAgentSprite(false, 0), createAgentSprite(false, 1), createAgentSprite(false, 2)];
  }, []);

  // Prepare agents with grid-based positioning
  useEffect(() => {
    const active = agents.filter(a => a.status === 'ACTIVE' && a.asset === market.symbol);
    const longs = active.filter(a => a.direction === 'LONG');
    const shorts = active.filter(a => a.direction === 'SHORT');

    const sorter = (a: Agent, b: Agent) => {
      if (a.owner === 'USER') return -1;
      if (b.owner === 'USER') return 1;
      return b.leverage - a.leverage;
    };

    longs.sort(sorter);
    shorts.sort(sorter);

    const visualList: RenderableAgent[] = [];
    const rows = 8;
    const cols = 10;
    const cellHeight = (HEIGHT - 100) / rows;
    const cellWidth = 35;

    const processSide = (agents: Agent[], isLong: boolean) => {
      const limited = agents.slice(0, MAX_DRAWN_AGENTS_PER_SIDE);
      
      limited.forEach((a, idx) => {
        let hash = 0;
        for (let i = 0; i < a.id.length; i++) {
          hash = a.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const seed = Math.abs(hash);
        
        const row = idx % rows;
        const col = Math.floor(idx / rows);
        
        // Add jitter within cell
        const jitterX = ((seed % 100) / 100 - 0.5) * cellWidth * 0.6;
        const jitterY = (((seed * 17) % 100) / 100 - 0.5) * cellHeight * 0.6;
        
        const baseY = 50 + row * cellHeight + cellHeight / 2;
        const baseX = isLong ? -col * cellWidth : col * cellWidth;
        
        const existing = gameState.current.renderableAgents.find(ra => ra.agent.id === a.id);
        
        // Check if this is a new agent (not in existing list, or existing hasn't finished entering)
        const isNewAgent = !existing || (existing.isEntering && existing.entryProgress < 1);
        
        // For new agents, start from far outside the screen (sides)
        // LONG agents fly in from the left, SHORT agents fly in from the right
        const startX = isNewAgent && !existing
          ? (isLong ? -WIDTH * 0.8 - Math.random() * 300 : WIDTH * 0.8 + Math.random() * 300) // Start far off-screen on sides
          : (existing ? existing.x : baseX + jitterX);
        const startY = isNewAgent && !existing
          ? baseY + jitterY + (Math.random() - 0.5) * 100 // Y variation on entry
          : (existing ? existing.y : baseY + jitterY);
        
        visualList.push({
          agent: a,
          seed,
          tier: a.leverage > 12 ? 2 : a.leverage > 5 ? 1 : 0,
          x: startX,
          y: startY,
          targetX: baseX + jitterX,
          targetY: baseY + jitterY,
          vx: existing ? existing.vx : 0,
          vy: existing ? existing.vy : 0,
          isUser: a.owner === 'USER',
          isLong,
          row,
          col,
          isEntering: isNewAgent,
          entryProgress: existing ? existing.entryProgress : 0
        });
      });
    };

    processSide(longs, true);
    processSide(shorts, false);
    
    gameState.current.renderableAgents = visualList;

    // PnL flashes for individual agents
    const FLASH_THRESHOLD = 10;
    active.forEach(agent => {
      const prev = gameState.current.prevPnL.get(agent.id);
      if (prev !== undefined) {
        const diff = agent.pnl - prev;
        if (Math.abs(diff) >= FLASH_THRESHOLD) {
          const flashColor = diff > 0 ? COLOR_PROFIT : COLOR_LOSS;
          gameState.current.agentFlashes.set(agent.id, { color: flashColor, life: 1 });
        }
      }
      gameState.current.prevPnL.set(agent.id, agent.pnl);
    });

    // Calculate and display faction-level floating profit
    const longPnL = longs.reduce((sum, a) => sum + a.pnl, 0);
    const shortPnL = shorts.reduce((sum, a) => sum + a.pnl, 0);
    const prevLongPnL = gameState.current.prevFactionPnL?.long ?? 0;
    const prevShortPnL = gameState.current.prevFactionPnL?.short ?? 0;
    const longDiff = longPnL - prevLongPnL;
    const shortDiff = shortPnL - prevShortPnL;
    
    const FACTION_PROFIT_THRESHOLD = 5;
    const battleX = (gameState.current.battlePosition / 100) * WIDTH;

    // Show faction profit in the center battle area (only show profits, not losses)
    if (longDiff >= FACTION_PROFIT_THRESHOLD) {
      // Position on the long side (left of battle line)
      const xPos = battleX - 150 - Math.random() * 50;
      const yPos = HEIGHT * 0.3 + Math.random() * HEIGHT * 0.4;
      spawnFloatingProfit(xPos, yPos, longDiff, 'LONG_FACTION');
    }
    if (shortDiff >= FACTION_PROFIT_THRESHOLD) {
      // Position on the short side (right of battle line)
      const xPos = battleX + 150 + Math.random() * 50;
      const yPos = HEIGHT * 0.3 + Math.random() * HEIGHT * 0.4;
      spawnFloatingProfit(xPos, yPos, shortDiff, 'SHORT_FACTION');
    }
    
    gameState.current.prevFactionPnL = { long: longPnL, short: shortPnL };
  }, [agents, market.symbol]);

  // Loot event effect
  useEffect(() => {
    if (lootEvent) {
      const isLongWin = lootEvent.winner === 'LONG';
      const battleX = (gameState.current.battlePosition / 100) * WIDTH;
      const xPos = isLongWin ? battleX - 120 : battleX + 120;
      spawnText(xPos, HEIGHT / 2 - 80, `+${Math.floor(lootEvent.amount).toLocaleString()} MON`, t('plundered'), isLongWin ? COLOR_LONG : COLOR_SHORT);
    }
  }, [lootEvent, t]);

  // Market effect - Update battle position only
  useEffect(() => {
    const priceDiff = market.price - gameState.current.lastPrice;
    const pctChange = gameState.current.lastPrice > 0 ? (priceDiff / gameState.current.lastPrice) * 100 : 0;

    const movement = pctChange * 25;
    let newTarget = gameState.current.targetBattlePosition + movement;
    newTarget = Math.max(20, Math.min(80, newTarget));
    gameState.current.targetBattlePosition = newTarget;
    gameState.current.lastPrice = market.price;
    gameState.current.priceTrend = priceDiff;
  }, [market.price]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let frameId: number;
    const state = gameState.current;

    const render = () => {
      state.time += 0.016;

      // Physics
      const k = 0.006;
      const d = 0.94;
      const dist = state.targetBattlePosition - state.battlePosition;
      const force = dist * k;
      state.velocity += force;
      state.velocity *= d;
      state.velocity = Math.max(-3, Math.min(3, state.velocity));
      state.battlePosition += state.velocity;
      state.battlePosition = Math.max(0, Math.min(100, state.battlePosition));

      const battleX = (state.battlePosition / 100) * WIDTH;

      // Clear background
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw grid
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#836EF9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const horizonY = HEIGHT * 0.15;
      const centerX = WIDTH / 2;
      for (let i = -6; i <= 6; i++) {
        const x1 = centerX + i * 80;
        const x2 = centerX + i * 350;
        ctx.moveTo(x1, horizonY);
        ctx.lineTo(x2, HEIGHT);
      }
      for (let i = 0; i < 8; i++) {
        const y = horizonY + Math.pow(i / 8, 2) * (HEIGHT - horizonY);
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
      }
      ctx.stroke();
      ctx.restore();

      // Plasma wall
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const wallColor = state.priceTrend >= 0 ? '0, 255, 157' : '255, 0, 85';
      const drag = -state.velocity * 8;
      const tVal = state.time * 15;
      const intensity = Math.abs(state.velocity) + 0.5;

      const getWallX = (y: number, jitter: number = 0) => {
        const ny = (y / HEIGHT) * 2 - 1;
        const parabola = 1 - ny * ny;
        const dragOffset = drag * parabola;
        const wave = Math.sin(y * 0.4 + tVal) * intensity * 3;
        const j = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
        return battleX + dragOffset + wave + j;
      };

      // Outer glow
      ctx.beginPath();
      for (let y = 0; y <= HEIGHT; y += 15) {
        const x = getWallX(y, 0);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${wallColor}, 0.25)`;
      ctx.lineWidth = 20 + Math.sin(state.time * 8) * 5;
      ctx.shadowBlur = 30;
      ctx.shadowColor = `rgba(${wallColor}, 0.6)`;
      ctx.stroke();

      // Middle glow
      ctx.beginPath();
      for (let y = 0; y <= HEIGHT; y += 10) {
        const x = getWallX(y, 0);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${wallColor}, 0.5)`;
      ctx.lineWidth = 8;
      ctx.shadowBlur = 15;
      ctx.stroke();

      // Core line
      ctx.beginPath();
      for (let y = 0; y <= HEIGHT; y += 5) {
        const x = getWallX(y, 0);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Sparks from wall
      if (Math.random() < 0.15 * intensity) {
        const py = Math.random() * HEIGHT;
        const px = getWallX(py, 8);
        spawnParticle(px, py, `rgba(${wallColor}, 1)`, 4, 'spark');
      }

      ctx.restore();

      // Update and render trails
      state.trails.forEach(t => {
        if (!t.active) return;
        
        t.x += t.vx;
        t.y += t.vy;
        t.life -= 0.025;
        
        if (t.life <= 0) {
          t.active = false;
          return;
        }

        ctx.save();
        ctx.globalAlpha = t.life * 0.6;
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render agents
      const agentsToRender = state.renderableAgents;
      if (spritesRef.current.long.length > 0) {
        const time = state.time;

        agentsToRender.forEach(ra => {
          // Handle entry animation for new agents
          if (ra.isEntering) {
            ra.entryProgress += 0.005;
            if (ra.entryProgress >= 1) {
              ra.entryProgress = 1;
              ra.isEntering = false;
            }
          }

          // Smooth movement to target
          const dx = ra.targetX - ra.x;
          const dy = ra.targetY - ra.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Simple smooth follow - always move towards target at reasonable speed
          // Cap max speed to prevent jitter
          const maxSpeed = ra.isEntering ? 8 : 2;
          const acceleration = ra.isEntering ? 0.03 : 0.02;
          
          // Normalize direction and apply speed
          if (distance > 0.5) {
            const targetVx = (dx / distance) * Math.min(distance * acceleration, maxSpeed);
            const targetVy = (dy / distance) * Math.min(distance * acceleration, maxSpeed);
            
            // Smooth velocity transition
            ra.vx += (targetVx - ra.vx) * 0.1;
            ra.vy += (targetVy - ra.vy) * 0.1;
          } else {
            // Close enough, slow down
            ra.vx *= 0.8;
            ra.vy *= 0.8;
          }
          
          ra.x += ra.vx;
          ra.y += ra.vy;

          // Add marching animation (only when not entering)
          const marchOffset = ra.isEntering ? 0 : Math.sin(time * 2 + ra.row * 0.5 + ra.col * 0.3) * 3;
          const thrustOffset = Math.sin(time * 10 + ra.seed) * 1;

          const finalX = battleX + ra.x + marchOffset + (ra.isLong ? -40 : 40);
          const finalY = ra.y + thrustOffset;

          // Cull offscreen (but allow entering agents to be visible)
          if (!ra.isEntering && (finalX < -50 || finalX > WIDTH + 50)) return;

          const drawSize = ra.isUser ? 44 : 28 + ra.tier * 4;
          const offset = drawSize / 2;

          // Enhanced trail during entry (long jet trail effect)
          const trailIntensity = ra.isEntering ? 0.95 : 0.3;
          if (Math.random() < trailIntensity) {
            // Many trail particles during entry for long tail effect
            const trailCount = ra.isEntering ? 8 : 1;
            for (let ti = 0; ti < trailCount; ti++) {
              // Trail extends behind the agent based on direction
              const trailOffset = ti * 15; // Longer trail spacing
              const trailX = ra.isLong 
                ? finalX - offset - 10 - trailOffset
                : finalX + offset + 10 + trailOffset;
              const trailY = finalY + (Math.random() - 0.5) * 6;
              // Trail moves opposite to agent direction
              const trailVx = (Math.random() - 0.5) * 0.3 + (ra.isLong ? -3 : 3);
              const trailVy = (Math.random() - 0.5) * 0.3;
              // Fade alpha based on trail position
              const alpha = ra.isEntering ? 0.8 - (ti * 0.08) : 0.3 + Math.random() * 0.3;
              const trailColor = ra.isLong 
                ? `rgba(0, 255, 157, ${Math.max(0.1, alpha)})` 
                : `rgba(255, 0, 85, ${Math.max(0.1, alpha)})`;
              spawnTrail(trailX, trailY, trailVx, trailVy, trailColor, ra.agent.id);
            }
          }

          // Entry glow effect (pulsing glow during fly-in)
          if (ra.isEntering) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const entryGlow = 1 - ra.entryProgress;
            const pulseGlow = 0.5 + Math.sin(time * 10) * 0.3; // Pulsing effect
            ctx.globalAlpha = entryGlow * pulseGlow;
            ctx.fillStyle = ra.isLong ? COLOR_LONG : COLOR_SHORT;
            ctx.beginPath();
            ctx.arc(finalX, finalY, 40 + entryGlow * 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Flash effect
          const flash = state.agentFlashes.get(ra.agent.id);
          if (flash && flash.life > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = flash.life * 0.5;
            ctx.fillStyle = flash.color;
            ctx.beginPath();
            ctx.arc(finalX, finalY, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            flash.life -= 0.04;
          }

          // Glow for user or high tier
          if (ra.tier === 2 || ra.isUser) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = ra.isUser ? 0.4 : 0.15;
            ctx.fillStyle = ra.isUser ? '#FFD700' : (ra.isLong ? COLOR_LONG : COLOR_SHORT);
            ctx.beginPath();
            ctx.arc(finalX, finalY, ra.isUser ? 20 : 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Draw sprite with rotation during entry (banking effect)
          ctx.save();
          if (ra.isEntering) {
            // Bank inward during entry
            const bankAngle = ra.isLong ? -15 * (1 - ra.entryProgress) : 15 * (1 - ra.entryProgress);
            ctx.translate(finalX, finalY);
            ctx.rotate(bankAngle * Math.PI / 180);
            ctx.translate(-finalX, -finalY);
          }
          
          const sprite = ra.isLong 
            ? spritesRef.current.long[ra.tier] 
            : spritesRef.current.short[ra.tier];
          ctx.drawImage(sprite, Math.floor(finalX - offset), Math.floor(finalY - offset), drawSize, drawSize);
          ctx.restore();

          // User indicator
          if (ra.isUser) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(finalX - 12, finalY - 20);
            ctx.lineTo(finalX + 12, finalY - 20);
            ctx.lineTo(finalX, finalY - 10);
            ctx.closePath();
            ctx.stroke();
          }
        });
      }

      // Beams disabled - keeping battlefield clean

      // Render particles
      const activeParticles = state.particles.filter(p => p.active);
      if (activeParticles.length > 0) {
        for (const p of activeParticles) {
          ctx.save();
          ctx.globalAlpha = p.life;
          
          if (p.type === 'smoke') {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (2 - p.life), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.restore();
          
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.life -= p.type === 'explosion' ? 0.06 : 0.025;
          if (p.life <= 0) p.active = false;
        }
      }

      // Render floating texts
      const activeTexts = state.floatingTexts.filter(t => t.active);
      if (activeTexts.length > 0) {
        ctx.save();
        ctx.textAlign = 'center';
        for (const t of activeTexts) {
          const scale = t.life > 0.85 ? 1 + (1 - t.life) * 3 : 1;
          
          ctx.font = `900 ${Math.floor(28 * scale)}px Orbitron, sans-serif`;
          ctx.fillStyle = t.color;
          ctx.fillText(t.text, t.x, t.y);
          
          ctx.font = '600 11px Rajdhani, sans-serif';
          ctx.fillStyle = '#fff';
          ctx.fillText(t.subText, t.x, t.y + 16);

          t.y -= 0.8;
          t.life -= 0.012;
          if (t.life <= 0) t.active = false;
        }
        ctx.restore();
      }

      // Render floating profit numbers (faction-level)
      const activeProfits = state.floatingProfits.filter(p => p.active);
      if (activeProfits.length > 0) {
        ctx.save();
        ctx.textAlign = 'center';
        for (const p of activeProfits) {
          const alpha = p.life > 0.3 ? 1 : p.life / 0.3;
          const scale = 1.2 + (1 - p.life) * 0.6; // Larger scale for faction profits
          const isProfit = p.amount >= 0;
          const isFaction = p.agentId.includes('FACTION');
          
          ctx.globalAlpha = alpha;
          
          if (isFaction) {
            // Faction profits - larger and more prominent
            ctx.font = `900 ${Math.floor(24 * scale)}px Orbitron, sans-serif`;
            ctx.fillStyle = isProfit ? COLOR_PROFIT : COLOR_LOSS;
            ctx.shadowColor = isProfit ? COLOR_PROFIT : COLOR_LOSS;
            ctx.shadowBlur = 20;
            
            const sign = isProfit ? '+' : '';
            const label = p.agentId === 'LONG_FACTION' ? 'LONG ' : 'SHORT ';
            ctx.fillText(`${label}${sign}${p.amount.toFixed(0)}`, p.x, p.y);
            
            // Add MON label below
            ctx.font = `bold ${Math.floor(12 * scale)}px Rajdhani, sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 5;
            ctx.fillText('MON', p.x, p.y + 20);
          } else {
            // Individual agent profits (if any)
            ctx.font = `bold ${Math.floor(14 * scale)}px Rajdhani, sans-serif`;
            ctx.fillStyle = isProfit ? COLOR_PROFIT : COLOR_LOSS;
            ctx.shadowColor = isProfit ? COLOR_PROFIT : COLOR_LOSS;
            ctx.shadowBlur = 10;
            
            const sign = isProfit ? '+' : '';
            ctx.fillText(`${sign}${p.amount.toFixed(1)}`, p.x, p.y);
          }
          
          // Update position and life
          p.y += p.velocityY;
          p.life -= 0.012;
          if (p.life <= 0) p.active = false;
        }
        ctx.restore();
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="relative w-full h-[300px] lg:h-[500px] rounded-2xl overflow-hidden border border-[#836EF9]/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#020203]">
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full h-full object-cover" />
    </div>
  );
};
