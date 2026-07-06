/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  id: string; // Unique React list key
  customerId: string; // PL4.015.SAUDI.003
  name: string;
  wa: string;
  package: string; // e.g., 'PAKET BASIC 200K'
  dueDate: string; // DD/MM/YYYY
  status: 'LUNAS' | 'BELUM_BAYAR' | 'AJUAN_BAYAR' | 'MENUNGGU_BAYAR' | 'MENUNGGU_KONFIRMASI';
  amount: number; // Numeric value for calculations, e.g., 200000
  qrisExpiresAt?: number; // timestamp of expiry
  paymentProofUrl?: string; // base64 or simulated preview url
  paymentProofName?: string; // file name
  paymentMethod?: 'QRIS' | 'KASIR'; // QRIS request or Cashier request
  customPaymentDetails?: string; // Admin alternative payment details (e.g. Bank/E-wallet account)
  customQrisUrl?: string; // Admin custom QRIS image (base64 or URL)
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    package: string;
    status: 'LUNAS' | 'PROSES' | 'GAGAL';
  }>;
}

export interface MessageTemplate {
  id: 'TAGIHAN' | 'PSB';
  isActive: boolean;
  text: string;
}

export interface PaymentNotification {
  id: string;
  customerId: string;
  customerName: string;
  packageName: string;
  amount: number;
  timestamp: Date;
  read: boolean;
  type?: 'SUCCESS' | 'QRIS_REQUEST' | 'PROOF_SUBMITTED';
}

export interface InternetPackage {
  name: string;
  price: number;
  speed: string;
}
