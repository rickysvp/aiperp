import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Nav
    app_title_root: "AIperp",
    app_title_suffix: ".fun",
    nav_subtitle: "AI Perp Predict Clash",
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
    my_fleet: "MY AGENTS",
    new_fabrication: "Mint a New Agent",
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
    min_funds: "Min 100 USDT",

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

    // WalletV2 - New Wallet Module
    wallet_overview: "Overview",
    wallet_history: "History",
    wallet_analytics: "Analytics",
    wallet_referrals: "Referrals",
    wallet_total_equity: "Total Equity",
    wallet_available: "Available",
    wallet_staked_agents: "Staked in Agents",
    wallet_total_pnl: "Total PnL",
    wallet_deposit: "Deposit",
    wallet_withdraw: "Withdraw",
    wallet_copy_ref: "Copy Ref Code",
    wallet_copied: "Copied!",
    wallet_portfolio_alloc: "Portfolio Allocation",
    wallet_no_positions: "No active positions",
    wallet_active_agents: "Active Agents",
    wallet_no_active: "No active agents",
    wallet_deploy_hint: "Deploy agents to start trading",
    wallet_tx_history: "Transaction History",
    wallet_all: "All",
    wallet_daily_pnl: "Daily PnL (Last 7 Days)",
    wallet_total_wins: "Total Wins",
    wallet_total_losses: "Total Losses",
    wallet_win_rate: "Win Rate",
    wallet_avg_leverage: "Avg Leverage",
    wallet_partner_program: "Partner Program",
    wallet_total_recruits: "Total Recruits",
    wallet_total_earnings: "Total Earnings",
    wallet_your_ref_code: "Your Referral Code",
    wallet_share_twitter: "Share on Twitter",
    wallet_how_it_works: "How It Works",
    wallet_step1_title: "Share Your Code",
    wallet_step1_desc: "Invite friends using your unique referral code",
    wallet_step2_title: "They Mint & Trade",
    wallet_step2_desc: "Your referrals mint agents and start trading",
    wallet_step3_title: "Earn Rewards",
    wallet_step3_desc: "Get 10% of their minting fees and trading profits",
    wallet_connected: "Connected Wallet",
    wallet_legal: "Legal",
    wallet_disconnect: "Disconnect",
    wallet_deposit_title: "Deposit",
    wallet_your_address: "Your Wallet Address",
    wallet_send_mon: "Send USDT to this address to deposit",
    wallet_understand: "I Understand",
    wallet_withdraw_title: "Withdraw",
    wallet_available_balance: "Available Balance",
    wallet_coming_soon: "Withdrawal feature coming soon",
    wallet_close: "Close",

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
    legal_required_notice: "You must accept our Terms of Service and Privacy Policy to continue",
    legal_title: "Terms & Privacy Policy",
    legal_subtitle: "Legal agreements and disclosures",
    legal_tab_terms: "Terms of Service",
    legal_tab_privacy: "Privacy Policy",
    legal_tab_risk: "Risk Disclosure",
    legal_effective_date: "Effective Date",
    legal_effective_date_value: "February 12, 2026",
    legal_last_updated: "Last Updated",
    legal_last_updated_value: "February 12, 2026",
    legal_contact: "Contact",
    
    // Terms of Service
    legal_terms_1_title: "Acceptance of Terms",
    legal_terms_1_text: "By accessing or using AIperp.fun, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use the platform.",
    legal_terms_2_title: "Prohibited Jurisdictions",
    legal_terms_2_text: "Access to and use of AIperp.fun is expressly prohibited for residents and citizens of the following jurisdictions:",
    legal_terms_2_item1: "United States of America and its territories",
    legal_terms_2_item2: "People's Republic of China",
    legal_terms_2_item3: "Democratic People's Republic of Korea (North Korea)",
    legal_terms_2_item4: "Islamic Republic of Iran",
    legal_terms_2_item5: "Any other jurisdiction where participation in blockchain-based gaming or trading simulations is prohibited by law",
    legal_terms_3_title: "Nature of Service",
    legal_terms_3_text: "AIperp.fun is a decentralized trading simulation platform. The platform uses USDT (Tether) for all transactions. Users connect their own non-custodial wallets and maintain full control of their funds. The platform does not custody user assets. All trading is simulated using real USDT deposits, but trading mechanics are gamified.",
    legal_terms_4_title: "User Eligibility",
    legal_terms_4_text: "You must be at least 18 years of age or the legal age of majority in your jurisdiction, whichever is greater, to use this platform. By using AIperp.fun, you represent and warrant that you meet these eligibility requirements.",
    legal_terms_5_title: "Intellectual Property",
    legal_terms_5_text: "All content, designs, graphics, and software on AIperp.fun are the exclusive property of AIperp.fun and are protected by international copyright, trademark, and other intellectual property laws. Users are granted a limited, non-exclusive, non-transferable license to use the platform for personal, non-commercial purposes.",
    
    // Privacy Policy
    legal_privacy_commitment: "Our Commitment",
    legal_privacy_commitment_text: "AIperp.fun is committed to protecting your privacy and handling your data with transparency and care.",
    legal_privacy_1_title: "Information We Collect",
    legal_privacy_1_text: "We collect minimal information necessary to provide our services:",
    legal_privacy_1_item1: "Wallet address (public blockchain data)",
    legal_privacy_1_item2: "Game activity and transaction history on our platform",
    legal_privacy_1_item3: "Email address (optional, for account recovery)",
    legal_privacy_2_title: "How We Use Your Information",
    legal_privacy_2_text: "Your information is used solely to operate the platform, maintain game state, and improve user experience. We do not sell, rent, or share your personal data with third parties for marketing purposes. All game data is stored locally in your browser.",
    legal_privacy_3_title: "Data Security",
    legal_privacy_3_text: "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. Users are responsible for maintaining the security of their wallet private keys.",
    legal_privacy_4_title: "Your Rights",
    legal_privacy_4_text: "You have the right to access, correct, or delete your personal information. Since most data is stored locally, you can clear your browser data at any time. For additional requests, contact our support team.",
    
    // Risk Disclosure
    legal_risk_warning_title: "IMPORTANT RISK WARNING",
    legal_risk_warning_text: "Please read this risk disclosure carefully. By using AIperp.fun, you acknowledge that you understand and accept the following risks.",
    legal_risk_1_title: "No Investment Advice",
    legal_risk_1_text: "AIperp.fun does not provide investment, financial, legal, or tax advice. Nothing on this platform should be construed as a recommendation to buy, sell, or hold any asset. All content is for entertainment and educational purposes only.",
    legal_risk_2_title: "Simulation Nature",
    legal_risk_2_text: "This platform is a simulation game. Past performance of AI agents does not guarantee future results. The trading strategies employed by AI agents are experimental and for entertainment purposes only.",
    legal_risk_3_title: "Technology Risks",
    legal_risk_3_text: "Blockchain technology and smart contracts are subject to risks including but not limited to: bugs, hacks, network congestion, and protocol failures. While we take precautions, we cannot guarantee the security of the platform.",
    legal_risk_4_title: "Regulatory Risks",
    legal_risk_4_text: "Cryptocurrency and blockchain regulations are evolving rapidly. Changes in laws or regulations may adversely affect the platform. Users are responsible for ensuring their use of the platform complies with local laws.",
    legal_risk_5_title: "No Liability",
    legal_risk_5_text: "To the maximum extent permitted by law, AIperp.fun and its team shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.",
    
    // Legal Actions
    legal_accept_checkbox: "I have read and agree to the Terms of Service, Privacy Policy, and Risk Disclosure",
    legal_accept: "Accept & Continue",
    legal_decline: "Decline",
    legal_close: "Agree & Close",
    legal_scroll_notice: "Please scroll through all sections to enable acceptance",

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

    final_status: "Final Status",

    collateral_health: "Collateral Health",
    agent_config: "Agent Configuration",
    risk_level: "Risk Level",
    total_trades: "Total Trades",
    exited_arena: "Exited Arena",
    deploy_section: "Deploy to Arena",
    direction: "Direction",
    leverage: "Leverage",

    insufficient_balance: "Insufficient Balance",
    deploy_with: "Deploy",

    share_agent: "Share Agent",

    withdraw: "Withdraw",
    back_to_list: "Back to List",

    // Withdraw Modal
    confirm_withdraw: "Confirm Withdraw",
    current_balance: "Current Balance",
    to_receive: "To Receive",
    withdraw_warning: "Withdrawing will exit your agent from the arena. You can redeploy later.",
    cancel: "Cancel",
    confirm: "Confirm",

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

    my_fleet: "我的特工",
    new_fabrication: "铸造新特工",
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

    health_collateral: "生命值 / 抵押",
    wins: "胜",
    losses: "负",

    signal_lost: "信号丢失",
    liquidated_msg: "在上一次波动高峰中被强平。",
    final_collateral: "最终抵押",

    back_to_fleet: "返回舰队",
    standby: "待命",
    long: "做多",
    short: "做空",
    auto: "自动",
    auto_desc: "特工根据市场 AI 自动判断方向。",
    
    assign_funds: "分配资金",
    collateral_amount: "抵押金额",
    available_balance: "可用余额",
    min_funds: "最少 100 USDT",

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

    // WalletV2 - New Wallet Module
    wallet_overview: "概览",
    wallet_history: "历史",
    wallet_analytics: "分析",
    wallet_referrals: "推荐",
    wallet_total_equity: "总权益",
    wallet_available: "可用",
    wallet_staked_agents: "特工质押",
    wallet_total_pnl: "总盈亏",
    wallet_deposit: "充值",
    wallet_withdraw: "提现",
    wallet_copy_ref: "复制推荐码",
    wallet_copied: "已复制!",
    wallet_portfolio_alloc: "资产配置",
    wallet_no_positions: "无活跃仓位",
    wallet_active_agents: "活跃特工",
    wallet_no_active: "无活跃特工",
    wallet_deploy_hint: "部署特工开始交易",
    wallet_tx_history: "交易历史",
    wallet_all: "全部",
    wallet_daily_pnl: "每日盈亏 (最近7天)",
    wallet_total_wins: "总胜场",
    wallet_total_losses: "总败场",
    wallet_win_rate: "胜率",
    wallet_avg_leverage: "平均杠杆",
    wallet_partner_program: "合伙人计划",
    wallet_total_recruits: "总招募",
    wallet_total_earnings: "总收益",
    wallet_your_ref_code: "你的推荐码",
    wallet_share_twitter: "分享到 Twitter",
    wallet_how_it_works: "如何运作",
    wallet_step1_title: "分享你的推荐码",
    wallet_step1_desc: "使用你的专属推荐码邀请好友",
    wallet_step2_title: "他们铸造并交易",
    wallet_step2_desc: "你的推荐人铸造特工并开始交易",
    wallet_step3_title: "赚取奖励",
    wallet_step3_desc: "获得他们铸造费用和交易利润的10%",
    wallet_connected: "已连接钱包",
    wallet_legal: "法律条款",
    wallet_disconnect: "断开连接",
    wallet_deposit_title: "充值",
    wallet_your_address: "你的钱包地址",
    wallet_send_mon: "发送 USDT 到此地址进行充值",
    wallet_understand: "我已了解",
    wallet_withdraw_title: "提现",
    wallet_available_balance: "可用余额",
    wallet_coming_soon: "提现功能即将上线",
    wallet_close: "关闭",

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

    unrealized_pnl: "未实现盈亏",
    recruit: "招募",
    deactivate: "停用单位",
    withdraw_exit: "收回并退出",
    you: "你",
    minted_by: "铸造者",
    edition: "版本",
    agent_exited: "特工已退出",

    share_results: "分享结果",

    roi_24h: "24H 收益率",
    session_pnl: "本局盈亏",
    margin: "保证金",

    legal_required_notice: "您必须接受我们的服务条款和隐私政策才能继续",
    legal_title: "条款与隐私政策",
    legal_subtitle: "法律协议与披露",
    legal_tab_terms: "服务条款",
    legal_tab_privacy: "隐私政策",
    legal_tab_risk: "风险披露",
    legal_effective_date: "生效日期",
    legal_effective_date_value: "2026年2月12日",
    legal_last_updated: "最后更新",
    legal_last_updated_value: "2026年2月12日",
    legal_contact: "联系方式",
    
    // 服务条款
    legal_terms_1_title: "条款接受",
    legal_terms_1_text: "访问或使用 AIperp.fun，即表示您确认已阅读、理解并同意受这些服务条款的约束。如果您不同意这些条款，则不得访问或使用本平台。",
    legal_terms_2_title: "禁止访问地区",
    legal_terms_2_text: "以下司法管辖区的居民和公民明确禁止访问和使用 AIperp.fun：",
    legal_terms_2_item1: "美利坚合众国及其领土",
    legal_terms_2_item2: "中华人民共和国",
    legal_terms_2_item3: "朝鲜民主主义人民共和国",
    legal_terms_2_item4: "伊朗伊斯兰共和国",
    legal_terms_2_item5: "任何其他法律禁止参与基于区块链的游戏或交易模拟的司法管辖区",
    legal_terms_3_title: "服务性质",
    legal_terms_3_text: "AIperp.fun 是一个去中心化交易模拟平台。平台使用 USDT（泰达币）进行所有交易。用户连接自己的非托管钱包并完全控制自己的资金。平台不托管用户资产。所有交易使用真实 USDT 存款进行模拟，但交易机制是游戏化的。",
    legal_terms_4_title: "用户资格",
    legal_terms_4_text: "您必须年满 18 周岁或达到您所在司法管辖区的法定成年年龄（以较大者为准）才能使用本平台。使用 AIperp.fun，即表示您声明并保证您符合这些资格要求。",
    legal_terms_5_title: "知识产权",
    legal_terms_5_text: "AIperp.fun 上的所有内容、设计、图形和软件均为 AIperp.fun 的专有财产，受国际版权、商标和其他知识产权法律的保护。用户被授予有限的、非排他性的、不可转让的许可，仅可将本平台用于个人非商业目的。",
    
    // 隐私政策
    legal_privacy_commitment: "我们的承诺",
    legal_privacy_commitment_text: "AIperp.fun 致力于保护您的隐私，并以透明和谨慎的方式处理您的数据。",
    legal_privacy_1_title: "我们收集的信息",
    legal_privacy_1_text: "我们仅收集提供服务所必需的最少信息：",
    legal_privacy_1_item1: "钱包地址（公共区块链数据）",
    legal_privacy_1_item2: "平台上的游戏活动和交易历史",
    legal_privacy_1_item3: "电子邮件地址（可选，用于账户恢复）",
    legal_privacy_2_title: "我们如何使用您的信息",
    legal_privacy_2_text: "您的信息仅用于运营平台、维护游戏状态和改善用户体验。我们不会出于营销目的向第三方出售、出租或共享您的个人数据。所有游戏数据都存储在您的浏览器本地。",
    legal_privacy_3_title: "数据安全",
    legal_privacy_3_text: "我们实施行业标准的安全措施来保护您的数据。但是，互联网传输方法并非 100% 安全。用户有责任维护其钱包私钥的安全。",
    legal_privacy_4_title: "您的权利",
    legal_privacy_4_text: "您有权访问、更正或删除您的个人信息。由于大多数数据存储在本地，您可以随时清除浏览器数据。如需其他请求，请联系我们的支持团队。",
    
    // 风险披露
    legal_risk_warning_title: "重要风险警告",
    legal_risk_warning_text: "请仔细阅读此风险披露。使用 AIperp.fun，即表示您确认理解并接受以下风险。",
    legal_risk_1_title: "非投资建议",
    legal_risk_1_text: "AIperp.fun 不提供投资、财务、法律或税务建议。本平台上的任何内容均不应被解释为购买、出售或持有任何资产的建议。所有内容仅供娱乐和教育目的。",
    legal_risk_2_title: "模拟性质",
    legal_risk_2_text: "本平台是一个模拟游戏。AI 代理的过往表现不能保证未来结果。AI 代理采用的交易策略是实验性的，仅供娱乐目的。",
    legal_risk_3_title: "技术风险",
    legal_risk_3_text: "区块链技术和智能合约面临包括但不限于以下风险：漏洞、黑客攻击、网络拥塞和协议故障。虽然我们采取预防措施，但我们无法保证平台的安全性。",
    legal_risk_4_title: "监管风险",
    legal_risk_4_text: "加密货币和区块链法规正在迅速发展。法律或法规的变化可能对平台产生不利影响。用户有责任确保其使用本平台符合当地法律。",
    legal_risk_5_title: "免责声明",
    legal_risk_5_text: "在法律允许的最大范围内，AIperp.fun 及其团队不对因您使用本平台而产生的任何直接、间接、附带、特殊、后果性或惩罚性损害承担责任。",
    
    // 法律操作
    legal_accept_checkbox: "我已阅读并同意服务条款、隐私政策和风险披露",
    legal_accept: "接受并继续",
    legal_decline: "拒绝",
    legal_close: "同意并关闭",
    legal_scroll_notice: "请滚动浏览所有章节以启用接受按钮",

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

    final_status: "最终状态",

    collateral_health: "抵押健康度",
    agent_config: "特工配置",
    risk_level: "风险等级",
    total_trades: "总交易数",
    exited_arena: "已退出竞技场",
    deploy_section: "部署到竞技场",
    direction: "方向",
    leverage: "杠杆",

    insufficient_balance: "余额不足",
    deploy_with: "部署",

    share_agent: "分享特工",

    withdraw: "收回",
    back_to_list: "返回列表",

    // Withdraw Modal
    confirm_withdraw: "确认收回",
    current_balance: "当前余额",
    to_receive: "将收到",
    withdraw_warning: "收回将让您的特工退出竞技场。您可以稍后重新部署。",
    cancel: "取消",
    confirm: "确认",

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
