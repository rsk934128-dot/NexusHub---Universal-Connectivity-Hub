import { Payment, PaymentGateway } from '../types';

export interface AutomatedInvoiceParams {
  contactId?: string;
  contactName: string;
  amount: number;
  currency?: 'BDT' | 'USD' | 'EUR' | 'GBP';
  purpose?: string;
  gateway?: PaymentGateway;
  notes?: string;
}

export interface GeneratedInvoiceResult {
  invoiceId: string;
  paymentLink: string;
  amount: number;
  currency: 'BDT' | 'USD' | 'EUR' | 'GBP';
  paymentPayload: Omit<Payment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
}

/**
 * Generates an automated invoice number, secure checkout link,
 * and a pending Payment record payload for Firestore.
 */
export function generateAutomatedInvoice(params: AutomatedInvoiceParams): GeneratedInvoiceResult {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceId = `INV-${Date.now().toString().slice(-4)}${randomSuffix}`;
  const currency = params.currency || 'BDT';
  const amount = Number(params.amount) || 0;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nexushub.io';
  const paymentLink = `${baseUrl}/pay/${invoiceId}?amount=${amount}&currency=${currency}`;

  const paymentPayload: Omit<Payment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
    contactId: params.contactId || '',
    contactName: params.contactName.trim(),
    amount,
    currency,
    gateway: params.gateway || 'sslcommerz',
    paymentMethod: 'SSLCommerz / bKash / Card',
    status: 'pending',
    transactionRef: invoiceId,
    purpose: params.purpose?.trim() || 'ডিজিটাল সার্ভিস ও বুকিং ইনভয়েস',
    notes: params.notes?.trim() || `Auto-generated invoice via IntentDispatcher PaymentPipeline [${paymentLink}]`,
  };

  return {
    invoiceId,
    paymentLink,
    amount,
    currency,
    paymentPayload,
  };
}

/**
 * Formats a clean, high-converting invoice dispatch message for WhatsApp/SMS/Email
 */
export function formatInvoiceMessage(
  contactName: string,
  amount: number,
  currency: string,
  invoiceId: string,
  paymentLink: string,
  purpose: string,
  language: 'bn' | 'en'
): string {
  if (language === 'bn') {
    const symbol = currency === 'BDT' ? '৳' : currency;
    return `প্রিয় ${contactName}, আপনার "${purpose}"-এর বিপরীতে ডিজিটাল ইনভয়েস (#${invoiceId}) প্রস্তুত করা হয়েছে।\n\nমোট প্রদেয় বিল: ${symbol} ${amount.toLocaleString()}\\nনিরাপদে বিকাশ/নগদ/কার্ডে পেমেন্ট সম্পন্ন করতে নিচের লিংকে ক্লিক করুন:\n${paymentLink}\n\nধন্যবাদান্তে,\nNexusHub Finance & Hotel Suite`;
  }
  const symbol = currency === 'USD' ? '$' : currency;
  return `Dear ${contactName}, your digital invoice (#${invoiceId}) for "${purpose}" is ready.\n\nTotal Due: ${symbol} ${amount.toLocaleString()}\\nPlease complete payment securely via:\n${paymentLink}\n\nThank you,\nNexusHub Finance Hub`;
}

/**
 * Calculates any pending balance and unpaid invoices for a specific contact
 */
export function getPendingBalanceForContact(
  payments: Payment[],
  contactName: string,
  contactId?: string
): { pendingCount: number; pendingAmount: number; currency: string } {
  let pendingCount = 0;
  let pendingAmount = 0;
  let currency = 'BDT';

  payments.forEach((p) => {
    const matchesId = contactId && p.contactId && p.contactId === contactId;
    const matchesName =
      contactName && p.contactName.trim().toLowerCase() === contactName.trim().toLowerCase();

    if ((matchesId || matchesName) && p.status === 'pending') {
      pendingCount++;
      pendingAmount += p.amount;
      currency = p.currency;
    }
  });

  return { pendingCount, pendingAmount, currency };
}
