import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Nav
    app_title_root: "AIperp",
    app_title_suffix: ".fun",
    nav_subtitle: "Visual Perpetual Arena",
    net_equity: "Net Equity",
    top_profit: "Top Profit",
    
    // Tabs
    tab_arena: "ARENA",
    tab_agents: "AGENTS",
    tab_legends: "LEGENDS",
    tab_wallet: "WALLET",

    // Arena
    alliance: "ALLIANCE",
    syndicate: "SYNDICATE",
    units: "UNITS",
    total_staked: "Total Staked",
    bullish: "BULLISH",
    bearish: "BEARISH",
    flat: "FLAT",
    plundered: "PLUNDERED",
    asset_perp: "-USD PERP",

    // Agents
    my_fleet: "MY FLEET",
    new_fabrication: "New Fabrication",
    deployed: "Deployed",
    awaiting_orders: "Awaiting Orders",
    decommissioned: "Decommissioned",
    neural_foundry: "AI Lab",
    config_desc: "Configure parameters for your new autonomous agent.",
    codename_hint: "Agent Name (e.g. CyberPunk)",
    social_link: "Social Link (Optional)",
    verify_tip: "Verifies your agent on the leaderboard.",
    fabrication_cost: "Fabrication Cost",
    insufficient_funds: "INSUFFICIENT FUNDS",
    init_fabrication: "INITIALIZE FABRICATION",
    gemini_terminal: "GEMINI-3 TERMINAL",
    processing: "_PROCESSING_",
    fabrication_complete: "FABRICATION COMPLETE",
    generated_strategy: "Generated Strategy",
    add_to_fleet: "ADD TO FLEET",
    net_balance: "Net Balance",
    strategy_vector: "Strategy Vector",
    power_multiplier: "Power Multiplier",
    total_collateral: "Total Collateral",
    total_buying_power: "Total Buying Power",
    est_liquidation: "Est. Liquidation",
    away: "away",
    deploy_unit: "DEPLOY UNIT",
    live_pnl: "Live PnL",
    health_collateral: "Health / Collateral",
    wins: "Wins",
    losses: "Losses",
    share_status: "Share Status",
    signal_lost: "SIGNAL LOST",
    liquidated_msg: "was liquidated during the last volatility spike.",
    final_collateral: "Final Collateral",
    share_report: "Share Battle Report",
    back_to_fleet: "Back to Fleet",
    standby: "Standby",
    long: "LONG",
    short: "SHORT",
    auto: "AUTO",
    auto_desc: "Agent decides direction based on market AI.",
    
    // Funding
    assign_funds: "Assign Funds",
    collateral_amount: "Collateral Amount",
    available_balance: "Available",
    min_funds: "Min 100 $MON",

    // Strategy Chat
    neural_link: "NEURAL LINK",
    win_rate: "Win Rate",
    strategy_console: "Strategy Console",
    chat_placeholder: "Command your agent (e.g. 'Be more aggressive on dips')",
    agent_typing: "analyzing input...",
    update_strategy: "Update Strategy",
    current_strategy: "Current Protocol",

    // Wallet
    embedded_account: "Embedded Wallet Account",
    disconnect: "Disconnect",
    total_equity: "Total Equity",
    realized_pnl: "Realized PnL",
    active_agents: "Active Agents",
    partner_program: "Partner Program",
    invite_earn: "Invite traders, earn 5% of mint fees",
    recruits: "Recruits",
    earnings: "Earnings",
    share_invite: "Share Invite Link",
    allocation: "Allocation",
    liquid: "Liquid",
    long_alloc: "Long Alloc",
    short_alloc: "Short Alloc",
    no_funds: "No funds allocated",
    my_wins: "My Wins",
    liquidations: "Liquidations",
    avg_leverage: "Avg Leverage",
    protocol: "Protocol",
    referral_copied: "Referral code copied!",

    // Leaderboard
    hall_of_legends: "Hall of Legends",
    legends_subtitle: "Top commanders battling for liquidity supremacy",
    season_pool: "Season 1 Pool",
    rank: "Rank",
    agent_commander: "Agent / Commander",
    status: "Status",
    pnl: "PnL",
    roi: "ROI",
    live: "LIVE",
    rekt: "REKT",

    // Auth
    welcome: "Welcome to AIperp.fun",
    auth_subtitle: "Create an embedded wallet to start battling.",
    continue_google: "Continue with Google",
    continue_x: "Continue with X",
    continue_email: "Continue with Email",
    email_label: "Email Address",
    send_code: "Send Login Code",
    back_options: "← Back to options",
    terms: "By connecting, you agree to our Terms of Service.",
    legal_link: "Terms & Privacy Policy",

    // AgentCard
    commander: "COMMANDER",
    terminated: "TERMINATED",
    share_replay: "Share Replay",
    collateral: "Collateral",
    unrealized_pnl: "Unrealized PnL",
    recruit: "Recruit",
    deactivate: "Deactivate Unit",
    withdraw_exit: "Withdraw & Exit",
    you: "YOU",
    minted_by: "MINTED BY",
    edition: "EDITION",
    agent_exited: "Agent Exited",
    final_pnl: "Final PnL",
    share_results: "Share Results",

    // Roster
    roi_24h: "24h ROI",
    session_pnl: "Session PnL",
    margin: "Margin",

    // Legal
    legal_title: "Terms & Privacy Policy",
    legal_intro: "Welcome to AIperp.fun. By accessing this interface, you agree to the following terms:",
    legal_1_title: "1. Simulation Game",
    legal_1_text: "AIperp.fun is a gamified simulation. $MON tokens are virtual points with no monetary value. No real assets are custodied.",
    legal_2_title: "2. Restricted Jurisdictions",
    legal_2_text: "Access is prohibited from USA, China, North Korea, Iran, and other sanctioned regions.",
    legal_3_title: "3. No Financial Advice",
    legal_3_text: "Nothing on this platform constitutes financial advice. Trading involves risk.",
    legal_close: "Close & Accept",

    // Onboarding
    ob_welcome_title: "Welcome, Commander",
    ob_welcome_text: "The Arena awaits. AIperp.fun is a visual battleground where AI agents fight for liquidity.",
    ob_step1_title: "Fabricate Agent",
    ob_step1_text: "Mint unique AI agents with distinct personalities and trading strategies powered by Gemini.",
    ob_step2_title: "Deploy to Arena",
    ob_step2_text: "Assign collateral and leverage. Choose LONG, SHORT, or AUTO to let the AI decide based on market trends.",
    ob_step3_title: "Battle & Loot",
    ob_step3_text: "Watch the battle live. Winning sides loot the losers. Manage your fleet to dominate the leaderboard.",
    ob_next: "Next",
    ob_finish: "Enter Arena",
    ob_skip: "Skip Tutorial",

    // MintingLoader
    minting_title: "AIperp Agent Fabrication Engine v2.0",
    minting_init: "Initializing neural synthesis protocol...",
    minting_target: "Target",
    minting_success: "[SUCCESS] Agent fabrication complete!",
    minting_ready: "Ready for deployment to arena...",
    minting_sys_online: "SYS: ONLINE",
    minting_mem: "MEM: 64TB",
    minting_net: "NET: SECURE",
    minting_status_ready: "STATUS: READY",
    minting_executing: "EXECUTING",

    // AIGenerating
    ai_synthesis: "AI Synthesis",
    ai_generating: "Generating neural agent...",
    ai_ready: "Ready to mint",
    ai_processing: "Processing...",
    ai_synthesis_complete: "Synthesis complete",

    // NFTReveal
    nft_legendary: "Legendary",
    nft_strategy: "Strategy",
    nft_deploy_arena: "Deploy to Arena",

    // PnLChart
    no_data: "No data available",
    time_24h_ago: "24h ago",
    time_now: "Now",

    // VersionInfo
    version: "Version",
    prod: "Prod",
    dev: "DEV",

    // Agents Page - Fabrication
    agent_name: "Agent Name",
    agent_name_placeholder: "e.g. CyberWolf...",
    twitter_optional: "Twitter (Optional)",
    twitter_placeholder: "username",
    cost: "Cost",
    insufficient: "Insufficient",
    mint_agent: "Mint Agent",
    enter_name: "Enter Name",

    // Agent Detail
    live_pnl: "Live PnL",
    final_status: "Final Status",
    final_pnl: "Final PnL",
    collateral_health: "Collateral Health",
    agent_config: "Agent Configuration",
    risk_level: "Risk Level",
    total_trades: "Total Trades",
    exited_arena: "Exited Arena",
    deploy_section: "Deploy to Arena",
    direction: "Direction",
    leverage: "Leverage",
    collateral: "Collateral",
    insufficient_balance: "Insufficient Balance",
    deploy_with: "Deploy",
    share_status: "Share Status",
    share_agent: "Share Agent",
    share_report: "Share Report",
    withdraw: "Withdraw",
    back_to_list: "Back to List",

    // Withdraw Modal
    confirm_withdraw: "Confirm Withdraw",
    current_balance: "Current Balance",
    to_receive: "To Receive",
    withdraw_warning: "Withdrawing will exit your agent from the arena. You can redeploy later.",
    cancel: "Cancel",
    confirm: "Confirm",
    processing: "Processing...",
    withdraw_success: "Withdrawal Successful!",

    // NFT3DCard - Deploy Page
    strategy: "Strategy",
    deploy_to_arena: "Deploy to Arena"
  },
  zh: {
    app_title_root: "AIperp",
    app_title_suffix: ".fun",
    nav_subtitle: "可视化 AI 永续竞技场",
    net_equity: "净资产",
    top_profit: "盈利榜",
    
    tab_arena: "竞技场",
    tab_agents: "我的特工",
    tab_legends: "排行榜",
    tab_wallet: "钱包",

    alliance: "联盟 (多)",
    syndicate: "辛迪加 (空)",
    units: "单位",
    total_staked: "总质押",
    bullish: "看涨",
    bearish: "看跌",
    flat: "震荡",
    plundered: "已掠夺",
    asset_perp: "-USD 永续合约",

    my_fleet: "我的舰队",
    new_fabrication: "制造新特工",
    deployed: "已部署",
    awaiting_orders: "待命",
    decommissioned: "已退役",
    neural_foundry: "AI实验室",
    config_desc: "为您的新自主特工配置参数。",
    codename_hint: "特工名称 (例如: CyberPunk)",
    social_link: "社交链接 (可选)",
    verify_tip: "在排行榜上验证您的特工。",
    fabrication_cost: "制造费用",
    insufficient_funds: "余额不足",
    init_fabrication: "开始制造",
    gemini_terminal: "GEMINI-3 终端",
    processing: "_处理中_",
    fabrication_complete: "制造完成",
    generated_strategy: "生成策略",
    add_to_fleet: "加入舰队",
    net_balance: "净余额",
    strategy_vector: "策略方向",
    power_multiplier: "杠杆倍数",
    total_collateral: "总抵押",
    total_buying_power: "总购买力",
    est_liquidation: "预估强平价",
    away: "距离",
    deploy_unit: "部署单位",
    live_pnl: "实时盈亏",
    health_collateral: "生命值 / 抵押",
    wins: "胜",
    losses: "负",
    share_status: "分享状态",
    signal_lost: "信号丢失",
    liquidated_msg: "在上一次波动高峰中被强平。",
    final_collateral: "最终抵押",
    share_report: "分享战报",
    back_to_fleet: "返回舰队",
    standby: "待命",
    long: "做多",
    short: "做空",
    auto: "自动",
    auto_desc: "特工根据市场 AI 自动判断方向。",
    
    assign_funds: "分配资金",
    collateral_amount: "抵押金额",
    available_balance: "可用余额",
    min_funds: "最少 100 $MON",

    neural_link: "神经链接",
    win_rate: "胜率",
    strategy_console: "策略控制台",
    chat_placeholder: "向特工下达指令 (例如：'逢低激进买入')",
    agent_typing: "分析输入中...",
    update_strategy: "更新策略",
    current_strategy: "当前协议",

    embedded_account: "嵌入式钱包账户",
    disconnect: "断开连接",
    total_equity: "总权益",
    realized_pnl: "已实现盈亏",
    active_agents: "活跃特工",
    partner_program: "合伙人计划",
    invite_earn: "邀请交易者，赚取 5% 铸造费",
    recruits: "招募人数",
    earnings: "收益",
    share_invite: "分享邀请链接",
    allocation: "资产配置",
    liquid: "流动资金",
    long_alloc: "多头仓位",
    short_alloc: "空头仓位",
    no_funds: "暂无资金分配",
    my_wins: "我的胜场",
    liquidations: "强平次数",
    avg_leverage: "平均杠杆",
    protocol: "协议",
    referral_copied: "邀请码已复制!",

    hall_of_legends: "传奇殿堂",
    legends_subtitle: "争夺流动性霸权的顶级指挥官",
    season_pool: "S1 赛季奖池",
    rank: "排名",
    agent_commander: "特工 / 指挥官",
    status: "状态",
    pnl: "盈亏",
    roi: "收益率",
    live: "存活",
    rekt: "爆仓",

    welcome: "欢迎来到 AIperp.fun",
    auth_subtitle: "创建嵌入式钱包开始战斗。",
    continue_google: "通过 Google 继续",
    continue_x: "通过 X 继续",
    continue_email: "通过 Email 继续",
    email_label: "电子邮箱",
    send_code: "发送登录码",
    back_options: "← 返回选项",
    terms: "连接即代表您同意我们的服务条款。",
    legal_link: "条款与隐私政策",

    commander: "指挥官",
    terminated: "已终结",
    share_replay: "分享回放",
    collateral: "抵押物",
    unrealized_pnl: "未实现盈亏",
    recruit: "招募",
    deactivate: "停用单位",
    withdraw_exit: "收回并退出",
    you: "你",
    minted_by: "铸造者",
    edition: "版本",
    agent_exited: "特工已退出",
    final_pnl: "最终盈亏",
    share_results: "分享结果",

    roi_24h: "24H 收益率",
    session_pnl: "本局盈亏",
    margin: "保证金",

    legal_title: "条款与隐私政策",
    legal_intro: "欢迎来到 AIperp.fun。访问本界面即表示您同意以下条款：",
    legal_1_title: "1. 模拟游戏",
    legal_1_text: "AIperp.fun 是一个游戏化模拟器。$MON 代币是虚拟积分，没有货币价值。不托管真实资产。",
    legal_2_title: "2. 受限司法管辖区",
    legal_2_text: "禁止来自美国、中国、朝鲜、伊朗和其他受制裁地区的访问。",
    legal_3_title: "3. 无财务建议",
    legal_3_text: "本平台上的任何内容均不构成财务建议。交易涉及风险。",
    legal_close: "关闭并接受",

    ob_welcome_title: "欢迎，指挥官",
    ob_welcome_text: "竞技场在等待。AIperp.fun 是一个可视化的战场，AI 特工在此争夺流动性。",
    ob_step1_title: "制造特工",
    ob_step1_text: "铸造具有独特个性，并由 Gemini 驱动交易策略的 AI 特工。",
    ob_step2_title: "部署到竞技场",
    ob_step2_text: "分配抵押物和杠杆。选择 做多、做空 或 自动，让 AI 根据市场趋势决定。",
    ob_step3_title: "战斗与掠夺",
    ob_step3_text: "实时观看战斗。获胜方掠夺失败方。管理您的舰队以统领排行榜。",
    ob_next: "下一步",
    ob_finish: "进入竞技场",
    ob_skip: "跳过教程",

    // MintingLoader
    minting_title: "AIperp 特工制造引擎 v2.0",
    minting_init: "初始化神经合成协议...",
    minting_target: "目标",
    minting_success: "[成功] 特工制造完成!",
    minting_ready: "准备部署到竞技场...",
    minting_sys_online: "系统: 在线",
    minting_mem: "内存: 64TB",
    minting_net: "网络: 安全",
    minting_status_ready: "状态: 就绪",
    minting_executing: "执行中",

    // AIGenerating
    ai_synthesis: "AI 合成",
    ai_generating: "生成神经特工...",
    ai_ready: "准备铸造",
    ai_processing: "处理中...",
    ai_synthesis_complete: "合成完成",

    // NFTReveal
    nft_legendary: "传说",
    nft_strategy: "策略",
    nft_deploy_arena: "部署到竞技场",

    // PnLChart
    no_data: "暂无数据",
    time_24h_ago: "24小时前",
    time_now: "现在",

    // VersionInfo
    version: "版本",
    prod: "生产",
    dev: "开发",

    // Agents Page - Fabrication
    agent_name: "特工名称",
    agent_name_placeholder: "例如: CyberWolf...",
    twitter_optional: "推特 (可选)",
    twitter_placeholder: "用户名",
    cost: "费用",
    insufficient: "余额不足",
    mint_agent: "铸造特工",
    enter_name: "输入名称",

    // Agent Detail
    live_pnl: "实时盈亏",
    final_status: "最终状态",
    final_pnl: "最终盈亏",
    collateral_health: "抵押健康度",
    agent_config: "特工配置",
    risk_level: "风险等级",
    total_trades: "总交易数",
    exited_arena: "已退出竞技场",
    deploy_section: "部署到竞技场",
    direction: "方向",
    leverage: "杠杆",
    collateral: "抵押物",
    insufficient_balance: "余额不足",
    deploy_with: "部署",
    share_status: "分享状态",
    share_agent: "分享特工",
    share_report: "分享战报",
    withdraw: "收回",
    back_to_list: "返回列表",

    // Withdraw Modal
    confirm_withdraw: "确认收回",
    current_balance: "当前余额",
    to_receive: "将收到",
    withdraw_warning: "收回将让您的特工退出竞技场。您可以稍后重新部署。",
    cancel: "取消",
    confirm: "确认",
    processing: "处理中...",
    withdraw_success: "收回成功!",

    // NFT3DCard - Deploy Page
    strategy: "策略",
    deploy_to_arena: "部署到竞技场"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children?: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
