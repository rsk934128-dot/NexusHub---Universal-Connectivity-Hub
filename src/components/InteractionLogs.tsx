import React, { useState, useMemo } from 'react';
import { InteractionLog, ChannelType } from '../types';
import { Language, translations } from '../utils/i18n';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  History,
  Phone,
  MessageCircle,
  MessageSquare,
  Send,
  Mail,
  Search,
  Download,
  Calendar,
  Clock,
  ExternalLink,
  BarChart3,
  TrendingUp,
  UserCheck,
  Activity,
  Layers,
  Sparkles,
  Users,
  User,
  Filter,
  X,
  ArrowUpRight,
} from 'lucide-react';

interface InteractionLogsProps {
  logs: InteractionLog[];
  language: Language;
  onGenerateSampleLogs?: () => Promise<void>;
}

export interface ContactFrequencyEntry {
  contactName: string;
  total: number;
  whatsapp: number;
  call: number;
  sms: number;
  messenger: number;
  telegram: number;
  email: number;
  primaryChannel: ChannelType;
  lastInteraction: string;
}

// Channel colors matching the system theme
const CHANNEL_COLORS: Record<ChannelType, string> = {
  whatsapp: '#10B981', // emerald-500
  call: '#6366F1',     // indigo-500
  sms: '#A855F7',      // purple-500
  messenger: '#3B82F6',// blue-500
  telegram: '#0EA5E9', // sky-500
  email: '#14B8A6',    // teal-500
};

