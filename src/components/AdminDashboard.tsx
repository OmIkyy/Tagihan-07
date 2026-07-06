/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Customer, MessageTemplate, InternetPackage } from '../types';
import { INTERNET_PACKAGES } from '../data';
import Logo from './Logo';
import AdminCredentialsPanel from './AdminCredentialsPanel';
import VoiceSettingsPanel from './VoiceSettingsPanel';
import ManagePackagesPanel from './ManagePackagesPanel';
import { 
  Plus, Edit2, Trash2, Send, QrCode, Search, UserPlus, Save, Settings, 
  MessageSquare, User, Phone, Package, Calendar, ToggleLeft, ToggleRight,
  Filter, Check, ChevronLeft, ChevronRight, Share2, Eye, ShieldCheck, RefreshCw, Router, Link,
  Volume2, VolumeX, Sliders, Play, CheckCircle, UploadCloud, Lock, Key, FileText, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  customers: Customer[];
  templates: MessageTemplate[];
  packages: InternetPackage[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onSaveTemplates: (templates: MessageTemplate[]) => void;
  onAddPackage: (pkg: InternetPackage) => void;
  onDeletePackage: (name: string) => void;
  onTriggerQRIS: (customer: Customer) => void;
  onOpenPortal: (customer: Customer) => void;
  brandName: string;
  setBrandName: (val: string) => void;
  brandSuffix: string;
  setBrandSuffix: (val: string) => void;
  logoType: 'wifi-classic' | 'wifi-modern' | 'wifi-shield' | 'wifi-globe' | 'custom';
  setLogoType: (val: 'wifi-classic' | 'wifi-modern' | 'wifi-shield' | 'wifi-globe' | 'custom') => void;
  logoColor: string;
  setLogoColor: (val: string) => void;
  customLogoData: string | null;
  setCustomLogoData: (val: string | null) => void;
  adminUsername: string;
  adminPassword: string;
  onUpdateAdminCredentials: (user: string, pass: string) => void;
}

function numberToIndonesianWords(n: number): string {
  if (typeof n !== 'number' || isNaN(n) || n < 0) return 'nol';
  if (n === 0) return 'nol';
  const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  
  const konversi = (num: number): string => {
    if (num < 12) {
      return units[num] || '';
    } else if (num < 20) {
      return konversi(num - 10) + ' belas';
    } else if (num < 100) {
      return konversi(Math.floor(num / 10)) + ' puluh ' + konversi(num % 10);
    } else if (num < 200) {
      return 'seratus ' + konversi(num - 100);
    } else if (num < 1000) {
      return konversi(Math.floor(num / 100)) + ' ratus ' + konversi(num % 100);
    } else if (num < 2000) {
      return 'seribu ' + konversi(num - 1000);
    } else if (num < 1000000) {
      return konversi(Math.floor(num / 1000)) + ' ribu ' + konversi(num % 1000);
    } else if (num < 1000000000) {
      return konversi(Math.floor(num / 1000000)) + ' juta ' + konversi(num % 1000000);
    }
    return num.toString();
  };

  try {
    return konversi(n).replace(/\s+/g, ' ').trim();
  } catch (e) {
    return n.toString();
  }
}

function computeMonthlyRevenue(customersList: Customer[]): Array<{ name: string; pendapatan: number }> {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const revenueMap: { [key: string]: number } = {};
  
  customersList.forEach(cust => {
    if (cust.status === 'LUNAS') {
      const parts = cust.dueDate.split('/');
      if (parts.length === 3) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        const year = parts[2];
        if (monthIndex >= 0 && monthIndex < 12) {
          const key = `${year}-${monthIndex}`;
          revenueMap[key] = (revenueMap[key] || 0) + cust.amount;
        }
      }
    }
    
    if (cust.paymentHistory) {
      cust.paymentHistory.forEach(hist => {
        if (hist.status === 'LUNAS') {
          const parts = hist.date.split(/[-/]/);
          if (parts.length === 3) {
            let monthIndex = -1;
            let year = '';
            if (parts[2].length === 4) {
              monthIndex = parseInt(parts[1], 10) - 1;
              year = parts[2];
            } else if (parts[0].length === 4) {
              monthIndex = parseInt(parts[1], 10) - 1;
              year = parts[0];
            }
            if (monthIndex >= 0 && monthIndex < 12) {
              const key = `${year}-${monthIndex}`;
              revenueMap[key] = (revenueMap[key] || 0) + hist.amount;
            }
          }
        }
      });
    }
  });

  return monthNames.map((name, index) => {
    const key = `2026-${index}`;
    return {
      name,
      pendapatan: revenueMap[key] || 0,
    };
  });
}

