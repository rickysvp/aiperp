import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Wallet, Coins, ArrowRight, Sparkles, Loader2, Key, Shield, FileKey } from 'lucide-react';
import { INITIAL_MON_BALANCE } from '../constants';

interface WalletGenerationModalProps {
  onComplete: () => void;
}

interface Step {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'completed';
}

export const WalletGenerationModal: React.FC<WalletGenerationModalProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [generatedWallet, setGeneratedWallet] = useState({
    address: '',
    privateKey: '',
    monBalance: INITIAL_MON_BALANCE
  });

  const [steps, setSteps] = useState<Step[]>([
    { id: 'create', icon: <Wallet size={20} />, title: '正在创建钱包', description: 'Initializing wallet structure...', status: 'pending' },
    { id: 'key', icon: <Key size={20} />, title: '正在生成私钥', description: 'Generating secure ECDSA keypair...', status: 'pending' },
    { id: 'address', icon: <Shield size={20} />, title: '正在生成Monad Testnet地址', description: 'Deriving address from public key...', status: 'pending' },
    { id: 'fund', icon: <Coins size={20} />, title: '正在转入初始化资产', description: `Sending ${INITIAL_MON_BALANCE.toLocaleString()} MON...`, status: 'pending' },
  ]);

  // Generate wallet address
  const generateAddress = () => {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  // Generate private key (mock)
  const generatePrivateKey = () => {
    const chars = '0123456789abcdef';
    let key = '0x';
    for (let i = 0; i < 64; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
  };

  // Step progression
  useEffect(() => {
    if (currentStep >= steps.length) {
      setTimeout(() => setShowResult(true), 500);
      return;
    }

    // Mark current step as loading
    setSteps(prev => prev.map((step, idx) => 
      idx === currentStep ? { ...step, status: 'loading' } : step
    ));

    // Complete step after delay
    const timer = setTimeout(() => {
      setSteps(prev => prev.map((step, idx) => 
        idx === currentStep ? { ...step, status: 'completed' } : step
      ));
      
      // Generate wallet data at specific steps
      if (steps[currentStep].id === 'address') {
        setGeneratedWallet(prev => ({
          ...prev,
          address: generateAddress(),
          privateKey: generatePrivateKey()
        }));
      }
      
      setCurrentStep(prev => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleConfirm = () => {
    onComplete();
  };

  // Result Screen
  if (showResult) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl">
        <div className="w-full max-w-md mx-4">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-[#836EF9]/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-[#836EF9] to-[#6c56e0] rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(131,110,249,0.5)]">
                <CheckCircle2 size={40} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles size={20} className="text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">钱包创建完成!</h2>
            <p className="text-slate-400 text-sm">您的Monad Testnet钱包已就绪</p>
          </div>

          {/* Wallet Card */}
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-6 mb-6">
            {/* Address */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-[#836EF9]" />
                <span className="text-xs text-slate-500 uppercase tracking-wider">钱包地址</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg">
                <p className="text-xs font-mono text-slate-300 break-all">{generatedWallet.address}</p>
              </div>
            </div>

            {/* Balance */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-purple-400">MON</span>
                </div>
                <span className="text-xs text-slate-500">初始余额</span>
              </div>
              <p className="text-2xl font-bold text-white">{generatedWallet.monBalance.toLocaleString()} <span className="text-sm font-normal text-slate-400">MON</span></p>
              <p className="text-[10px] text-slate-500 mt-1">用于Gas、铸造Agent和交易保证金</p>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <FileKey size={18} className="text-yellow-500 mt-0.5" />
              <div>
                <p className="text-xs text-yellow-500 font-bold mb-1">重要提示</p>
                <p className="text-[11px] text-slate-400">
                  这是测试网钱包，私钥仅存储在本地。请勿向此地址转入主网资产。
                </p>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-gradient-to-r from-[#836EF9] to-[#6c56e0] hover:shadow-[0_0_30px_rgba(131,110,249,0.5)] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            <span>进入竞技场</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // Generation Steps Screen
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-[#836EF9]/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-[#836EF9] to-[#6c56e0] rounded-xl flex items-center justify-center">
              <Wallet size={28} className="text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">正在生成钱包</h2>
          <p className="text-xs text-slate-500">Monad Testnet</p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                step.status === 'completed' 
                  ? 'bg-[#836EF9]/10 border-[#836EF9]/30' 
                  : step.status === 'loading'
                  ? 'bg-slate-900/50 border-[#836EF9]/50'
                  : 'bg-slate-900/30 border-slate-800'
              }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                step.status === 'completed' 
                  ? 'bg-[#836EF9] text-white' 
                  : step.status === 'loading'
                  ? 'bg-[#836EF9]/20 text-[#836EF9]'
                  : 'bg-slate-800 text-slate-600'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle2 size={20} />
                ) : step.status === 'loading' ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold transition-colors duration-300 ${
                  step.status === 'pending' ? 'text-slate-600' : 'text-white'
                }`}>
                  {step.title}
                </h3>
                <p className="text-[11px] text-slate-500 truncate">{step.description}</p>
              </div>

              {/* Status Indicator */}
              <div className="flex-shrink-0">
                {step.status === 'loading' && (
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-[#836EF9] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-[#836EF9] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-[#836EF9] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                {step.status === 'completed' && (
                  <span className="text-[10px] text-[#836EF9] font-bold">完成</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#836EF9] to-cyan-400 transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-3">
            步骤 {Math.min(currentStep + 1, steps.length)} / {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
};
