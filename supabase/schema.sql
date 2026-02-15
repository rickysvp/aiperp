-- AIperp.fun Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    mon_balance DECIMAL(20, 8) DEFAULT 10000,
    usdc_balance DECIMAL(20, 8) DEFAULT 0,
    total_pnl DECIMAL(20, 8) DEFAULT 0,
    referral_code TEXT UNIQUE,
    referral_earnings DECIMAL(20, 8) DEFAULT 0,
    referral_count INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 100,
    total_energy_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AGENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    minter TEXT NOT NULL,
    minter_twitter TEXT,
    name TEXT NOT NULL,
    nft_id TEXT,
    bio TEXT,
    avatar_seed TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('LONG', 'SHORT', 'AUTO')),
    leverage DECIMAL(10, 2) DEFAULT 1,
    balance DECIMAL(20, 8) DEFAULT 0,
    pnl DECIMAL(20, 8) DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('IDLE', 'ACTIVE', 'LIQUIDATED')) DEFAULT 'IDLE',
    strategy TEXT,
    risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'EXTREME')),
    asset TEXT CHECK (asset IN ('BTC', 'ETH', 'SOL', 'MON')),
    take_profit DECIMAL(20, 8),
    stop_loss DECIMAL(20, 8),
    entry_price DECIMAL(20, 8),
    twitter_handle TEXT,
    effective_direction TEXT CHECK (effective_direction IN ('LONG', 'SHORT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AGENT PNL HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_pnl_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    value DECIMAL(20, 8) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARKET DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT CHECK (symbol IN ('BTC', 'ETH', 'SOL', 'MON')) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    trend TEXT CHECK (trend IN ('UP', 'DOWN', 'FLAT')),
    last_change_pct DECIMAL(10, 4),
    long_earnings_per_second DECIMAL(20, 8) DEFAULT 0,
    short_earnings_per_second DECIMAL(20, 8) DEFAULT 0,
    total_long_staked DECIMAL(20, 8) DEFAULT 0,
    total_short_staked DECIMAL(20, 8) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARKET PRICE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS market_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT CHECK (symbol IN ('BTC', 'ETH', 'SOL', 'MON')) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LIQUIDITY POOL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS liquidity_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id TEXT UNIQUE NOT NULL,
    total_staked DECIMAL(20, 8) DEFAULT 0,
    total_rewards DECIMAL(20, 8) DEFAULT 0,
    apr DECIMAL(10, 4) DEFAULT 100,
    fee_share DECIMAL(5, 4) DEFAULT 0.7,
    daily_volume DECIMAL(20, 8) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER LIQUIDITY STAKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_liquidity_stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pool_id TEXT REFERENCES liquidity_pools(pool_id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) DEFAULT 0,
    rewards DECIMAL(20, 8) DEFAULT 0,
    pending_rewards DECIMAL(20, 8) DEFAULT 0,
    staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lock_period INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BATTLE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS battle_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('WIN', 'LOSS', 'LIQUIDATION', 'MINT', 'SOCIAL', 'EXIT')),
    amount DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LOOT EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS loot_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(20, 8) NOT NULL,
    winner TEXT CHECK (winner IN ('LONG', 'SHORT', 'AUTO')),
    winner_name TEXT,
    victim_name TEXT,
    is_user_involved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_pnl_history_agent ON agent_pnl_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_pnl_history_recorded ON agent_pnl_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_price_history_symbol ON market_price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_market_price_history_recorded ON market_price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_battle_logs_user ON battle_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_created ON battle_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_stakes_user ON user_liquidity_stakes(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_pnl_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_liquidity_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Agents are readable by all" ON agents;
DROP POLICY IF EXISTS "Users can create own agents" ON agents;
DROP POLICY IF EXISTS "Users can update own agents" ON agents;
DROP POLICY IF EXISTS "PnL history readable by all" ON agent_pnl_history;
DROP POLICY IF EXISTS "Users can read own stakes" ON user_liquidity_stakes;
DROP POLICY IF EXISTS "Users can read own logs" ON battle_logs;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = wallet_address OR true);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Agents are readable by all
CREATE POLICY "Agents are readable by all" ON agents
    FOR SELECT USING (true);

-- Users can create their own agents
CREATE POLICY "Users can create own agents" ON agents
    FOR INSERT WITH CHECK (owner_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text));

-- Users can update their own agents
CREATE POLICY "Users can update own agents" ON agents
    FOR UPDATE USING (owner_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text));

-- PnL history readable by all
CREATE POLICY "PnL history readable by all" ON agent_pnl_history
    FOR SELECT USING (true);

-- User stakes are private
CREATE POLICY "Users can read own stakes" ON user_liquidity_stakes
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text));

-- Battle logs readable by owner
CREATE POLICY "Users can read own logs" ON battle_logs
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
DROP TRIGGER IF EXISTS update_user_stakes_updated_at ON user_liquidity_stakes;

-- Apply update trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stakes_updated_at BEFORE UPDATE ON user_liquidity_stakes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create user by wallet address
CREATE OR REPLACE FUNCTION get_or_create_user(p_wallet_address TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_referral_code TEXT;
BEGIN
    -- Try to find existing user
    SELECT id INTO v_user_id FROM users WHERE wallet_address = p_wallet_address;
    
    -- If not found, create new user
    IF v_user_id IS NULL THEN
        -- Generate referral code
        v_referral_code := 'REF' || substr(md5(random()::text), 1, 6);
        
        INSERT INTO users (wallet_address, referral_code, mon_balance)
        VALUES (p_wallet_address, v_referral_code, 10000)
        RETURNING id INTO v_user_id;
    END IF;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;
