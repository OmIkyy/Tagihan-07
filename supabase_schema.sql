-- ============================================================================
-- KOMINDO NETWORK E-BILLING WI-FI
-- Supabase PostgreSQL Schema Configuration
-- Generated: 2026-07-06
-- ============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------
-- 1. Table: system_settings
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY DEFAULT 'app_config',
    brand_name VARCHAR(100) NOT NULL DEFAULT 'KOMINDO',
    brand_suffix VARCHAR(100) NOT NULL DEFAULT 'NETWORK',
    logo_color VARCHAR(10) NOT NULL DEFAULT '#2563EB',
    logo_type VARCHAR(50) NOT NULL DEFAULT 'wifi-classic',
    custom_logo_data TEXT NULL,
    admin_username VARCHAR(100) NOT NULL DEFAULT 'admin',
    admin_password VARCHAR(100) NOT NULL DEFAULT 'admin',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 2. Table: internet_packages
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS internet_packages (
    name VARCHAR(100) PRIMARY KEY,
    price INT NOT NULL DEFAULT 0,
    speed VARCHAR(50) NOT NULL DEFAULT '10 Mbps',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 3. Table: customers
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    wa VARCHAR(100) NOT NULL,
    package VARCHAR(100) REFERENCES internet_packages(name) ON UPDATE CASCADE ON DELETE SET NULL,
    due_date VARCHAR(50) NOT NULL, -- Format DD/MM/YYYY
    status VARCHAR(50) NOT NULL CHECK (status IN ('LUNAS', 'BELUM_BAYAR', 'AJUAN_BAYAR', 'MENUNGGU_BAYAR', 'MENUNGGU_KONFIRMASI')),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    qris_expires_at BIGINT NULL,
    payment_proof_url TEXT NULL,
    payment_proof_name TEXT NULL,
    payment_method VARCHAR(50) NULL CHECK (payment_method IN ('QRIS', 'KASIR')),
    custom_payment_details TEXT NULL,
    custom_qris_url TEXT NULL,
    payment_history JSONB DEFAULT '[]'::jsonb, -- Array of previous invoice records
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 4. Table: message_templates
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS message_templates (
    id VARCHAR(50) PRIMARY KEY CHECK (id IN ('TAGIHAN', 'PSB')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    text TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 5. Table: payment_notifications
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_notifications (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(50) CHECK (type IN ('SUCCESS', 'QRIS_REQUEST', 'PROOF_SUBMITTED'))
);

-- ============================================================================
-- AUTOMATIC TIMESTAMPS (UPDATED_AT TRIGGERS)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_modtime
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_customers_modtime
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_message_templates_modtime
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- SUPABASE REALTIME REPLICATION CONFIGURATION
-- ============================================================================
-- Enable real-time updates for customers, notifications and settings tables.
-- In Supabase, this enables the client-side UI to automatically receive instant updates.

alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table payment_notifications;
alter publication supabase_realtime add table system_settings;

-- ============================================================================
-- SEED INITIAL DATA (SAFE MERGE)
-- ============================================================================

-- Insert default app settings
INSERT INTO system_settings (key, brand_name, brand_suffix, logo_color, logo_type, admin_username, admin_password)
VALUES ('app_config', 'KOMINDO', 'NETWORK', '#2563EB', 'wifi-classic', 'admin', 'admin')
ON CONFLICT (key) DO NOTHING;

-- Insert default packages
INSERT INTO internet_packages (name, price, speed) VALUES
('PAKET LITE 5 Mbps', 100000, '5 Mbps'),
('PAKET BASIC 10 Mbps', 150000, '10 Mbps'),
('PAKET POPULAR 20 Mbps', 200000, '20 Mbps'),
('PAKET PREMIUM 50 Mbps', 350000, '50 Mbps')
ON CONFLICT (name) DO NOTHING;

-- Insert default message templates
INSERT INTO message_templates (id, is_active, text) VALUES
('TAGIHAN', true, '*KOMINDO NETWORK*\n\nYth. Bapak/Ibu *[NAMA]*\nID Pelanggan: *[ID]*\n\nKami menginformasikan bahwa tagihan internet Wi-Fi Anda untuk paket *[PAKET]* sebesar *Rp [TAGIHAN]* jatuh tempo pada *[TANGGAL]*. Mohon lakukan pembayaran melalui link portal di bawah ini untuk menghindari isolir jaringan otomatis.\n\n📱 Link Pembayaran Mandiri Anda:\n[LINK]\n\nTerima kasih atas kerja samanya.'),
('PSB', true, '*KOMINDO NETWORK*\n\nYth. Pelanggan Baru *[NAMA]*\nID Pelanggan: *[ID]*\n\nPemasangan Wi-Fi baru Anda telah selesai dan aktif! Anda dapat mulai memonitor status tagihan serta masa aktif bulanan menggunakan portal pembayaran pribadi di bawah ini.\n\n📱 Link Portal Wi-Fi Anda:\n[LINK]\n\nTerima kasih telah bergabung bersama kami.')
ON CONFLICT (id) DO NOTHING;

-- Insert default sample customers
INSERT INTO customers (id, customer_id, name, wa, package, due_date, status, amount, payment_history) VALUES
('cust-1', 'KM-4190-RIZKY', 'Muhammad Rizky', '081234567890', 'PAKET POPULAR 20 Mbps', '10/07/2026', 'BELUM_BAYAR', 200000.00, '[{"id": "inv-001", "date": "10/06/2026", "amount": 200000, "status": "LUNAS", "package": "PAKET POPULAR 20 Mbps"}]'::jsonb),
('cust-2', 'KM-4112-DANI', 'Ahmad Dani', '089876543210', 'PAKET PREMIUM 50 Mbps', '05/07/2026', 'MENUNGGU_KONFIRMASI', 350000.00, '[]'::jsonb),
('cust-3', 'KM-4155-SITI', 'Siti Aminah', '081357924680', 'PAKET BASIC 10 Mbps', '15/07/2026', 'LUNAS', 150000.00, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
