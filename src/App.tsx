/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Sync-State: Trigger rules snapshot sync
 */

import React, { useState, useEffect, useRef } from 'react';
import { Customer, MessageTemplate, PaymentNotification, InternetPackage } from './types';
import { INITIAL_CUSTOMERS, DEFAULT_TEMPLATES, INTERNET_PACKAGES } from './data';
import AdminDashboard from './components/AdminDashboard';
import CustomerPortal from './components/CustomerPortal';
import NotificationsPanel from './components/NotificationsPanel';
import QuickSharePanel from './components/QuickSharePanel';
import QRISModal from './components/QRISModal';
import Logo from './components/Logo';
// @ts-ignore
import logoSvg from './assets/logo.svg';
// @ts-ignore
import logoPng from './assets/logo.png';
// @ts-ignore
import logoJpg from './assets/logo.jpg';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { 
  Wifi, ShieldAlert, CreditCard, Bell, Play, FileText, Settings, User, 
  Layers, Smartphone, CheckCircle, RefreshCw, Eye, ArrowRight, QrCode, Sparkles,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getCustomers,
  saveCustomer,
  deleteCustomerFromDb,
  getTemplates,
  saveTemplatesToDb,
  getPackages,
  savePackageToDb,
  deletePackageFromDb,
  getNotifications,
  addNotificationToDb,
  deleteNotificationFromDb,
  getSettings,
  saveSettingsToDb,
  resetAllDataToDefaults
} from './lib/dbService';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Logo & Branding Customization State
  const [brandName, setBrandName] = useState<string>('KOMINDO');
  const [brandSuffix, setBrandSuffix] = useState<string>('NETWORK');
  const [logoType, setLogoType] = useState<'wifi-classic' | 'wifi-modern' | 'wifi-shield' | 'wifi-globe' | 'custom'>('wifi-classic');
  const [logoColor, setLogoColor] = useState<string>('#2563EB');
  const [customLogoData, setCustomLogoData] = useState<string | null>(null);

  // Dynamically update document title and favicon based on branding
  useEffect(() => {
    if (brandName) {
      document.title = `${brandName} ${brandSuffix || ''} - E-Billing Wi-Fi`;
    }

    // Set dynamic favicon matching logo
    let faviconUrl = logoSvg;
    if (logoType === 'custom' && customLogoData) {
      faviconUrl = customLogoData;
    } else {
      faviconUrl = logoPng || logoJpg || logoSvg;
    }

    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      link.href = faviconUrl;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = logoType === 'custom' ? 'image/png' : 'image/svg+xml';
      newLink.href = faviconUrl;
      document.head.appendChild(newLink);
    }
  }, [brandName, brandSuffix, logoType, customLogoData]);

  // Core collections state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [packages, setPackages] = useState<InternetPackage[]>([]);

  // Navigation & Interactive Simulation State
  const [currentView, setCurrentView] = useState<'ADMIN' | 'PORTAL'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('admin') === 'true' || params.get('view') === 'admin';
      const queryId = params.get('id') || params.get('cust') || params.get('customer') || params.get('customerId');
      if (queryId) return 'PORTAL';
      if (isAdmin) return 'ADMIN';
      
      const saved = localStorage.getItem('currentView');
      if (saved === 'ADMIN' || saved === 'PORTAL') return saved;
    } catch (e) {}
    return 'PORTAL';
  });
  const [selectedCustomerForPortal, setSelectedCustomerForPortal] = useState<Customer | null>(null);
  
  // Admin credentials state
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('admin');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(true);
  
  // Directly trigger QRIS from table
  const [directQRISCustomer, setDirectQRISCustomer] = useState<Customer | null>(null);

  // Auto-Toast State for payments and alerts
  const [activeToast, setActiveToast] = useState<{
    customerName: string;
    amount: number;
    packageName: string;
    type: 'SUCCESS' | 'QRIS_REQUEST' | 'PROOF_SUBMITTED';
  } | null>(null);

  // Load initial settings and data from Firestore on mount and setup real-time listeners
  const playedNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    let isMounted = true;

    async function initDbAndSubscribe() {
      try {
        // Ensure initial collections are seeded in Firestore if empty
        const [settingsData, customersData, templatesData, packagesData] = await Promise.all([
          getSettings(),
          getCustomers(),
          getTemplates(),
          getPackages(),
        ]);

        if (!isMounted) return;

        if (settingsData) {
          setBrandName(settingsData.brandName || 'KOMINDO');
          setBrandSuffix(settingsData.brandSuffix || 'NETWORK');
          setLogoType(settingsData.logoType || 'wifi-classic');
          setLogoColor(settingsData.logoColor || '#2563EB');
          setCustomLogoData(settingsData.customLogoData || null);
          setAdminUsername(settingsData.adminUsername || 'admin');
          setAdminPassword(settingsData.adminPassword || 'admin');
        }

        setCustomers(customersData);
        setTemplates(templatesData);
        setPackages(packagesData);

        // Check query parameters to set view dynamically
        const params = new URLSearchParams(window.location.search);
        const queryId = params.get('id') || params.get('cust') || params.get('customer') || params.get('customerId');
        const isAdmin = params.get('admin') === 'true' || params.get('view') === 'admin';

        if (queryId) {
          const cleaned = queryId.trim().toUpperCase();
          const matched = customersData.find(
            (c) => c.customerId.toUpperCase() === cleaned || c.id.toUpperCase() === cleaned
          );
          if (matched) {
            setSelectedCustomerForPortal(matched);
          }
          setCurrentView('PORTAL');
        } else if (isAdmin) {
          setCurrentView('ADMIN');
        } else {
          setCurrentView('PORTAL');
        }

        // --- ATTACH REAL-TIME FIRESTORE LISTENERS ---
        
        // 1. Settings subscription
        const unsubSettings = onSnapshot(doc(db, 'settings', 'app_config'), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBrandName(data.brandName || 'KOMINDO');
            setBrandSuffix(data.brandSuffix || 'NETWORK');
            setLogoType(data.logoType || 'wifi-classic');
            setLogoColor(data.logoColor || '#2563EB');
            setCustomLogoData(data.customLogoData || null);
            setAdminUsername(data.adminUsername || 'admin');
            setAdminPassword(data.adminPassword || 'admin');
          }
        }, (err) => {
          console.error("Firestore onSnapshot error settings:", err);
        });
        unsubs.push(unsubSettings);

        // 2. Customers subscription
        const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
          const list: Customer[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...docSnap.data(), id: docSnap.id } as Customer);
          });
          setCustomers(list);

          // Sync active customer in portal if updated
          setSelectedCustomerForPortal((prevActive) => {
            if (!prevActive) return null;
            const updated = list.find((c) => c.id === prevActive.id);
            return updated || null;
          });
        }, (err) => {
          console.error("Firestore onSnapshot error customers:", err);
        });
        unsubs.push(unsubCustomers);

        // 3. Templates subscription
        const unsubTemplates = onSnapshot(collection(db, 'templates'), (snapshot) => {
          const list: MessageTemplate[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...docSnap.data(), id: docSnap.id } as MessageTemplate);
          });
          setTemplates(list);
        }, (err) => {
          console.error("Firestore onSnapshot error templates:", err);
        });
        unsubs.push(unsubTemplates);

        // 4. Packages subscription
        const unsubPackages = onSnapshot(collection(db, 'packages'), (snapshot) => {
          const list: InternetPackage[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as InternetPackage);
          });
          setPackages(list);
        }, (err) => {
          console.error("Firestore onSnapshot error packages:", err);
        });
        unsubs.push(unsubPackages);

        // 5. Notifications subscription with change detector for sound + toast
        const qNotifs = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
        const unsubNotifications = onSnapshot(qNotifs, (snapshot) => {
          const list: PaymentNotification[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const ts = data.timestamp;
            const timestamp = ts && typeof ts.toDate === 'function' ? ts.toDate() : (ts ? new Date(ts) : new Date());
            list.push({
              ...data,
              id: docSnap.id,
              timestamp,
            } as PaymentNotification);
          });
          setNotifications(list);

          // Detect new added notifications to trigger sounds & toasts dynamically across other devices
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const notifId = change.doc.id;
              if (!playedNotificationsRef.current.has(notifId)) {
                playedNotificationsRef.current.add(notifId);

                const data = change.doc.data();
                const ts = data.timestamp;
                const timestamp = ts && typeof ts.toDate === 'function' ? ts.toDate() : (ts ? new Date(ts) : new Date());
                const ageMs = Date.now() - timestamp.getTime();

                // Only alert for very recent actions (created in the last 20 seconds) to avoid trigger on initial load
                if (ageMs < 20000) {
                  if (data.type === 'QRIS_REQUEST') {
                    playNotificationSound('qris');
                    setActiveToast({
                      customerName: data.customerName,
                      amount: data.amount,
                      packageName: data.packageName,
                      type: 'QRIS_REQUEST'
                    });
                  } else if (data.type === 'PROOF_SUBMITTED') {
                    playNotificationSound('proof');
                    setActiveToast({
                      customerName: data.customerName,
                      amount: data.amount,
                      packageName: data.packageName,
                      type: 'PROOF_SUBMITTED'
                    });
                  } else if (data.type === 'SUCCESS') {
                    playNotificationSound('success');
                    setActiveToast({
                      customerName: data.customerName,
                      amount: data.amount,
                      packageName: data.packageName,
                      type: 'SUCCESS'
                    });
                  }
                }
              }
            }
          });
        }, (err) => {
          console.error("Firestore onSnapshot error notifications:", err);
        });
        unsubs.push(unsubNotifications);

      } catch (err) {
        console.error('Failed to initialize database and setup real-time listeners:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsSettingsLoaded(true);
        }
      }
    }

    initDbAndSubscribe();

    return () => {
      isMounted = false;
      unsubs.forEach((unsub) => unsub());
    };
  }, []);


  const playNotificationSound = (type: 'qris' | 'proof' | 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (typeof AudioCtx !== 'function') return;
      const ctx = new (AudioCtx as any)();
      const now = ctx.currentTime;

      if (type === 'qris') {
        // Soft double-beep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(600, now);
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, now + 0.1);
        gain2.gain.setValueAtTime(0.08, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.25);
      } else if (type === 'proof') {
        // High soft chime chord for uploading proof
        const freqs = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5 (Cmaj7)
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.06, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.35);
        });
      } else if (type === 'success') {
        // Victory major arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.08);
          gain.gain.setValueAtTime(0.08, now + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + index * 0.08);
          osc.stop(now + index * 0.08 + 0.3);
        });
      }
    } catch (e) {
      console.warn('AudioContext sound failed', e);
    }
  };

  // Parse URL query parameter for dynamic QR modem scan billing lookup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id') || params.get('cust') || params.get('customer') || params.get('customerId');
    const isAdmin = params.get('admin') === 'true' || params.get('view') === 'admin';

    if (queryId) {
      const cleaned = queryId.trim().toUpperCase();
      const matched = customers.find(
        (c) => c.customerId.toUpperCase() === cleaned || c.id.toUpperCase() === cleaned
      );
      if (matched) {
        setSelectedCustomerForPortal(matched);
      }
      setCurrentView('PORTAL');
    } else if (isAdmin) {
      setCurrentView('ADMIN');
    } else {
      setCurrentView('PORTAL');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize settings changes to Firestore with debounce
  useEffect(() => {
    if (!isSettingsLoaded) return;
    const delayDebounceFn = setTimeout(() => {
      saveSettingsToDb({
        brandName,
        brandSuffix,
        logoType,
        logoColor,
        customLogoData,
        adminUsername,
        adminPassword
      });
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [brandName, brandSuffix, logoType, logoColor, customLogoData, adminUsername, adminPassword, isSettingsLoaded]);

  // Auto-persist currentView to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('currentView', currentView);
    } catch (e) {}
  }, [currentView]);

  // Handle addition of a customer
  const handleAddCustomer = async (newCustomer: Omit<Customer, 'id'>) => {
    const customerWithId: Customer = {
      ...newCustomer,
      id: `cust-${Date.now()}`,
    };
    setCustomers((prev) => [customerWithId, ...prev]);
    await saveCustomer(customerWithId);
  };

  // Handle editing a customer
  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    // Intercept status changes to generate notifications
    const original = customers.find((c) => c.id === updatedCustomer.id);
    if (original && original.status !== updatedCustomer.status) {
      if (updatedCustomer.status === 'AJUAN_BAYAR') {
        const newNotif: PaymentNotification = {
          id: `notif-qris-${Date.now()}`,
          customerId: updatedCustomer.customerId,
          customerName: updatedCustomer.name,
          packageName: updatedCustomer.package,
          amount: updatedCustomer.amount,
          timestamp: new Date(),
          read: false,
          type: 'QRIS_REQUEST',
        };
        setNotifications((prev) => [newNotif, ...prev]);
        await addNotificationToDb(newNotif);

        // Notification Sound and Toast for Admin & Customer
        playNotificationSound('qris');
        setActiveToast({
          customerName: updatedCustomer.name,
          amount: updatedCustomer.amount,
          packageName: updatedCustomer.package,
          type: 'QRIS_REQUEST'
        });

        setTimeout(() => {
          setActiveToast((prev) => prev && prev.customerName === updatedCustomer.name && prev.type === 'QRIS_REQUEST' ? null : prev);
        }, 6000);

      } else if (updatedCustomer.status === 'MENUNGGU_KONFIRMASI') {
        const newNotif: PaymentNotification = {
          id: `notif-proof-${Date.now()}`,
          customerId: updatedCustomer.customerId,
          customerName: updatedCustomer.name,
          packageName: updatedCustomer.package,
          amount: updatedCustomer.amount,
          timestamp: new Date(),
          read: false,
          type: 'PROOF_SUBMITTED',
        };
        setNotifications((prev) => [newNotif, ...prev]);
        await addNotificationToDb(newNotif);

        // Notification Sound and Toast for Admin & Customer
        playNotificationSound('proof');
        setActiveToast({
          customerName: updatedCustomer.name,
          amount: updatedCustomer.amount,
          packageName: updatedCustomer.package,
          type: 'PROOF_SUBMITTED'
        });

        setTimeout(() => {
          setActiveToast((prev) => prev && prev.customerName === updatedCustomer.name && prev.type === 'PROOF_SUBMITTED' ? null : prev);
        }, 6000);
      }
    }

    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
    // Sync active customer in portal if updated
    if (selectedCustomerForPortal && selectedCustomerForPortal.id === updatedCustomer.id) {
      setSelectedCustomerForPortal(updatedCustomer);
    }
    await saveCustomer(updatedCustomer);
  };

  // Handle deleting a customer
  const handleDeleteCustomer = async (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (selectedCustomerForPortal && selectedCustomerForPortal.id === id) {
      setSelectedCustomerForPortal(null);
    }
    await deleteCustomerFromDb(id);
  };

  // Handle template updates
  const handleSaveTemplates = async (updatedTemplates: MessageTemplate[]) => {
    setTemplates(updatedTemplates);
    await saveTemplatesToDb(updatedTemplates);
  };

  // Handle adding a package
  const handleAddPackage = async (newPkg: InternetPackage) => {
    if (packages.some((p) => p.name.toUpperCase() === newPkg.name.toUpperCase())) {
      return;
    }
    setPackages((prev) => [...prev, newPkg]);
    await savePackageToDb(newPkg);
  };

  // Handle deleting a package
  const handleDeletePackage = async (packageName: string) => {
    setPackages((prev) => prev.filter((p) => p.name !== packageName));
    await deletePackageFromDb(packageName);
  };

  // Triggered when any customer completes payment
  const handlePaymentSuccess = async (customer: Customer) => {
    // 1. Update customer status to LUNAS in customers list
    const updatedCustomer: Customer = { ...customer, status: 'LUNAS' };
    await handleUpdateCustomer(updatedCustomer);

    // 2. Add notification log
    const newNotification: PaymentNotification = {
      id: `notif-success-${Date.now()}`,
      customerId: customer.customerId,
      customerName: customer.name,
      packageName: customer.package,
      amount: customer.amount,
      timestamp: new Date(),
      read: false,
      type: 'SUCCESS',
    };
    setNotifications((prev) => [newNotification, ...prev]);
    await addNotificationToDb(newNotification);

    // 3. Trigger dynamic banner toast notification
    setActiveToast({
      customerName: customer.name,
      amount: customer.amount,
      packageName: customer.package,
      type: 'SUCCESS'
    });

    playNotificationSound('success');

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToast((prev) => prev && prev.customerName === customer.name && prev.type === 'SUCCESS' ? null : prev);
    }, 6000);
  };

  const handleOpenCustomerPortal = (customer: Customer) => {
    setSelectedCustomerForPortal(customer);
    setCurrentView('PORTAL');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotificationFromDb(id);
  };

  const handleResetData = async () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang data sistem ke pengaturan awal di Firestore?')) {
      setIsLoading(true);
      try {
        await resetAllDataToDefaults(customers, packages, notifications);
        
        // Reset states locally to default values
        setBrandName('KOMINDO');
        setBrandSuffix('NETWORK');
        setLogoType('wifi-classic');
        setLogoColor('#2563EB');
        setCustomLogoData(null);
        setAdminUsername('admin');
        setAdminPassword('admin');
        setCustomers(INITIAL_CUSTOMERS);
        setTemplates(DEFAULT_TEMPLATES);
        setPackages(INTERNET_PACKAGES);
        setNotifications([]);
        setSelectedCustomerForPortal(null);
        setCurrentView('ADMIN');
        alert('Sistem berhasil disetel ulang di Firestore!');
      } catch (err) {
        console.error(err);
        alert('Gagal menyetel ulang sistem.');
      } finally {
        setIsLoading(false);
      }
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 bg-blue-100 rounded-full animate-ping opacity-75" />
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin relative" />
          </div>
          <h3 className="font-sans font-black text-xl text-blue-900 mt-6 tracking-tight">Menghubungkan ke Cloud...</h3>
          <p className="font-sans text-xs text-slate-500 mt-2 leading-relaxed">
            Menghubungkan ke server Cloud Firestore yang aman. Sinkronisasi data tagihan otomatis sedang berlangsung...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">

      {/* Elegant Top Decorative Accent Bar */}
      <div className="h-1.5 w-full animate-pulse" style={{ backgroundColor: logoColor }} />

      {/* Main Header */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <Logo 
              logoType={logoType}
              logoColor={logoColor}
              customLogoData={customLogoData}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-blue-900">{brandName}</span>
                <span className="font-black text-lg tracking-wide" style={{ color: logoColor }}>{brandSuffix}</span>
              </div>
              <p className="text-[9px] font-mono font-black tracking-wider uppercase" style={{ color: logoColor }}>Sistem Pembayaran Resmi E-Billing</p>
            </div>
          </div>

          {/* Navigation Role Switcher & Reset - Only visible to manager in Admin mode */}
          {currentView === 'ADMIN' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentView('ADMIN')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-sm animate-pulse"
              >
                <Layers className="w-4 h-4" />
                🖥️ Dashboard Admin
              </button>

              <button
                onClick={handleResetData}
                title="Reset Database"
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-100"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setCurrentView('PORTAL');
                }}
                title="Keluar dari Admin"
                className="px-3 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white hover:border-rose-150 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Real-time Payment Confirmation Banner/Toast */}
      <AnimatePresence>
        {activeToast && (() => {
          let bgClass = 'bg-green-600 border-green-500';
          let Icon = CheckCircle;
          let titleText = 'NOTIFIKASI PEMBAYARAN MASUK!';
          let description = (
            <>
              Pelanggan <strong>{activeToast.customerName}</strong> telah melunasi{' '}
              <strong>{activeToast.packageName}</strong> sebesar{' '}
              <strong className="font-mono text-white">Rp {activeToast.amount.toLocaleString('id-ID')}</strong> via Scan QRIS.
            </>
          );

          if (activeToast.type === 'QRIS_REQUEST') {
            bgClass = 'bg-blue-600 border-blue-500';
            Icon = QrCode;
            titleText = 'AJUAN PEMBAYARAN QRIS!';
            description = (
              <>
                Pelanggan <strong>{activeToast.customerName}</strong> mengajukan permintaan kode QRIS untuk paket{' '}
                <strong>{activeToast.packageName}</strong> sebesar{' '}
                <strong className="font-mono text-white">Rp {activeToast.amount.toLocaleString('id-ID')}</strong>.
              </>
            );
          } else if (activeToast.type === 'PROOF_SUBMITTED') {
            bgClass = 'bg-purple-600 border-purple-500';
            Icon = Sparkles;
            titleText = 'BUKTI PEMBAYARAN DIKIRIM!';
            description = (
              <>
                Pelanggan <strong>{activeToast.customerName}</strong> telah mengirim bukti transfer untuk paket{' '}
                <strong>{activeToast.packageName}</strong>. Silakan periksa & konfirmasi!
              </>
            );
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
            >
              <div className={`${bgClass} text-white rounded-2xl p-4 shadow-xl border flex items-start gap-4`}>
                <div className="bg-white/20 p-2 rounded-xl shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-sans font-bold text-sm tracking-wide">{titleText}</h4>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">REAL-TIME</span>
                  </div>
                  <p className="text-xs mt-1.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {currentView === 'ADMIN' ? (
          <div className="space-y-10">
              {/* Real-time Payment Logging Panel */}
              <div className="w-full">
                <NotificationsPanel
                  notifications={notifications}
                  onDeleteNotification={handleDeleteNotification}
                  onMarkAsRead={(id) => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                    );
                  }}
                />
              </div>

              {/* Quick Customer Share Links Generator */}
              <div className="w-full">
                <QuickSharePanel customers={customers} />
              </div>

              {/* Core Admin Layout Table & Templates */}
              <AdminDashboard
                customers={customers}
                templates={templates}
                packages={packages}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onSaveTemplates={handleSaveTemplates}
                onAddPackage={handleAddPackage}
                onDeletePackage={handleDeletePackage}
                onTriggerQRIS={(cust) => setDirectQRISCustomer(cust)}
                onOpenPortal={handleOpenCustomerPortal}
                brandName={brandName}
                setBrandName={setBrandName}
                brandSuffix={brandSuffix}
                setBrandSuffix={setBrandSuffix}
                logoType={logoType}
                setLogoType={setLogoType}
                logoColor={logoColor}
                setLogoColor={setLogoColor}
                customLogoData={customLogoData}
                setCustomLogoData={setCustomLogoData}
                adminUsername={adminUsername}
                adminPassword={adminPassword}
                onUpdateAdminCredentials={(user, pass) => {
                  setAdminUsername(user);
                  setAdminPassword(pass);
                }}
              />
            </div>
        ) : (
          <div className="max-w-md mx-auto">
            <CustomerPortal
              customer={selectedCustomerForPortal}
              customers={customers}
              onSelectCustomer={(cust) => setSelectedCustomerForPortal(cust)}
              onBackToAdmin={() => {
                setCurrentView('ADMIN');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onPaymentSuccess={handlePaymentSuccess}
              brandName={brandName}
              brandSuffix={brandSuffix}
              logoType={logoType}
              logoColor={logoColor}
              customLogoData={customLogoData}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-20 py-8 text-xs text-neutral-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-bold text-neutral-600">KOMINDO NETWORK E-BILLING PLATFORM</p>
            <p className="mt-1">Hak Cipta &copy; 2026 KOMINDO NETWORK. Seluruh hak cipta dilindungi undang-undang.</p>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-neutral-600">Panduan Sistem</span>
            <span>&bull;</span>
            <span className="hover:text-neutral-600">Kebijakan Privasi</span>
            <span>&bull;</span>
            <span className="hover:text-neutral-600">Bantuan Teknis</span>
          </div>
        </div>
      </footer>

      {/* Direct QRIS Modal (triggered from Admin Table or Quick pay action) */}
      {directQRISCustomer && (
        <QRISModal
          customer={directQRISCustomer}
          isOpen={true}
          onClose={() => setDirectQRISCustomer(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
