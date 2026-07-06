/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer } from '../types';
import { Link, Copy, Check, Search, Share2, Info, User, ExternalLink, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickSharePanelProps {
  customers: Customer[];
}

export default function QuickSharePanel({ customers }: QuickSharePanelProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find selected customer
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId || c.customerId === selectedCustomerId);

  // Filter customers for dropdown/search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.wa.includes(searchQuery)
  );

  const getPaymentUrl = (cust: Customer) => {
    return `${window.location.origin}${window.location.pathname}?id=${cust.customerId}`;
  };

  const handleCopyLink = (cust: Customer) => {
    const url = getPaymentUrl(cust);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert(`Link Pembayaran: ${url}`);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">
              Pusat Salin Link Tagihan Pelanggan (Anti-Akses Admin)
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              Salin link khusus pelanggan baru atau lama agar langsung masuk portal tanpa akses ke menu admin.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search & Select */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              1. Cari Pelanggan
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama, ID, atau WA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              2. Pilih Hasil Pencarian ({filteredCustomers.length})
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setCopied(false);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              <option value="">-- Pilih Pelanggan --</option>
              {filteredCustomers.map((cust) => (
                <option key={cust.id} value={cust.customerId}>
                  [{cust.customerId}] {cust.name} - {cust.package}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Customer Link Info */}
        <AnimatePresence mode="wait">
          {selectedCustomer ? (
            <motion.div
              key={selectedCustomer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3"
            >
              {/* Customer Details Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-indigo-950 uppercase leading-none">
                      {selectedCustomer.name}
                    </h4>
                    <p className="text-[10px] text-indigo-600 font-mono font-bold mt-1">
                      {selectedCustomer.customerId} • {selectedCustomer.wa}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-100/80 text-indigo-800 px-2.5 py-0.5 rounded font-bold">
                    {selectedCustomer.package}
                  </span>
                  {selectedCustomer.status === 'LUNAS' ? (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-black font-mono">
                      LUNAS
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-black font-mono">
                      BELUM BAYAR
                    </span>
                  )}
                </div>
              </div>

              {/* Generated URL Box */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-indigo-900/60 uppercase tracking-wider">
                  Link Pembayaran Mandiri (Salin & Kirim ke WhatsApp)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white border border-indigo-200 rounded-lg py-2 px-3 text-xs font-mono font-bold text-slate-700 break-all select-all flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-thin">
                    {getPaymentUrl(selectedCustomer)}
                  </div>
                  <button
                    onClick={() => handleCopyLink(selectedCustomer)}
                    className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-lg font-black text-xs uppercase cursor-pointer transition-all ${
                      copied
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Disalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Access Test & Warning Info */}
              <div className="flex items-start gap-2 bg-white/70 rounded-lg p-2.5 border border-indigo-100 text-[10px] text-slate-600 leading-relaxed font-medium">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-indigo-950">Aman Terisolasi</span>: Link di atas membawa pelanggan langsung ke portal pembayaran pribadi mereka. Tombol <span className="font-extrabold text-slate-800">"Masuk Dashboard Admin"</span>, header admin, reset data, dan seluruh fitur admin **100% dinonaktifkan** jika pelanggan masuk menggunakan link ini.
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="py-6 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
              Silakan cari atau pilih pelanggan di atas untuk mendapatkan link pembayaran langsung.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
