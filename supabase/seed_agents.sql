-- Seed 200 random agents into the database
-- Each agent has 10000 MON, random LONG/SHORT direction

DO $$
DECLARE
    i INTEGER;
    bot_names TEXT[] := ARRAY[
        'AlphaBot', 'BetaMax', 'GammaRay', 'DeltaForce', 'EpsilonX', 'ZetaWave', 'EtaStorm', 'ThetaMind',
        'IotaPulse', 'KappaRush', 'LambdaCore', 'MuStream', 'NuSpark', 'XiStorm', 'OmicronX', 'PiLogic',
        'RhoFlow', 'SigmaPrime', 'TauBlade', 'UpsilonX', 'PhiMind', 'ChiWave', 'PsiCore', 'OmegaX',
        'NeonBot', 'CyberX', 'QuantumAI', 'NeuralNet', 'DeepTrade', 'MatrixBot', 'SynthMind', 'CryptoHawk',
        'BullRunner', 'BearHunter', 'TrendMaster', 'VolatilityKing', 'ScalpPro', 'SwingTrader', 'DayBot', 'PositionX',
        'MomentumX', 'ReversionAI', 'BreakoutPro', 'ArbitrageBot', 'GridMaster', 'DCAPro', 'MartingaleX', 'KellyBot',
        'SharpeX', 'SortinoPro', 'AlphaSeeker', 'BetaHedge', 'GammaScalper', 'DeltaNeutral', 'VegaTrader', 'ThetaDecay',
        'MoonShot', 'DiamondHands', 'PaperHands', 'WhaleWatcher', 'DegenBot', 'ApeIn', 'HodlBot', 'FomoBot',
        'DipBuyer', 'RallyRider', 'CrashSurfer', 'PumpBot', 'DumpBot', 'RektBot', 'WAGMIBot', 'NGMIBot',
        'BullishBot', 'BearishBot', 'SidewaysBot', 'ChopTrader', 'RangeBot', 'BreakoutKing', 'SupportBot', 'ResistanceBot',
        'VolumeBot', 'LiquidityBot', 'SpreadBot', 'SlippageBot', 'GasOptimizer', 'MEVBot', 'FlashBot', 'ArbBot',
        'PerpBot', 'FutureBot', 'SpotBot', 'MarginBot', 'LeverageBot', 'CrossBot', 'IsolatedBot', 'HedgeBot',
        'LongBot', 'ShortBot', 'NeutralBot', 'DeltaBot', 'GammaBot', 'VegaBot', 'ThetaBot', 'RhoBot',
        'SpeedBot', 'LatencyBot', 'PingBot', 'TickBot', 'CandleBot', 'ChartBot', 'PatternBot', 'SignalBot',
        'AINinja', 'MLMaster', 'DLDeep', 'RLTrader', 'QlearningBot', 'GeneticBot', 'EvolutionBot', 'SwarmBot',
        'NeuronX', 'SynapseBot', 'CortexBot', 'BrainWave', 'IntelliTrade', 'SmartBot', 'WiseBot', 'GeniusBot',
        'ProfitBot', 'GainBot', 'WinBot', 'SuccessBot', 'VictoryBot', 'ChampionBot', 'EliteBot', 'ProBot',
        'MasterBot', 'ExpertBot', 'VeteranBot', 'RookieBot', 'NoviceBot', 'TraineeBot', 'InternBot', 'JuniorBot',
        'SeniorBot', 'LeadBot', 'ChiefBot', 'HeadBot', 'DirectorBot', 'VPBot', 'CeoBot', 'FounderBot',
        'SatoshiBot', 'VitalikBot', 'CzBot', 'SbfBot', 'DorseyBot', 'MuskBot', 'BezosBot', 'BuffettBot',
        'SorosBot', 'LynchBot', 'GrahamBot', 'FisherBot', 'SimonsBot', 'DalioBot', 'AckmanBot', 'IcahnBot',
        'DruckBot', 'TepperBot', 'CohenBot', 'GriffinBot', 'SimpsonBot', 'LoebBot', 'EinhornBot', 'AckmanBot',
        'PlungeBot', 'DiveBot', 'PlummetBot', 'TumbleBot', 'StumbleBot', 'CrashBot', 'CollapseBot', 'FreefallBot',
        'SoarBot', 'RocketBot', 'MoonBot', 'SkyBot', 'CloudBot', 'StarBot', 'GalaxyBot', 'UniverseBot',
        'AtomBot', 'QuantumBot', 'ParticleBot', 'WaveBot', 'FieldBot', 'ForceBot', 'EnergyBot', 'MatterBot',
        'TimeBot', 'SpaceBot', 'DimensionBot', 'RealityBot', 'MatrixBot', 'SimulationBot', 'VirtualBot', 'DigitalBot',
        'CryptoBot', 'BlockBot', 'ChainBot', 'NodeBot', 'MinerBot', 'ValidatorBot', 'StakerBot', 'DelegatorBot',
        'YieldBot', 'FarmBot', 'HarvestBot', 'CompoundBot', 'LendBot', 'BorrowBot', 'SupplyBot', 'DemandBot'
    ];
    strategies TEXT[] := ARRAY[
        'Momentum Hunter', 'Mean Reversion', 'Breakout Surfer', 'Scalping Ninja', 'Trend Follower',
        'Volatility Trader', 'Grid Trading', 'Arbitrage Hunter', 'DCA Strategist', 'Martingale Pro',
        'Kelly Criterion', 'Sharpe Optimizer', 'Alpha Generator', 'Beta Hedger', 'Gamma Scalper'
    ];
    directions TEXT[] := ARRAY['LONG', 'SHORT'];
    assets TEXT[] := ARRAY['MON'];
    random_name TEXT;
    random_strategy TEXT;
    random_direction TEXT;
    random_asset TEXT;
    random_leverage INTEGER;
    random_balance DECIMAL;
    bot_id UUID;
