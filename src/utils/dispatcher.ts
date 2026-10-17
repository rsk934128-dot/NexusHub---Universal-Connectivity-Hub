import { ChannelType, Contact } from '../types';

export function sanitizePhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  return phone.replace(/[\s\-()]/g, '');
}

export function buildDeepLink(channel: ChannelType, identifier: string, message: string = ''): string {
  const cleanId = sanitizePhoneNumber(identifier);

  switch (channel) {
    case 'whatsapp': {
      // Remove leading '+' for wa.me if present
      const waNumber = cleanId.replace(/^\+/, '');
      const encodedMsg = message ? `?text=${encodeURIComponent(message)}` : '';
      return `https://wa.me/${waNumber}${encodedMsg}`;
    }
    case 'messenger': {
      return `https://m.me/${encodeURIComponent(identifier)}`;
    }
    case 'telegram': {
      // If starts with @ strip it
      const tgHandle = identifier.replace(/^@/, '');
      if (message) {
        return `https://t.me/${encodeURIComponent(tgHandle)}?text=${encodeURIComponent(message)}`;
      }
      return `https://t.me/${encodeURIComponent(tgHandle)}`;
    }
    case 'call': {
      return `tel:${cleanId}`;
    }
    case 'sms': {
      const encodedMsg = message ? `?body=${encodeURIComponent(message)}` : '';
      return `sms:${cleanId}${encodedMsg}`;
    }
    case 'email': {
      const encodedMsg = message ? `?subject=${encodeURIComponent('NexusHub Message')}&body=${encodeURIComponent(message)}` : '';
      return `mailto:${identifier}${encodedMsg}`;
    }
    default:
      return '';
  }
}

export function openExternalChannel(channel: ChannelType, identifier: string, message: string = ''): boolean {
  const url = buildDeepLink(channel, identifier, message);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export const sampleSeedContacts: Omit<Contact, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Lamisa Aktar Raisha',
    phone: '+8801712345678',
    fbUsername: 'lamisa.aktarraisha',
    telegramUsername: 'lamisa_raisha',
    email: 'lamisa.raisha@example.com',
    category: 'VIP',
    organization: 'Sirajganj Tech Innovation',
    notes: 'Key partner for Sirajganj local software ecosystem and universal communication.',
  },
  {
    name: 'Md. Sheikh Farid (Developer)',
    phone: '+8801812345679',
    fbUsername: 'sheikh.farid.sirajganj',
    telegramUsername: 'sheikhfarid_dev',
    email: 'sf5842843@gmail.com',
    category: 'Work',
    organization: 'NoorNexus Sovereign OS',
    notes: 'Architect and visionary behind the NexusHub connectivity platform.',
  },
  {
    name: 'Hotel Al-Noor Customer Care',
    phone: '+8801912345680',
    fbUsername: 'hotelalnoor.bd',
    telegramUsername: 'hotelalnoor',
    email: 'booking@hotelalnoor.com',
    category: 'Business',
    organization: 'Al-Noor Hospitality Group',
    notes: 'Hotel reservations, guest customer support and billing clearance.',
  },
  {
    name: 'Sirajganj Enterprise Supply',
    phone: '+8801612345681',
    fbUsername: 'sirajganj.supplies',
    telegramUsername: 'sirajganj_supplies',
    email: 'supply@sirajganjtrade.com',
    category: 'Business',
    organization: 'Sirajganj Trading Hub',
    notes: 'Logistics, delivery coordination and trade orders.',
  },
];
