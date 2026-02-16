import { useState, useEffect, useCallback, useRef } from 'react';
import { Agent, AgentOwner, Direction, AssetSymbol } from '../types';
import {
  getAllAgents,
  getAgentsByOwner,
  createAgent,
  deployAgent,
  withdrawAgent,
  liquidateAgent,
  updateAgentPnL,
  recordAgentPnLHistory,
  batchUpdateAgentsPnL,
  batchRecordPnLHistory,
  updateAgent
} from '../lib/api/agents';
import { isSupabaseConfigured } from '../lib/supabase';

// 转换数据库 Agent 格式为应用格式
function transformDbAgent(dbAgent: any, userId: string | null): Agent {
  return {
    id: dbAgent.id,
    owner: (dbAgent.owner_id === userId ? 'USER' : 'SYSTEM') as AgentOwner,
    minter: dbAgent.minter,
    minterTwitter: dbAgent.minter_twitter || undefined,
    name: dbAgent.name,
    nftId: dbAgent.nft_id || undefined,
    bio: dbAgent.bio || '',
    avatarSeed: dbAgent.avatar_seed,
    direction: (dbAgent.direction || 'LONG') as Direction,
    leverage: dbAgent.leverage,
    balance: dbAgent.balance,
    pnl: dbAgent.pnl,
    wins: dbAgent.wins,
    losses: dbAgent.losses,
    status: dbAgent.status,
    strategy: dbAgent.strategy || '',
    riskLevel: (dbAgent.risk_level || 'MEDIUM') as Agent['riskLevel'],
    asset: (dbAgent.asset || 'MON') as AssetSymbol,
    takeProfit: dbAgent.take_profit || undefined,
    stopLoss: dbAgent.stop_loss || undefined,
    entryPrice: dbAgent.entry_price || 0,
    twitterHandle: dbAgent.twitter_handle || undefined,
    effectiveDirection: dbAgent.effective_direction || undefined,
    pnlHistory: []
  };
}

