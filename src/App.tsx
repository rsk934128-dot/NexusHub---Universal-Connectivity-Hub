import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ContactCard } from './components/ContactCard';
import { ContactModal } from './components/ContactModal';
import { IntentDispatcher } from './components/IntentDispatcher';
import { InteractionLogs } from './components/InteractionLogs';
import { DeviceBridge } from './components/DeviceBridge';
import { ExportImportModal } from './components/ExportImportModal';
import { PaymentGatewayHub } from './components/PaymentGatewayHub';
import { AIDevConsole } from './components/AIDevConsole';
import { FoundersCommandCenter } from './components/FoundersCommandCenter';
import { Contact, InteractionLog, SyncPacket, ChannelType, Payment, PaymentStatus, CustomModule, WhiteLabelConfig } from './types';
import { Language, translations } from './utils/i18n';
import {
  openExternalChannel,
  sampleSeedContacts,
  buildDeepLink,
} from './utils/dispatcher';
import {
  subscribeToContacts,
  createContact,
  updateContact as updateContactInFirestore,
  deleteContact as deleteContactInFirestore,
  bulkImportContacts,
  subscribeToLogs,
  recordInteraction,
  subscribeToSyncPackets,
  addSyncPacket,
  deleteSyncPacket,
  subscribeToPayments,
  recordPayment,
  updatePaymentStatus as updatePaymentStatusInFirestore,
  deletePayment as deletePaymentInFirestore,
  bulkImportPayments,
  subscribeToCustomModules,
  saveCustomModule,
  toggleCustomModuleStatus,
  deleteCustomModule,
} from './firebase/services';
import { testConnection } from './firebase/config';
import {
  Users,
  Zap,
  History,
  Smartphone,
  Plus,
  Search,
  Upload,
  Download,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  LogIn,
  CreditCard,
  Cpu,
} from 'lucide-react';

const generateHistoricalDemoLogs = (ownerId: string = 'guest'): InteractionLog[] => {
  const channels: ChannelType[] = ['whatsapp', 'call', 'sms', 'messenger', 'telegram'];
  const contactNames = [
    'Lamisa Aktar Raisha',
    'Md. Sheikh Farid (Developer)',
    'Hotel Al-Noor Customer Care',
    'Sirajganj Enterprise Supply',
  ];
  const sampleSummaries = [
    'হোটেল রিজার্ভেশন এবং বুকিং কনফার্মেশন',
    'জরুরি মিটিংয়ের লিংক পাঠিয়েছি',
    'বিল ও পেমেন্ট ক্লিয়ারেন্স আপডেট',
    'আসছি ৫ মিনিটের মধ্যে',
    'অফিসিয়াল ডকুমেন্টস পর্যালোচনা',
    'Direct GSM check-in call',
  ];

  const generated: InteractionLog[] = [];
  const now = new Date();

  // Distribute 25 sample logs across the last 30 days
  const dayOffsets = [0, 0, 1, 2, 2, 3, 5, 6, 7, 7, 9, 10, 12, 14, 15, 15, 17, 19, 21, 22, 24, 25, 27, 28, 29];
  dayOffsets.forEach((daysAgo, idx) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(9 + (idx % 12), (idx * 17) % 60);

    const contactName = contactNames[idx % contactNames.length];
    const channel = channels[idx % channels.length];
    const summary = sampleSummaries[idx % sampleSummaries.length];

    generated.push({
      id: `demo-log-${idx}-${Date.now()}`,
      ownerId,
      contactName,
      channel,
      messageSummary: summary,
      timestamp: d.toISOString(),
    });
  });

  return generated;
};

