// Debug script to check liquidity pool data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fknrkbmeyfzntgouvmfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbnJrYm1leWZ6bnRnb3V2bWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NzgxMjUsImV4cCI6MjA1NDQ1NDEyNX0.1__4Ib9gXHqwd4iUQY0DJP8Q8h8xvs5iRlnYMVHhRsk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPool() {
  console.log('Checking liquidity pool data...\n');
  
  // Check liquidity_pools table
  const { data: pool, error: poolError } = await supabase
    .from('liquidity_pools')
    .select('*')
    .eq('pool_id', 'mon-lp-1')
    .single();
  
  if (poolError) {
    console.error('Error fetching pool:', poolError);
  } else {
    console.log('Liquidity Pool (mon-lp-1):');
    console.log('  total_staked:', pool?.total_staked);
    console.log('  total_rewards:', pool?.total_rewards);
    console.log('  apr:', pool?.apr);
    console.log('  fee_share:', pool?.fee_share);
    console.log('  daily_volume:', pool?.daily_volume);
    console.log('');
  }
  
  // Check user_liquidity_stakes
  const { data: stakes, error: stakesError } = await supabase
    .from('user_liquidity_stakes')
    .select('*')
    .eq('pool_id', 'mon-lp-1');
  
  if (stakesError) {
    console.error('Error fetching stakes:', stakesError);
  } else {
    console.log('User Stakes for mon-lp-1:', stakes?.length || 0, 'records');
    stakes?.forEach((stake, i) => {
      console.log(`  [${i + 1}] User: ${stake.user_id?.substring(0, 8)}...`);
      console.log(`      Amount: ${stake.amount}`);
      console.log(`      Rewards: ${stake.rewards}`);
      console.log(`      Pending: ${stake.pending_rewards}`);
    });
  }
}

checkPool();
