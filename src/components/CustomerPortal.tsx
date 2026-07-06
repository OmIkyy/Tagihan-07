/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Customer } from '../types';
import Logo from './Logo';
import { 
  Wifi, ShieldAlert, ArrowLeft, CheckCircle2, AlertCircle, FileText, 
  Smartphone, RefreshCw, QrCode, Search, CreditCard, Lock, ArrowRight, User,
  History, UploadCloud, Check, Clock, Eye, Volume2, Sparkles, Camera, Router
} from 'lucide-react';

// Play native synthesised browser chime/beeps for delightful payment feedback
const playSound = (type: 'chime' | 'success' | 'click') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (typeof AudioCtx !== 'function') return;
    const ctx = new (AudioCtx as any)();
    const now = ctx.currentTime;

    if (type === 'chime') {
      // Pleasant dual tone chime for payment requests
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.22); // C6
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } else if (type === 'success') {
      // Arpeggio chime for successful payment
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gain.gain.setValueAtTime(0.12, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.3);
      });
    } else {
      // Quick clean click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    console.warn('AudioContext failed or blocked by browser gesture policy', e);
  }
};

const getIndonesianMonthName = (monthNum: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[(monthNum - 1) % 12] || '';
};

const getPeriodName = (dueDateStr: string): string => {
  const parts = dueDateStr.split('/');
  if (parts.length !== 3) return 'Juni 2026';
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  return `${getIndonesianMonthName(month)} ${year}`;
};

