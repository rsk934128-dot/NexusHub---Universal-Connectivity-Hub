import React, { useState } from 'react';
import { SyncPacket } from '../types';
import { Language, translations } from '../utils/i18n';
import {
  Smartphone,
  Radio,
  Send,
  BellRing,
  Code2,
  Trash2,
  CheckCircle2,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DeviceBridgeProps {
  packets: SyncPacket[];
  language: Language;
  onSimulatePacket: (packet: { deviceId: string; appName: string; sender: string; content?: string }) => Promise<void>;
  onDeletePacket: (packetId: string) => Promise<void>;
}

export const DeviceBridge: React.FC<DeviceBridgeProps> = ({
  packets,
  language,
  onSimulatePacket,
  onDeletePacket,
}) => {
  const t = translations[language];

  const [deviceId, setDeviceId] = useState('Nexus-Android-SM-G998B');
  const [appName, setAppName] = useState('WhatsApp');
  const [sender, setSender] = useState('Lamisa Aktar Raisha');
  const [content, setContent] = useState('জরুরি মিটিং শুরু হয়েছে, দ্রুত চলে আসুন।');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCodeReference, setShowCodeReference] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !sender) return;

    try {
      setIsSubmitting(true);
      await onSimulatePacket({
        deviceId: deviceId.trim(),
        appName: appName.trim(),
        sender: sender.trim(),
        content: content.trim(),
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-600/20">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>{t.deviceBridgeTitle}</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
                <span>Live Cloud Sync</span>
              </span>
            </h2>
            <p className="text-xs text-slate-400">{t.deviceBridgeDesc}</p>
          </div>
        </div>

        <button
          onClick={() => setShowCodeReference(!showCodeReference)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition self-start sm:self-auto"
        >
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t.nativeCodeGuide}</span>
          {showCodeReference ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Code Reference Accordion */}
      {showCodeReference && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-3 font-mono">
          <div className="flex items-center justify-between text-indigo-400 font-bold font-sans">
            <span className="flex items-center space-x-2">
              <Cpu className="w-4 h-4" />
              <span>Android NotificationListenerService (Kotlin)</span>
            </span>
          </div>
          <pre className="overflow-x-auto p-3 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 text-[11px] leading-relaxed">
{`// Android Notification Listener Snippet
class NexusNotificationListener : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        // Transmit packet to Firestore Cloud endpoint or Socket Bridge
        sendToNexusHub(title, text, packageName)
    }
}`}
          </pre>
          <p className="font-sans text-[11px] text-slate-400">
            This module represents the native Android background listener that captures incoming communication events and synchronizes them directly into your secure Firebase Firestore database.
          </p>
        </div>
      )}

      {/* Simulation / Injection Form */}
      <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center space-x-2">
          <BellRing className="w-4 h-4 text-cyan-400" />
          <span>{t.simulatePacket}</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">{t.simulateDesc}</p>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              {t.appName}
            </label>
            <select
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Messenger">Facebook Messenger</option>
              <option value="Telegram">Telegram</option>
              <option value="SMS/Telecom">SMS / Grameenphone</option>
              <option value="Bank Notification">Bank / Financial Alert</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              {t.senderTitle}
            </label>
            <input
              type="text"
              required
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. Lamisa or +88017..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Device Identifier
            </label>
            <input
              type="text"
              required
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              {t.notificationContent}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Message payload received by device listener..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 shadow-md shadow-cyan-600/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.pushPacket}</span>
              </button>
            </div>
          </div>
        </form>

        {successMsg && (
          <div className="mt-3 flex items-center space-x-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Packet pushed to Firestore and synced across all instances!</span>
          </div>
        )}
      </div>

      {/* Synced Packets Stream */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Device Synced Packets ({packets.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500">Stored in /users/{'{uid}'}/syncPackets</span>
        </div>

        {packets.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40">
            <Smartphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No device packets recorded yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Use the simulator above to test Android notification synchronization.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {packets.map((pkt) => {
              const timeStr = new Date(pkt.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={pkt.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center shrink-0">
                      <BellRing className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100 text-xs truncate">
                          {pkt.sender}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                          {pkt.appName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          [{pkt.deviceId}]
                        </span>
                      </div>
                      {pkt.content && (
                        <p className="text-xs text-slate-300 truncate max-w-sm sm:max-w-xl font-mono mt-0.5">
                          {pkt.content}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-3">
                    <span className="text-[10px] font-mono text-slate-500">{timeStr}</span>
                    <button
                      onClick={() => onDeletePacket(pkt.id)}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
                      title="Delete Packet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
