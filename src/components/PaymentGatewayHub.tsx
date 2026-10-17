import React, { useState, useMemo } from 'react';
import { Payment, Contact, PaymentGateway, PaymentStatus } from '../types';
import { Language, translations } from '../utils/i18n';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Download,
  Share2,
  MessageCircle,
  Phone,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  Printer,
  X,
} from 'lucide-react';

interface PaymentGatewayHubProps {
  payments: Payment[];
  contacts: Contact[];
  language: Language;
  onRecordPayment: (data: Omit<Payment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  onUpdateStatus: (paymentId: string, status: PaymentStatus, notes?: string) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
  onLoadSamplePayments?: () => Promise<void>;
}

export const PaymentGatewayHub: React.FC<PaymentGatewayHubProps> = ({
  payments,
  contacts,
  language,
  onRecordPayment,
  onUpdateStatus,
  onDeletePayment,
  onLoadSamplePayments,
}) => {
  const t = translations[language];

  // Filters & State
  const [filterGateway, setFilterGateway] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Form State
  const [selectedContactId, setSelectedContactId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState<number>(5000);
  const [currency, setCurrency] = useState<'BDT' | 'USD' | 'EUR' | 'GBP'>('BDT');
  const [gateway, setGateway] = useState<PaymentGateway>('sslcommerz');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [purpose, setPurpose] = useState('হোটেল আল শেখ ফরিদ - রুম বুকিং ও রিজার্ভেশন');
  const [status, setStatus] = useState<PaymentStatus>('completed');
  const [notes, setNotes] = useState('');

  // Pre-set purposes
  const presetPurposes = [
    'হোটেল আল শেখ ফরিদ - রুম বুকিং ও রিজার্ভেশন',
    'Hotel Al-Noor VIP Suite Reservation',
    'রেস্তোরাঁ ও ক্যাটারিং বিল পেমেন্ট',
    'Sirajganj Enterprise Supply - ট্রেডিং চালান',
    'NexusHub Software License & IT Consulting',
  ];

  // Financial Statistics
  const stats = useMemo(() => {
    let totalBdt = 0;
    let totalUsd = 0;
    let completedCount = 0;
    let pendingCount = 0;

    payments.forEach((p) => {
      if (p.status === 'completed') {
        completedCount++;
        if (p.currency === 'BDT') totalBdt += p.amount;
        else if (p.currency === 'USD') totalUsd += p.amount;
        else totalBdt += p.amount; // fallback
      } else if (p.status === 'pending') {
        pendingCount++;
      }
    });

    return {
      totalBdt,
      totalUsd,
      completedCount,
      pendingCount,
      totalCount: payments.length,
    };
  }, [payments]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesGateway = filterGateway === 'all' || p.gateway === filterGateway;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.contactName.toLowerCase().includes(query) ||
        p.transactionRef.toLowerCase().includes(query) ||
        p.purpose.toLowerCase().includes(query) ||
        (p.notes && p.notes.toLowerCase().includes(query));

      return matchesGateway && matchesStatus && matchesSearch;
    });
  }, [payments, filterGateway, filterStatus, searchQuery]);

  // Gateway Badge
  const getGatewayBadge = (gw: PaymentGateway) => {
    switch (gw) {
      case 'sslcommerz':
        return {
          label: 'SSLCommerz (BD)',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'stripe':
        return {
          label: 'Stripe (Global)',
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        };
      case 'bkash_direct':
        return {
          label: 'bKash / Nagad',
          bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        };
      case 'cash':
        return {
          label: 'Cash / Desk',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      default:
        return {
          label: gw,
          bg: 'bg-slate-700 text-slate-300 border-slate-600',
        };
    }
  };

  // Status Badge
  const getStatusBadge = (st: PaymentStatus) => {
    switch (st) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'failed':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'refunded':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    }
  };

  // Handle Contact Pick in modal
  const handleSelectContact = (cId: string) => {
    setSelectedContactId(cId);
    if (cId) {
      const c = contacts.find((item) => item.id === cId);
      if (c) {
        setCustomerName(c.name);
        setCustomerPhone(c.phone);
      }
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || amount <= 0) {
      alert('অনুগ্রহ করে গ্রাহকের নাম ও সঠিক পরিমাণ লিখুন।');
      return;
    }

    try {
      setIsSubmitting(true);
      const generatedTrx =
        gateway === 'sslcommerz'
          ? `SSLCZ-${Date.now().toString(36).toUpperCase()}`
          : gateway === 'stripe'
          ? `ch_${Math.random().toString(36).substring(2, 12)}`
          : `MFS-${Date.now().toString().slice(-8)}`;

      const newId = await onRecordPayment({
        contactId: selectedContactId || '',
        contactName: customerName.trim(),
        amount: Number(amount),
        currency,
        gateway,
        paymentMethod,
        status,
        transactionRef: generatedTrx,
        purpose: purpose.trim(),
        notes: notes.trim() + (customerPhone ? ` [Phone: ${customerPhone}]` : ''),
      });

      // Show digital receipt
      setActiveReceipt({
        id: newId,
        ownerId: 'active',
        contactId: selectedContactId,
        contactName: customerName.trim(),
        amount: Number(amount),
        currency,
        gateway,
        paymentMethod,
        status,
        transactionRef: generatedTrx,
        purpose: purpose.trim(),
        notes: notes.trim() + (customerPhone ? ` [Phone: ${customerPhone}]` : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setIsCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Share Invoice
  const shareInvoiceViaWhatsApp = (payment: Payment) => {
    const phone =
      customerPhone ||
      contacts.find((c) => c.name.toLowerCase() === payment.contactName.toLowerCase())?.phone ||
      '';

    const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^\+/, '');
    const invoiceMsg = `*হোটেল আল শেখ ফরিদ / NexusHub Finance Receipt*
────────────────────────
গ্রাহক: ${payment.contactName}
ইনভয়েস/TRX: ${payment.transactionRef}
পরিমাণ: ${payment.currency} ${payment.amount.toLocaleString()}
মাধ্যম: ${payment.paymentMethod} (${payment.gateway.toUpperCase()})
বিবরণ: ${payment.purpose}
স্ট্যাটাস: ${payment.status === 'completed' ? 'পরিশোধিত (PAID)' : 'অপেক্ষমাণ (PENDING)'}
তারিখ: ${new Date(payment.createdAt).toLocaleDateString('bn-BD')}
────────────────────────
আমাদের সাথে লেনদেন করার জন্য ধন্যবাদ!`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(invoiceMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(invoiceMsg)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Export Payments JSON
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(payments, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexushub_finance_export_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>{t.financeTitle}</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>SSLCommerz & Stripe Hub</span>
              </span>
            </h2>
            <p className="text-xs text-slate-400">{t.financeDesc}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onLoadSamplePayments && payments.length === 0 && (
            <button
              onClick={async () => {
                setIsLoadingSample(true);
                try {
                  await onLoadSamplePayments();
                } finally {
                  setIsLoadingSample(false);
                }
              }}
              disabled={isLoadingSample}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoadingSample ? 'Loading...' : 'নমুনা হোটেল ও ব্যবসা বিল লোড'}</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedContactId('');
              setCustomerName('');
              setCustomerPhone('');
              setAmount(5000);
              setIsCreateOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newPayment}</span>
          </button>

          {payments.length > 0 && (
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
              title="Download Finance Records (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">{t.totalRevenue} (BDT)</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
            ৳ {stats.totalBdt.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">
            {stats.completedCount} সফল লেনদেন
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Global Stripe (USD)</span>
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-400 font-mono">
            $ {stats.totalUsd.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">International checkout</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">{t.successfulTx}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">
            {stats.completedCount}
          </p>
          <span className="text-[10px] text-teal-400 font-medium">100% verified ledger</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">{t.pendingTx}</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
            {stats.pendingCount}
          </p>
          <span className="text-[10px] text-slate-400">Awaiting clearance</span>
        </div>
      </div>

      {/* Gateway Switcher Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
        <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            ৳
          </div>
          <div className="text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-100">SSLCommerz Gateway Engine</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                Bangladesh
              </span>
            </div>
            <p className="text-slate-400 mt-0.5 text-[11px]">
              Direct bKash, Nagad, Rocket, DBBL, City Bank & Visa/Mastercard processing with instant IPN webhooks.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-indigo-500/20">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
            $
          </div>
          <div className="text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-100">Stripe Global Processing</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                Worldwide
              </span>
            </div>
            <p className="text-slate-400 mt-0.5 text-[11px]">
              Accept payments across 135+ currencies for international guests, VIP bookings & export clients.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, TRX ID, or purpose..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Gateway Filter */}
          <select
            value={filterGateway}
            onChange={(e) => setFilterGateway(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Gateways</option>
            <option value="sslcommerz">SSLCommerz</option>
            <option value="stripe">Stripe</option>
            <option value="bkash_direct">bKash Direct</option>
            <option value="cash">Cash / Counter</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed (Paid)</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payments List / Table */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40">
          <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300 mb-1">কোনো লেনদেন রেকর্ড পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            নতুন পেমেন্ট রেকর্ড করুন অথবা নমুনা লেনদেন ডাটা লোড করে টেস্ট করুন।
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            {t.newPayment}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPayments.map((payment) => {
            const gwInfo = getGatewayBadge(payment.gateway);
            const dateStr = new Date(payment.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const timeStr = new Date(payment.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 transition gap-3"
              >
                <div className="flex items-start sm:items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700 font-bold text-sm text-emerald-400">
                    {payment.currency === 'BDT' ? '৳' : '$'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-100 text-sm truncate">
                        {payment.contactName}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${gwInfo.bg}`}
                      >
                        {gwInfo.label}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="font-mono text-indigo-300">
                        {payment.transactionRef}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-xs">{payment.purpose}</span>
                      <span>•</span>
                      <span className="text-slate-500 text-[11px] font-mono">
                        {dateStr} {timeStr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <p className="text-base font-extrabold text-white font-mono">
                      {payment.currency === 'BDT' ? '৳' : '$'}{' '}
                      {payment.amount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400">{payment.paymentMethod}</p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setActiveReceipt(payment)}
                      className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
                      title="View Digital Invoice"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    </button>

                    <button
                      onClick={() => shareInvoiceViaWhatsApp(payment)}
                      className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition"
                      title="Share Invoice via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick status cycle button */}
                    <button
                      onClick={() => {
                        const nextStatus: PaymentStatus =
                          payment.status === 'pending'
                            ? 'completed'
                            : payment.status === 'completed'
                            ? 'refunded'
                            : 'pending';
                        onUpdateStatus(payment.id, nextStatus);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition"
                      title={`Change Status (Current: ${payment.status})`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeletePayment(payment.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Payment / Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>নতুন পেমেন্ট / ইনভয়েস তৈরি করুন</span>
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              {/* Select Existing Contact or Custom */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  কন্টাক্ট নির্বাচন করুন (ঐচ্ছিক)
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => handleSelectContact(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- কাস্টম গ্রাহকের নাম লিখুন --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {c.organization ? `• ${c.organization}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    গ্রাহকের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Lamisa Aktar Raisha"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+88017..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    পরিমাণ *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    মুদ্রা (Currency)
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BDT">BDT (৳ - টাকা)</option>
                    <option value="USD">USD ($ - ডলার)</option>
                    <option value="EUR">EUR (€ - ইউরো)</option>
                    <option value="GBP">GBP (£ - পাউন্ড)</option>
                  </select>
                </div>
              </div>

              {/* Gateway & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    পেমেন্ট গেটওয়ে
                  </label>
                  <select
                    value={gateway}
                    onChange={(e) => {
                      const gw = e.target.value as PaymentGateway;
                      setGateway(gw);
                      if (gw === 'sslcommerz') setPaymentMethod('bKash');
                      else if (gw === 'stripe') setPaymentMethod('Visa / Mastercard');
                      else if (gw === 'bkash_direct') setPaymentMethod('bKash Personal');
                      else setPaymentMethod('Cash Counter');
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="sslcommerz">SSLCommerz (bKash/Nagad/Cards)</option>
                    <option value="stripe">Stripe (Global Card Checkout)</option>
                    <option value="bkash_direct">bKash / Nagad Direct</option>
                    <option value="cash">Cash / Front Desk Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    মাধ্যম (Payment Method)
                  </label>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="e.g. bKash / Nagad / Visa"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Purpose & Presets */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  পেমেন্টের উদ্দেশ্য / সার্ভিস
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {presetPurposes.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setPurpose(p)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  পেমেন্ট স্ট্যাটাস
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['completed', 'pending', 'refunded'] as PaymentStatus[]).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setStatus(st)}
                      className={`py-1.5 rounded-lg border font-medium capitalize text-center transition ${
                        status === st
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  অতিরিক্ত নোট
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="রুম নম্বর, বিশেষ নির্দেশাবলী বা রেফারেন্স..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'প্রসেস হচ্ছে...' : 'পেমেন্ট সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Receipt / Invoice Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            {/* Invoice Card Top */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shadow">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100">
                    হোটেল আল শেখ ফরিদ
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    NexusHub Sovereign Finance • Invoice
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveReceipt(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Details Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ইনভয়েস / TRX ID</span>
                <span className="font-mono font-bold text-indigo-400">
                  {activeReceipt.transactionRef}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">গ্রাহক</span>
                <span className="font-bold text-white">{activeReceipt.contactName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">বিবরণ</span>
                <span className="font-medium text-slate-200 text-right max-w-[200px] truncate">
                  {activeReceipt.purpose}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">গেটওয়ে ও মেথড</span>
                <span className="text-emerald-400 font-medium">
                  {activeReceipt.paymentMethod} ({activeReceipt.gateway.toUpperCase()})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">তারিখ ও সময়</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {new Date(activeReceipt.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-bold">মোট পরিশোধিত পরিমাণ</span>
                <span className="font-mono font-extrabold text-lg text-emerald-400">
                  {activeReceipt.currency === 'BDT' ? '৳' : '$'}{' '}
                  {activeReceipt.amount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 text-[11px]">স্ট্যাটাস</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeReceipt.status === 'completed' ? 'PAID & VERIFIED' : activeReceipt.status}
                </span>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => shareInvoiceViaWhatsApp(activeReceipt)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t.invoiceShare}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>প্রিন্ট ইনভয়েস (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