const getNextDueDate = (currentDueDate: string): string => {
  const parts = currentDueDate.split('/');
  if (parts.length !== 3) return currentDueDate;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  
  return `${day.toString().padStart(2, '0')}/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;
};

interface CustomerPortalProps {
  customer: Customer | null;
  onBackToAdmin: () => void;
  onPaymentSuccess: (customer: Customer) => void;
  customers?: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  brandName?: string;
  brandSuffix?: string;
  logoType?: 'wifi-classic' | 'wifi-modern' | 'wifi-shield' | 'wifi-globe' | 'custom';
  logoColor?: string;
  customLogoData?: string | null;
}

export default function CustomerPortal({ 
  customer, 
  onBackToAdmin, 
  onPaymentSuccess,
  customers = [],
  onSelectCustomer,
  onUpdateCustomer,
  brandName = 'KOMINDO',
  brandSuffix = 'NETWORK',
  logoType = 'wifi-classic',
  logoColor = '#2563EB',
  customLogoData = null,
}: CustomerPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  const isDirectLink = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('id') || params.has('cust') || params.has('customer') || params.has('customerId');
    } catch (e) {
      return false;
    }
  })();
  
  // Simulated router QR scanner states
  const [isScanningRouter, setIsScanningRouter] = useState(false);
  const [scannedRouterStatus, setScannedRouterStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scanningCustomerRef, setScanningCustomerRef] = useState<Customer | null>(null);

  const handleSimulateScanRouter = (cust: Customer) => {
    if (isScanningRouter) return;
    playSound('click');
    setScanningCustomerRef(cust);
    setIsScanningRouter(true);
    setScannedRouterStatus('scanning');
    
    // Simulate camera scanning with sound and animations
    setTimeout(() => {
      // Success sound
      playSound('success');
      setScannedRouterStatus('success');
      
      setTimeout(() => {
        setIsScanningRouter(false);
        setScannedRouterStatus('idle');
        setScanningCustomerRef(null);
        if (onSelectCustomer) {
          onSelectCustomer(cust);
          setSearchError('');
        }
      }, 800);
    }, 1500);
  };
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // View states
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  
  // Drag and drop / proof upload simulation state
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track if payment was completed in the current portal session
  const prevStatusRef = useRef<string | null>(null);
  const [hasPaidInSession, setHasPaidInSession] = useState(false);

  useEffect(() => {
    if (customer) {
      if (prevStatusRef.current === 'AJUAN_BAYAR' && customer.status === 'MENUNGGU_BAYAR') {
        playSound('success');
      }
      if (prevStatusRef.current && prevStatusRef.current !== 'LUNAS' && customer.status === 'LUNAS') {
        setHasPaidInSession(true);
      }
      prevStatusRef.current = customer.status;
    } else {
      prevStatusRef.current = null;
      setHasPaidInSession(false);
    }
  }, [customer?.id, customer?.status]);

  // Monitor QRIS Expiration Countdown Timer
  useEffect(() => {
    if (customer && customer.status === 'MENUNGGU_BAYAR' && customer.qrisExpiresAt) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((customer.qrisExpiresAt! - now) / 1000));
        setTimeLeft(diff);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [customer]);

  // Audio trigger on load for successful payment status change
  useEffect(() => {
    if (customer && customer.status === 'LUNAS') {
      // If we just became paid, celebrate with a success audio tone!
      playSound('success');
    }
  }, [customer?.status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    playSound('click');
    const trimmed = searchQuery.trim().toUpperCase();
    
    // Find matching customer
    const matched = customers.find(
      (c) => 
        c.customerId.toUpperCase() === trimmed || 
        c.customerId.toUpperCase().includes(trimmed) ||
        c.name.toUpperCase().includes(trimmed)
    );

    if (matched) {
      if (onSelectCustomer) {
        onSelectCustomer(matched);
        setSearchError('');
      }
    } else {
      setSearchError('ID Salah');
    }
  };

  // Submit payment request to Admin (QRIS or KASIR)
  const handleRequestPayment = (method: 'QRIS' | 'KASIR') => {
    if (!customer || !onUpdateCustomer) return;
    
    // Sound on payload request
    playSound('chime');
    
    // Update customer state to 'AJUAN_BAYAR' and set paymentMethod
    const updated: Customer = {
      ...customer,
      status: 'AJUAN_BAYAR',
      paymentMethod: method
    };
    onUpdateCustomer(updated);
  };

  // Handle image proof selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      playSound('click');
      setProofFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProofPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Payment Proof to Admin
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !onUpdateCustomer) return;
    if (!proofPreview) {
      alert('Mohon pilih atau unggah foto bukti pembayaran terlebih dahulu!');
      return;
    }

    setIsSubmittingProof(true);
    playSound('chime');

    setTimeout(() => {
      const updated: Customer = {
        ...customer,
        status: 'MENUNGGU_KONFIRMASI',
        paymentProofUrl: proofPreview,
        paymentProofName: proofFileName
      };
      
      onUpdateCustomer(updated);
      setIsSubmittingProof(false);
      setProofPreview(null);
      setProofFileName('');
      alert('Bukti pembayaran berhasil dikirim! Menunggu konfirmasi admin untuk mengaktifkan internet.');
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Lookup page if no customer selected
  if (!customer) {
    return (
      <div className="max-w-md mx-auto my-6 space-y-6">
        {/* Portal Header */}
        <div 
          className="bg-white rounded-2xl border-2 p-6 text-center shadow-lg relative overflow-hidden"
          style={{ borderColor: logoColor }}
        >
          <div className="absolute top-0 left-0 right-0 h-2 animate-pulse" style={{ backgroundColor: logoColor }} />
          
          <div className="mx-auto mb-4 flex justify-center">
            <Logo 
              className="w-14 h-14"
              iconClassName="w-8 h-8"
              logoType={logoType}
              logoColor={logoColor}
              customLogoData={customLogoData}
            />
          </div>
          
          <h2 className="font-sans font-black text-2xl text-slate-900 tracking-tight">
            {brandName} <span style={{ color: logoColor }}>{brandSuffix}</span>
          </h2>
          <p className="text-[10px] font-mono tracking-widest font-extrabold uppercase mt-1" style={{ color: logoColor }}>
            PORTAL E-BILLING RESMI
          </p>
          
          <p className="text-xs text-slate-700 font-bold mt-4 leading-relaxed">
            Periksa tagihan bulanan Wi-Fi Anda dan lakukan pembayaran instan via QRIS aman.
          </p>
        </div>

        {/* Search Form Card */}
        <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-md">
          <h3 className="font-sans font-black text-lg text-blue-900 mb-4 flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600 stroke-[2.5px]" />
            Cari Tagihan Anda
          </h3>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div>
              <label htmlFor="customerId" className="block text-xs font-black text-blue-800 uppercase tracking-wider mb-1.5">
                ID Pelanggan (Customer ID)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="customerId"
                  placeholder="Masukkan ID Pelanggan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-blue-100 rounded-xl py-3.5 px-4 pl-11 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white font-mono uppercase transition-all shadow-xs"
                />
                <User className="absolute left-3.5 top-4 w-5 h-5 text-blue-500 stroke-[2.5px]" />
              </div>
            </div>

            {searchError && (
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-xs text-red-600 font-extrabold leading-relaxed text-center flex items-center justify-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                {searchError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-widest"
            >
              Periksa Tagihan
              <ArrowRight className="w-5 h-5 stroke-[3px]" />
            </button>
          </form>


        </div>

        {/* Security / Trust Shield */}
        <div className="bg-white rounded-2xl border-2 border-blue-100 p-4 text-center space-y-1.5 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-blue-900 font-black text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4 text-blue-600 stroke-[2.5px]" />
            Keamanan Transaksi Terjamin
          </div>
          <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
            Pembayaran QRIS diproses langsung melalui sistem QRIS Nasional Bank Indonesia yang aman, real-time, dan terenkripsi.
          </p>
        </div>

        {!isDirectLink && onBackToAdmin && (
          <div className="text-center pt-2">
            <button
              onClick={() => {
                playSound('click');
                onBackToAdmin();
              }}
              className="text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest cursor-pointer inline-flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-indigo-100"
            >
              🖥️ Masuk Dashboard Admin
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-4 space-y-6">
      {/* Navigation bar inside portal - hidden for direct payment links */}
      {!isDirectLink && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              playSound('click');
              if (onSelectCustomer) {
                const searchParams = new URLSearchParams(window.location.search);
                if (searchParams.get('id')) {
                  window.history.replaceState({}, '', window.location.pathname);
                }
                onSelectCustomer(null as any);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-800 transition-colors bg-white border-2 border-blue-100 rounded-xl px-3.5 py-2 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
            Cari Tagihan Lain
          </button>

          {onBackToAdmin ? (
            <button
              onClick={() => {
                playSound('click');
                onBackToAdmin();
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black transition-all bg-slate-800 hover:bg-slate-900 text-white shadow-xs cursor-pointer"
            >
              🖥️ Ke Admin
            </button>
          ) : (
            <span className="text-[10px] bg-blue-50 text-blue-700 px-3.5 py-2 rounded-full font-black uppercase tracking-wider font-mono border-2 border-blue-100 shadow-xs">
              PORTAL PELANGGAN
            </span>
          )}
        </div>
      )}

      {/* Main Billing Card */}
      <div className="bg-white rounded-2xl border-2 shadow-lg overflow-hidden" style={{ borderColor: `${logoColor}20` }}>
        {/* Brand Header */}
        <div 
          className="text-white p-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${logoColor}, ${logoColor}dd)` }}
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none text-white">
            <Wifi className="w-44 h-44" />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] text-white/80 font-mono tracking-widest font-black uppercase">E-BILLING RESMI</p>
              <h2 className="text-2xl font-black tracking-tight mt-1 uppercase">
                {brandName} {brandSuffix}
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg text-right border border-white/20">
              <p className="text-[8px] text-blue-100 uppercase font-black leading-none">STATUS MODEM</p>
              <p className="text-[10px] font-black text-green-300 mt-1 flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                ONLINE
              </p>
            </div>
          </div>

          <div className="mt-8 relative z-10 flex justify-between items-end">
            <div>
              <p className="text-xs text-blue-100 font-bold">Pelanggan</p>
              <p className="font-black text-xl mt-0.5 tracking-tight uppercase">{customer.name}</p>
              <p className="text-[10px] text-blue-100 font-mono mt-0.5 font-black">{customer.customerId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-100 font-bold">Tempo Pembayaran</p>
              <p className="font-black text-xs mt-0.5 bg-white/20 px-2.5 py-1 rounded-md inline-block border border-white/10">{customer.dueDate}</p>
            </div>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-6 space-y-6">
          
          {/* 1. Status: LUNAS */}
          {customer.status === 'LUNAS' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex gap-3 text-green-900">
              <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0 mt-0.5 stroke-[2.5px]" />
              <div>
                {hasPaidInSession ? (
                  <>
                    <h4 className="font-black text-sm uppercase">Tagihan Sudah Dibayar!</h4>
                    <p className="text-xs text-green-800 mt-1 font-bold animate-pulse">
                      Terima kasih, pembayaran untuk paket {customer.package} telah berhasil diproses. Masa aktif Wi-Fi Anda telah diperpanjang otomatis.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-black text-sm uppercase">Layanan Wi-Fi Aktif</h4>
                    <p className="text-xs text-green-800 mt-1 font-bold">
                      Masa aktif Wi-Fi Anda berjalan normal dengan paket {customer.package}. Tidak ada tagihan jatuh tempo saat ini.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. Status: BELUM_BAYAR */}
          {customer.status === 'BELUM_BAYAR' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex gap-3 text-amber-950">
                <AlertCircle className="w-7 h-7 text-amber-600 shrink-0 mt-0.5 stroke-[2.5px] animate-bounce" />
                <div>
                  <h4 className="font-black text-sm uppercase">Tagihan Belum Dibayar</h4>
                  <p className="text-xs text-amber-800 mt-1 font-bold">
                    Internet Anda aktif. Silakan ajukan pembayaran QRIS atau bayar di kasir secara tunai melalui tombol di bawah untuk memperpanjang langganan Anda.
                  </p>
                </div>
              </div>

              {/* Unpaid Info Block: Name, Phone, Package, Due Date */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Informasi Tagihan Pelanggan
                </h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase font-sans">Nama Pelanggan</span>
                    <span className="font-black text-slate-800 uppercase">{customer.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase font-sans">No. WhatsApp</span>
                    <span className="font-black text-slate-700 font-mono">{customer.wa}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-100/60 my-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase font-sans">Paket Layanan</span>
                    <span className="font-black text-slate-800">{customer.package}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase font-sans">Batas Jatuh Tempo</span>
                    <span className="font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-mono text-[10px] inline-block">{customer.dueDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Status: AJUAN_BAYAR */}
          {customer.status === 'AJUAN_BAYAR' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex gap-3 text-blue-900">
              <Clock className="w-7 h-7 text-blue-600 shrink-0 mt-0.5 stroke-[2.5px] animate-pulse" />
              <div>
                {customer.paymentMethod === 'KASIR' ? (
                  <>
                    <h4 className="font-black text-sm uppercase">Ajuan Bayar di Kasir Dikirim</h4>
                    <p className="text-xs text-blue-800 mt-1 font-bold">
                      Permintaan pembayaran tunai di kasir telah dikirim ke Admin. Silakan kunjungi kantor/kasir untuk melakukan pembayaran tunai. Admin akan mengaktifkan layanan internet Anda segera setelah menerima pembayaran tunai.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-black text-sm uppercase">Ajuan QRIS Dikirim</h4>
                    <p className="text-xs text-blue-800 mt-1 font-bold">
                      Permintaan QRIS Anda sudah masuk ke sistem Admin. QRIS pembayaran Anda akan muncul di sini setelah Admin memproses dan memberikan QRIS aktif dengan durasi tertentu.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 4. Status: MENUNGGU_BAYAR */}
          {customer.status === 'MENUNGGU_BAYAR' && (
            <div className="space-y-4">
              {timeLeft > 0 ? (
                <>
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 font-black text-sm uppercase">
                      <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                      Sisa Waktu Pembayaran QRIS:
                    </div>
                    <div className="font-mono text-3xl font-black text-blue-700 tracking-wider bg-white px-6 py-2 rounded-2xl border-2 border-blue-100 shadow-inner">
                      {formatTime(timeLeft)}
                    </div>
                    <p className="text-[10px] text-blue-800 font-bold max-w-xs">
                      Rincian pembayaran ini aktif dan akan hangus otomatis setelah waktu habis demi keamanan transaksi Anda.
                    </p>
                  </div>

                  {/* QRIS Code Image Box */}
                  {(!customer.customPaymentDetails || customer.customQrisUrl) && (
                    <div className="bg-slate-50 border-2 border-dashed border-blue-200 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
                      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-md">
                        <img 
                          src={customer.customQrisUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=1d4ed8&bgcolor=ffffff&data=${encodeURIComponent(`KOMINDO_QRIS_BILLING:${customer.customerId}:${customer.amount}`)}`}
                          alt="QRIS Komindo"
                          className="w-48 h-48 object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-900 font-black text-xs uppercase tracking-wider">
                        <QrCode className="w-4 h-4 text-blue-600 stroke-[3.5px]" />
                        {customer.customQrisUrl ? 'QRIS KHUSUS ANDA' : 'QRIS DINAMIS NASIONAL'}
                      </div>
                    </div>
                  )}

                  {/* Custom Bank/E-wallet Payment Details */}
                  {customer.customPaymentDetails && (
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg border border-slate-700 space-y-3 relative overflow-hidden">
                      <div className="absolute -right-6 -bottom-6 opacity-5 text-white">
                        <CreditCard className="w-24 h-24" />
                      </div>
                      <div className="flex justify-between items-center relative z-10">
                        <span className="text-[9px] bg-blue-500/30 text-blue-300 font-bold font-mono tracking-widest uppercase px-2 py-0.5 rounded">
                          REKENING PEMBAYARAN
                        </span>
                        <CreditCard className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-300 font-semibold leading-relaxed whitespace-pre-line select-all">
                        {customer.customPaymentDetails}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(customer.customPaymentDetails || '');
                          alert('Rincian pembayaran berhasil disalin!');
                        }}
                        className="mt-2 text-[10px] bg-white/10 hover:bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all uppercase w-max"
                      >
                        <FileText className="w-3.5 h-3.5 text-white" />
                        Copy Rincian
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3 text-red-900">
                  <ShieldAlert className="w-7 h-7 text-red-600 shrink-0 mt-0.5 stroke-[2.5px]" />
                  <div>
                    <h4 className="font-black text-sm uppercase">QRIS Kedaluwarsa</h4>
                    <p className="text-xs text-red-800 mt-1 font-bold">
                      Batas waktu pembayaran 1 jam telah terlewati. Silakan ajukan ulang pembuatan QRIS baru kepada Admin di bawah.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Status: MENUNGGU_KONFIRMASI */}
          {customer.status === 'MENUNGGU_KONFIRMASI' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 flex flex-col items-center text-center space-y-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-blue-600 border-r-blue-600 rounded-full animate-spin" />
                <CreditCard className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h4 className="font-black text-base text-blue-900 uppercase">Proses Konfirmasi Pembayaran</h4>
                <p className="text-xs text-slate-700 font-bold mt-2 max-w-sm">
                  Bukti pembayaran Anda telah terkirim ke Admin. Admin sedang memeriksa dana masuk. Setelah disetujui, halaman ini akan otomatis berganti ke <span className="text-green-600 font-black">LUNAS</span>.
                </p>
              </div>
              <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-2/3 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {/* Service Details Breakdown */}
          <div className="space-y-3">
            <h4 className="font-black text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-blue-600" />
              Rincian Layanan Internet
            </h4>
            <div className="border border-blue-100 rounded-xl divide-y divide-blue-50 overflow-hidden bg-slate-50/50">
              <div className="flex justify-between items-center p-3.5 text-xs">
                <span className="text-slate-500 font-bold">Nama Paket</span>
                <span className="font-black text-slate-800">{customer.package}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 text-xs">
                <span className="text-slate-500 font-bold">Kapasitas Kecepatan</span>
                <span className="font-black text-slate-800">Upto 20 Mbps (Kuota Unlimited)</span>
              </div>
              <div className="flex justify-between items-center p-3.5 text-xs">
                <span className="text-slate-500 font-bold">Periode Tagihan</span>
                <span className="font-black text-slate-700">{getPeriodName(customer.dueDate)}</span>
              </div>
              <div className="flex justify-between items-center p-4 text-xs bg-blue-50/40">
                <span className="text-blue-900 font-black">Total Pembayaran</span>
                <span className="font-black text-lg text-blue-900 font-mono">
                  Rp {customer.amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Zone based on status */}
          <div className="space-y-4 pt-2">
            
            {/* Action 1: Customer needs to request QRIS or Cashier */}
            {(customer.status === 'BELUM_BAYAR' || (customer.status === 'MENUNGGU_BAYAR' && timeLeft <= 0)) && (
              <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                <h4 className="font-sans font-black text-xs text-slate-700 uppercase tracking-wider text-center border-b border-slate-100 pb-2">
                  Metode Pembayaran Tersedia
                </h4>
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => handleRequestPayment('QRIS')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
                  >
                    <QrCode className="w-4.5 h-4.5 text-white stroke-[2.5px]" />
                    Ajukan Pembayaran via QRIS
                  </button>

                  <button
                    onClick={() => handleRequestPayment('KASIR')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
                  >
                    <CreditCard className="w-4.5 h-4.5 text-white stroke-[2.5px]" />
                    Bayar di Kasir (Tunai)
                  </button>
                </div>
              </div>
            )}

            {/* Action 2: Customer has an active QRIS and can upload proof of payment */}
            {customer.status === 'MENUNGGU_BAYAR' && timeLeft > 0 && (
              <form onSubmit={handleSubmitProof} className="bg-slate-50 border-2 border-blue-100 rounded-xl p-4 space-y-3 shadow-inner">
                <h4 className="font-black text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                  <UploadCloud className="w-4.5 h-4.5 text-blue-600" />
                  Kirim Bukti Pembayaran
                </h4>
                <p className="text-[10px] text-slate-600 font-bold">
                  Transfer ke QRIS di atas, lalu lampirkan screenshot kuitansi transaksi di bawah ini:
                </p>

                {/* Upload File Area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden" 
                  />
                  {proofPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={proofPreview} 
                        alt="Preview Bukti" 
                        className="max-h-24 mx-auto rounded border border-slate-200 shadow-sm"
                      />
                      <p className="text-[10px] text-green-600 font-black truncate max-w-xs">{proofFileName}</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-blue-500 mb-1 stroke-[2px]" />
                      <span className="text-[11px] text-blue-700 font-black uppercase">Pilih Foto / Screenshot</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">JPEG, PNG maks 5MB</span>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!proofPreview || isSubmittingProof}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    proofPreview && !isSubmittingProof
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-[0.98]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmittingProof ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            )}

            {/* Action for next period payment when status is LUNAS */}
            {customer.status === 'LUNAS' && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200/80 rounded-xl p-4.5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                  <h4 className="font-sans font-black text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Bayar Tagihan Bulan Depan / Perpanjang
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                  Layanan internet Anda untuk periode ini telah <strong>aktif & lunas</strong>. Anda dapat melakukan pembayaran di muka untuk periode berikutnya agar perpanjangan berjalan tanpa hambatan.
                </p>
                <div className="border border-indigo-100 rounded-xl bg-white divide-y divide-indigo-50 overflow-hidden text-xs">
                  <div className="flex justify-between items-center p-3">
                    <span className="text-slate-500 font-bold">Periode Berikutnya</span>
                    <span className="font-black text-indigo-900 font-sans">{getPeriodName(getNextDueDate(customer.dueDate))}</span>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span className="text-slate-500 font-bold">Jatuh Tempo Baru</span>
                    <span className="font-black text-indigo-900 font-mono">{getNextDueDate(customer.dueDate)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-50/20">
                    <span className="text-slate-500 font-bold">Total Pembayaran</span>
                    <span className="font-black text-slate-800 font-mono">Rp {customer.amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('chime');
                    const nextDate = getNextDueDate(customer.dueDate);
                    const updated: Customer = {
                      ...customer,
                      dueDate: nextDate,
                      status: 'AJUAN_BAYAR'
                    };
                    if (onUpdateCustomer) {
                      onUpdateCustomer(updated);
                      alert(`Berhasil mengajukan perpanjangan internet untuk periode ${getPeriodName(nextDate)}. Silakan hubungi Admin atau tunggu Admin mengaktifkan QRIS Anda.`);
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
                >
                  <QrCode className="w-4.5 h-4.5 stroke-[2.5px]" />
                  Ajukan QRIS Bulan Depan
                </button>
              </div>
            )}

            {/* Action 3: Display "Data & Riwayat Pembayaran" section */}
            <div>
              <button
                onClick={() => {
                  playSound('click');
                  setShowHistory(!showHistory);
                }}
                className="w-full bg-white hover:bg-blue-50 border-2 border-blue-100 text-blue-700 font-black py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <History className="w-4 h-4 stroke-[2.5px]" />
                {showHistory ? 'Sembunyikan Riwayat' : 'Data & Riwayat Pembayaran'}
              </button>
            </div>

            {/* Collapsible Payment History Section */}
            {showHistory && (
              <div className="bg-slate-50 border-2 border-blue-50 rounded-xl p-4 space-y-3 animate-fade-in shadow-inner">
                <h4 className="font-black text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Rekap Pembayaran Anda (ID: {customer.customerId})
                </h4>

                {customer.paymentHistory && customer.paymentHistory.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-green-700 font-black">
                      🎉 Anda telah melakukan pembayaran sukses sebanyak <strong>{customer.paymentHistory.length}</strong> kali.
                    </p>
                    <div className="divide-y divide-blue-100 bg-white border border-blue-50 rounded-lg overflow-hidden">
                      {customer.paymentHistory.map((item) => (
                        <div key={item.id} className="p-3 flex justify-between items-center text-[11px] hover:bg-blue-50/20">
                          <div>
                            <p className="font-black text-blue-900">{item.package}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{item.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-800 font-mono">Rp {item.amount.toLocaleString('id-ID')}</p>
                            <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Belum ada riwayat pembayaran terekam di sistem e-billing baru ini.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Trust & Safety Badging */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center space-y-1 shadow-sm">
        <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider">KOMINDO JAMINAN KEAMANAN</p>
        <p className="text-[10px] text-slate-600 font-bold">
          Sistem e-billing dienkripsi 256-bit SSL. Pembayaran diproses real-time oleh gerbang QRIS Nasional Bank Indonesia.
        </p>
      </div>
    </div>
  );
}