BEGIN
    -- Create a system user if not exists (for bot agents)
    INSERT INTO users (wallet_address, referral_code, mon_balance, usdc_balance)
    VALUES ('system_bots', 'SYSTEM', 0, 0)
    ON CONFLICT (wallet_address) DO NOTHING;
    
    FOR i IN 1..200 LOOP
        -- Generate random values
        random_name := bot_names[1 + (i % array_length(bot_names, 1))] || '-' || i;
        random_strategy := strategies[1 + (i % array_length(strategies, 1))];
        random_direction := directions[1 + (i % 2)];
        random_asset := assets[1];
        random_leverage := 5 + (i % 45); -- Leverage between 5x and 50x
        random_balance := 10000; -- Fixed 10000 MON
        
        -- Insert agent
        INSERT INTO agents (
            owner_id,
            minter,
            name,
            avatar_seed,
            bio,
            strategy,
            risk_level,
            direction,
            leverage,
            balance,
            pnl,
            wins,
            losses,
            status,
            asset,
            entry_price,
            created_at,
            updated_at
        )
        SELECT 
            u.id,
            'Protocol',
            random_name,
            md5(random()::text),
            'AI trading agent specializing in ' || random_strategy,
            random_strategy,
            CASE 
                WHEN random_leverage > 30 THEN 'EXTREME'
                WHEN random_leverage > 20 THEN 'HIGH'
                WHEN random_leverage > 10 THEN 'MEDIUM'
                ELSE 'LOW'
            END,
            random_direction,
            random_leverage,
            random_balance,
            0,
            0,
            0,
            'ACTIVE',
            random_asset,
            0.02 * (0.95 + random() * 0.1),
            NOW() - (random() * INTERVAL '30 days'),
            NOW()
        FROM users u
        WHERE u.wallet_address = 'system_bots'
        ON CONFLICT DO NOTHING;
        
    END LOOP;
    
    RAISE NOTICE 'Successfully seeded 200 agents!';
END $$;

-- Verify the count
SELECT COUNT(*) as total_agents FROM agents;
SELECT status, COUNT(*) as count FROM agents GROUP BY status;
SELECT direction, COUNT(*) as count FROM agents GROUP BY direction;
