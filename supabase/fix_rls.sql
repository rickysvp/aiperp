-- Fix RLS policies for anonymous access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Agents are readable by all" ON agents;
DROP POLICY IF EXISTS "Users can create own agents" ON agents;
DROP POLICY IF EXISTS "Users can update own agents" ON agents;
DROP POLICY IF EXISTS "PnL history readable by all" ON agent_pnl_history;
DROP POLICY IF EXISTS "Users can read own stakes" ON user_liquidity_stakes;
DROP POLICY IF EXISTS "Users can read own logs" ON battle_logs;

-- Enable anonymous access to users table
CREATE POLICY "Allow anonymous read users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update users" ON users
    FOR UPDATE USING (true);

-- Enable anonymous access to agents table
CREATE POLICY "Allow anonymous read agents" ON agents
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert agents" ON agents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update agents" ON agents
    FOR UPDATE USING (true);

-- Enable anonymous access to agent_pnl_history table
CREATE POLICY "Allow anonymous read pnl history" ON agent_pnl_history
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert pnl history" ON agent_pnl_history
    FOR INSERT WITH CHECK (true);

-- Enable anonymous access to user_liquidity_stakes table
CREATE POLICY "Allow anonymous read stakes" ON user_liquidity_stakes
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert stakes" ON user_liquidity_stakes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update stakes" ON user_liquidity_stakes
    FOR UPDATE USING (true);

-- Enable anonymous access to battle_logs table
CREATE POLICY "Allow anonymous read logs" ON battle_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert logs" ON battle_logs
    FOR INSERT WITH CHECK (true);

-- Enable anonymous access to loot_events table
DROP POLICY IF EXISTS "Allow anonymous read loot" ON loot_events;
DROP POLICY IF EXISTS "Allow anonymous insert loot" ON loot_events;

CREATE POLICY "Allow anonymous read loot" ON loot_events
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert loot" ON loot_events
    FOR INSERT WITH CHECK (true);

-- Enable anonymous access to market_data table
DROP POLICY IF EXISTS "Allow anonymous read market" ON market_data;
DROP POLICY IF EXISTS "Allow anonymous update market" ON market_data;

CREATE POLICY "Allow anonymous read market" ON market_data
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous update market" ON market_data
    FOR UPDATE USING (true);

-- Enable anonymous access to market_price_history table
DROP POLICY IF EXISTS "Allow anonymous read price history" ON market_price_history;
DROP POLICY IF EXISTS "Allow anonymous insert price history" ON market_price_history;

CREATE POLICY "Allow anonymous read price history" ON market_price_history
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert price history" ON market_price_history
    FOR INSERT WITH CHECK (true);

-- Enable anonymous access to liquidity_pools table
DROP POLICY IF EXISTS "Allow anonymous read pools" ON liquidity_pools;
DROP POLICY IF EXISTS "Allow anonymous update pools" ON liquidity_pools;

CREATE POLICY "Allow anonymous read pools" ON liquidity_pools
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous update pools" ON liquidity_pools
    FOR UPDATE USING (true);
