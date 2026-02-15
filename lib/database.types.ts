export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          mon_balance: number
          usdc_balance: number
          total_pnl: number
          referral_code: string | null
          referral_earnings: number
          referral_count: number
          energy: number
          total_energy_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          mon_balance?: number
          usdc_balance?: number
          total_pnl?: number
          referral_code?: string | null
          referral_earnings?: number
          referral_count?: number
          energy?: number
          total_energy_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          mon_balance?: number
          usdc_balance?: number
          total_pnl?: number
          referral_code?: string | null
          referral_earnings?: number
          referral_count?: number
          energy?: number
          total_energy_earned?: number
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          owner_id: string
          minter: string
          minter_twitter: string | null
          name: string
          nft_id: string | null
          bio: string | null
          avatar_seed: string
          direction: 'LONG' | 'SHORT' | 'AUTO' | null
          leverage: number
          balance: number
          pnl: number
          wins: number
          losses: number
          status: 'IDLE' | 'ACTIVE' | 'LIQUIDATED'
          strategy: string | null
          risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' | null
          asset: 'BTC' | 'ETH' | 'SOL' | 'MON' | null
          take_profit: number | null
          stop_loss: number | null
          entry_price: number | null
          twitter_handle: string | null
          effective_direction: 'LONG' | 'SHORT' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          minter: string
          minter_twitter?: string | null
          name: string
          nft_id?: string | null
          bio?: string | null
          avatar_seed: string
          direction?: 'LONG' | 'SHORT' | 'AUTO' | null
          leverage?: number
          balance?: number
          pnl?: number
          wins?: number
          losses?: number
          status?: 'IDLE' | 'ACTIVE' | 'LIQUIDATED'
          strategy?: string | null
          risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' | null
          asset?: 'BTC' | 'ETH' | 'SOL' | 'MON' | null
          take_profit?: number | null
          stop_loss?: number | null
          entry_price?: number | null
          twitter_handle?: string | null
          effective_direction?: 'LONG' | 'SHORT' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          minter?: string
          minter_twitter?: string | null
          name?: string
          nft_id?: string | null
          bio?: string | null
          avatar_seed?: string
          direction?: 'LONG' | 'SHORT' | 'AUTO' | null
          leverage?: number
          balance?: number
          pnl?: number
          wins?: number
          losses?: number
          status?: 'IDLE' | 'ACTIVE' | 'LIQUIDATED'
          strategy?: string | null
          risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' | null
          asset?: 'BTC' | 'ETH' | 'SOL' | 'MON' | null
          take_profit?: number | null
          stop_loss?: number | null
          entry_price?: number | null
          twitter_handle?: string | null
          effective_direction?: 'LONG' | 'SHORT' | null
          created_at?: string
          updated_at?: string
        }
      }
      agent_pnl_history: {
        Row: {
          id: string
          agent_id: string
          value: number
          recorded_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          value: number
          recorded_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          value?: number
          recorded_at?: string
        }
      }
      market_data: {
        Row: {
          id: string
          symbol: 'BTC' | 'ETH' | 'SOL' | 'MON'
          price: number
          trend: 'UP' | 'DOWN' | 'FLAT' | null
          last_change_pct: number | null
          long_earnings_per_second: number
          short_earnings_per_second: number
          total_long_staked: number
          total_short_staked: number
          updated_at: string
        }
        Insert: {
          id?: string
          symbol: 'BTC' | 'ETH' | 'SOL' | 'MON'
          price: number
          trend?: 'UP' | 'DOWN' | 'FLAT' | null
          last_change_pct?: number | null
          long_earnings_per_second?: number
          short_earnings_per_second?: number
          total_long_staked?: number
          total_short_staked?: number
          updated_at?: string
        }
        Update: {
          id?: string
          symbol?: 'BTC' | 'ETH' | 'SOL' | 'MON'
          price?: number
          trend?: 'UP' | 'DOWN' | 'FLAT' | null
          last_change_pct?: number | null
          long_earnings_per_second?: number
          short_earnings_per_second?: number
          total_long_staked?: number
          total_short_staked?: number
          updated_at?: string
        }
      }
      market_price_history: {
        Row: {
          id: string
          symbol: 'BTC' | 'ETH' | 'SOL' | 'MON'
          price: number
          recorded_at: string
        }
        Insert: {
          id?: string
          symbol: 'BTC' | 'ETH' | 'SOL' | 'MON'
          price: number
          recorded_at?: string
        }
        Update: {
          id?: string
          symbol?: 'BTC' | 'ETH' | 'SOL' | 'MON'
          price?: number
          recorded_at?: string
        }
      }
      liquidity_pools: {
        Row: {
          id: string
          pool_id: string
          total_staked: number
          total_rewards: number
          apr: number
          fee_share: number
          daily_volume: number
          updated_at: string
        }
        Insert: {
          id?: string
          pool_id: string
          total_staked?: number
          total_rewards?: number
          apr?: number
          fee_share?: number
          daily_volume?: number
          updated_at?: string
        }
        Update: {
          id?: string
          pool_id?: string
          total_staked?: number
          total_rewards?: number
          apr?: number
          fee_share?: number
          daily_volume?: number
          updated_at?: string
        }
      }
      user_liquidity_stakes: {
        Row: {
          id: string
          user_id: string
          pool_id: string
          amount: number
          rewards: number
          pending_rewards: number
          staked_at: string
          lock_period: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pool_id: string
          amount?: number
          rewards?: number
          pending_rewards?: number
          staked_at?: string
          lock_period?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pool_id?: string
          amount?: number
          rewards?: number
          pending_rewards?: number
          staked_at?: string
          lock_period?: number
          created_at?: string
          updated_at?: string
        }
      }
      battle_logs: {
        Row: {
          id: string
          user_id: string
          message: string
          type: 'WIN' | 'LOSS' | 'LIQUIDATION' | 'MINT' | 'SOCIAL' | 'EXIT'
          amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: 'WIN' | 'LOSS' | 'LIQUIDATION' | 'MINT' | 'SOCIAL' | 'EXIT'
          amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: 'WIN' | 'LOSS' | 'LIQUIDATION' | 'MINT' | 'SOCIAL' | 'EXIT'
          amount?: number | null
          created_at?: string
        }
      }
      loot_events: {
        Row: {
          id: string
          amount: number
          winner: 'LONG' | 'SHORT' | 'AUTO'
          winner_name: string | null
          victim_name: string | null
          is_user_involved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          winner: 'LONG' | 'SHORT' | 'AUTO'
          winner_name?: string | null
          victim_name?: string | null
          is_user_involved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          amount?: number
          winner?: 'LONG' | 'SHORT' | 'AUTO'
          winner_name?: string | null
          victim_name?: string | null
          is_user_involved?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      get_or_create_user: {
        Args: { p_wallet_address: string }
        Returns: string
      }
    }
  }
}