export function useSupabaseAgents(userId: string | null) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const pendingUpdatesRef = useRef<Array<{ id: string; pnl: number; status?: string; balance?: number }>>([]);
  const pendingPnLHistoryRef = useRef<Array<{ agentId: string; value: number }>>([]);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载 agents 从 Supabase
  const loadAgents = useCallback(async (force = false) => {
    if (!isSupabaseConfigured()) return;
    
    const now = Date.now();
    if (!force && now - lastSyncTime < 2000) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getAllAgents();
      if (data) {
        const transformedAgents: Agent[] = data.map(dbAgent => 
          transformDbAgent(dbAgent, userId)
        );
        setAgents(transformedAgents);
        setLastSyncTime(now);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, [userId, lastSyncTime]);

  // 批量同步待处理的更新
  const flushPendingUpdates = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    
    const updates = [...pendingUpdatesRef.current];
    const pnlHistory = [...pendingPnLHistoryRef.current];
    
    if (updates.length === 0 && pnlHistory.length === 0) return;
    
    pendingUpdatesRef.current = [];
    pendingPnLHistoryRef.current = [];
    
    try {
      if (updates.length > 0) {
        await batchUpdateAgentsPnL(updates);
      }
      if (pnlHistory.length > 0) {
        await batchRecordPnLHistory(pnlHistory);
      }
    } catch (err) {
      console.error('Error flushing pending updates:', err);
      pendingUpdatesRef.current = [...updates, ...pendingUpdatesRef.current];
      pendingPnLHistoryRef.current = [...pnlHistory, ...pendingPnLHistoryRef.current];
    }
  }, []);

  // 添加待处理的 PnL 更新
  const addPendingPnLUpdate = useCallback((agentId: string, pnl: number, status?: string, balance?: number) => {
    pendingUpdatesRef.current.push({ id: agentId, pnl, status, balance });
  }, []);

  // 添加待处理的 PnL 历史记录
  const addPendingPnLHistory = useCallback((agentId: string, value: number) => {
    pendingPnLHistoryRef.current.push({ agentId, value });
  }, []);

  // 初始加载和轮询
  useEffect(() => {
    loadAgents(true);
    
    const interval = setInterval(loadAgents, 5000);
    const syncInterval = setInterval(flushPendingUpdates, 2000);
    
    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [loadAgents, flushPendingUpdates]);

  // 创建新 Agent
  const handleCreateAgent = useCallback(async (agentData: Partial<Agent>) => {
    if (!userId || !isSupabaseConfigured()) return null;
    
    try {
      const newAgent = await createAgent({
        owner_id: userId,
        minter: agentData.minter || userId,
        name: agentData.name!,
        avatar_seed: agentData.avatarSeed!,
        bio: agentData.bio,
        strategy: agentData.strategy,
        risk_level: agentData.riskLevel,
        twitter_handle: agentData.twitterHandle,
        direction: 'LONG',
        leverage: 1,
        balance: 0,
        pnl: 0,
        wins: 0,
        losses: 0,
        status: 'IDLE'
      });
      
      if (newAgent) {
        await loadAgents(true);
        return newAgent.id;
      }
    } catch (err) {
      console.error('Error creating agent:', err);
    }
    return null;
  }, [userId, loadAgents]);

  // 部署 Agent
  const handleDeployAgent = useCallback(async (
    agentId: string,
    direction: string,
    leverage: number,
    collateral: number,
    takeProfit?: number,
    stopLoss?: number,
    asset?: string
  ) => {
    if (!isSupabaseConfigured()) return false;
    
    try {
      const entryPrice = 100;
      const updated = await deployAgent(
        agentId,
        collateral,
        asset || 'MON',
        direction,
        leverage,
        entryPrice,
        takeProfit,
        stopLoss
      );
      
      if (updated) {
        await loadAgents(true);
        return true;
      }
    } catch (err) {
      console.error('Error deploying agent:', err);
    }
    return false;
  }, [loadAgents]);

  // 提现 Agent
  const handleWithdrawAgent = useCallback(async (agentId: string) => {
    if (!isSupabaseConfigured()) return { success: false, finalBalance: 0 };
    
    try {
      const result = await withdrawAgent(agentId);
      if (result.agent) {
        await loadAgents(true);
        return { success: true, finalBalance: result.finalBalance };
      }
    } catch (err) {
      console.error('Error withdrawing agent:', err);
    }
    return { success: false, finalBalance: 0 };
  }, [loadAgents]);

  // 更新单个 Agent PnL
  const handleUpdatePnL = useCallback(async (agentId: string, pnl: number) => {
    if (!isSupabaseConfigured()) return;
    
    try {
      await updateAgentPnL(agentId, pnl);
      
      if (Math.random() < 0.1) {
        await recordAgentPnLHistory(agentId, pnl);
      }
    } catch (err) {
      console.error('Error updating PnL:', err);
    }
  }, []);

  // 清算 Agent
  const handleLiquidateAgent = useCallback(async (agentId: string) => {
    if (!isSupabaseConfigured()) return false;
    
    try {
      const updated = await liquidateAgent(agentId);
      if (updated) {
        await loadAgents(true);
        return true;
      }
    } catch (err) {
      console.error('Error liquidating agent:', err);
    }
    return false;
  }, [loadAgents]);

  // 批量更新多个 Agents（用于游戏循环）
  const handleBatchUpdateAgents = useCallback(async (updates: Array<{ id: string; pnl: number; status?: string; balance?: number; pnlHistory?: number }>) => {
    setAgents(prev => prev.map(agent => {
      const update = updates.find(u => u.id === agent.id);
      if (!update) return agent;
      return {
        ...agent,
        pnl: update.pnl,
        status: update.status || agent.status,
        balance: update.balance !== undefined ? update.balance : agent.balance
      };
    }));

    for (const update of updates) {
      addPendingPnLUpdate(update.id, update.pnl, update.status, update.balance);
      if (update.pnlHistory !== undefined) {
        addPendingPnLHistory(update.id, update.pnlHistory);
      }
    }
  }, [addPendingPnLUpdate, addPendingPnLHistory]);

  // 本地添加 Agent（用于游戏生成的 bot，不保存到数据库）
  const handleAddLocalAgent = useCallback((agent: Agent) => {
    setAgents(prev => [...prev, agent]);
  }, []);

  // 本地更新多个 Agents（用于游戏循环中的 bot）
  const handleUpdateLocalAgents = useCallback((updater: (agents: Agent[]) => Agent[]) => {
    setAgents(prev => updater(prev));
  }, []);

  return {
    agents,
    isLoading,
    error,
    loadAgents,
    createAgent: handleCreateAgent,
    deployAgent: handleDeployAgent,
    withdrawAgent: handleWithdrawAgent,
    liquidateAgent: handleLiquidateAgent,
    updateAgentPnL: handleUpdatePnL,
    batchUpdateAgents: handleBatchUpdateAgents,
    addLocalAgent: handleAddLocalAgent,
    updateLocalAgents: handleUpdateLocalAgents,
    flushPendingUpdates
  };
}
