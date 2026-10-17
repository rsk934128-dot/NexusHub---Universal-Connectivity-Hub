import React from 'react';
import { Contact, ChannelType } from '../types';
import { Language, translations } from '../utils/i18n';
import {
  Phone,
  MessageSquare,
  Send,
  MessageCircle,
  Mail,
  Edit2,
  Trash2,
  Building2,
  Tag,
  Share2,
} from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  language: Language;
  onAction: (channel: ChannelType, contact: Contact, defaultMessage?: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  language,
  onAction,
  onEdit,
  onDelete,
}) => {
  const t = translations[language];

  // Category badge colors
  const getCategoryColor = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'vip':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'business':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'work':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'family':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/30';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 rounded-2xl p-5 transition-all duration-200 shadow-md hover:shadow-indigo-500/10 flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name, Category */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-base shadow shrink-0">
              {getInitials(contact.name)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-100 text-base truncate group-hover:text-indigo-300 transition">
                {contact.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono tracking-tight truncate">
                {contact.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {contact.category && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(
                  contact.category
                )}`}
              >
                {contact.category}
              </span>
            )}
          </div>
        </div>

        {/* Organization / Details */}
        {(contact.organization || contact.notes) && (
          <div className="mb-4 space-y-1.5 text-xs text-slate-300/90 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
            {contact.organization && (
              <div className="flex items-center space-x-1.5 text-slate-400 truncate">
                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{contact.organization}</span>
              </div>
            )}
            {contact.notes && (
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {contact.notes}
              </p>
            )}
          </div>
        )}

        {/* Handle Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4 text-[11px]">
          {contact.fbUsername && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-900/30 text-blue-300 border border-blue-800/40">
              m.me/{contact.fbUsername}
            </span>
          )}
          {contact.telegramUsername && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-900/30 text-sky-300 border border-sky-800/40">
              t.me/{contact.telegramUsername}
            </span>
          )}
          {contact.email && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-900/30 text-emerald-300 border border-emerald-800/40 truncate max-w-[180px]">
              {contact.email}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Dispatch Actions */}
      <div className="pt-3 border-t border-slate-700/60">
        <div className="grid grid-cols-4 gap-1.5 mb-2.5">
          {/* WhatsApp */}
          <button
            onClick={() => onAction('whatsapp', contact)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition text-[11px] font-medium"
            title="Open WhatsApp & Log"
          >
            <MessageCircle className="w-4 h-4 mb-0.5" />
            <span>WA</span>
          </button>

          {/* Messenger */}
          <button
            onClick={() => onAction('messenger', contact)}
            disabled={!contact.fbUsername}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition text-[11px] font-medium ${
              contact.fbUsername
                ? 'bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border-blue-500/30'
                : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title={contact.fbUsername ? 'Open Messenger & Log' : 'No Messenger handle set'}
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span>Chat</span>
          </button>

          {/* Telegram */}
          <button
            onClick={() => onAction('telegram', contact)}
            disabled={!contact.telegramUsername}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition text-[11px] font-medium ${
              contact.telegramUsername
                ? 'bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border-sky-500/30'
                : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title={contact.telegramUsername ? 'Open Telegram & Log' : 'No Telegram handle set'}
          >
            <Send className="w-4 h-4 mb-0.5" />
            <span>TG</span>
          </button>

          {/* Direct GSM Call */}
          <button
            onClick={() => onAction('call', contact)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition text-[11px] font-medium"
            title="Native Dial & Log"
          >
            <Phone className="w-4 h-4 mb-0.5" />
            <span>{t.call}</span>
          </button>
        </div>

        {/* Extra actions: SMS, Email, Edit, Delete */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onAction('sms', contact)}
              className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition flex items-center space-x-1 text-[11px]"
              title="Send SMS"
            >
              <Phone className="w-3 h-3 text-purple-400" />
              <span>SMS</span>
            </button>

            {contact.email && (
              <button
                onClick={() => onAction('email', contact)}
                className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition flex items-center space-x-1 text-[11px]"
                title="Send Email"
              >
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>Mail</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(contact)}
              className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition"
              title={t.edit}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(contact.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
              title={t.delete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
