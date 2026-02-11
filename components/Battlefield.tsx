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
const MAX_DRAWN_AGENTS_PER_SIDE = 100; 

// Colors - STANDARD FINANCIAL COLORS
const COLOR_LONG = '#00FF9D'; // Neon Green
const COLOR_SHORT = '#FF0055'; // Neon Red
const COLOR_PROFIT = '#00FF9D';
const COLOR_LOSS = '#FF0055'; 

// Pooling & Limits
const MAX_PARTICLES = 150;
const MAX_BEAMS = 30;
const MAX_TEXTS = 20;

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Beam {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number;
  color: string;
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

// Optimization: Pre-calculated visual properties to avoid per-frame parsing
interface RenderableAgent {
    agent: Agent;
    seed: number;
    tier: number;
    rowPos: number;
    depthPos: number;
    isUser: boolean;
    isLong: boolean;
}

// PERFORMANCE OPTIMIZATION: Pre-render agents to offscreen canvas (Sprites)
const createMechSprite = (isLong: boolean, tier: number): HTMLCanvasElement => {
    const size = 64; 
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const cx = size / 2;
    const cy = size / 2;

    ctx.translate(cx, cy);
    const scale = 1.0 + (tier * 0.2);
    const dir = isLong ? 1 : -1;
    ctx.scale(dir * scale, scale);

    const baseColor = isLong ? COLOR_LONG : COLOR_SHORT;
    const darkColor = isLong ? '#064e3b' : '#450a0a'; 
    
    ctx.shadowBlur = 4 + (tier * 2); // Reduced blur for performance
    ctx.shadowColor = baseColor;

    if (tier === 0) {
        // TIER 1: DRONE
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        if (isLong) {
            ctx.moveTo(10, 0); ctx.lineTo(-6, 5); ctx.lineTo(-2, 0); ctx.lineTo(-6, -5);
        } else {
            ctx.moveTo(8, 0); ctx.lineTo(-4, 6); ctx.lineTo(-8, 0); ctx.lineTo(-4, -6);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI*2); ctx.fill();

    } else if (tier === 1) {
        // TIER 2: FIGHTER
        ctx.fillStyle = darkColor;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (isLong) {
            ctx.moveTo(14, 0); ctx.lineTo(-6, 8); ctx.lineTo(-4, 2); ctx.lineTo(-10, 4);
            ctx.lineTo(-8, 0); ctx.lineTo(-10, -4); ctx.lineTo(-4, -2); ctx.lineTo(-6, -8);
        } else {
            ctx.moveTo(12, 0); ctx.lineTo(0, 8); ctx.lineTo(-8, 4); ctx.lineTo(-12, 0);
            ctx.lineTo(-8, -4); ctx.lineTo(0, -8);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(-6, 0, 2, 0, Math.PI*2); ctx.fill();

    } else {
        // TIER 3: CAPITAL SHIP
        ctx.fillStyle = darkColor;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = baseColor; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 0); ctx.lineTo(4, 10); ctx.lineTo(-12, 6); ctx.lineTo(-12, -6); ctx.lineTo(4, -10);
        ctx.closePath(); ctx.stroke();
        ctx.fillStyle = baseColor; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    return canvas;
};

export const Battlefield: React.FC<BattlefieldProps> = ({ agents, market, lootEvent, logs }) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<{ long: HTMLCanvasElement[], short: HTMLCanvasElement[] }>({ long: [], short: [] });

  // Game State Ref
  const gameState = useRef({
    battlePosition: 50,
    targetBattlePosition: 50,
    velocity: 0,
    lastPrice: market.price,
    priceTrend: 0, // >0 UP, <0 DOWN
    time: 0,
    
    // Object Pools
    particles: Array.from({ length: MAX_PARTICLES }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#fff', size: 1 })) as Particle[],
    beams: Array.from({ length: MAX_BEAMS }, () => ({ active: false, startX: 0, startY: 0, endX: 0, endY: 0, life: 0, color: '#fff' })) as Beam[],
    floatingTexts: Array.from({ length: MAX_TEXTS }, () => ({ active: false, x: 0, y: 0, text: '', subText: '', color: '#fff', life: 0, scale: 1 })) as FloatingText[],
    
    agentFlashes: new Map<string, { color: string, life: number }>(),
    prevPnL: new Map<string, number>(),
    renderableAgents: [] as RenderableAgent[]
  });

  // Helpers to spawn objects from pool
  const spawnParticle = (x: number, y: number, color: string, speed: number = 4) => {
      const pool = gameState.current.particles;
      const p = pool.find(p => !p.active);
      if (p) {
          p.active = true;
          p.x = x; p.y = y;
          p.vx = (Math.random() - 0.5) * speed;
          p.vy = (Math.random() - 0.5) * speed;
          p.life = 1.0;
          p.color = color;
          p.size = Math.random() * 2 + 1;
      }
  };

  const spawnBeam = (startX: number, startY: number, endX: number, endY: number, color: string) => {
      const pool = gameState.current.beams;
      const b = pool.find(b => !b.active);
      if (b) {
          b.active = true;
          b.startX = startX; b.startY = startY;
          b.endX = endX; b.endY = endY;
          b.life = 1.0;
          b.color = color;
      }
  };

  const spawnText = (x: number, y: number, text: string, sub: string, color: string) => {
      const pool = gameState.current.floatingTexts;
      const t = pool.find(item => !item.active);
      if (t) {
          t.active = true;
          t.x = x; t.y = y;
          t.text = text; t.subText = sub;
          t.color = color;
          t.life = 1.0;
          t.scale = 0.1;
      }
  };

  // Initialization
  useEffect(() => {
      spritesRef.current.long = [createMechSprite(true, 0), createMechSprite(true, 1), createMechSprite(true, 2)];
      spritesRef.current.short = [createMechSprite(false, 0), createMechSprite(false, 1), createMechSprite(false, 2)];
  }, []);

  // Prepare Agents logic
  useEffect(() => {
      const active = agents.filter(a => a.status === 'ACTIVE');
      
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
      const processAgent = (a: Agent) => {
          // Stable Seed Generation
          let hash = 0;
          for (let i = 0; i < a.id.length; i++) hash = a.id.charCodeAt(i) + ((hash << 5) - hash);
          const seed = Math.abs(hash);

          const tier = a.leverage > 12 ? 2 : a.leverage > 5 ? 1 : 0;
          
          visualList.push({
              agent: a,
              seed: seed,
              tier,
              rowPos: (seed % 100) / 100,
              depthPos: ((seed * 17) % 100) / 100,
              isUser: a.owner === 'USER',
              isLong: a.direction === 'LONG'
          });
      };

      longs.slice(0, MAX_DRAWN_AGENTS_PER_SIDE).forEach(processAgent);
      shorts.slice(0, MAX_DRAWN_AGENTS_PER_SIDE).forEach(processAgent);
      
      gameState.current.renderableAgents = visualList;

      // PnL Flashes
      const FLASH_THRESHOLD = 50;
      active.forEach(agent => {
        const prev = gameState.current.prevPnL.get(agent.id);
        if (prev !== undefined) {
            const diff = agent.pnl - prev;
            if (Math.abs(diff) >= FLASH_THRESHOLD) {
                const flashColor = diff > 0 ? COLOR_PROFIT : COLOR_LOSS;
                gameState.current.agentFlashes.set(agent.id, { color: flashColor, life: 1.0 });
            }
        }
        gameState.current.prevPnL.set(agent.id, agent.pnl);
    });

  }, [agents]);

  // Game Logic (Loot & Market)
  useEffect(() => {
    if (lootEvent) {
       const isLongWin = lootEvent.winner === 'LONG';
       const currentBattlePos = gameState.current.battlePosition;
       const battleX = (currentBattlePos / 100) * WIDTH;
       const xPos = isLongWin ? battleX - 100 : battleX + 100;
       
       spawnText(xPos, HEIGHT/2 - 100, `+${Math.floor(lootEvent.amount).toLocaleString()} $MON`, t('looted'), isLongWin ? COLOR_LONG : COLOR_SHORT);
    }
  }, [lootEvent, t]); // Added t dependency

  useEffect(() => {
    const priceDiff = market.price - gameState.current.lastPrice;
    const pctChange = gameState.current.lastPrice > 0 ? (priceDiff / gameState.current.lastPrice) * 100 : 0;
    
    // Physics Impulse
    const movement = pctChange * 30; 
    let newTarget = gameState.current.targetBattlePosition + movement;
    newTarget = Math.max(15, Math.min(85, newTarget)); 
    gameState.current.targetBattlePosition = newTarget;
    gameState.current.lastPrice = market.price;
    
    // Update Trend for Visuals
    gameState.current.priceTrend = priceDiff;

    if (Math.abs(pctChange) > 0.005) {
        const isPriceUp = priceDiff > 0;
        
        // 1. Beam FX
        const count = 4;
        const battleX = (gameState.current.battlePosition / 100) * WIDTH;
        
        for (let i = 0; i < count; i++) {
             const isLongAttacking = isPriceUp;
             const startX = isLongAttacking ? battleX - (Math.random() * 200) : battleX + (Math.random() * 200);
             const startY = 100 + Math.random() * (HEIGHT - 200);
             const endX = isLongAttacking ? startX + 300 : startX - 300;
             const endY = startY + (Math.random() * 100 - 50);

             spawnBeam(startX, startY, endX, endY, isLongAttacking ? COLOR_LONG : COLOR_SHORT);
        }

        // 2. Particle Explosion FX
        const explosionColor = isPriceUp ? COLOR_LONG : COLOR_SHORT;
        // Spawn cluster of fast particles
        for (let k = 0; k < 25; k++) {
             const py = Math.random() * HEIGHT;
             // Radiate fast
             spawnParticle(battleX, py, explosionColor, 15);
        }
    }
  }, [market]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let frameId: number;
    const state = gameState.current;

    const render = () => {
        state.time += 0.02;

        // --- PHYSICS ---
        const k = 0.008; 
        const d = 0.92; 
        const dist = state.targetBattlePosition - state.battlePosition;
        const force = dist * k;
        state.velocity += force;
        state.velocity *= d; 
        if (state.velocity > 2) state.velocity = 2;
        if (state.velocity < -2) state.velocity = -2;
        state.battlePosition += state.velocity;
        state.battlePosition = Math.max(0, Math.min(100, state.battlePosition));
        
        const battleX = (state.battlePosition / 100) * WIDTH;

        // 1. Clear & Background
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#836EF9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Grid
        const horizonY = HEIGHT * 0.1;
        const centerX = WIDTH / 2;
        for (let i = -5; i <= 5; i++) {
            const x1 = centerX + i * 100;
            const x2 = centerX + i * 400;
            ctx.moveTo(x1, horizonY); ctx.lineTo(x2, HEIGHT);
        }
        for (let i = 0; i < 10; i++) {
            const y = horizonY + Math.pow(i / 10, 2) * (HEIGHT - horizonY);
            ctx.moveTo(0, y); ctx.lineTo(WIDTH, y);
        }
        ctx.stroke();
        ctx.restore();

        // 2. Plasma Wall & Heat Effects
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Determine Wall Color based on TREND (Green if Up, Red if Down)
        let wallColorRGB = '255, 255, 255';
        if (state.priceTrend >= 0) {
            // GREEN
            wallColorRGB = '0, 255, 157';
        } else {
            // RED
            wallColorRGB = '255, 0, 85';
        }

        const drag = -state.velocity * 10; 
        const tVal = state.time * 20;
        const absVel = Math.abs(state.velocity) + 1;
        
        // Helper to get X coordinate of wall at specific Y with optional jitter
        const getWallX = (y: number, jitterIntensity: number = 0) => {
            const ny = (y / HEIGHT) * 2 - 1; 
            const parabola = 1 - ny*ny; 
            const dragOffset = drag * parabola;
            const tension = Math.sin(y * 0.5 + tVal) * absVel;
            const jitter = jitterIntensity > 0 ? (Math.random() - 0.5) * jitterIntensity : 0;
            return battleX + dragOffset + tension + jitter;
        };

        // Layer A: Wide Glow / Heat Haze
        ctx.beginPath();
        const step = 20;
        for(let y=0; y<=HEIGHT; y+=step) {
            const x = getWallX(y, 0);
            if(y===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${wallColorRGB}, 0.3)`;
        ctx.lineWidth = 12 + Math.sin(state.time * 10) * 4; // Pulsing
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(${wallColorRGB}, 0.8)`;
        ctx.stroke();

        // Layer B: Core Energy Line
        ctx.beginPath();
        for(let y=0; y<=HEIGHT; y+=step) {
            const x = getWallX(y, 0);
            if(y===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${wallColorRGB}, 1)`;
        ctx.stroke();

        // Layer C: Static / High Energy Jitter (If intense)
        if (absVel > 1.2) {
             ctx.beginPath();
             const fineStep = 10;
             for(let y=0; y<=HEIGHT; y+=fineStep) {
                 // Jitter proportional to velocity/intensity
                 const x = getWallX(y, 10 * (absVel - 1)); 
                 if(y===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
             }
             ctx.strokeStyle = `rgba(${wallColorRGB}, 0.6)`;
             ctx.lineWidth = 1;
             ctx.stroke();
        }

        // Emit Wall Particles (Sparks) based on intensity
        if (Math.random() < 0.1 * absVel) {
            const py = Math.random() * HEIGHT;
            const px = getWallX(py, 5);
            spawnParticle(px, py, `rgba(${wallColorRGB}, 1)`);
        }

        ctx.restore();

        // 3. Render Agents
        const agentsToRender = state.renderableAgents;
        if (spritesRef.current.long.length > 0) {
            const spread = 450; 
            const gap = 50; 
            const timeMove = state.time * 2;
            const timeThrust = state.time * 8;

            for (let i = 0; i < agentsToRender.length; i++) {
                const ra = agentsToRender[i];
                const y = 80 + (ra.rowPos * (HEIGHT - 160));
                
                // Optimized Math
                const march = Math.sin(timeMove + i) * 3;
                const thrust = Math.sin(timeThrust + i) * 1.5; 

                let x = 0;
                if (ra.isLong) {
                    x = battleX - gap - (ra.depthPos * ra.depthPos * spread) + march;
                } else {
                    x = battleX + gap + (ra.depthPos * ra.depthPos * spread) - march;
                }

                // Cull offscreen
                if (x < -30 || x > WIDTH + 30) continue;

                const drawSize = ra.isUser ? 48 : 32; 
                const offset = drawSize / 2;
                const finalY = y + thrust;

                // Flash Logic
                const flash = state.agentFlashes.get(ra.agent.id);
                if (flash) {
                    if (flash.life > 0) {
                        ctx.save();
                        ctx.globalCompositeOperation = 'screen';
                        ctx.globalAlpha = flash.life * 0.6; 
                        ctx.fillStyle = flash.color;
                        ctx.beginPath();
                        ctx.arc(x, finalY, 20, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                        flash.life -= 0.05;
                    } else {
                        state.agentFlashes.delete(ra.agent.id);
                    }
                }

                // Tier 3 or User Glow
                if (ra.tier === 2 || ra.isUser) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    ctx.globalAlpha = ra.isUser ? 0.5 : 0.2;
                    ctx.fillStyle = ra.isUser ? '#FFD700' : (ra.isLong ? COLOR_LONG : COLOR_SHORT);
                    ctx.beginPath();
                    ctx.arc(x, finalY, ra.isUser ? 18 : 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                const sprite = ra.isLong ? spritesRef.current.long[ra.tier] : spritesRef.current.short[ra.tier];
                ctx.drawImage(sprite, Math.floor(x - offset), Math.floor(finalY - offset), drawSize, drawSize);

                if (ra.isUser) {
                    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x - 10, finalY - 18); ctx.lineTo(x + 10, finalY - 18); ctx.lineTo(x, finalY - 10); ctx.closePath();
                    ctx.stroke();
                }
            }
        }

        // 4. Effects (Batched)
        // Beams
        const activeBeams = state.beams.filter(b => b.active);
        if (activeBeams.length > 0) {
            ctx.save();
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            for (const b of activeBeams) {
                ctx.strokeStyle = b.color;
                ctx.beginPath();
                ctx.moveTo(b.startX, b.startY); ctx.lineTo(b.endX, b.endY);
                ctx.stroke();
                b.life -= 0.1;
                if (b.life <= 0) b.active = false;
            }
            ctx.restore();
        }

        // Particles
        const activeParticles = state.particles.filter(p => p.active);
        if (activeParticles.length > 0) {
             for (const p of activeParticles) {
                 ctx.fillStyle = p.color;
                 ctx.globalAlpha = p.life;
                 ctx.beginPath();
                 ctx.rect(p.x, p.y, p.size, p.size);
                 ctx.fill();
                 p.x += p.vx; p.y += p.vy;
                 p.life -= 0.05;
                 if (p.life <= 0) p.active = false;
             }
             ctx.globalAlpha = 1.0;
        }

        // Text
        const activeTexts = state.floatingTexts.filter(t => t.active);
        if (activeTexts.length > 0) {
            ctx.save();
            ctx.textAlign = 'center';
            for (const t of activeTexts) {
                const scale = t.life > 0.9 ? 1 + (1 - t.life) * 5 : 1;
                ctx.font = `900 ${Math.floor(36 * scale)}px Orbitron`;
                ctx.fillStyle = t.color;
                ctx.fillText(t.text, t.x, t.y);
                
                ctx.font = '700 12px Rajdhani';
                ctx.fillStyle = '#fff';
                ctx.fillText(t.subText, t.x, t.y + 20);

                t.y -= 1;
                t.life -= 0.01;
                if (t.life <= 0) t.active = false;
            }
            ctx.restore();
        }

        frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [agents]); 

  return (
    <div className="relative w-full h-[300px] lg:h-[500px] rounded-2xl overflow-hidden border border-[#836EF9]/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#020203]">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full h-full object-cover" />
        
        {/* HUD Overlay Top */}
        <div className="absolute top-0 left-0 w-full p-4 lg:p-6 flex flex-col justify-between pointer-events-none">
             <div className="flex justify-between items-start">
                 <div className="bg-black/40 backdrop-blur-sm border-l-2 border-[#00FF9D] pl-3 py-1">
                     <div className="text-[#00FF9D] text-xs font-bold tracking-widest">{t('alliance')}</div>
                     <div className="text-white font-mono text-xl">{agents.filter(a => a.direction === 'LONG' && a.status === 'ACTIVE').length} {t('units')}</div>
                 </div>
                 <div className="bg-black/40 backdrop-blur-sm border-r-2 border-[#FF0055] pr-3 py-1 text-right">
                     <div className="text-[#FF0055] text-xs font-bold tracking-widest">{t('syndicate')}</div>
                     <div className="text-white font-mono text-xl">{agents.filter(a => a.direction === 'SHORT' && a.status === 'ACTIVE').length} {t('units')}</div>
                 </div>
             </div>
        </div>
    </div>
  );
};