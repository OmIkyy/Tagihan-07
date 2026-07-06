/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PaymentNotification } from '../types';
import { Bell, CreditCard, Sparkles, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsPanelProps {
  notifications: PaymentNotification[];
  onDeleteNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationsPanel({
  notifications,
  onDeleteNotification,
  onMarkAsRead,
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <h3 className="font-sans font-bold text-sm text-slate-800">
            Log Aktivitas & Pembayaran
          </h3>
          {unreadCount > 0 && (
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono border border-slate-200">
              {unreadCount} Baru
            </span>
          )}
        </div>
      </div>

      <div className="p-2 max-h-[280px] overflow-y-auto divide-y divide-slate-50">
        <AnimatePresence initial={false}>
          {notifications.map((notif) => {
            const isQrisRequest = notif.type === 'QRIS_REQUEST';
            const isProofSubmitted = notif.type === 'PROOF_SUBMITTED';

            let iconBg = 'bg-green-50 text-green-600 border-green-100';
            let Icon = CheckCircle2;
            let title = `${notif.customerName} - LUNAS`;
            let description = (
              <>
                Pembayaran <strong>{notif.packageName}</strong> sebesar{' '}
                <strong className="text-slate-800 font-mono">
                  Rp {Number(notif.amount || 0).toLocaleString('id-ID')}
                </strong>{' '}
                telah sukses terverifikasi otomatis via QRIS.
              </>
            );

            if (isQrisRequest) {
              iconBg = 'bg-blue-50 text-blue-600 border-blue-100';
              Icon = CreditCard;
              title = `📝 AJUAN QRIS: ${notif.customerName}`;
              description = (
                <>
                  Pelanggan meminta kode QRIS untuk pembayaran{' '}
                  <strong>{notif.packageName}</strong> sebesar{' '}
                  <strong className="text-slate-800 font-mono">
                    Rp {Number(notif.amount || 0).toLocaleString('id-ID')}
                  </strong>.
                </>
              );
            } else if (isProofSubmitted) {
              iconBg = 'bg-purple-50 text-purple-600 border-purple-100';
              Icon = Sparkles;
              title = `📸 BUKTI BAYAR: ${notif.customerName}`;
              description = (
                <>
                  Pelanggan telah mengunggah bukti transfer untuk{' '}
                  <strong>{notif.packageName}</strong>. Silakan cek dan konfirmasi kelunasan.
                </>
              );
            }

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 text-xs transition-colors flex gap-3 items-start relative group ${
                  notif.read ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div 
                  onClick={() => onMarkAsRead(notif.id)}
                  className="flex-1 flex gap-3 items-start cursor-pointer min-w-0"
                >
                  <div className={`${iconBg} p-2 rounded-xl shrink-0 border mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-extrabold leading-tight">
                      {title}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed text-[11px]">
                      {description}
                    </p>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono mt-1.5">
                      <Clock className="w-3 h-3" />
                      {(() => {
                        try {
                          const d = new Date(notif.timestamp);
                          return isNaN(d.getTime()) ? 'Baru saja' : d.toLocaleTimeString('id-ID');
                        } catch (e) {
                          return 'Baru saja';
                        }
                      })()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Apakah Anda yakin ingin menghapus log ini?')) {
                      onDeleteNotification(notif.id);
                    }
                  }}
                  title="Hapus Log"
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 cursor-pointer self-center shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada aktivitas pembayaran hari ini.
          </div>
        )}
      </div>
    </div>
  );
}