export default function AdminDashboard({
  customers,
  templates,
  packages = INTERNET_PACKAGES,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onSaveTemplates,
  onAddPackage,
  onDeletePackage,
  onTriggerQRIS,
  onOpenPortal,
  brandName,
  setBrandName,
  brandSuffix,
  setBrandSuffix,
  logoType,
  setLogoType,
  logoColor,
  setLogoColor,
  customLogoData,
  setCustomLogoData,
  adminUsername,
  adminPassword,
  onUpdateAdminCredentials,
}: AdminDashboardProps) {
  // Local state for forms
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formWa, setFormWa] = useState('');
  const [formPackage, setFormPackage] = useState(() => packages[0]?.name || 'PAKET BASIC 200K');

  // Custom states for QRIS queue inputs
  const [customQrisImgs, setCustomQrisImgs] = useState<{[key: string]: string}>({});
  const [customInstructions, setCustomInstructions] = useState<{[key: string]: string}>({});

  // Package management local states
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgSpeed, setNewPkgSpeed] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');

  // Message templates local state
  const [localTemplates, setLocalTemplates] = useState<MessageTemplate[]>(templates);
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);

  // Filters and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackageFilter, setSelectedPackageFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Custom states for proof of payment view & approval
  const [activeProofCustomer, setActiveProofCustomer] = useState<Customer | null>(null);

  // Manual payment customisation states
  const [manualPaymentCustomer, setManualPaymentCustomer] = useState<Customer | null>(null);
  const [manualQrImg, setManualQrImg] = useState<string>('');
  const [manualInstructions, setManualInstructions] = useState<string>('');
  const [manualDuration, setManualDuration] = useState<number>(60);

  // Voice TTS control states
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isTTSSupported, setIsTTSSupported] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [voicesList, setVoicesList] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [testSpeechText, setTestSpeechText] = useState('Pembayaran berhasil. Budi telah membayar nominal seratus lima puluh ribu rupiah. Internet aktif otomatis.');
  
  // Custom toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Admin credentials update local state
  const [tempAdminUser, setTempAdminUser] = useState(adminUsername);
  const [tempAdminPass, setTempAdminPass] = useState(adminPassword);

  // Sync back when prop changes
  useEffect(() => {
    setTempAdminUser(adminUsername);
  }, [adminUsername]);

  useEffect(() => {
    setTempAdminPass(adminPassword);
  }, [adminPassword]);

  // Drag and drop state for custom logo
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Mohon unggah file gambar saja (PNG, JPG, SVG)!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCustomLogoData(e.target.result as string);
        setLogoType('custom');
        showToast('Logo kustom berhasil diperbarui!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    // Auto clear after 4.5 seconds
    setTimeout(() => {
      setToast(prev => prev && prev.message === message ? null : prev);
    }, 4500);
  };

  // Preload and monitor available browser speech voices
  useEffect(() => {
    let supported = false;
    try {
      if (typeof SpeechSynthesisUtterance === 'function' && 'speechSynthesis' in window) {
        const testUtterance = new SpeechSynthesisUtterance('');
        if (testUtterance) {
          supported = true;
        }
      }
    } catch (e) {
      console.warn('SpeechSynthesisUtterance is not constructible in this environment:', e);
    }
    setIsTTSSupported(supported);

    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          const available = window.speechSynthesis.getVoices() || [];
          setVoicesList(available);
          
          // Auto-select Indonesian if present
          const indoVoice = available.find(v => v && v.lang && (v.lang.includes('id') || v.lang.includes('ID')));
          if (indoVoice) {
            setSelectedVoiceURI(indoVoice.voiceURI);
          } else if (available.length > 0) {
            // Fallback to first available
            setSelectedVoiceURI(available[0].voiceURI);
          }
        } catch (e) {
          console.warn('Failed to load speech synthesis voices:', e);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Main customizable Voice Trigger
  const speakText = (text: string) => {
    if (!isSpeechEnabled || !isTTSSupported) return;
    try {
      if ('speechSynthesis' in window) {
        // Stop any currently running speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechRate;
        utterance.pitch = speechPitch;
        utterance.volume = speechVolume;

        // Try to bind custom voice selected
        const selectedVoice = voicesList.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          // Fallback search
          const indoVoice = voicesList.find(v => v.lang.includes('id') || v.lang.includes('ID'));
          if (indoVoice) {
            utterance.voice = indoVoice;
          }
        }

        utterance.lang = 'id-ID';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('TTS speak error:', err);
    }
  };

  const handleApproveQRISRequest = (
    cust: Customer, 
    durationMinutes: number = 60, 
    customPaymentDetails?: string, 
    customQrisUrl?: string
  ) => {
    // Admin approves the request and generates a QRIS with custom duration & payment instructions
    const updated: Customer = {
      ...cust,
      status: 'MENUNGGU_BAYAR',
      qrisExpiresAt: Date.now() + durationMinutes * 60 * 1000,
      customPaymentDetails,
      customQrisUrl,
    };
    onUpdateCustomer(updated);
    
    let durationText = `${durationMinutes} menit`;
    if (durationMinutes === 60) durationText = '1 jam';
    else if (durationMinutes === 120) durationText = '2 jam';
    else if (durationMinutes === 1440) durationText = '24 jam';
    
    showToast(`Rincian pembayaran sukses diaktifkan selama ${durationText} untuk pelanggan ${cust.name}!`, 'info');
  };

  const handleConfirmPaymentSuccess = (cust: Customer) => {
    // Append a new successful transaction to history
    const historyItem = {
      id: `hist-${Date.now()}`,
      date: new Date().toLocaleDateString('id-ID'),
      amount: cust.amount,
      package: cust.package,
      status: 'LUNAS' as const,
    };
    const updatedHistory = [...(cust.paymentHistory || []), historyItem];

    const updated: Customer = {
      ...cust,
      status: 'LUNAS',
      qrisExpiresAt: undefined,
      paymentProofUrl: undefined,
      paymentProofName: undefined,
      paymentHistory: updatedHistory,
    };
    
    onUpdateCustomer(updated);
    
    // Play dual beep sound
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (typeof AudioCtx === 'function') {
        const ctx = new (AudioCtx as any)();
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      }
    } catch (e) {}

    // Play Voice Notification TTS (Speech Synthesis)
    // Convert numbers to readable text for perfect Indonesian TTS rendering
    const rupiahText = numberToIndonesianWords(cust.amount);

    const textToSpeak = `${cust.name.toLowerCase()}, paket ${cust.package.toLowerCase()}, nominal ${rupiahText} rupiah, sudah bayar.`;
    speakText(textToSpeak);

    showToast(`Konfirmasi Sukses! Status internet ${cust.name} telah diaktifkan otomatis.`, 'success');
  };

  const handleOpenManualPaymentModal = (cust: Customer) => {
    setManualPaymentCustomer(cust);
    setManualQrImg(cust.customQrisUrl || '');
    setManualInstructions(cust.customPaymentDetails || '');
    setManualDuration(60); // Default to 1 hour
  };

  const handleExportExcel = () => {
    // Filter customers who paid (status === 'LUNAS')
    const paidCustomers = customers.filter(c => c.status === 'LUNAS');
    
    if (paidCustomers.length === 0) {
      showToast('Tidak ada data pelanggan dengan status LUNAS untuk direkap.', 'error');
      return;
    }

    // High quality, professionally styled XML Spreadsheet 2003 code
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>KOMINDO NETWORK</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" />
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:CharSet="1" ss:Size="10" ss:Color="#334155"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="MainTitle">
   <Font ss:FontName="Segoe UI" x:CharSet="1" ss:Size="15" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Segoe UI" x:CharSet="1" ss:Size="9" ss:Italic="1" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Segoe UI" x:CharSet="1" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
   </Borders>
  </Style>
  <Style ss:ID="RowNo">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="RowID">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Color="#0F172A" ss:Bold="1"/>
  </Style>
  <Style ss:ID="RowName">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#0F172A" ss:Bold="1"/>
  </Style>
  <Style ss:ID="RowAmount">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
  </Style>
  <Style ss:ID="RowStatusPaid">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="RowDate">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="RowMethod">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#4338CA"/>
   <Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalLabel">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalVal">
   <Font ss:FontName="Consolas" ss:Size="10" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Laporan Lunas">
  <Table>
   <Column ss:Width="45"/> <!-- No -->
   <Column ss:Width="160"/> <!-- ID Pelanggan -->
   <Column ss:Width="200"/> <!-- Nama Pelanggan -->
   <Column ss:Width="130"/> <!-- No WhatsApp -->
   <Column ss:Width="180"/> <!-- Paket Internet -->
   <Column ss:Width="120"/> <!-- Jatuh Tempo -->
   <Column ss:Width="140"/> <!-- Jumlah Pembayaran -->
   <Column ss:Width="130"/> <!-- Metode Bayar -->
   <Column ss:Width="110"/> <!-- Status -->

   <!-- Title Row -->
   <Row ss:Height="28">
    <Cell ss:MergeAcross="8" ss:StyleID="MainTitle"><Data ss:Type="String">LAPORAN REKAP PEMBAYARAN WI-FI (STATUS: LUNAS)</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="8" ss:StyleID="SubTitle"><Data ss:Type="String">Dicetak otomatis pada: ${new Date().toLocaleString('id-ID')} | Total Lunas: ${paidCustomers.length} Pelanggan</Data></Cell>
   </Row>
   <Row ss:Height="12">
    <!-- Blank spacer row -->
   </Row>

   <!-- Header Row -->
   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">ID Pelanggan</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Nama Pelanggan</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">No. WhatsApp</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Paket Internet</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Jatuh Tempo</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Jumlah Bayar</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Metode Bayar</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Status</Data></Cell>
   </Row>
`;

    let totalRevenue = 0;
    paidCustomers.forEach((cust, idx) => {
      totalRevenue += cust.amount;
      const cleanWa = cust.wa || '-';
      const methodText = cust.paymentMethod || 'QRIS';
      
      xml += `   <Row ss:Height="22">
    <Cell ss:StyleID="RowNo"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="RowID"><Data ss:Type="String">${cust.customerId}</Data></Cell>
    <Cell ss:StyleID="RowName"><Data ss:Type="String">${cust.name}</Data></Cell>
    <Cell ss:StyleID="RowNo"><Data ss:Type="String">${cleanWa}</Data></Cell>
    <Cell ss:StyleID="RowName"><Data ss:Type="String">${cust.package}</Data></Cell>
    <Cell ss:StyleID="RowDate"><Data ss:Type="String">${cust.dueDate}</Data></Cell>
    <Cell ss:StyleID="RowAmount"><Data ss:Type="Number">${cust.amount}</Data></Cell>
    <Cell ss:StyleID="RowMethod"><Data ss:Type="String">${methodText}</Data></Cell>
    <Cell ss:StyleID="RowStatusPaid"><Data ss:Type="String">LUNAS</Data></Cell>
   </Row>
`;
    });

    // Total Row
    xml += `   <Row ss:Height="24">
    <Cell ss:MergeAcross="5" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL REKAP PENDAPATAN LUNAS</Data></Cell>
    <Cell ss:StyleID="TotalVal"><Data ss:Type="Number">${totalRevenue}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TotalLabel"><Data ss:Type="String"></Data></Cell>
   </Row>
`;

    xml += `  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `REKAP_BAYAR_LUNAS_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Berhasil mengekspor rekap ${paidCustomers.length} pelanggan LUNAS ke Excel dengan rapi!`, 'success');
  };

  // Simulated WhatsApp preview modal
  const [activeWaPreview, setActiveWaPreview] = useState<{
    customer: Customer;
    text: string;
  } | null>(null);

  // Reset form helper
  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormCustomerId('');
    setFormWa('');
    setFormPackage(packages[0]?.name || 'PAKET BASIC 200K');
  };

  // Populate form for editing
  const handleStartEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormName(customer.name);
    setFormCustomerId(customer.customerId);
    setFormWa(customer.wa);
    setFormPackage(customer.package);
    
    // Smooth scroll to form on mobile
    const formElement = document.getElementById('tambah-pelanggan-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName || !newPkgSpeed || !newPkgPrice) {
      alert('Mohon isi semua kolom paket!');
      return;
    }
    const priceNum = parseInt(newPkgPrice.replace(/\D/g, ''), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Harga paket harus berupa angka yang valid!');
      return;
    }

    onAddPackage({
      name: newPkgName.trim().toUpperCase(),
      speed: newPkgSpeed.trim(),
      price: priceNum
    });

    setNewPkgName('');
    setNewPkgSpeed('');
    setNewPkgPrice('');
    showToast(`Paket ${newPkgName.trim().toUpperCase()} berhasil ditambahkan!`, 'success');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCustomerId || !formWa) {
      alert('Mohon isi semua kolom!');
      return;
    }

    const packageMeta = packages.find((p) => p.name === formPackage);
    const amount = packageMeta ? packageMeta.price : 200000;

    if (editingId) {
      // Find original customer to keep their status, or default
      const original = customers.find((c) => c.id === editingId);
      onUpdateCustomer({
        id: editingId,
        name: formName.toUpperCase(),
        customerId: formCustomerId.toUpperCase(),
        wa: formWa.trim(),
        package: formPackage,
        dueDate: original ? original.dueDate : '01/06/2026',
        status: original ? original.status : 'BELUM_BAYAR',
        amount,
      });
      alert('Pelanggan berhasil diperbarui!');
    } else {
      onAddCustomer({
        name: formName.toUpperCase(),
        customerId: formCustomerId.toUpperCase(),
        wa: formWa.trim(),
        package: formPackage,
        dueDate: '01/06/2026',
        status: 'BELUM_BAYAR',
        amount,
      });
      alert('Pelanggan baru berhasil ditambahkan!');
    }
    resetForm();
  };

  // Copy payment portal link directly to clipboard
  const handleCopyPaymentLink = (cust: Customer) => {
    const paymentUrl = `${window.location.origin}${window.location.pathname}?id=${cust.customerId}`;
    navigator.clipboard.writeText(paymentUrl).then(() => {
      showToast(`Link Pembayaran untuk ${cust.name} berhasil disalin ke clipboard!`, 'success');
    }).catch(() => {
      alert(`Link Pembayaran: ${paymentUrl}`);
    });
  };

  // Generate WhatsApp message preview
  const handleTriggerWaMessage = (customer: Customer, type: 'TAGIHAN' | 'PSB') => {
    const template = localTemplates.find((t) => t.id === type);
    if (!template) return;

    let text = template.text
      .replace(/{nama}/g, customer.name)
      .replace(/{paket}/g, customer.package)
      .replace(/{jatuhTempo}/g, customer.dueDate);

    setActiveWaPreview({ customer, text });
  };

  const handleToggleTemplate = (id: 'TAGIHAN' | 'PSB') => {
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const handleSaveTemplateChanges = () => {
    onSaveTemplates(localTemplates);
    setTemplateSavedMsg(true);
    setTimeout(() => {
      setTemplateSavedMsg(false);
    }, 3000);
  };

  // Filter & Search processing
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.wa.includes(searchQuery);

    const matchesPackage =
      selectedPackageFilter === 'ALL' || cust.package === selectedPackageFilter;

    const matchesStatus =
      selectedStatusFilter === 'ALL' || cust.status === selectedStatusFilter;

    return matchesSearch && matchesPackage && matchesStatus;
  });

  // Pagination processing
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-10">
      {/* Premium Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none"
          >
            <div className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : toast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}>
              <CheckCircle className={`w-5 h-5 shrink-0 ${
                toast.type === 'success' ? 'text-emerald-600' : toast.type === 'error' ? 'text-rose-600' : 'text-blue-600'
              }`} />
              <div className="flex-1 text-xs font-bold leading-tight">
                {toast.message}
              </div>
              <button 
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Customer Management (8 Columns) */}
        <div className="lg:col-span-8 space-y-8">

      {/* SECTION 1.6: PENGATURAN LOGO & BRANDING (DEPRECATED - MOVED TO LogoBrandingPanel) */}
      <div className="hidden bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: logoColor }} />
        
        <h3 className="font-sans font-black text-lg text-slate-800 flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5" style={{ color: logoColor }} />
          Pengaturan Logo & Branding Wi-Fi
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-5">
          Sesuaikan logo bentuk Wi-Fi kustom, nama brand, dan tema warna sistem portal pembayaran e-billing Anda secara real-time.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Col 1: Brand Name Customization */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
              <span>✍️</span> Nama Brand & Suffix
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Brand Utama (e.g. KOMINDO)
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-mono"
                  placeholder="KOMINDO"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Brand Suffix (e.g. NETWORK)
                </label>
                <input
                  type="text"
                  value={brandSuffix}
                  onChange={(e) => setBrandSuffix(e.target.value)}
                  className="w-full text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-mono"
                  placeholder="NETWORK"
                />
              </div>
            </div>

            {/* Quick Accent Color Theme Selection */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Pilih Warna Aksen Brand
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Blue', value: '#2563EB' },
                  { name: 'Indigo', value: '#4F46E5' },
                  { name: 'Emerald', value: '#059669' },
                  { name: 'Teal', value: '#0D9488' },
                  { name: 'Purple', value: '#7C3AED' },
                  { name: 'Rose', value: '#E11D48' },
                  { name: 'Amber', value: '#D97706' },
                  { name: 'Slate', value: '#475569' },
                ].map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setLogoColor(color.value);
                      showToast(`Warna aksen diubah ke ${color.name}!`, 'success');
                    }}
                    className="w-6 h-6 rounded-full border border-white shadow-xs cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center relative"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {logoColor === color.value && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                    )}
                  </button>
                ))}
                
                {/* Custom Spectrum Picker */}
                <div className="flex items-center gap-1.5 ml-1">
                  <input
                    type="color"
                    value={logoColor}
                    onChange={(e) => setLogoColor(e.target.value)}
                    className="w-6 h-6 rounded-full border-0 cursor-pointer p-0 overflow-hidden shrink-0 outline-none"
                    title="Warna Kustom"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{logoColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Drag & Drop / Click Custom Logo Upload */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
              <span>🖼️</span> Unggah Logo Sendiri (Wifi / Lainnya)
            </h4>

            {/* Drag & Drop Stage */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingLogo(true);
              }}
              onDragLeave={() => setIsDraggingLogo(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingLogo(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleLogoUpload(file);
              }}
              onClick={() => logoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] relative ${
                isDraggingLogo 
                  ? 'border-indigo-500 bg-indigo-50/50 scale-95 shadow-inner' 
                  : logoType === 'custom'
                  ? 'border-emerald-300 bg-emerald-50/10'
                  : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
              }`}
              style={{
                borderColor: isDraggingLogo ? logoColor : (logoType === 'custom' ? '#10B981' : undefined)
              }}
            >
              <input
                type="file"
                ref={logoInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                accept="image/*"
                className="hidden"
              />

              {logoType === 'custom' && customLogoData ? (
                <div className="space-y-2">
                  <div className="relative mx-auto w-14 h-14 rounded-xl border border-slate-100 overflow-hidden shadow-md">
                    <img 
                      src={customLogoData} 
                      alt="Custom Logo Preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[10px] font-black text-emerald-700">Logo Anda Aktif!</p>
                  <p className="text-[9px] text-slate-500 font-medium">Klik atau seret file gambar lain untuk mengganti</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                    <UploadCloud className="w-5 h-5 stroke-[2.5px]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-700">Unggah Gambar Logo</p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Mendukung format PNG, JPG, SVG</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">Seret & lepas berkas di sini atau klik untuk mencari</p>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Logo Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={logoType === 'custom'}
                onClick={() => {
                  if (customLogoData) {
                    setLogoType('custom');
                    showToast('Logo kustom diaktifkan!', 'success');
                  } else {
                    logoInputRef.current?.click();
                  }
                }}
                className={`flex-1 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  logoType === 'custom'
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span>✨</span> Aktifkan Logo Kustom
              </button>

              {customLogoData && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomLogoData(null);
                    setLogoType('wifi-classic');
                    showToast('Logo kustom dihapus.', 'info');
                  }}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Hapus Logo Kustom"
                >
                  Hapus Logo
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 1.8: DAFTAR AJUAN PEMBAYARAN (Antrean QRIS/Kasir) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <QrCode className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-base text-slate-800">
                Antrean Ajuan Pembayaran QR & Kasir
              </h3>
              <p className="text-xs text-slate-400">
                Proses pengajuan pembayaran QRIS kustom atau tunai dari pelanggan secara real-time.
              </p>
            </div>
          </div>
          <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
            {customers.filter(c => c.status === 'AJUAN_BAYAR').length} Pengajuan
          </span>
        </div>

        {customers.filter(c => c.status === 'AJUAN_BAYAR').length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <p className="text-sm font-semibold">🎉 Tidak ada pengajuan pembayaran baru.</p>
            <p className="text-[11px] mt-0.5">Semua pengajuan dari portal pelanggan telah selesai diproses.</p>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-slate-100">
            {customers.filter(c => c.status === 'AJUAN_BAYAR').map((cust) => {
              const method = cust.paymentMethod || 'QRIS';
              const instVal = customInstructions[cust.id] ?? '';
              const qrisVal = customQrisImgs[cust.id] ?? '';
              
              return (
                <div key={cust.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/75 p-3 rounded-xl border border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm uppercase">{cust.name}</span>
                        <span className="text-slate-400 text-xs font-mono">({cust.customerId})</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          method === 'KASIR' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {method === 'KASIR' ? 'TUNAI DI KASIR' : 'QRIS / TRANSFER'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 font-medium">
                        <span>WhatsApp: <strong className="text-slate-700 font-mono">{cust.wa}</strong></span>
                        <span>•</span>
                        <span>Paket: <strong className="text-slate-800">{cust.package}</strong></span>
                        <span>•</span>
                        <span>Jumlah: <strong className="text-blue-600 font-mono">Rp {cust.amount.toLocaleString('id-ID')}</strong></span>
                      </div>
                    </div>

                    {method === 'KASIR' ? (
                      <button
                        onClick={() => handleConfirmPaymentSuccess(cust)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Terima Tunai (Kasir)
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold italic">Lengkapi detail di bawah untuk mengirim</span>
                    )}
                  </div>

                  {method === 'QRIS' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/30 p-4 rounded-xl border border-slate-100/80">
                      {/* Left side: config (8 cols) */}
                      <div className="md:col-span-8 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Expiry select */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                              Masa Berlaku Pembayaran (Durasi)
                            </label>
                            <select
                              id={`queue-dur-${cust.id}`}
                              defaultValue="60"
                              className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="5">5 Menit</option>
                              <option value="15">15 Menit</option>
                              <option value="30">30 Menit</option>
                              <option value="60">1 Jam</option>
                              <option value="120">2 Jam</option>
                              <option value="1440">24 Jam</option>
                            </select>
                          </div>

                          {/* Quick fill instructions */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                              Template No Rek/E-wallet
                            </label>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  setCustomInstructions(prev => ({ ...prev, [cust.id]: e.target.value }));
                                }
                              }}
                              className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none"
                            >
                              <option value="">-- Pilih No Rekening --</option>
                              <option value={"Bank BCA\nNo Rek: 7820192819\na.n. PT KOMINDO NETWORK"}>BCA PT KOMINDO</option>
                              <option value={"Bank Mandiri\nNo Rek: 142001827391\na.n. Admin Komindo"}>Mandiri Admin</option>
                              <option value={"DANA / ShopeePay\nNo HP: 082123456789\na.n. Komindo Billing"}>DANA/ShopeePay</option>
                            </select>
                          </div>
                        </div>

                        {/* Alternate instruction details textarea */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            Informasi Tambahan / No Rekening (Teks)
                          </label>
                          <textarea
                            value={instVal}
                            onChange={(e) => setCustomInstructions(prev => ({ ...prev, [cust.id]: e.target.value }))}
                            placeholder="Contoh: Silakan transfer ke Bank Mandiri No. Rek: 142001827391 a.n. KOMINDO, lalu unggah bukti di bawah."
                            className="w-full h-16 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>

                      {/* Right side: Custom QR upload (4 cols) */}
                      <div className="md:col-span-4 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            Unggah QR Kustom (Gambar)
                          </label>
                          <div className="flex gap-2 items-center">
                            <label className="cursor-pointer bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-2 text-center text-xs text-blue-600 font-bold transition-colors block flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setCustomQrisImgs(prev => ({ ...prev, [cust.id]: event.target.result as string }));
                                        showToast('Gambar QR berhasil dipilih!', 'success');
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                              {qrisVal ? 'Ganti QR' : 'Pilih QR'}
                            </label>
                            {qrisVal && (
                              <button
                                onClick={() => setCustomQrisImgs(prev => {
                                  const cpy = { ...prev };
                                  delete cpy[cust.id];
                                  return cpy;
                                })}
                                className="bg-red-50 text-red-600 p-2 rounded-lg border border-red-200 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer"
                                title="Hapus QR Kustom"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>

                        {qrisVal ? (
                          <div className="border border-slate-200 bg-white rounded-lg p-1.5 flex justify-center max-h-16 overflow-hidden">
                            <img src={qrisVal} alt="Preview QR Kustom" className="object-contain max-h-12 rounded" />
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-400 font-semibold italic leading-relaxed text-center">
                            Jika kosong, system otomatis akan membuat QRIS Dinamis standar nominal Rp {cust.amount.toLocaleString('id-ID')}
                          </p>
                        )}

                        <button
                          onClick={() => {
                            const selectEl = document.getElementById(`queue-dur-${cust.id}`) as HTMLSelectElement | null;
                            const mins = selectEl ? parseInt(selectEl.value, 10) : 60;
                            handleApproveQRISRequest(cust, mins, instVal || undefined, qrisVal || undefined);
                            // Clear states
                            setCustomInstructions(prev => {
                              const cpy = { ...prev };
                              delete cpy[cust.id];
                              return cpy;
                            });
                            setCustomQrisImgs(prev => {
                              const cpy = { ...prev };
                              delete cpy[cust.id];
                              return cpy;
                            });
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.97]"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Kirim QR / Rincian
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2.8: RECHARTS MONTHLY REVENUE CHART */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-sans font-bold text-base text-slate-800 flex items-center gap-2">
            <span className="text-blue-600">📈</span> Grafik Analisis Pendapatan Bulanan (Lunas)
          </h3>
          <p className="text-xs text-slate-400">
            Akumulasi nilai pendapatan dari tagihan lunas dan riwayat pelunasan pelanggan tahun 2026.
          </p>
        </div>

        <div className="w-full">
          {(() => {
            const chartData = computeMonthlyRevenue(customers);
            const totalRevenue = chartData.reduce((acc, curr) => acc + curr.pendapatan, 0);
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Total Pendapatan Terkumpul</span>
                    <strong className="text-blue-600 font-mono text-base font-black">
                      Rp {totalRevenue.toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Rata-rata Bulanan</span>
                    <strong className="text-slate-700 font-mono text-base font-black">
                      Rp {Math.round(totalRevenue / 12).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Status Audit</span>
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 font-black px-2 py-0.5 rounded-full text-[9px] uppercase">
                      <Check className="w-3 h-3 stroke-[3px]" /> Sinkron Terverifikasi
                    </span>
                  </div>
                </div>

                <div className="h-[280px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.25}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => `Rp ${(v / 1000).toLocaleString('id-ID')}K`}
                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#F8FAFC' }}
                        labelStyle={{ color: '#94A3B8' }}
                      />
                      <Bar dataKey="pendapatan" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* SECTION 2: Add Customer ("Tambah Pelanggan") */}
      <div 
        id="tambah-pelanggan-form"
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <h3 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-slate-500" />
          {editingId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
        </h3>

        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Nama */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Nama Pelanggan
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Ali Kasim"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* ID Pelanggan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                ID Pelanggan
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  placeholder="PL3.01.ALI.KASIM.001"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                No. WhatsApp (WA)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formWa}
                  onChange={(e) => setFormWa(e.target.value)}
                  placeholder="628127315..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Paket */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Pilih Paket Internet
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={formPackage}
                  onChange={(e) => setFormPackage(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-8 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 appearance-none cursor-pointer font-bold"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.name} value={pkg.name}>
                      {pkg.name} - Rp {pkg.price.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-5 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2.5: Kelola Paket Internet ("Manage Internet Packages") (DEPRECATED - MOVED TO ManagePackagesPanel) */}
      <div className="hidden bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-slate-500" />
          Kelola Paket Internet
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Add Package Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">
              ➕ Tambah Paket Baru
            </h4>
            <form onSubmit={handleCreatePackage} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Nama Paket
                </label>
                <input
                  type="text"
                  required
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  placeholder="Contoh: PAKET BASIC 200K"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Kecepatan (Speed)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPkgSpeed}
                    onChange={(e) => setNewPkgSpeed(e.target.value)}
                    placeholder="Contoh: 20 Mbps"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Harga Bulanan (Rp)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(e.target.value)}
                    placeholder="Contoh: 200000"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                <Plus className="w-4 h-4" />
                Tambah Paket
              </button>
            </form>
          </div>

          {/* Right Side: Packages List (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">
              📋 Daftar Paket Aktif
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {packages.map((pkg) => (
                <div 
                  key={pkg.name}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-800">{pkg.name}</p>
                    <div className="flex gap-2 text-[10px] text-slate-500 font-medium">
                      <span>⚡ {pkg.speed}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">Rp {pkg.price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menghapus paket "${pkg.name}"?`)) {
                        onDeletePackage(pkg.name);
                        showToast(`Paket ${pkg.name} dihapus!`, 'success');
                      }
                    }}
                    disabled={packages.length <= 1}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Hapus Paket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {packages.length <= 1 && (
              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2 leading-relaxed">
                ⚠️ Harus menyisakan minimal 1 paket dalam sistem untuk memastikan pengisian form pelanggan tetap berfungsi dengan benar.
              </p>
            )}
          </div>
        </div>
      </div>
      </div> {/* END OF LEFT COLUMN */}

      {/* RIGHT COLUMN: Sidebar Configuration (4 columns) */}
      <div className="lg:col-span-4 space-y-6">
         <AdminCredentialsPanel
           adminUsername={adminUsername}
           adminPassword={adminPassword}
           onUpdateAdminCredentials={onUpdateAdminCredentials}
           showToast={showToast}
         />

         <ManagePackagesPanel
           packages={packages}
           onAddPackage={onAddPackage}
           onDeletePackage={onDeletePackage}
           showToast={showToast}
         />



         <VoiceSettingsPanel
           isSpeechEnabled={isSpeechEnabled}
           setIsSpeechEnabled={setIsSpeechEnabled}
           selectedVoiceURI={selectedVoiceURI}
           setSelectedVoiceURI={setSelectedVoiceURI}
           voicesList={voicesList}
           speechRate={speechRate}
           setSpeechRate={setSpeechRate}
           speechPitch={speechPitch}
           setSpeechPitch={setSpeechPitch}
           speechVolume={speechVolume}
           setSpeechVolume={setSpeechVolume}
           testSpeechText={testSpeechText}
           setTestSpeechText={setTestSpeechText}
           speakText={speakText}
           showToast={showToast}
         />
      </div>

      </div> {/* END OF TWO COLUMN GRID LAYOUT */}

      {/* SECTION 3: Customer List & Filters ("Daftar Pelanggan") */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filter Actions Bar */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-sans font-bold text-lg text-slate-800">
                Daftar Pelanggan Layanan
              </h3>
              <button
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Ekspor seluruh pelanggan status LUNAS ke Excel yang rapi"
              >
                <FileText className="w-3.5 h-3.5" />
                Rekap Excel (Lunas)
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-medium">
                Total: <strong>{filteredCustomers.length}</strong> pelanggan
              </span>
              <span className="bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-lg font-medium">
                Lunas: <strong>{customers.filter(c => c.status === 'LUNAS').length}</strong>
              </span>
              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-lg font-medium">
                Belum Bayar: <strong>{customers.filter(c => c.status === 'BELUM_BAYAR').length}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            {/* Rows Limit Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-sans shrink-0">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer w-20"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama, ID, WA..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* Package Filter Select */}
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                value={selectedPackageFilter}
                onChange={(e) => {
                  setSelectedPackageFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer appearance-none font-semibold"
              >
                <option value="ALL">Semua Paket</option>
                {packages.map((pkg) => (
                  <option key={pkg.name} value={pkg.name}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Select */}
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer appearance-none font-semibold"
              >
                <option value="ALL">Semua Status Bayar</option>
                <option value="LUNAS">Lunas</option>
                <option value="BELUM_BAYAR">Belum Bayar</option>
                <option value="AJUAN_BAYAR">Minta QRIS</option>
                <option value="MENUNGGU_BAYAR">Menunggu Bayar</option>
                <option value="MENUNGGU_KONFIRMASI">Butuh Konfirmasi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-mono w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4 font-mono">ID Pelanggan</th>
                <th className="py-3.5 px-4 font-mono">No. WA (WhatsApp)</th>
                <th className="py-3.5 px-4">Paket Internet</th>
                <th className="py-3.5 px-4 text-center">Tempo</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Pembayaran & Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.map((cust, index) => (
                <tr
                  key={cust.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-4 px-4 font-mono text-center text-slate-400">
                    {startIndex + index + 1}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-950">
                    {cust.name}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-500 text-[11px]">
                    {cust.customerId}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600">
                    {cust.wa}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex bg-slate-100 text-slate-700 font-semibold text-[10px] px-2 py-1 rounded border border-slate-200">
                      {cust.package}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-slate-500 text-[11px]">
                    {cust.dueDate}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {(() => {
                      let badgeStyle = '';
                      let badgeText = '';
                      if (cust.status === 'LUNAS') {
                        badgeStyle = 'bg-green-50 text-green-600 border border-green-100';
                        badgeText = 'LUNAS';
                      } else if (cust.status === 'AJUAN_BAYAR') {
                        if (cust.paymentMethod === 'KASIR') {
                          badgeStyle = 'bg-emerald-50 text-emerald-600 border border-emerald-200 animate-pulse';
                          badgeText = 'AJUAN KASIR';
                        } else {
                          badgeStyle = 'bg-blue-50 text-blue-600 border border-blue-200 animate-pulse';
                          badgeText = 'AJUAN QRIS';
                        }
                      } else if (cust.status === 'MENUNGGU_BAYAR') {
                        badgeStyle = 'bg-sky-50 text-sky-600 border border-sky-200';
                        badgeText = 'MENUNGGU BAYAR';
                      } else if (cust.status === 'MENUNGGU_KONFIRMASI') {
                        badgeStyle = 'bg-purple-50 text-purple-600 border border-purple-200 animate-pulse';
                        badgeText = 'BUTUH KONFIRMASI';
                      } else {
                        badgeStyle = 'bg-amber-50 text-amber-600 border border-amber-100';
                        badgeText = 'BELUM BAYAR';
                      }
                      return (
                        <span
                          onClick={() => {
                            const nextStatus = cust.status === 'LUNAS' ? 'BELUM_BAYAR' : 'LUNAS';
                            onUpdateCustomer({ ...cust, status: nextStatus });
                          }}
                          className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black cursor-pointer transition-transform hover:scale-105 ${badgeStyle}`}
                          title="Klik untuk mengubah status"
                        >
                          {badgeText}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      {/* Special Approval Flow: Kirim QRIS atau Terima Kasir */}
                      {cust.status === 'AJUAN_BAYAR' && (
                        cust.paymentMethod === 'KASIR' ? (
                          <button
                            onClick={() => handleConfirmPaymentSuccess(cust)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg border border-emerald-500 transition-colors cursor-pointer flex items-center gap-1 font-black text-[10px] animate-pulse"
                            title="Konfirmasi Pembayaran Kasir Tunai"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            Terima Tunai (Kasir)
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                               id={`qris-dur-${cust.id}`}
                              defaultValue="60"
                              className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700"
                            >
                              <option value="5">5 Menit</option>
                              <option value="15">15 Menit</option>
                              <option value="30">30 Menit</option>
                              <option value="60">1 Jam</option>
                              <option value="120">2 Jam</option>
                              <option value="1440">24 Jam</option>
                            </select>
                            <button
                              onClick={() => {
                                const selectEl = document.getElementById(`qris-dur-${cust.id}`) as HTMLSelectElement | null;
                                const mins = selectEl ? parseInt(selectEl.value, 10) : 60;
                                handleApproveQRISRequest(cust, mins);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg border border-blue-500 transition-colors cursor-pointer flex items-center gap-1 font-black text-[10px]"
                              title="Kirim Kode QRIS Berdurasi kustom"
                            >
                              <QrCode className="w-3.5 h-3.5 text-white" />
                              Kirim QRIS
                            </button>
                            <button
                              onClick={() => handleOpenManualPaymentModal(cust)}
                              className="bg-amber-600 hover:bg-amber-700 text-white p-1.5 rounded-lg border border-amber-500 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[10px]"
                              title="Atur QRIS Kustom, Durasi & Pembayaran Lain"
                            >
                              <Settings className="w-3.5 h-3.5 text-white" />
                              Kustom Manual
                            </button>
                          </div>
                        )
                      )}

                      {/* Special Approval Flow: Konfirmasi Bukti Pembayaran */}
                      {cust.status === 'MENUNGGU_KONFIRMASI' && (
                        <>
                          {cust.paymentProofUrl && (
                            <button
                              onClick={() => setActiveProofCustomer(cust)}
                              className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg border border-purple-500 transition-colors cursor-pointer flex items-center gap-1 font-black text-[10px]"
                              title="Lihat Screenshot Bukti Transfer"
                            >
                              <Eye className="w-3.5 h-3.5 text-white" />
                              Lihat Bukti
                            </button>
                          )}
                          <button
                            onClick={() => handleConfirmPaymentSuccess(cust)}
                            className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded-lg border border-green-500 transition-colors cursor-pointer flex items-center gap-1 font-black text-[10px]"
                            title="Setujui pembayaran pelanggan sebagai Lunas"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            Sukses
                          </button>
                        </>
                      )}

                      {/* Default Quick Pay when in Belum Bayar */}
                      {cust.status === 'BELUM_BAYAR' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyPaymentLink(cust)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg border border-indigo-500 transition-colors cursor-pointer flex items-center gap-1 font-black text-[10px]"
                            title="Salin Link Pembayaran untuk Pelanggan"
                          >
                            <Link className="w-3.5 h-3.5 text-white" />
                            Salin Link Bayar
                          </button>
                          <button
                            onClick={() => handleOpenManualPaymentModal(cust)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg border border-blue-500 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[10px]"
                            title="Atur Manual QRIS / Durasi / Pembayaran Lain"
                          >
                            <Settings className="w-3.5 h-3.5 text-white" />
                            Bayar Manual
                          </button>
                        </div>
                      )}

                      {/* Salin Link Pembayaran */}
                      {cust.status !== 'BELUM_BAYAR' && (
                        <button
                          onClick={() => handleCopyPaymentLink(cust)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          title="Salin Link Pembayaran"
                        >
                          <Link className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Simualte WA Message Notification Sending */}
                      <button
                        onClick={() => handleTriggerWaMessage(cust, 'TAGIHAN')}
                        className="bg-green-50 hover:bg-green-100 text-green-600 p-1.5 rounded-lg border border-green-200 transition-colors cursor-pointer"
                        title="Simulasi WA Tagihan"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleStartEdit(cust)}
                        className="bg-slate-50 hover:bg-slate-100 text-amber-600 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="Ubah Pelanggan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus pelanggan ${cust.name}?`)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border border-red-100 transition-colors cursor-pointer"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan pelanggan yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High Quality Card List layout for ultimate HP responsiveness */}
        <div className="block md:hidden divide-y divide-slate-100">
          {paginatedCustomers.map((cust, index) => (
            <div key={cust.id} className="p-4 space-y-3 hover:bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 block">
                    No. {startIndex + index + 1} &bull; {cust.customerId}
                  </span>
                  <h4 className="font-sans font-bold text-slate-900 text-sm mt-0.5">{cust.name}</h4>
                </div>
                {(() => {
                  let badgeStyle = '';
                  let badgeText = '';
                  if (cust.status === 'LUNAS') {
                    badgeStyle = 'bg-green-50 text-green-600 border border-green-100';
                    badgeText = 'LUNAS';
                  } else if (cust.status === 'AJUAN_BAYAR') {
                    if (cust.paymentMethod === 'KASIR') {
                      badgeStyle = 'bg-emerald-50 text-emerald-600 border border-emerald-200 animate-pulse';
                      badgeText = 'AJUAN KASIR';
                    } else {
                      badgeStyle = 'bg-blue-50 text-blue-600 border border-blue-200 animate-pulse';
                      badgeText = 'AJUAN QRIS';
                    }
                  } else if (cust.status === 'MENUNGGU_BAYAR') {
                    badgeStyle = 'bg-sky-50 text-sky-600 border border-sky-200';
                    badgeText = 'MENUNGGU BAYAR';
                  } else if (cust.status === 'MENUNGGU_KONFIRMASI') {
                    badgeStyle = 'bg-purple-50 text-purple-600 border border-purple-200 animate-pulse';
                    badgeText = 'BUTUH KONFIRMASI';
                  } else {
                    badgeStyle = 'bg-amber-50 text-amber-600 border border-amber-100';
                    badgeText = 'BELUM BAYAR';
                  }
                  return (
                    <span
                      onClick={() => {
                        const nextStatus = cust.status === 'LUNAS' ? 'BELUM_BAYAR' : 'LUNAS';
                        onUpdateCustomer({ ...cust, status: nextStatus });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black cursor-pointer border ${badgeStyle}`}
                    >
                      {badgeText}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-50 py-2 font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">WhatsApp</span>
                  <span className="text-slate-700">{cust.wa}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Paket</span>
                  <span className="text-slate-800 font-bold">{cust.package}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block text-[9px] uppercase">Tagihan</span>
                  <span className="text-slate-900 font-semibold">Rp {cust.amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block text-[9px] uppercase">Tempo</span>
                  <span className="text-slate-600">{cust.dueDate}</span>
                </div>
              </div>

              {/* Mobile Actions Grid */}
              <div className="flex gap-1.5 justify-end flex-wrap">
                {/* Kirim QRIS atau Terima Kasir Button for mobile */}
                {cust.status === 'AJUAN_BAYAR' && (
                  cust.paymentMethod === 'KASIR' ? (
                    <button
                      onClick={() => handleConfirmPaymentSuccess(cust)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer animate-pulse w-full"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                      Terima Tunai (Kasir)
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full">
                      <select
                        id={`qris-dur-mob-${cust.id}`}
                        defaultValue="60"
                        className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700 flex-1"
                      >
                        <option value="5">5 Mnt</option>
                        <option value="15">15 Mnt</option>
                        <option value="30">30 Mnt</option>
                        <option value="60">1 Jam</option>
                        <option value="120">2 Jam</option>
                        <option value="1440">24 Jam</option>
                      </select>
                      <button
                        onClick={() => {
                          const selectEl = document.getElementById(`qris-dur-mob-${cust.id}`) as HTMLSelectElement | null;
                          const mins = selectEl ? parseInt(selectEl.value, 10) : 60;
                          handleApproveQRISRequest(cust, mins);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer animate-pulse flex-2"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Kirim QRIS
                      </button>
                    </div>
                  )
                )}

                {/* Confirmations on mobile */}
                {cust.status === 'MENUNGGU_KONFIRMASI' && (
                  <>
                    {cust.paymentProofUrl && (
                      <button
                        onClick={() => setActiveProofCustomer(cust)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Bukti
                      </button>
                    )}
                    <button
                      onClick={() => handleConfirmPaymentSuccess(cust)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Sukses
                    </button>
                  </>
                )}

                {cust.status === 'BELUM_BAYAR' && (
                  <button
                    onClick={() => handleCopyPaymentLink(cust)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all"
                  >
                    <Link className="w-3.5 h-3.5" />
                    Salin Link Bayar
                  </button>
                )}

                {cust.status !== 'BELUM_BAYAR' && (
                  <button
                    onClick={() => handleCopyPaymentLink(cust)}
                    className="bg-indigo-50 border border-indigo-200 text-indigo-600 p-1.5 rounded-lg cursor-pointer flex items-center justify-center"
                    title="Salin Link"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleTriggerWaMessage(cust, 'TAGIHAN')}
                  className="bg-green-50 border border-green-200 text-green-600 p-1.5 rounded-lg cursor-pointer flex items-center justify-center"
                  title="Kirim WA"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleStartEdit(cust)}
                  className="bg-slate-50 border border-slate-200 text-amber-600 p-1.5 rounded-lg cursor-pointer flex items-center justify-center"
                  title="Ubah"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus ${cust.name}?`)) onDeleteCustomer(cust.id);
                  }}
                  className="bg-red-50 border border-red-100 text-red-600 p-1.5 rounded-lg cursor-pointer flex items-center justify-center"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {paginatedCustomers.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ditemukan pelanggan.
            </div>
          )}
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-sans">
          <span>
            Menampilkan <strong>{paginatedCustomers.length}</strong> dari <strong>{totalItems}</strong> pelanggan
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono bg-white border border-slate-200 py-1.5 px-3 rounded-lg font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Message Preview Popup Modal */}
      <AnimatePresence>
        {activeWaPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setActiveWaPreview(null)}
            />
            <div className="bg-[#efeae2] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative z-10 border border-slate-300">
              {/* WA Chat Header */}
              <div className="bg-[#005e54] text-white p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                  KM
                </div>
                <div>
                  <h4 className="font-bold text-sm">KOMINDO NETWORK</h4>
                  <p className="text-[10px] text-green-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse"></span>
                    online (Sistem Otomatis)
                  </p>
                </div>
              </div>

              {/* Chat messages canvas */}
              <div className="p-4 h-80 overflow-y-auto space-y-4 font-sans bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[size:180px]">
                <div className="bg-white text-slate-800 p-3 rounded-2xl rounded-tl-none shadow-xs text-xs max-w-[85%] relative border border-slate-200/50">
                  <p className="whitespace-pre-wrap leading-relaxed">{activeWaPreview.text}</p>
                  <span className="text-[9px] text-slate-400 text-right block mt-2 font-mono">
                    20:45 &bull; Terkirim &bull; ✓✓
                  </span>
                </div>
              </div>

              {/* WA Footer */}
              <div className="bg-[#f0f0f0] p-3 flex items-center justify-between border-t border-slate-200">
                <p className="text-[10px] text-slate-500 italic">
                  Simulasi pengiriman otomatis sukses ke <strong>{activeWaPreview.customer.wa}</strong>
                </p>
                <button
                  onClick={() => {
                    setActiveWaPreview(null);
                    alert(`Notifikasi simulasi WhatsApp terkirim ke ${activeWaPreview.customer.wa}!`);
                  }}
                  className="bg-[#00a884] hover:bg-[#008f72] text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  OK, Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Payment Proof Viewer Modal */}
        {activeProofCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setActiveProofCustomer(null)}
            />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-100 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Bukti Pembayaran Pelanggan</h4>
                  <p className="text-[10px] text-slate-500 font-mono">ID: {activeProofCustomer.customerId} &bull; {activeProofCustomer.name}</p>
                </div>
                <button
                  onClick={() => setActiveProofCustomer(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Paket Internet</span>
                    <span className="text-slate-800 font-semibold">{activeProofCustomer.package}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Tagihan</span>
                    <span className="text-slate-900 font-mono font-bold text-blue-600">Rp {activeProofCustomer.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/50">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Nama File Upload</span>
                    <span className="text-slate-700 font-mono truncate block text-[11px]">{activeProofCustomer.paymentProofName || 'bukti-transfer.jpg'}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 relative group flex items-center justify-center min-h-60 max-h-96">
                  {activeProofCustomer.paymentProofUrl ? (
                    <img
                      src={activeProofCustomer.paymentProofUrl}
                      alt="Bukti Transfer Pelanggan"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain max-h-96"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <Eye className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-500">File bukti pembayaran tidak dapat dimuat atau berformat biner.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button
                  onClick={() => setActiveProofCustomer(null)}
                  className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    const cust = activeProofCustomer;
                    setActiveProofCustomer(null);
                    handleConfirmPaymentSuccess(cust);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Konfirmasi Sukses
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Payment Customisation Modal */}
        {manualPaymentCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setManualPaymentCustomer(null)}
            />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-150 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Pembayaran Manual Kustom</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Pelanggan: {manualPaymentCustomer.name} ({manualPaymentCustomer.customerId})</p>
                  </div>
                </div>
                <button
                  onClick={() => setManualPaymentCustomer(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1.5 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4 font-sans">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Paket Internet</span>
                    <span className="text-slate-800 font-black">{manualPaymentCustomer.package}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Tagihan</span>
                    <span className="text-blue-600 font-mono font-black">Rp {manualPaymentCustomer.amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Masa Berlaku Pembayaran (Durasi)
                  </label>
                  <select
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value={5}>5 Menit</option>
                    <option value={15}>15 Menit</option>
                    <option value={30}>30 Menit</option>
                    <option value={60}>1 Jam</option>
                    <option value={120}>2 Jam</option>
                    <option value={1440}>24 Jam</option>
                  </select>
                </div>

                {/* Templates for instructions */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Template No Rekening / Pembayaran Lain
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setManualInstructions(e.target.value);
                      }
                    }}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Gunakan Template (Opsional) --</option>
                    <option value={"Bank BCA\nNo Rek: 7820192819\na.n. PT KOMINDO NETWORK"}>BCA PT KOMINDO</option>
                    <option value={"Bank Mandiri\nNo Rek: 142001827391\na.n. Admin Komindo"}>Mandiri Admin</option>
                    <option value={"DANA / ShopeePay\nNo HP: 082123456789\na.n. Komindo Billing"}>DANA / ShopeePay</option>
                  </select>
                </div>

                {/* Manual text details */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Detail Informasi Pembayaran Transfer (Teks)
                  </label>
                  <textarea
                    value={manualInstructions}
                    onChange={(e) => setManualInstructions(e.target.value)}
                    placeholder="Contoh: Silakan transfer ke Bank Mandiri No Rek: 142001827391 a.n PT KOMINDO."
                    className="w-full h-20 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Custom QR Code Image upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Unggah QR Code Pembayaran Kustom (Gambar)
                  </label>
                  <div className="flex gap-3 items-center">
                    <label className="cursor-pointer bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 text-center text-xs text-blue-600 font-bold transition-all block flex-1 shadow-sm hover:shadow-md">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setManualQrImg(event.target.result as string);
                                showToast('Gambar QR kustom berhasil diunggah!', 'success');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-1.5">
                        <UploadCloud className="w-4 h-4" />
                        {manualQrImg ? 'Ganti QR Code' : 'Unggah QR Code'}
                      </div>
                    </label>
                    {manualQrImg && (
                      <button
                        onClick={() => setManualQrImg('')}
                        className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer shadow-sm"
                        title="Hapus QR Kustom"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  
                  {manualQrImg ? (
                    <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center space-y-1.5">
                      <img src={manualQrImg} alt="Preview QR" className="object-contain h-32 w-32 rounded shadow-md border bg-white p-1" />
                      <span className="text-[9px] text-slate-400 font-mono">File QR Kustom Terpilih</span>
                    </div>
                  ) : (
                    <p className="text-[9.5px] text-slate-400 italic text-center leading-relaxed">
                      Jika gambar dikosongkan, sistem otomatis menggunakan QRIS Dinamis standar nominal Rp {manualPaymentCustomer.amount.toLocaleString('id-ID')}.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2.5">
                <button
                  onClick={() => setManualPaymentCustomer(null)}
                  className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    handleApproveQRISRequest(
                      manualPaymentCustomer,
                      manualDuration,
                      manualInstructions || undefined,
                      manualQrImg || undefined
                    );
                    setManualPaymentCustomer(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Kirim Rincian
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
