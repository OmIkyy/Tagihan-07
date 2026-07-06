/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer } from '../types';
import { X, Check, DollarSign, Download, CreditCard, Bell, Shield, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRISModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (customer: Customer) => void;
}

export default function QRISModal({ customer, isOpen, onClose, onPaymentSuccess }: QRISModalProps) {
  const [paymentStep, setPaymentStep] = useState<'QRIS' | 'PROCESSING' | 'SUCCESS'>('QRIS');
  const [bankSelected, setBankSelected] = useState<string>('BCA');

  if (!isOpen) return null;

  // Real-world dynamic QRIS data simulation using an elegant QR code
  // In Indonesia, QRIS payload starts with 000201... but for image display, a clean standard URL of QR code works wonderfully.
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(
    `00020101021226580010ID.CO.QRIS.WWW0215ID102030405060703030005123456785204531153033605406${customer.amount}5802ID5915KOMINDO NETWORK6007JAKARTA6304`
  )}`;

  const handleSimulatePayment = () => {
    setPaymentStep('PROCESSING');
    
    // Simulate payment clearing network processing delay
    setTimeout(() => {
      setPaymentStep('SUCCESS');
    }, 2000);
  };

  const handleComplete = () => {
    onPaymentSuccess(customer);
    onClose();
    setPaymentStep('QRIS');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={paymentStep !== 'PROCESSING' ? onClose : undefined}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative z-10 border border-slate-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center justify-between">
            <div>
              <h4 className="font-sans font-black text-sm tracking-wide">KOMINDO E-BILLING</h4>
              <p className="text-xs text-blue-200 font-mono font-bold">Invoice: {customer.customerId}</p>
            </div>
            {paymentStep !== 'PROCESSING' && (
              <button
                onClick={onClose}
                className="text-blue-100 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5px]" />
              </button>
            )}
          </div>

          {paymentStep === 'QRIS' && (
            <div className="p-6">
              {/* QRIS Header Sticker UI */}
              <div className="bg-gradient-to-r from-red-600 to-blue-800 text-white p-3 rounded-t-xl text-center font-bold tracking-wider relative">
                {/* QRIS Logo mock */}
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm italic font-extrabold tracking-tight">QRIS</span>
                  <span className="text-[10px] font-mono tracking-widest bg-white text-blue-950 px-1.5 py-0.5 rounded font-bold">
                    GPN
                  </span>
                </div>
                <div className="text-[9px] text-slate-200 mt-0.5 font-normal tracking-wide">
                  QR CODE STANDAR PEMBAYARAN NASIONAL
                </div>
              </div>

              {/* QR Code and Meta */}
              <div className="bg-slate-50 border border-slate-200 border-t-0 rounded-b-xl p-5 flex flex-col items-center">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                  KOMINDO NETWORK
                </div>
                <div className="text-[10px] text-slate-400 font-mono mb-4">NMID: ID1020304050607</div>

                {/* QR Display */}
                <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 relative">
                  <img
                    src={qrCodeUrl}
                    alt="QRIS Code"
                    className="w-56 h-56 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle watermarked QRIS center logo */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded shadow-md border border-slate-100">
                    <span className="text-[8px] font-extrabold text-blue-900 font-sans tracking-tight leading-none">QRIS</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-5 text-center">
                  <p className="text-xs text-slate-500 font-sans uppercase tracking-wider font-semibold">
                    TOTAL TAGIHAN
                  </p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5 font-mono">
                    Rp {customer.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Bottom Instructions / Simulation Action */}
              <div className="mt-5 space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex gap-3 text-slate-600">
                  <Shield className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <p>
                    Scan QRIS di atas menggunakan aplikasi mobile banking (BCA, Mandiri, BRI) atau e-wallet (Gopay, OVO, Dana, LinkAja) Anda.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSimulatePayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
                  >
                    <CreditCard className="w-4.5 h-4.5" />
                    Simulasi Bayar Sekarang (Gopay/OVO/ATM)
                  </button>
                  <p className="text-[10px] text-slate-500 font-bold text-center mt-2">
                    Mendukung semua pembayaran Penyelenggara Jasa Sistem Pembayaran (PJSP) Berizin BI.
                  </p>
                </div>
              </div>
            </div>
          )}

          {paymentStep === 'PROCESSING' && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-20 h-20 mb-6">
                {/* Decorative rotating circles */}
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-blue-600 border-r-blue-600 rounded-full animate-spin" />
                <CreditCard className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 stroke-[2px]" />
              </div>
              <h4 className="font-sans font-black text-lg text-blue-900">Memproses Pembayaran</h4>
              <p className="text-sm text-slate-600 font-medium mt-2 max-w-xs">
                Sistem sedang memverifikasi dana masuk dari PJSP bank tujuan Anda. Jangan tutup jendela ini...
              </p>
            </div>
          )}

          {paymentStep === 'SUCCESS' && (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Check className="w-8 h-8 text-green-600 stroke-[3px]" />
              </div>

              <span className="text-[10px] font-bold tracking-widest text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full uppercase">
                Transaksi Sukses
              </span>

              <h4 className="font-sans font-bold text-xl text-slate-800 mt-4">Pembayaran Terkonfirmasi!</h4>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">
                Terima kasih, <strong>{customer.name}</strong>. Pembayaran sebesar <strong>Rp {customer.amount.toLocaleString('id-ID')}</strong> telah otomatis terverifikasi lunas di server KOMINDO NETWORK.
              </p>

              <div className="w-full border-t border-b border-dashed border-slate-200 my-5 py-4 text-xs space-y-2 text-left font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Pelanggan:</span>
                  <span className="text-slate-700 font-semibold">{customer.customerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paket Internet:</span>
                  <span className="text-slate-700 font-semibold">{customer.package}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nomor Reff:</span>
                  <span className="text-slate-700">TX-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Metode:</span>
                  <span className="text-slate-700 font-bold text-red-600">QRIS AUTOPAY</span>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider text-sm"
              >
                Selesai & Cetak Bukti
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