export const InteractionLogs: React.FC<InteractionLogsProps> = ({
  logs,
  language,
  onGenerateSampleLogs,
}) => {
  const t = translations[language];

  // Dashboard & Filter States
  const [analyticsView, setAnalyticsView] = useState<'contacts' | 'timeline'>('contacts');
  const [chartMode, setChartMode] = useState<'stacked' | 'total'>('stacked');
  const [contactLimit, setContactLimit] = useState<number>(8);
  const [selectedContactFilter, setSelectedContactFilter] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute 30-day timeline and contact-frequency analytics
  const { timelineData, contactFrequencyData, stats, topContacts } = useMemo(() => {
    const daysMap = new Map<
      string,
      {
        dateKey: string;
        dateLabel: string;
        shortDate: string;
        total: number;
        whatsapp: number;
        call: number;
        sms: number;
        messenger: number;
        telegram: number;
        email: number;
      }
    >();

    const now = new Date();
    // Build 30 days from 29 days ago until today
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
      const shortDate = d.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
      });

      daysMap.set(dateKey, {
        dateKey,
        dateLabel,
        shortDate,
        total: 0,
        whatsapp: 0,
        call: 0,
        sms: 0,
        messenger: 0,
        telegram: 0,
        email: 0,
      });
    }

    const channelCounts: Record<ChannelType, number> = {
      whatsapp: 0,
      call: 0,
      sms: 0,
      messenger: 0,
      telegram: 0,
      email: 0,
    };

    const contactMap = new Map<string, ContactFrequencyEntry>();
    let totalLast30DaysCount = 0;

    // Filter and aggregate logs that fell within the last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    logs.forEach((log) => {
      if (!log.timestamp) return;
      const logDate = new Date(log.timestamp);
      if (logDate >= thirtyDaysAgo) {
        totalLast30DaysCount++;
        const dateKey = log.timestamp.split('T')[0];

        if (daysMap.has(dateKey)) {
          const dayEntry = daysMap.get(dateKey)!;
          dayEntry.total += 1;
          const ch = log.channel as ChannelType;
          if (ch in dayEntry) {
            dayEntry[ch] += 1;
          }
        }

        const ch = log.channel as ChannelType;
        if (ch in channelCounts) {
          channelCounts[ch] = (channelCounts[ch] || 0) + 1;
        }

        // Contact frequency aggregation
        const cName = log.contactName?.trim() || 'Unknown';
        if (!contactMap.has(cName)) {
          contactMap.set(cName, {
            contactName: cName,
            total: 1,
            whatsapp: ch === 'whatsapp' ? 1 : 0,
            call: ch === 'call' ? 1 : 0,
            sms: ch === 'sms' ? 1 : 0,
            messenger: ch === 'messenger' ? 1 : 0,
            telegram: ch === 'telegram' ? 1 : 0,
            email: ch === 'email' ? 1 : 0,
            primaryChannel: ch,
            lastInteraction: log.timestamp,
          });
        } else {
          const entry = contactMap.get(cName)!;
          entry.total += 1;
          if (ch in entry) {
            entry[ch] += 1;
          }
          if (new Date(log.timestamp) > new Date(entry.lastInteraction)) {
            entry.lastInteraction = log.timestamp;
            entry.primaryChannel = ch;
          }
        }
      }
    });

    // Determine top channel
    let topChannelName: ChannelType = 'whatsapp';
    let maxChannelCount = -1;
    (Object.keys(channelCounts) as ChannelType[]).forEach((ch) => {
      if (channelCounts[ch] > maxChannelCount) {
        maxChannelCount = channelCounts[ch];
        topChannelName = ch;
      }
    });

    // Sorted contact frequency list
    const sortedContactList = Array.from(contactMap.values()).sort((a, b) => b.total - a.total);
    const activeContactsCount = sortedContactList.length;
    const avgPerContact = activeContactsCount > 0 ? (totalLast30DaysCount / activeContactsCount).toFixed(1) : '0';
    const dailyAvg = (totalLast30DaysCount / 30).toFixed(1);

    return {
      timelineData: Array.from(daysMap.values()),
      contactFrequencyData: sortedContactList,
      stats: {
        total30Days: totalLast30DaysCount,
        dailyAverage: dailyAvg,
        activeContactsCount,
        avgPerContact,
        topChannel: maxChannelCount > 0 ? topChannelName : 'N/A',
        topChannelCount: maxChannelCount > 0 ? maxChannelCount : 0,
        activeDays: Array.from(daysMap.values()).filter((d) => d.total > 0).length,
      },
      topContacts: sortedContactList.slice(0, 5),
    };
  }, [logs, language]);

  // Displayed Contact Frequency slice based on user limit
  const displayedContacts = useMemo(() => {
    if (contactLimit === 0) return contactFrequencyData;
    return contactFrequencyData.slice(0, contactLimit);
  }, [contactFrequencyData, contactLimit]);

  const getChannelIcon = (channel: ChannelType) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'messenger':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-sky-400" />;
      case 'call':
        return <Phone className="w-4 h-4 text-indigo-400" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-teal-400" />;
      default:
        return <ExternalLink className="w-4 h-4 text-slate-400" />;
    }
  };

  const getChannelBadge = (channel: ChannelType) => {
    switch (channel) {
      case 'whatsapp':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'messenger':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'telegram':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
      case 'call':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'sms':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'email':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesChannel = filterChannel === 'all' || log.channel === filterChannel;
    const matchesContactFilter =
      !selectedContactFilter ||
      log.contactName.toLowerCase() === selectedContactFilter.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      log.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.messageSummary && log.messageSummary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesChannel && matchesContactFilter && matchesSearch;
  });

  const exportLogsAsJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_logs_export_${Date.now()}.json`;
    a.click();
  };

  // Custom Tooltip for Timeline Bar Chart
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayTotal = payload.reduce((sum: number, p: any) => sum + (Number(p.value) || 0), 0);
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur text-xs space-y-1.5 min-w-[170px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200">{label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              {dayTotal} total
            </span>
          </div>
          {payload.map((entry: any, index: number) => {
            if (!entry.value) return null;
            return (
              <div key={`entry-${index}`} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="capitalize">{entry.name}:</span>
                </span>
                <span className="font-mono font-bold text-white">{entry.value}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Contact Frequency Bar Chart
  const CustomContactTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const contactData = payload[0]?.payload as ContactFrequencyEntry;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl backdrop-blur text-xs space-y-2 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                {label?.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-bold text-slate-100">{label}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              {contactData?.total || 0} total
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            {payload.map((entry: any, index: number) => {
              if (!entry.value || entry.value === 0) return null;
              return (
                <div key={`contact-tip-${index}`} className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span className="flex items-center space-x-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="capitalize">{entry.name}:</span>
                  </span>
                  <span className="font-mono font-bold text-white">{entry.value}</span>
                </div>
              );
            })}
          </div>

          {contactData?.lastInteraction && (
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Last contacted:</span>
              <span className="font-mono text-slate-300">
                {new Date(contactData.lastInteraction).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl max-w-5xl mx-auto space-y-6">
      {/* Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>{language === 'bn' ? 'ইন্টারঅ্যাকশন অ্যানালিটিক্স ও লগ' : 'Interaction Analytics & Audit Logs'}</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                {logs.length} Total Logs
              </span>
            </h2>
            <p className="text-xs text-slate-400">{t.interactionAnalyticsDesc}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGenerateSampleLogs && logs.length < 5 && (
            <button
              onClick={async () => {
                setIsGenerating(true);
                try {
                  await onGenerateSampleLogs();
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer"
              title="Populate historical logs to test contact analytics"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : (language === 'bn' ? 'নমুনা ৩০ দিনের লগ লোড' : 'Load 30-Day Demo Logs')}</span>
            </button>
          )}

          {logs.length > 0 && (
            <button
              onClick={exportLogsAsJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* 30-Day Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">{t.totalLast30Days}</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">
            {stats.total30Days}
          </p>
          <span className="text-[10px] text-slate-400">
            Across {stats.activeDays} active days
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">{t.activeContacts}</span>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
            {stats.activeContactsCount}
          </p>
          <span className="text-[10px] text-slate-400">Unique communicators</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">{t.avgPerContact}</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-teal-400 font-mono">
            {stats.avgPerContact}
          </p>
          <span className="text-[10px] text-slate-400">Interactions / contact</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">{t.topContactsTitle}</span>
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {topContacts[0]?.contactName || 'N/A'}
          </p>
          <span className="text-[10px] text-purple-300 font-mono">
            {topContacts[0] ? `${topContacts[0].total} interactions` : 'No data yet'}
          </span>
        </div>
      </div>

      {/* Interaction Analytics Recharts Dashboard Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
        {/* Dashboard Controls: Switcher (Contact Frequency vs Timeline) and Mode */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-700/50">
          <div className="flex items-center space-x-2">
            {/* View Switcher: Contact Frequency vs Daily Timeline */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setAnalyticsView('contacts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  analyticsView === 'contacts'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t.contactFrequencyTab}</span>
              </button>

              <button
                onClick={() => setAnalyticsView('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  analyticsView === 'timeline'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.timelineTab}</span>
              </button>
            </div>
          </div>

          {/* Right Controls: Stacked vs Total & Contact Limit */}
          <div className="flex flex-wrap items-center gap-2">
            {analyticsView === 'contacts' && (
              <div className="flex items-center space-x-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 font-medium">Show:</span>
                {[5, 8, 15, 0].map((lim) => (
                  <button
                    key={lim}
                    onClick={() => setContactLimit(lim)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      contactLimit === lim
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lim === 0 ? 'All' : `Top ${lim}`}
                  </button>
                ))}
              </div>
            )}

            {/* Toggle Stacked vs Total */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setChartMode('stacked')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer ${
                  chartMode === 'stacked'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Channels</span>
              </button>
              <button
                onClick={() => setChartMode('total')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  chartMode === 'total'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Total Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart Header Explanation */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {analyticsView === 'contacts'
                ? (language === 'bn'
                    ? `বিগত ৩০ দিনে বিভিন্ন কন্টাক্টের সাথে যোগাযোগের ফ্রিকোয়েন্সি (${displayedContacts.length} জন কন্টাক্ট প্রদর্শিত)`
                    : `Interaction frequency with different contacts over the last 30 days (${displayedContacts.length} contacts plotted)`)
                : (language === 'bn'
                    ? 'বিগত ৩০ দিনের দৈনিক যোগাযোগের পরিমাণ ও চ্যানেল বিশ্লেষণ'
                    : 'Daily communication volume over the last 30 calendar days')}
            </span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            * কন্টাক্ট বারে ক্লিক করে ফিল্টার করুন
          </span>
        </div>

        {/* RECHARTS BAR CHART */}
        <div className="w-full h-72 sm:h-80 pt-2">
          {analyticsView === 'contacts' ? (
            displayedContacts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 border border-dashed border-slate-700/50 rounded-xl">
                <Users className="w-8 h-8 text-slate-600" />
                <span className="text-xs">বিগত ৩০ দিনে কোনো যোগাযোগের রেকর্ড পাওয়া যায়নি।</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedContacts}
                  margin={{ top: 15, right: 15, left: -20, bottom: 45 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      const clickedName = state.activePayload[0].payload.contactName;
                      if (clickedName) {
                        setSelectedContactFilter(clickedName);
                        setSearchQuery('');
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="contactName"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomContactTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      paddingBottom: '10px',
                      fontSize: '11px',
                      color: '#94A3B8',
                    }}
                  />

                  {chartMode === 'stacked' ? (
                    <>
                      <Bar dataKey="whatsapp" name="WhatsApp" stackId="contactStack" fill={CHANNEL_COLORS.whatsapp} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="call" name="Calls" stackId="contactStack" fill={CHANNEL_COLORS.call} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="sms" name="SMS" stackId="contactStack" fill={CHANNEL_COLORS.sms} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="messenger" name="Messenger" stackId="contactStack" fill={CHANNEL_COLORS.messenger} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="telegram" name="Telegram" stackId="contactStack" fill={CHANNEL_COLORS.telegram} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="email" name="Email" stackId="contactStack" fill={CHANNEL_COLORS.email} radius={[3, 3, 0, 0]} />
                    </>
                  ) : (
                    <Bar
                      dataKey="total"
                      name="Total Interactions"
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            /* Timeline View */
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timelineData}
                margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                  dy={6}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTimelineTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    paddingBottom: '10px',
                    fontSize: '11px',
                    color: '#94A3B8',
                  }}
                />

                {chartMode === 'stacked' ? (
                  <>
                    <Bar dataKey="whatsapp" name="WhatsApp" stackId="timeStack" fill={CHANNEL_COLORS.whatsapp} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="call" name="Calls" stackId="timeStack" fill={CHANNEL_COLORS.call} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="sms" name="SMS" stackId="timeStack" fill={CHANNEL_COLORS.sms} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="messenger" name="Messenger" stackId="timeStack" fill={CHANNEL_COLORS.messenger} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="telegram" name="Telegram" stackId="timeStack" fill={CHANNEL_COLORS.telegram} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="email" name="Email" stackId="timeStack" fill={CHANNEL_COLORS.email} radius={[3, 3, 0, 0]} />
                  </>
                ) : (
                  <Bar
                    dataKey="total"
                    name="Total Interactions"
                    fill="#6366F1"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Communicators Leaderboard Strip & Interactive Filter */}
        {topContacts.length > 0 && (
          <div className="pt-3 border-t border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'bn' ? 'শীর্ষ যোগাযোগকৃত কন্টাক্টসমূহ (ক্লিক করে অডিট লগ দেখুন):' : 'Top Communicators (Click to filter audit logs):'}
              </span>
              {selectedContactFilter && (
                <button
                  onClick={() => setSelectedContactFilter(null)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <span>Clear Filter</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {topContacts.map((contact, idx) => {
                const isSelected = selectedContactFilter === contact.contactName;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedContactFilter(null);
                      } else {
                        setSelectedContactFilter(contact.contactName);
                        setSearchQuery('');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                        : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200 text-xs truncate block">
                          {contact.contactName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-5">
                        {contact.total} interactions
                      </span>
                    </div>

                    <div className="shrink-0">
                      {getChannelIcon(contact.primaryChannel)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar for List */}
      <div className="space-y-2 pt-2">
        {selectedContactFilter && (
          <div className="flex items-center justify-between bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {language === 'bn' ? 'ফিল্টার করা হচ্ছে:' : 'Filtering by contact:'}{' '}
                <strong className="text-white font-bold">{selectedContactFilter}</strong>
              </span>
            </span>
            <button
              onClick={() => setSelectedContactFilter(null)}
              className="text-xs hover:text-white flex items-center space-x-1"
            >
              <span>{language === 'bn' ? 'ফিল্টার সরান' : 'Remove Filter'}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by contact name or message..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'whatsapp', 'call', 'sms', 'messenger', 'telegram', 'email'].map((ch) => (
              <button
                key={ch}
                onClick={() => setFilterChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize whitespace-nowrap transition cursor-pointer ${
                  filterChannel === ch
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/50">
          <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300 mb-1">{t.noLogs}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{t.noLogsDesc}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((log) => {
            const dateObj = new Date(log.timestamp);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700/80">
                    {getChannelIcon(log.channel)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4
                        onClick={() => setSelectedContactFilter(log.contactName)}
                        className="font-semibold text-slate-100 text-xs sm:text-sm truncate cursor-pointer hover:text-indigo-300 transition"
                      >
                        {log.contactName}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getChannelBadge(
                          log.channel
                        )}`}
                      >
                        {log.channel}
                      </span>
                    </div>
                    {log.messageSummary && (
                      <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md mt-0.5 font-mono">
                        "{log.messageSummary}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="flex items-center justify-end space-x-1 text-slate-300 text-xs font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{timeStr}</span>
                  </div>
                  <div className="flex items-center justify-end space-x-1 text-slate-500 text-[10px]">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
