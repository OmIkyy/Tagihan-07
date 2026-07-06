/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, MessageTemplate, InternetPackage } from './types';

export const INTERNET_PACKAGES: InternetPackage[] = [
  { name: 'PAKET BASIC 200K', price: 200000, speed: '20 Mbps' },
  { name: 'PAKET STANDARD 300K', price: 300000, speed: '50 Mbps' },
  { name: 'PAKET PREMIUM 500K', price: 500000, speed: '100 Mbps' },
  { name: 'PAKET ULTRA 800K', price: 800000, speed: '200 Mbps' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    customerId: 'PL3.01.ALI.KASIM.001',
    name: 'ALI KASIM',
    wa: '6281273157733',
    package: 'PAKET BASIC 200K',
    dueDate: '01/06/2026',
    status: 'BELUM_BAYAR',
    amount: 200000,
    paymentHistory: [
      { id: 'hist-1a', date: '01/04/2026', amount: 200000, package: 'PAKET BASIC 200K', status: 'LUNAS' },
      { id: 'hist-1b', date: '01/05/2026', amount: 200000, package: 'PAKET BASIC 200K', status: 'LUNAS' }
    ]
  },
  {
    id: 'cust-2',
    customerId: 'PL4.015.ADI.SAFUTRA.009',
    name: 'ADI SAFUTRA',
    wa: '6283803966453',
    package: 'PAKET BASIC 200K',
    dueDate: '01/06/2026',
    status: 'LUNAS',
    amount: 200000,
    paymentHistory: [
      { id: 'hist-2a', date: '01/04/2026', amount: 200000, package: 'PAKET BASIC 200K', status: 'LUNAS' },
      { id: 'hist-2b', date: '01/05/2026', amount: 200000, package: 'PAKET BASIC 200K', status: 'LUNAS' }
    ]
  },
  {
    id: 'cust-3',
    customerId: 'PL4.015.SAUDI.003',
    name: 'SAUDI',
    wa: '6283198534152',
    package: 'PAKET BASIC 200K',
    dueDate: '01/06/2026',
    status: 'BELUM_BAYAR',
    amount: 200000,
    paymentHistory: [
      { id: 'hist-3a', date: '01/05/2026', amount: 200000, package: 'PAKET BASIC 200K', status: 'LUNAS' }
    ]
  },
  {
    id: 'cust-4',
    customerId: 'PL4.017.SURYADI.SUDIRJA.001',
    name: 'SURYADI',
    wa: '6282249427177',
    package: 'PAKET BASIC 200K',
    dueDate: '01/06/2026',
    status: 'BELUM_BAYAR',
    amount: 200000,
    paymentHistory: []
  },
  {
    id: 'cust-5',
    customerId: 'PL4.020.MANTAP.001',
    name: 'MANTAP',
    wa: '6285764910082',
    package: 'PAKET BASIC 200K',
    dueDate: '01/06/2026',
    status: 'LUNAS',
    amount: 200000,
    paymentHistory: [
      { id: 'hist-5a', date: '01/05/2026', amount: 200000, package: 'PAKET BASIC 200K', status: 'LUNAS' }
    ]
  },
  {
    id: 'cust-6',
    customerId: 'PL4.023.NURKHOLIS.001',
    name: 'NURKHOLIS',
    wa: '6285367961110',
    package: 'PAKET BASIC 200K',
    dueDate: '01/06/2026',
    status: 'BELUM_BAYAR',
    amount: 200000,
    paymentHistory: []
  },
  {
    id: 'cust-7',
    customerId: 'PL4.023.SINDI.PRATIWI.002',
    name: 'SINDI PRATIWI',
    wa: '6288286030335',
    package: 'PAKET BASIC 200K',
    dueDate: '01/06/2026',
    status: 'BELUM_BAYAR',
    amount: 200000,
    paymentHistory: []
  },
  {
    id: 'cust-8',
    customerId: 'PL4.005.AANG.MIDHARTA.001',
    name: 'AANG MIDHARTA',
    wa: '6282324553042',
    package: 'PAKET BASIC 200K',
    dueDate: '02/06/2026',
    status: 'LUNAS',
    amount: 200000,
    paymentHistory: [
      { id: 'hist-8a', date: '02/05/2026', amount: 200000, package: 'PAKET BASIC 200K', status: 'LUNAS' }
    ]
  },
  {
    id: 'cust-9',
    customerId: 'PL4.010.MAULANA.004',
    name: 'MAULANA',
    wa: '6281388703378',
    package: 'PAKET BASIC 200K',
    dueDate: '02/06/2026',
    status: 'BELUM_BAYAR',
    amount: 200000,
    paymentHistory: []
  },
  {
    id: 'cust-10',
    customerId: 'PL4.014.HERMAN.005',
    name: 'HERMAN',
    wa: '6281378373229',
    package: 'PAKET BASIC 200K',
    dueDate: '02/06/2026',
    status: 'BELUM_BAYAR',
    amount: 200000,
    paymentHistory: []
  }
];

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'TAGIHAN',
    isActive: true,
    text: `Ini adalah pesan otomatis dari sistem e-billing layanan *KOMINDO NETWORK*\n\nHalo {nama},\nPaket: {paket}\nJatuh Tempo: {jatuhTempo}\nPanduan cara melakukan pembayaran lihat video ini:\nhttps://komindo.net/cara-bayar\n\nSilakan scan stiker QRIS yang tertempel di modem Wi-Fi Anda untuk membayar dengan cepat dan otomatis lunas. Terima kasih!`
  },
  {
    id: 'PSB',
    isActive: false,
    text: `Ini adalah pesan otomatis dari sistem e-billing layanan *KOMINDO NETWORK*\n\n*Pembayaran Biaya Aktivasi Pemasangan Baru Wifi*\n\nHalo {nama},\nBiaya: {paket}\nJatuh Tempo: {jatuhTempo}\n\nTerima kasih atas kepercayaan Anda!`
  }
];
