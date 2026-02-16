-- Initialize default liquidity pools
-- This should be run once after creating the tables

INSERT INTO liquidity_pools (
    pool_id,
    total_staked,
    total_rewards,
    apr,
    fee_share,
    daily_volume
)
VALUES ('mon-lp-1', 0, 0, 100, 0.7, 0)
ON CONFLICT (pool_id) DO NOTHING;

-- Verify the pool exists
SELECT * FROM liquidity_pools;
