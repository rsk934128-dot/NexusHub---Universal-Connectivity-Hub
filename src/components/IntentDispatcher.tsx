import React, { useState } from 'react';
import { Contact, ChannelType, Payment } from '../types';
import { Language, translations } from '../utils/i18n';
import {
  generateAutomatedInvoice,
  formatInvoiceMessage,
  getPendingBalanceForContact,
} from '../utils/paymentPipeline';
import {
  Send,
  MessageCircle,
  MessageSquare,
  Phone,
  Mail,
  Zap,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Briefcase,
  CreditCard,
  Receipt,
  AlertTriangle,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';

interface IntentDispatcherProps {
  contacts: Contact[];
  payments?: Payment[];
  language: Language;
  onDispatch: (channel: ChannelType, identifier: string, contactName: string, message: string, contactId?: string) => void;
  onRecordPayment?: (payment: Omit<Payment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
}

export const IntentDispatcher: React.FC<IntentDispatcherProps> = ({
  contacts,
  payments = [],
  language,
  onDispatch,
  onRecordPayment,
}) => {
  const t = translations[language];

  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [customTarget, setCustomTarget] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('whatsapp');
  const [message, setMessage] = useState<string>('');
  const [lastDispatched, setLastDispatched] = useState<string | null>(null);

  const [templateCategory, setTemplateCategory] = useState<'daily' | 'outreach' | 'saas' | 'finance'>('outreach');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Automated Invoicing & Payment Pipeline State
  const [showInvoicePanel, setShowInvoicePanel] = useState<boolean>(false);
  const [invoiceAmount, setInvoiceAmount] = useState<number>(1500);
  const [invoiceCurrency, setInvoiceCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [invoicePurpose, setInvoicePurpose] = useState<string>('হোটেল রুম বুকিং ও সার্ভিস ফি');
  const [stagedInvoice, setStagedInvoice] = useState<{
    invoiceId: string;
    paymentLink: string;
    amount: number;
    currency: 'BDT' | 'USD';
  } | null>(null);
  const [invoiceStatusMsg, setInvoiceStatusMsg] = useState<string | null>(null);

  // Selected contact and pending balance calculation
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const pendingDue = selectedContact
    ? getPendingBalanceForContact(payments, selectedContact.name, selectedContact.id)
    : { pendingCount: 0, pendingAmount: 0, currency: 'BDT' };

  const handleGenerateAndAttachInvoice = async () => {
    const contactName = selectedContact ? selectedContact.name : customTarget.trim() || 'Valued Client';
    const contactId = selectedContact ? selectedContact.id : undefined;

    const result = generateAutomatedInvoice({
      contactId,
      contactName,
      amount: invoiceAmount,
      currency: invoiceCurrency,
      purpose: invoicePurpose,
      gateway: 'sslcommerz',
    });

    setStagedInvoice({
      invoiceId: result.invoiceId,
      paymentLink: result.paymentLink,
      amount: result.amount,
      currency: result.currency as any,
    });

    const invoiceMsg = formatInvoiceMessage(
      contactName,
      result.amount,
      result.currency,
      result.invoiceId,
      result.paymentLink,
      invoicePurpose,
      language
    );

    setMessage((prev) => (prev ? `${prev}\n\n${invoiceMsg}` : invoiceMsg));
    setInvoiceStatusMsg(
      language === 'bn'
        ? `ইনভয়েস #${result.invoiceId} তৈরি ও মেসেজে যুক্ত হয়েছে!`
        : `Invoice #${result.invoiceId} generated and inserted!`
    );

    // Record immediately in Firestore or local state as pending
    if (onRecordPayment) {
      try {
        await onRecordPayment(result.paymentPayload);
      } catch (err) {
        console.error('Invoice recording error:', err);
      }
    }

    setTimeout(() => setInvoiceStatusMsg(null), 4000);
  };

  const categorizedTemplatesBn = {
    daily: [
      { title: 'আসছি ৫ মিনিটে', text: 'আসছি ৫ মিনিটের মধ্যে, অপেক্ষা করুন।' },
      { title: 'জরুরি মিটিং লিংক', text: 'জরুরি মিটিংয়ের লিংক পাঠিয়েছি, অনুগ্রহ করে চেক করে যোগ দিন।' },
      { title: 'ডকুমেন্টস রিভিউ', text: 'অফিসিয়াল ডকুমেন্টস ও ড্রাফট পর্যালোচনা করে দ্রুত ফিডব্যাক জানাবেন।' },
      { title: 'কল রিকোয়েস্ট', text: 'জরুরি কিছু বিষয়ে ৫ মিনিট কথা বলা প্রয়োজন। আপনি কি ফ্রি আছেন?' },
    ],
    outreach: [
      {
        title: 'LinkedIn হাই-টিকেট আর্কিটেক্ট পিচ',
        text: `Hi [Name], I noticed your team is scaling systems and integrating AI automation. 

As a Full-Stack Software Architect specializing in AI-driven microservices, real-time sync (Firestore/Firebase), and high-throughput communication hubs, I build production-grade platforms in days rather than months.

I recently architected "NexusHub Sovereign OS"—a multi-channel connectivity & automated dispatching platform with real-time audit intelligence. 

Would you be open to a brief 10-minute discovery chat this week to explore how we can 5x your development velocity and automate high-value workflows?

Best regards,
Md. Sheikh Farid | Software Architect`,
      },
      {
        title: 'Upwork / Freelance হাই-কনভার্টিং কভার লেটার',
        text: `Hello,

Your project caught my attention because it demands a battle-tested Software Architect who builds lean, production-ready full-stack applications with AI acceleration.

Why I can deliver this faster and cleaner:
1. High-Velocity AI Architecture: I develop systems with instant reactive databases (Firestore), ABAC security rules, and sub-second deep linking.
2. Production Experience: Architected enterprise solutions like NexusHub (Omni-channel dispatcher, payment integration, and AI code generation engines).
3. Zero Technical Debt: Strict TypeScript, modular React architecture, and bulletproof security.

I can share a live working demo and start immediately. Let’s jump on a quick chat to discuss the milestones.

Md. Sheikh Farid`,
      },
      {
        title: 'এআই অটোমেশন কনসাল্টিং অফার',
        text: `Hello [Business Owner],

Most businesses lose 15+ hours weekly on manual messaging, customer dispatching, and fragmented apps.

I build custom AI Agents & Universal Connectivity Hubs that automate:
- Instant multi-channel client notifications (WhatsApp, SMS, Email)
- Payment verification & automated digital invoicing (bKash/SSLCommerz/Stripe)
- Executive AI weekly analytics reports

Let's discuss how we can automate your core business operations. When would be a good time for a 10-minute demo?`,
      },
    ],
    saas: [
      {
        title: 'হোয়াইট-লেবেল হোটেল SaaS অফার লেটার',
        text: `সম্মানিত ব্যবস্থাপনা কর্তৃপক্ষ,

হোটেল আল শেখ ফরিদ ও হসপিটালিটি সেক্টরের জন্য আমরা তৈরি করেছি একটি সম্পূর্ণ ক্লাউড-সিঙ্কড 'Universal Hotel Management & Guest Dispatch Hub'।

এই সিস্টেমের মূল সুবিধাসমূহ:
১. এক ক্লিকে অতিথিকে হোয়াটসঅ্যাপে বুকিং কনফার্মেশন ও ডিজিটাল ইনভয়েস পাঠানো।
২. সরাসরি SSLCommerz (বিকাশ/নগদ/কার্ড) ও আন্তর্জাতিক Stripe পেমেন্ট কালেকশন।
৩. রুম অকুপেন্সি, সিজন ডিসকাউন্ট ও ভ্যাট অটো-ক্যালকুলেশন।
৪. ৩০ দিনের রিয়েল-টাইম গেস্ট ইন্টারঅ্যাকশন ও অডিট হিস্ট্রি।

আপনার হোটেল বা রিসোর্টের ব্র্যান্ড নামে এটি সম্পূর্ণ হোয়াইট-লেবেল সেটআপ করে দেওয়া সম্ভব। একটি লাইভ ডেমো দেখার জন্য যোগাযোগ করুন।

ধন্যবাদান্তে,
মোঃ শেখ ফরিদ | সিস্টেম আর্কিটেক্ট`,
      },
      {
        title: 'মাইক্রো-SaaS লাইসেন্সিং পিচ',
        text: `NexusHub Sovereign OS is now available as a turnkey White-Label Micro-SaaS for enterprises, logistics, and hospitality businesses.

Includes:
- Multi-channel intent router (WhatsApp, Telegram, Messenger, SMS, Calls)
- Automated payment ledger with instant receipt generation
- Self-evolving AI feature generator powered by Gemini Flash
- Full source code ownership or hosted subscription model

Inquire today for white-label licensing and pilot deployment.`,
      },
    ],
    finance: [
      { title: 'বুকিং ও পেমেন্ট রিসিট', text: 'হোটেল আল শেখ ফরিদ - আপনার রুম বুকিং ও পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে। ডিজিটাল ইনভয়েস রিসিট চেক করুন।' },
      { title: 'বকেয়া বিল রিমাইন্ডার', text: 'আপনার বিগত চালানের পেমেন্ট অপেক্ষমাণ রয়েছে। অনুগ্রহ করে চেক করে পেমেন্ট ক্লিয়ার করার অনুরোধ রইলো।' },
      { title: 'ইনভয়েস শেয়ার', text: 'আপনার সেবার বিপরীতে অফিসিয়াল ডিজিটাল ইনভয়েস প্রস্তুত করা হয়েছে। লিংক অথবা অ্যাটাচমেন্ট পর্যালোচনা করুন।' },
    ],
  };

  const categorizedTemplatesEn = {
    daily: [
      { title: 'On My Way (5m)', text: 'I am on my way, arriving in 5 minutes.' },
      { title: 'Meeting Link', text: 'Sent you the urgent meeting link. Please review and join.' },
      { title: 'Document Review', text: 'Please inspect the official documents and provide feedback.' },
      { title: 'Quick Call Request', text: 'Do you have 5 minutes for a quick priority call?' },
    ],
    outreach: categorizedTemplatesBn.outreach,
    saas: categorizedTemplatesBn.saas,
    finance: [
      { title: 'Receipt Confirmation', text: 'Payment receipt has been generated and verified. Thank you for your business!' },
      { title: 'Pending Clearance', text: 'Kindly review the pending payment statement and clear at your earliest convenience.' },
      { title: 'Invoice Sent', text: 'Official digital invoice is now available. Please review the details.' },
    ],
  };

  const activeCategoryList = (language === 'bn' ? categorizedTemplatesBn : categorizedTemplatesEn)[templateCategory];

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();

    let targetIdentifier = '';
    let targetName = '';
    let contactId: string | undefined = undefined;

    if (selectedContactId) {
      const contact = contacts.find((c) => c.id === selectedContactId);
      if (contact) {
        contactId = contact.id;
        targetName = contact.name;
        if (selectedChannel === 'whatsapp' || selectedChannel === 'call' || selectedChannel === 'sms') {
          targetIdentifier = contact.phone;
        } else if (selectedChannel === 'messenger') {
          targetIdentifier = contact.fbUsername || contact.phone;
        } else if (selectedChannel === 'telegram') {
          targetIdentifier = contact.telegramUsername || contact.phone;
        } else if (selectedChannel === 'email') {
          targetIdentifier = contact.email || '';
        }
      }
    } else {
      targetIdentifier = customTarget.trim();
      targetName = targetIdentifier || 'Direct Contact';
    }

    if (!targetIdentifier) {
      alert(language === 'bn' ? 'অনুগ্রহ করে কন্টাক্ট নির্বাচন করুন অথবা নম্বর লিখুন।' : 'Please select a contact or enter a target number.');
      return;
    }

    onDispatch(selectedChannel, targetIdentifier, targetName, message, contactId);
    setLastDispatched(`${targetName} via ${selectedChannel.toUpperCase()}`);
    setTimeout(() => setLastDispatched(null), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <span>{t.dispatchTitle}</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
              Intent Router
            </span>
          </h2>
          <p className="text-xs text-slate-400">{t.dispatchDesc}</p>
        </div>
      </div>

      <form onSubmit={handleExecute} className="space-y-5">
        {/* Contact Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.selectContact}
            </label>
            <select
              value={selectedContactId}
              onChange={(e) => {
                setSelectedContactId(e.target.value);
                if (e.target.value) setCustomTarget('');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- {language === 'bn' ? 'কন্টাক্ট তালিকা থেকে বাছুন' : 'Choose from saved contacts'} --</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.customTarget}
            </label>
            <input
              type="text"
              value={customTarget}
              disabled={!!selectedContactId}
              onChange={(e) => setCustomTarget(e.target.value)}
              placeholder="e.g. +8801700000000 or username"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
            />
          </div>
        </div>

        {/* Pending Due Alert Banner */}
        {selectedContact && pendingDue.pendingCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-300">
                  {language === 'bn' ? 'বকেয়া ইনভয়েস সতর্কতা:' : 'Outstanding Balance Alert:'}
                </span>{' '}
                <span className="text-white font-mono font-bold">
                  {pendingDue.currency === 'BDT' ? '৳' : pendingDue.currency} {pendingDue.pendingAmount.toLocaleString()}
                </span>{' '}
                <span className="text-slate-400 text-[11px]">
                  ({pendingDue.pendingCount} {language === 'bn' ? 'টি বিল অপেক্ষমাণ' : 'unpaid bills'})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const text =
                  language === 'bn'
                    ? `প্রিয় ${selectedContact.name}, আপনার একাউন্টে ${pendingDue.currency === 'BDT' ? '৳' : pendingDue.currency} ${pendingDue.pendingAmount.toLocaleString()}-এর বিগত ইনভয়েস অপেক্ষমাণ রয়েছে। অনুগ্রহ করে যত দ্রুত সম্ভব পেমেন্ট ক্লিয়ার করার অনুরোধ রইলো।`
                    : `Dear ${selectedContact.name}, you have an outstanding invoice balance of ${pendingDue.currency} ${pendingDue.pendingAmount.toLocaleString()}. Please arrange payment at your earliest convenience.`;
                setMessage(text);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-white font-bold text-[10px] transition cursor-pointer"
            >
              {language === 'bn' ? 'তাগাদা মেসেজ লোড করুন' : 'Load Due Reminder'}
            </button>
          </div>
        )}

        {/* Channel Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            {t.channelLabel}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-400', border: 'border-emerald-500' },
              { id: 'messenger', label: 'Messenger', icon: MessageSquare, color: 'text-blue-400', border: 'border-blue-500' },
              { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-400', border: 'border-sky-500' },
              { id: 'call', label: t.call, icon: Phone, color: 'text-indigo-400', border: 'border-indigo-500' },
              { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-purple-400', border: 'border-purple-500' },
              { id: 'email', label: 'Email', icon: Mail, color: 'text-teal-400', border: 'border-teal-500' },
            ].map((ch) => {
              const Icon = ch.icon;
              const isSelected = selectedChannel === ch.id;
              return (
                <button
                  type="button"
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id as ChannelType)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-xs font-medium ${
                    isSelected
                      ? `bg-slate-800 ${ch.border} ring-2 ring-indigo-500/20 text-white`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${ch.color}`} />
                  <span className="text-[11px] truncate max-w-full">{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Templates with Categorized Pitch & Outreach */}
        {selectedChannel !== 'call' && (
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'bn' ? 'রেডিমেড টেমপ্লেট ও ক্লায়েন্ট আউটরিচ পিচ' : 'Ready-Made Templates & Client Pitch Offers'}
                </label>
              </div>

              {/* Template Category Switcher */}
              <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-[10px]">
                {[
                  { id: 'outreach', label: language === 'bn' ? '💼 ক্লায়েন্ট আউটরিচ' : '💼 Outreach' },
                  { id: 'saas', label: language === 'bn' ? '🏨 SaaS ও হোটেল' : '🏨 SaaS Offer' },
                  { id: 'finance', label: language === 'bn' ? '৳ পেমেন্ট' : '৳ Payments' },
                  { id: 'daily', label: language === 'bn' ? '⚡ দৈনন্দিন' : '⚡ Daily' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTemplateCategory(cat.id as any)}
                    className={`px-2 py-1 rounded-md font-medium transition ${
                      templateCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeCategoryList.map((template, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 transition flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs truncate">
                      {template.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(template.text);
                        setCopiedIndex(idx);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }}
                      className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition"
                      title="Copy full text to clipboard"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 font-sans">
                    {template.text}
                  </p>

                  <button
                    type="button"
                    onClick={() => setMessage(template.text)}
                    className="w-full py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-bold transition flex items-center justify-center space-x-1"
                  >
                    <span>{language === 'bn' ? 'মেসেজ বক্সে বসান' : 'Apply to Message Box'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automated Invoicing & Payment Pipeline Panel */}
        {selectedChannel !== 'call' && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">
                  {language === 'bn' ? 'অটো-ইনভয়েস ও পেমেন্ট লিঙ্ক জেনারেটর' : 'Automated Invoicing & Payment Link'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  SSLCommerz / Stripe
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowInvoicePanel(!showInvoicePanel)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>
                  {showInvoicePanel
                    ? language === 'bn' ? 'লুকান' : 'Hide'
                    : language === 'bn' ? '+ ইনভয়েস সংযুক্ত করুন' : '+ Attach Invoice'}
                </span>
              </button>
            </div>

            {showInvoicePanel && (
              <div className="pt-2 border-t border-slate-800 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      {language === 'bn' ? 'বিলের পরিমাণ' : 'Amount'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      {language === 'bn' ? 'মুদ্রা' : 'Currency'}
                    </label>
                    <select
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="BDT">BDT (৳ - টাকা)</option>
                      <option value="USD">USD ($ - ডলার)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      {language === 'bn' ? 'বিবরণ বা সার্ভিস' : 'Purpose / Service'}
                    </label>
                    <input
                      type="text"
                      value={invoicePurpose}
                      onChange={(e) => setInvoicePurpose(e.target.value)}
                      placeholder="e.g. হোটেল রুম বুকিং"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Quick Amount Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-400">{language === 'bn' ? 'দ্রুত পরিমাণ:' : 'Quick Amounts:'}</span>
                  {[500, 1500, 3500, 5000, 8500, 15000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInvoiceAmount(amt)}
                      className={`px-2 py-0.5 rounded-md border font-mono transition cursor-pointer ${
                        invoiceAmount === amt
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      ৳ {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    * {language === 'bn' ? 'লিংক তৈরি হলে ফায়ারস্টোরে পেন্ডিং পেমেন্ট সংরক্ষিত হবে' : 'Pending payment record will be logged in Firestore'}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAndAttachInvoice}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'bn' ? 'ইনভয়েস তৈরি ও মেসেজে বসান' : 'Generate & Insert Invoice'}</span>
                  </button>
                </div>
              </div>
            )}

            {invoiceStatusMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{invoiceStatusMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Message Body */}
        {selectedChannel !== 'call' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.messageBody}
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type customized dispatch message..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {lastDispatched ? (
            <div className="flex items-center space-x-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dispatched to {lastDispatched}! Logged in Cloud.</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              * Direct deep linking triggers your native OS application handler.
            </span>
          )}

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{t.sendAndLog}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