const sampleSeedPayments: Omit<Payment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>[] = [
  {
    contactName: 'Lamisa Aktar Raisha',
    amount: 8500,
    currency: 'BDT',
    gateway: 'sslcommerz',
    paymentMethod: 'bKash Merchant',
    status: 'completed',
    transactionRef: 'SSLCZ-89472648',
    purpose: 'হোটেল আল শেখ ফরিদ - ডিলাক্স রুম ৩০২ বুকিং',
    notes: 'Advance booking for 2 nights with breakfast [Phone: +8801712345678]',
  },
  {
    contactName: 'Hotel Al-Noor Customer Care',
    amount: 15000,
    currency: 'BDT',
    gateway: 'sslcommerz',
    paymentMethod: 'Visa / Mastercard',
    status: 'completed',
    transactionRef: 'SSLCZ-99382104',
    purpose: 'হোটেল ভিআইপি কনফারেন্স হল রিজার্ভেশন',
    notes: 'Conference room advance payment for business summit',
  },
  {
    contactName: 'Sirajganj Enterprise Supply',
    amount: 42000,
    currency: 'BDT',
    gateway: 'sslcommerz',
    paymentMethod: 'City Bank Transfer',
    status: 'pending',
    transactionRef: 'SSLCZ-44910283',
    purpose: 'ট্রেডিং ও লজিস্টিকস সাপ্লাই চালানের পেমেন্ট',
    notes: 'Awaiting clearance from bank gateway',
  },
  {
    contactName: 'Md. Sheikh Farid (Developer)',
    amount: 350,
    currency: 'USD',
    gateway: 'stripe',
    paymentMethod: 'Stripe Card Checkout',
    status: 'completed',
    transactionRef: 'ch_3N8fFj2eZvKYlo2C0Qwe7Z',
    purpose: 'NexusHub Enterprise Architecture Consulting',
    notes: 'Sovereign OS universal gateway deployment',
  },
];

