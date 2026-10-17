export interface Contact {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  fbUsername?: string;
  telegramUsername?: string;
  email?: string;
  category?: string;
  organization?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChannelType = 'whatsapp' | 'messenger' | 'telegram' | 'call' | 'sms' | 'email';

export interface InteractionLog {
  id: string;
  ownerId: string;
  contactId?: string;
  contactName: string;
  channel: ChannelType;
  messageSummary?: string;
  timestamp: string;
}

export interface SyncPacket {
  id: string;
  ownerId: string;
  deviceId: string;
  appName: string;
  sender: string;
  content?: string;
  timestamp: string;
}

export type PaymentGateway = 'sslcommerz' | 'stripe' | 'bkash_direct' | 'cash';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  ownerId: string;
  contactId?: string;
  contactName: string;
  amount: number;
  currency: 'BDT' | 'USD' | 'EUR' | 'GBP';
  gateway: PaymentGateway;
  paymentMethod: string;
  status: PaymentStatus;
  transactionRef: string;
  purpose: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomModule {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  code: string;
  icon?: string;
  category?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteLabelConfig {
  brandName: string;
  tagline: string;
  defaultCurrency: 'BDT' | 'USD' | 'EUR' | 'GBP';
  themeColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
  clientLogoText?: string;
  enableHotelSuite: boolean;
  enableGlobalPayments: boolean;
}
