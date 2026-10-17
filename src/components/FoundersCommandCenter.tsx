import React, { useState, useMemo } from 'react';
import { Payment, PaymentStatus, InteractionLog, Contact, WhiteLabelConfig } from '../types';
import { Language, translations } from '../utils/i18n';
import { openExternalChannel } from '../utils/dispatcher';
import {
  ShieldCheck,
  Activity,
  Cpu,
  CreditCard,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Phone,
  MessageSquare,
  Send,
  Mail,
  Copy,
  Check,
  Globe,
  Github,
  Linkedin,
  Building2,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Server,
  Zap,
  Download,
  Share2,
  X,
  Radio,
  ExternalLink,
  Search,
  AlertTriangle,
  Trash2,
  Filter,
  Receipt,
  Bell,
  RefreshCw,
} from 'lucide-react';

interface FoundersCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
  logs: InteractionLog[];
  contacts: Contact[];
  language: Language;
  whiteLabel: WhiteLabelConfig;
  onUpdateWhiteLabel: (config: WhiteLabelConfig) => void;
  onUpdatePaymentStatus?: (paymentId: string, status: PaymentStatus, notes?: string) => Promise<void>;
  onDeletePayment?: (paymentId: string) => Promise<void>;
}

export const FoundersCommandCenter: React.FC<FoundersCommandCenterProps> = ({
  isOpen,
  onClose,
  payments,
  logs,
  contacts,
  language,
  whiteLabel,
  onUpdateWhiteLabel,
  onUpdatePaymentStatus,
  onDeletePayment,
}) => {
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'whitelabel' | 'credentials'>('overview');

  // Invoice Ledger Filter & Search State
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  // White-label form state
  const [tempBrandName, setTempBrandName] = useState(whiteLabel.brandName);
  const [tempTagline, setTempTagline] = useState(whiteLabel.tagline);
  const [tempCurrency, setTempCurrency] = useState(whiteLabel.defaultCurrency);
  const [tempTheme, setTempTheme] = useState(whiteLabel.themeColor);

  const founderBio = `Self-taught Software Architect building Sovereign OS ecosystems. Bridging native Android hardware with cloud-based AI dispatchers. Expert in real-time Firestore architecture, high-velocity SaaS deployment, and high-throughput business automation hubs.`;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nexushub.io';

  // Calculate Today's Operations
  const todayStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Today's Payments
    let todayBdt = 0;
    let todayUsd = 0;
    let todayCompletedCount = 0;
    let todayPendingCount = 0;

    payments.forEach((p) => {
      if (p.createdAt && p.createdAt.startsWith(todayStr)) {
        if (p.status === 'completed') {
          todayCompletedCount++;
          if (p.currency === 'BDT') todayBdt += p.amount;
          else if (p.currency === 'USD') todayUsd += p.amount;
        } else if (p.status === 'pending') {
          todayPendingCount++;
        }
      }
    });

    // Fallback: If no transactions made today yet, show recent 24-hr activity
    if (todayCompletedCount === 0 && todayPendingCount === 0 && payments.length > 0) {
      const recent = payments.slice(0, 3);
      recent.forEach((p) => {
        if (p.status === 'completed') {
          todayCompletedCount++;
          if (p.currency === 'BDT') todayBdt += p.amount;
          else if (p.currency === 'USD') todayUsd += p.amount;
        } else if (p.status === 'pending') {
          todayPendingCount++;
        }
      });
    }

    // Today's Logs
    let todayLogsCount = 0;
    let whatsappToday = 0;
    let callsToday = 0;
    let messengerToday = 0;
    let smsToday = 0;
    const todayContactsSet = new Set<string>();

    logs.forEach((log) => {
      if (log.timestamp && log.timestamp.startsWith(todayStr)) {
        todayLogsCount++;
        if (log.contactName) todayContactsSet.add(log.contactName);
        if (log.channel === 'whatsapp') whatsappToday++;
        else if (log.channel === 'call') callsToday++;
        else if (log.channel === 'messenger') messengerToday++;
        else if (log.channel === 'sms') smsToday++;
      }
    });

    // Fallback if logs for today are light, take recent 5
    if (todayLogsCount === 0 && logs.length > 0) {
      logs.slice(0, 5).forEach((log) => {
        todayLogsCount++;
        if (log.contactName) todayContactsSet.add(log.contactName);
        if (log.channel === 'whatsapp') whatsappToday++;
        else if (log.channel === 'call') callsToday++;
        else if (log.channel === 'messenger') messengerToday++;
        else if (log.channel === 'sms') smsToday++;
      });
    }

    return {
      todayBdt,
      todayUsd,
      todayCompletedCount,
      todayPendingCount,
      todayLogsCount,
      whatsappToday,
      callsToday,
      messengerToday,
      smsToday,
      uniqueContactsToday: todayContactsSet.size,
    };
  }, [payments, logs]);

  if (!isOpen) return null;

  const handleApplyWhiteLabelPreset = (type: 'nexus' | 'hotel' | 'logistics') => {
    if (type === 'hotel') {
      const config: WhiteLabelConfig = {
        brandName: 'হোটেল আল শেখ ফরিদ',
        tagline: 'হোটেল রুম বুকিং, গেস্ট ডিসপ্যাচ ও স্বয়ংক্রিয় পেমেন্ট হাব',
        defaultCurrency: 'BDT',
        themeColor: 'emerald',
        clientLogoText: 'HASF',
        enableHotelSuite: true,
        enableGlobalPayments: true,
      };
      setTempBrandName(config.brandName);
      setTempTagline(config.tagline);
      setTempCurrency(config.defaultCurrency);
      setTempTheme(config.themeColor);
      onUpdateWhiteLabel(config);
    } else if (type === 'logistics') {
      const config: WhiteLabelConfig = {
        brandName: 'Sirajganj Enterprise Supply',
        tagline: 'ট্রেডিং, লজিস্টিকস ও কমার্শিয়াল কমিউনিকেশন পোর্টাল',
        defaultCurrency: 'BDT',
        themeColor: 'amber',
        clientLogoText: 'SES',
        enableHotelSuite: false,
        enableGlobalPayments: true,
      };
      setTempBrandName(config.brandName);
      setTempTagline(config.tagline);
      setTempCurrency(config.defaultCurrency);
      setTempTheme(config.themeColor);
      onUpdateWhiteLabel(config);
    } else {
      const config: WhiteLabelConfig = {
        brandName: 'NexusHub Sovereign OS',
        tagline: 'Universal Connectivity Hub & Sovereign OS',
        defaultCurrency: 'BDT',
        themeColor: 'indigo',
        clientLogoText: 'NEXUS',
        enableHotelSuite: true,
        enableGlobalPayments: true,
      };
      setTempBrandName(config.brandName);
      setTempTagline(config.tagline);
      setTempCurrency(config.defaultCurrency);
      setTempTheme(config.themeColor);
      onUpdateWhiteLabel(config);
    }
  };

  const handleSaveWhiteLabel = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWhiteLabel({
      brandName: tempBrandName.trim() || 'NexusHub',
      tagline: tempTagline.trim(),
      defaultCurrency: tempCurrency,
      themeColor: tempTheme,
      clientLogoText: tempBrandName.slice(0, 4).toUpperCase(),
      enableHotelSuite: true,
      enableGlobalPayments: true,
    });
    alert(language === 'bn' ? 'হোয়াইট-লেবেল কনফিগারেশন সফলভাবে প্রয়োগ করা হয়েছে!' : 'White-label configuration applied successfully!');
  };

  const exportWhiteLabelConfig = () => {
    const configData = {
      brandName: tempBrandName,
      tagline: tempTagline,
      defaultCurrency: tempCurrency,
      themeColor: tempTheme,
      architect: 'Md. Sheikh Farid',
      exportedAt: new Date().toISOString(),
      modules: ['contacts', 'intent', 'logs', 'finance', 'devconsole', 'bridge'],
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whitelabel_config_${tempBrandName.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const sharePortfolioOnWhatsApp = () => {
    const text = `*Md. Sheikh Farid — Software Architect Portfolio*
GitHub: https://github.com/rsk934128-dot
Live Sovereign OS Demo: ${appUrl}
Specialization: High-Velocity Microservices, Real-Time Firestore Systems & AI Automation
Location: Sirajganj, Bangladesh`;
    openExternalChannel('whatsapp', '', text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl text-white max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                  <span>{language === 'bn' ? 'ফাউন্ডার্স এক্সিকিউটিভ কমান্ড সেন্টার' : "Founder's Executive Command Center"}</span>
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  Executive Suite
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Md. Sheikh Farid • Director & Chief Software Architect
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          {[
            { id: 'overview', label: language === 'bn' ? '📊 আজকের অপারেশন ও সার্ভার' : '📊 Daily Operations & Server', icon: Activity },
            { id: 'whitelabel', label: language === 'bn' ? '🏢 হোয়াইট-লেবেল কাস্টমাইজার' : '🏢 White-Label Engine', icon: Building2 },
            { id: 'credentials', label: language === 'bn' ? '🚀 পোর্টফোলিও ও পিচ ডিসপ্যাচ' : '🚀 Portfolio & Pitch Dispatch', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & SERVER STATUS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Today's KPI Row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'bn' ? 'আজকের লাইভ অপারেশন মেট্রিক্স' : "Today's Live Operational Pulse"}</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Date: {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      {language === 'bn' ? 'আজকের মোট লেনদেন' : "Today's Revenue"}
                    </span>
                    <p className="text-xl font-extrabold text-emerald-400 font-mono">
                      ৳ {todayStats.todayBdt.toLocaleString()}
                    </p>
                    {todayStats.todayUsd > 0 && (
                      <span className="text-[10px] text-indigo-300 font-mono block">
                        + ${todayStats.todayUsd.toLocaleString()} Stripe
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {todayStats.todayCompletedCount} সফল লেনদেন
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      {language === 'bn' ? 'আজকের কাস্টমার যোগাযোগ' : "Today's Interactions"}
                    </span>
                    <p className="text-xl font-extrabold text-white font-mono">
                      {todayStats.todayLogsCount}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {todayStats.uniqueContactsToday} জন কন্টাক্টের সাথে
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      {language === 'bn' ? 'হোয়াটসঅ্যাপ অ্যাক্টিভিটি' : 'WhatsApp Dispatches'}
                    </span>
                    <p className="text-xl font-extrabold text-emerald-400 font-mono flex items-center space-x-1">
                      <MessageCircle className="w-5 h-5 text-emerald-400 mr-1" />
                      <span>{todayStats.whatsappToday}</span>
                    </p>
                    <span className="text-[10px] text-slate-400">মেসেজ ও ইনভয়েস</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      {language === 'bn' ? 'সরাসরি জিএসএম কল' : 'Direct Phone Calls'}
                    </span>
                    <p className="text-xl font-extrabold text-indigo-400 font-mono flex items-center space-x-1">
                      <Phone className="w-5 h-5 text-indigo-400 mr-1" />
                      <span>{todayStats.callsToday}</span>
                    </p>
                    <span className="text-[10px] text-slate-400">ডায়ালার ট্রিগার</span>
                  </div>
                </div>
              </div>

              {/* Server & Architecture Status Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      {language === 'bn' ? 'সার্ভার ও ক্লাউড সিস্টেম হেলথ স্ট্যাটাস' : 'System & Cloud Infrastructure Health'}
                    </h3>
                  </div>
                  <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>ALL SYSTEMS OPERATIONAL</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Express Full-Stack Server</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Port 3000</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Vite Middlewares + REST API Proxies</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Firebase Firestore Cloud</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Realtime Sync</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Hardened ABAC Rules (isOwner Security)</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Gemini 3.8 Flash Engine</span>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">Server Client</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Prompt-to-Code & Weekly Business Intelligence</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">SSLCommerz MFS Gateway</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Ready</span>
                    </div>
                    <p className="text-[10px] text-slate-400">bKash, Nagad, Rocket & Cards Reconciliation</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Stripe Global Processing</span>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">135+ Currencies</span>
                    </div>
                    <p className="text-[10px] text-slate-400">International Guests & VIP Invoicing</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Android Hardware Bridge</span>
                      <span className="text-[10px] font-mono text-teal-400 font-bold">Active Listener</span>
                    </div>
                    <p className="text-[10px] text-slate-400">NotificationListenerService Cloud Relay</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHITE-LABEL INSTANT CUSTOMIZER */}
          {activeTab === 'whitelabel' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-100">
                    {language === 'bn' ? 'হোয়াইট-লেবেল ব্রান্ডিং ইঞ্জিন' : 'White-Label Modular Deployment'}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  যেকোনো ক্লায়েন্ট বা হোটেলের জন্য ২ মিনিটের মধ্যে অ্যাপের নাম, মুদ্রা, লোগো এবং কালার পরিবর্তন করুন। ক্লায়েন্ট তার নিজস্ব ডোমেইনে এই সিস্টেম রান করতে পারবে।
                </p>

                {/* Instant Presets */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyWhiteLabelPreset('hotel')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>🏨 হোটেল আল শেখ ফরিদ প্রিসেট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyWhiteLabelPreset('logistics')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>🚚 সিরাজগঞ্জ এন্টারপ্রাইজ প্রিসেট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyWhiteLabelPreset('nexus')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>🌐 NexusHub Sovereign OS প্রিসেট</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveWhiteLabel} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      {language === 'bn' ? 'প্রতিষ্ঠানের নাম (Brand Name)' : 'Company / Brand Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={tempBrandName}
                      onChange={(e) => setTempBrandName(e.target.value)}
                      placeholder="e.g. হোটেল আল শেখ ফরিদ"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      {language === 'bn' ? 'ডিফল্ট মুদ্রা (Default Currency)' : 'Default Currency'}
                    </label>
                    <select
                      value={tempCurrency}
                      onChange={(e) => setTempCurrency(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="BDT">BDT (৳ - টাকা)</option>
                      <option value="USD">USD ($ - ডলার)</option>
                      <option value="EUR">EUR (€ - ইউরো)</option>
                      <option value="GBP">GBP (£ - পাউন্ড)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {language === 'bn' ? 'ট্যাগলাইন বা সাবটাইটেল' : 'Tagline / Subtitle'}
                  </label>
                  <input
                    type="text"
                    value={tempTagline}
                    onChange={(e) => setTempTagline(e.target.value)}
                    placeholder="e.g. হোটেল রুম বুকিং, গেস্ট ডিসপ্যাচ ও স্বয়ংক্রিয় পেমেন্ট হাব"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={exportWhiteLabelConfig}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'কনফিগ ডাউনলোড (JSON)' : 'Export Config (.json)'}</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                  >
                    {language === 'bn' ? 'হোয়াইট-লেবেল প্রয়োগ করুন' : 'Apply White-Label'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CREDENTIALS & PITCH DISPATCH */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Linkedin className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-xs text-slate-200">
                      LinkedIn About & Professional Brand Bio
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(founderBio);
                      setCopiedBio(true);
                      setTimeout(() => setCopiedBio(false), 2000);
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold transition cursor-pointer"
                  >
                    {copiedBio ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBio ? 'Copied!' : 'Copy Bio'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                  "{founderBio}"
                </p>
              </div>

              {/* Links & Quick Share Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <Github className="w-4 h-4 text-white" />
                      <span>GitHub Repository & Profile</span>
                    </span>
                    <a
                      href="https://github.com/rsk934128-dot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">github.com/rsk934128-dot</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>Live NexusHub Sovereign URL</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(appUrl);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center space-x-1"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{appUrl}</p>
                </div>
              </div>

              {/* 1-Click WhatsApp Portfolio Dispatch */}
              <div className="pt-2">
                <button
                  onClick={sharePortfolioOnWhatsApp}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {language === 'bn'
                      ? 'হোয়াটসঅ্যাপে সম্পূর্ণ পোর্টফোলিও ও লাইভ লিংক ক্লায়েন্টকে পাঠান'
                      : 'Dispatch Full Portfolio & Live Demo via WhatsApp'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>NexusHub Sovereign Architecture • Built for Sheikh Farid</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