function NexusApp() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const [language, setLanguage] = useState<Language>('bn');
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'contacts' | 'intent' | 'logs' | 'bridge' | 'finance' | 'devconsole'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [syncPackets, setSyncPackets] = useState<SyncPacket[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [modules, setModules] = useState<CustomModule[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isFoundersHubOpen, setIsFoundersHubOpen] = useState(false);

  // White-label state
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig>({
    brandName: 'NexusHub Sovereign OS',
    tagline: 'Universal Connectivity Hub & Sovereign OS',
    defaultCurrency: 'BDT',
    themeColor: 'indigo',
    clientLogoText: 'NEXUS',
    enableHotelSuite: true,
    enableGlobalPayments: true,
  });

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial connection test
  useEffect(() => {
    testConnection();
  }, []);

  // Firebase Realtime Subscriptions
  useEffect(() => {
    if (!user) {
      // Local fallback preview demo contacts when not signed in
      const localSeed: Contact[] = sampleSeedContacts.map((c, i) => ({
        ...c,
        id: `local-${i}`,
        ownerId: 'guest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setContacts(localSeed);
      setLogs(generateHistoricalDemoLogs('guest'));
      setSyncPackets([]);
      setPayments(
        sampleSeedPayments.map((p, i) => ({
          ...p,
          id: `demo-pay-${i}`,
          ownerId: 'guest',
          createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
        }))
      );
      setModules([
        {
          id: 'local-mod-1',
          ownerId: 'guest',
          title: 'কন্টাক্ট জন্মদিন ও শুভেচ্ছা ডিসপ্যাচার',
          description: 'সোশ্যাল রিলেশনশিপ ম্যানেজার • WhatsApp Greeting',
          code: '// Birthday Dispatcher Module for Sheikh Farid',
          category: 'Productivity',
          icon: 'Cake',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'local-mod-2',
          ownerId: 'guest',
          title: 'হোটেল আল শেখ ফরিদ - রেট ক্যালকুলেটর',
          description: 'রুম বুকিং হিসাব, সিজন ডিসকাউন্ট ও ভ্যাট হিসাব',
          code: '// Hotel Room Rate Calculator',
          category: 'Hotel',
          icon: 'Calculator',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    // Subscribe to user contacts
    const unsubContacts = subscribeToContacts(
      user.uid,
      (updatedContacts) => {
        setContacts(updatedContacts);
      },
      (err) => console.error('Contacts listener error:', err)
    );

    // Subscribe to interaction logs
    const unsubLogs = subscribeToLogs(
      user.uid,
      (updatedLogs) => {
        setLogs(updatedLogs);
      },
      (err) => console.error('Logs listener error:', err)
    );

    // Subscribe to sync packets
    const unsubPackets = subscribeToSyncPackets(
      user.uid,
      (updatedPackets) => {
        setSyncPackets(updatedPackets);
      },
      (err) => console.error('SyncPackets listener error:', err)
    );

    // Subscribe to payments
    const unsubPayments = subscribeToPayments(
      user.uid,
      (updatedPayments) => {
        setPayments(updatedPayments);
      },
      (err) => console.error('Payments listener error:', err)
    );

    // Subscribe to custom modules
    const unsubModules = subscribeToCustomModules(
      user.uid,
      (updatedMods) => {
        setModules(updatedMods);
      },
      (err) => console.error('Modules listener error:', err)
    );

    return () => {
      unsubContacts();
      unsubLogs();
      unsubPackets();
      unsubPayments();
      unsubModules();
    };
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Dispatch Action handler
  const handleAction = async (channel: ChannelType, contact: Contact, defaultMessage: string = '') => {
    let identifier = contact.phone;
    if (channel === 'messenger') identifier = contact.fbUsername || contact.phone;
    if (channel === 'telegram') identifier = contact.telegramUsername || contact.phone;
    if (channel === 'email') identifier = contact.email || '';

    // Trigger OS deep link
    openExternalChannel(channel, identifier, defaultMessage);

    const summary = defaultMessage || `${channel.toUpperCase()} dispatch to ${contact.name}`;

    // Record in Firestore if authenticated
    if (user) {
      try {
        await recordInteraction(user.uid, {
          contactId: contact.id,
          contactName: contact.name,
          channel,
          messageSummary: summary,
        });
        showToast(
          language === 'bn'
            ? `${contact.name}-এর সাথে ${channel.toUpperCase()} খোলা হয়েছে ও ফায়ারস্টোরে লগ সেভ হয়েছে!`
            : `Opened ${channel.toUpperCase()} for ${contact.name} & logged in Firestore!`
        );
      } catch (err) {
        console.error('Failed to log interaction:', err);
      }
    } else {
      // Local log for guest preview
      const localLog: InteractionLog = {
        id: `log-${Date.now()}`,
        ownerId: 'guest',
        contactId: contact.id,
        contactName: contact.name,
        channel,
        messageSummary: summary,
        timestamp: new Date().toISOString(),
      };
      setLogs((prev) => [localLog, ...prev]);
      showToast(
        language === 'bn'
          ? `${contact.name}-এর সাথে ${channel.toUpperCase()} ট্রিগার হয়েছে (গেস্ট প্রিভিউ)।`
          : `Triggered ${channel.toUpperCase()} for ${contact.name} (Guest Preview).`
      );
    }
  };

  // Intent Dispatcher execution
  const handleIntentDispatch = async (
    channel: ChannelType,
    identifier: string,
    contactName: string,
    message: string,
    contactId?: string
  ) => {
    openExternalChannel(channel, identifier, message);

    if (user) {
      try {
        await recordInteraction(user.uid, {
          contactId,
          contactName,
          channel,
          messageSummary: message || `${channel.toUpperCase()} dispatched`,
        });
        showToast(
          language === 'bn'
            ? `ইন্টেন্ট ডিসপ্যাচ সম্পন্ন: ${contactName} (${channel.toUpperCase()})`
            : `Intent Dispatched: ${contactName} via ${channel.toUpperCase()}`
        );
      } catch (err) {
        console.error('Intent log error:', err);
      }
    } else {
      const localLog: InteractionLog = {
        id: `log-${Date.now()}`,
        ownerId: 'guest',
        contactId,
        contactName,
        channel,
        messageSummary: message,
        timestamp: new Date().toISOString(),
      };
      setLogs((prev) => [localLog, ...prev]);
    }
  };

  // Save Contact (Create or Edit)
  const handleSaveContact = async (
    contactData: Omit<Contact, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (user) {
      if (editingContact) {
        await updateContactInFirestore(user.uid, editingContact.id, contactData);
        showToast(language === 'bn' ? 'কন্টাক্ট সফলভাবে আপডেট হয়েছে!' : 'Contact updated successfully!');
      } else {
        await createContact(user.uid, contactData);
        showToast(language === 'bn' ? 'নতুন কন্টাক্ট ক্লাউডে সংরক্ষিত হয়েছে!' : 'New contact saved to Firestore Cloud!');
      }
    } else {
      // Guest mode
      if (editingContact) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === editingContact.id
              ? { ...c, ...contactData, updatedAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        const newLocal: Contact = {
          ...contactData,
          id: `local-${Date.now()}`,
          ownerId: 'guest',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setContacts((prev) => [newLocal, ...prev]);
      }
      showToast(language === 'bn' ? 'কন্টাক্ট যুক্ত হয়েছে (গেস্ট মোড)' : 'Contact saved (Guest mode)');
    }
    setEditingContact(null);
  };

  // Delete Contact
  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm(t.deleteConfirm)) return;

    if (user) {
      try {
        await deleteContactInFirestore(user.uid, contactId);
        showToast(language === 'bn' ? 'কন্টাক্ট মুছে ফেলা হয়েছে।' : 'Contact removed.');
      } catch (err) {
        console.error('Failed to delete contact:', err);
      }
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    }
  };

  // Native Phone Contacts Picker
  const handleImportFromPhone = async () => {
    try {
      if (!('contacts' in navigator && 'ContactsManager' in window)) {
        alert(
          language === 'bn'
            ? 'আপনার ব্রাউজার বা ডিভাইসে Contact Picker API সমর্থন করে না। অনুগ্রহ করে JSON ফাইল ইমপোর্ট বা ম্যানুয়াল ফর্ম ব্যবহার করুন।'
            : 'The Contact Picker API is not supported on this device/browser. Please use JSON file import or add manually.'
        );
        return;
      }

      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      const selected = await (navigator as any).contacts.select(props, opts);

      if (!selected || selected.length === 0) return;

      const formatted = selected.map((item: any) => ({
        name: (item.name && item.name[0]) || 'Unknown',
        phone: (item.tel && item.tel[0]?.replace(/\s/g, '')) || '',
        email: (item.email && item.email[0]) || '',
        category: 'Phonebook',
        organization: '',
        notes: 'Imported via device Contact Picker',
      }));

      if (user) {
        const count = await bulkImportContacts(user.uid, formatted);
        showToast(language === 'bn' ? `${count}টি কন্টাক্ট ফোনবুক থেকে যোগ হয়েছে!` : `Imported ${count} contacts from phone!`);
      } else {
        const localList: Contact[] = formatted.map((item: any, idx: number) => ({
          ...item,
          id: `phone-${Date.now()}-${idx}`,
          ownerId: 'guest',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setContacts((prev) => [...localList, ...prev]);
        showToast(`${formatted.length} contacts loaded from phone!`);
      }
    } catch (err) {
      console.error('Phonebook import error:', err);
    }
  };

  // Load Seed / Demo Contacts
  const handleLoadDemo = async () => {
    if (user) {
      const count = await bulkImportContacts(user.uid, sampleSeedContacts);
      showToast(language === 'bn' ? `${count}টি নমুনা কন্টাক্ট যোগ হয়েছে!` : `Added ${count} sample contacts!`);
    } else {
      const seed: Contact[] = sampleSeedContacts.map((c, i) => ({
        ...c,
        id: `demo-${Date.now()}-${i}`,
        ownerId: 'guest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setContacts((prev) => [...seed, ...prev]);
      showToast('Loaded demo contacts!');
    }
  };

  // Generate 30-day historical logs for testing chart
  const handleGenerateSampleLogs = async () => {
    const sampleLogs = generateHistoricalDemoLogs(user ? user.uid : 'guest');
    if (user) {
      try {
        for (const log of sampleLogs) {
          await recordInteraction(user.uid, {
            contactId: log.contactId,
            contactName: log.contactName,
            channel: log.channel,
            messageSummary: log.messageSummary,
          });
        }
        showToast(
          language === 'bn'
            ? 'বিগত ৩০ দিনের নমুনা অ্যানালিটিক্স ডাটা সফলভাবে ফায়ারস্টোরে তৈরি হয়েছে!'
            : '30-day analytics sample logs created in Firestore!'
        );
      } catch (err) {
        console.error('Failed to generate historical logs:', err);
      }
    } else {
      setLogs(sampleLogs);
      showToast('Loaded 30-day historical logs!');
    }
  };

  // Bulk JSON Import
  const handleJsonImport = async (
    contactsList: Array<Omit<Contact, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>
  ): Promise<number> => {
    if (user) {
      return await bulkImportContacts(user.uid, contactsList);
    } else {
      const imported: Contact[] = contactsList.map((c, i) => ({
        ...c,
        id: `imp-${Date.now()}-${i}`,
        ownerId: 'guest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setContacts((prev) => [...imported, ...prev]);
      return contactsList.length;
    }
  };

  // Remote Bridge Packet Simulation
  const handleSimulatePacket = async (packetData: {
    deviceId: string;
    appName: string;
    sender: string;
    content?: string;
  }) => {
    if (user) {
      await addSyncPacket(user.uid, packetData);
    } else {
      const localPacket: SyncPacket = {
        id: `pkt-${Date.now()}`,
        ownerId: 'guest',
        ...packetData,
        timestamp: new Date().toISOString(),
      };
      setSyncPackets((prev) => [localPacket, ...prev]);
    }
  };

  // Delete Packet
  const handleDeletePacket = async (packetId: string) => {
    if (user) {
      await deleteSyncPacket(user.uid, packetId);
    } else {
      setSyncPackets((prev) => prev.filter((p) => p.id !== packetId));
    }
  };

  // Payment Handlers
  const handleRecordPayment = async (
    data: Omit<Payment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (user) {
      const newId = await recordPayment(user.uid, data);
      showToast(
        language === 'bn'
          ? `পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে: ${data.currency} ${data.amount.toLocaleString()} (${data.contactName})`
          : `Payment recorded: ${data.currency} ${data.amount.toLocaleString()} for ${data.contactName}`
      );
      return newId;
    } else {
      const generatedId = `pay-${Date.now()}`;
      const newPay: Payment = {
        id: generatedId,
        ownerId: 'guest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
      setPayments((prev) => [newPay, ...prev]);
      showToast(
        language === 'bn'
          ? `পেমেন্ট সংরক্ষিত হয়েছে (গেস্ট মোড): ৳ ${data.amount.toLocaleString()}`
          : `Payment saved (Guest mode): ${data.currency} ${data.amount.toLocaleString()}`
      );
      return generatedId;
    }
  };

  const handleUpdatePaymentStatus = async (
    paymentId: string,
    status: PaymentStatus,
    notes?: string
  ) => {
    if (user) {
      await updatePaymentStatusInFirestore(user.uid, paymentId, status, notes);
      showToast(
        language === 'bn'
          ? `পেমেন্ট স্ট্যাটাস আপডেট: ${status.toUpperCase()}`
          : `Payment status updated: ${status.toUpperCase()}`
      );
    } else {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? { ...p, status, ...(notes ? { notes } : {}), updatedAt: new Date().toISOString() }
            : p
        )
      );
      showToast(`Status updated: ${status.toUpperCase()}`);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (
      !window.confirm(
        language === 'bn'
          ? 'আপনি কি এই লেনদেন রেকর্ডটি মুছে ফেলতে চান?'
          : 'Delete this payment record?'
      )
    )
      return;
    if (user) {
      await deletePaymentInFirestore(user.uid, paymentId);
      showToast(language === 'bn' ? 'লেনদেন মুছে ফেলা হয়েছে।' : 'Payment record deleted.');
    } else {
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    }
  };

  const handleLoadSamplePayments = async () => {
    if (user) {
      const count = await bulkImportPayments(user.uid, sampleSeedPayments);
      showToast(
        language === 'bn'
          ? `${count}টি নমুনা লেনদেন ডাটা ফায়ারস্টোরে লোড হয়েছে!`
          : `Loaded ${count} sample payments in Firestore!`
      );
    } else {
      const demoPayments: Payment[] = sampleSeedPayments.map((p, i) => ({
        ...p,
        id: `demo-pay-${Date.now()}-${i}`,
        ownerId: 'guest',
        createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      }));
      setPayments((prev) => [...demoPayments, ...prev]);
      showToast('Loaded sample hotel & trade payments!');
    }
  };

  // Custom Module Handlers (AI Dev Console & Self-Evolving System)
  const handleSaveModule = async (
    data: Omit<CustomModule, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<string> => {
    if (user) {
      const id = await saveCustomModule(user.uid, data);
      showToast(language === 'bn' ? 'মডিউল ক্লাউডে সফলভাবে সেভ হয়েছে!' : 'Module saved to Firestore Cloud!');
      return id;
    } else {
      const generatedId = data.id || `mod-${Date.now()}`;
      const newMod: CustomModule = {
        id: generatedId,
        ownerId: 'guest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
      setModules((prev) => {
        const exists = prev.some((m) => m.id === generatedId);
        if (exists) {
          return prev.map((m) => (m.id === generatedId ? newMod : m));
        }
        return [newMod, ...prev];
      });
      showToast(language === 'bn' ? 'মডিউল সংরক্ষিত হয়েছে (গেস্ট মোড)' : 'Module saved (Guest mode)');
      return generatedId;
    }
  };

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    if (user) {
      await toggleCustomModuleStatus(user.uid, moduleId, enabled);
    } else {
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, enabled, updatedAt: new Date().toISOString() } : m))
      );
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি এই মডিউলটি মুছে ফেলতে চান?' : 'Delete this module?')) return;
    if (user) {
      await deleteCustomModule(user.uid, moduleId);
      showToast(language === 'bn' ? 'মডিউল মুছে ফেলা হয়েছে।' : 'Module deleted.');
    } else {
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    }
  };

  // Filtered contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      c.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      (c.fbUsername && c.fbUsername.toLowerCase().includes(query)) ||
      (c.telegramUsername && c.telegramUsername.toLowerCase().includes(query)) ||
      (c.organization && c.organization.toLowerCase().includes(query)) ||
      (c.notes && c.notes.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        onOpenFoundersCommandCenter={() => setIsFoundersHubOpen(true)}
        brandName={whiteLabel.brandName}
        tagline={whiteLabel.tagline}
      />

      {/* Guest Mode Banner */}
      {!user && !authLoading && (
        <div className="bg-gradient-to-r from-indigo-900/70 via-purple-900/70 to-slate-900 border-b border-indigo-700/40 px-4 py-2.5 text-xs text-indigo-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t.guestWarning}</span>
            </div>
            <button
              onClick={signInWithGoogle}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.signInWithGoogle}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'contacts', label: t.tabContacts, icon: Users, count: contacts.length },
            { id: 'intent', label: t.tabIntent, icon: Zap },
            { id: 'logs', label: t.tabLogs, icon: History, count: logs.length },
            { id: 'finance', label: t.tabFinance, icon: CreditCard, count: payments.length },
            { id: 'devconsole', label: t.tabDevConsole, icon: Cpu, count: modules.length },
            { id: 'bridge', label: t.tabDeviceSync, icon: Smartphone, count: syncPackets.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-indigo-950/60 text-indigo-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Contacts & Dispatcher */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {/* Action Bar: Search, Category Filters, Buttons */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                  />
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setIsContactModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addContact}</span>
                  </button>

                  <button
                    onClick={handleImportFromPhone}
                    className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
                    title="Read from native Android phonebook"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">{t.importPhone}</span>
                  </button>

                  <button
                    onClick={() => setIsExportImportOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
                    title="Backup / Restore JSON"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>

                  {contacts.length === 0 && (
                    <button
                      onClick={handleLoadDemo}
                      className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t.loadDemo}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Filter:
                </span>
                {['all', 'vip', 'business', 'work', 'family', 'personal'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? t.allCategories : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Contacts Grid */}
            {filteredContacts.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-200 mb-1">{t.noContacts}</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                  {t.noContactsDesc}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setIsContactModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                  >
                    {t.addContact}
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
                  >
                    {t.loadDemo}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    language={language}
                    onAction={handleAction}
                    onEdit={(c) => {
                      setEditingContact(c);
                      setIsContactModalOpen(true);
                    }}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Smart Intent Router */}
        {activeTab === 'intent' && (
          <IntentDispatcher
            contacts={contacts}
            language={language}
            onDispatch={handleIntentDispatch}
          />
        )}

        {/* Tab 3: Interaction Audit Logs & 30-Day Activity Visualization */}
        {activeTab === 'logs' && (
          <InteractionLogs
            logs={logs}
            language={language}
            onGenerateSampleLogs={handleGenerateSampleLogs}
          />
        )}

        {/* Tab 4: Financial Transactions & Payment Gateway Hub */}
        {activeTab === 'finance' && (
          <PaymentGatewayHub
            payments={payments}
            contacts={contacts}
            language={language}
            onRecordPayment={handleRecordPayment}
            onUpdateStatus={handleUpdatePaymentStatus}
            onDeletePayment={handleDeletePayment}
            onLoadSamplePayments={handleLoadSamplePayments}
          />
        )}

        {/* Tab 5: AI Dev Console & Self-Evolving Code Modules */}
        {activeTab === 'devconsole' && (
          <AIDevConsole
            modules={modules}
            contacts={contacts}
            logs={logs}
            payments={payments}
            language={language}
            onSaveModule={handleSaveModule}
            onToggleModule={handleToggleModule}
            onDeleteModule={handleDeleteModule}
          />
        )}

        {/* Tab 6: Android Device Bridge & Packet Sync */}
        {activeTab === 'bridge' && (
          <DeviceBridge
            packets={syncPackets}
            language={language}
            onSimulatePacket={handleSimulatePacket}
            onDeletePacket={handleDeletePacket}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 border border-indigo-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-indigo-500/20 text-xs sm:text-sm animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        initialData={editingContact}
        language={language}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        contacts={contacts}
        language={language}
        onImport={handleJsonImport}
      />

      {/* Founder's Executive Command Center & White-Label Customizer Modal */}
      <FoundersCommandCenter
        isOpen={isFoundersHubOpen}
        onClose={() => setIsFoundersHubOpen(false)}
        payments={payments}
        logs={logs}
        contacts={contacts}
        language={language}
        whiteLabel={whiteLabel}
        onUpdateWhiteLabel={(cfg) => {
          setWhiteLabel(cfg);
          showToast(
            language === 'bn'
              ? `হোয়াইট-লেবেল পরিবর্তন প্রয়োগ করা হয়েছে: ${cfg.brandName}`
              : `White-label brand updated: ${cfg.brandName}`
          );
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>NexusHub Sovereign OS • Unified Interoperability & Communication Architecture</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NexusApp />
    </AuthProvider>
  );
}
