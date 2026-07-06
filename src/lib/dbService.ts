import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Customer, MessageTemplate, InternetPackage, PaymentNotification } from '../types';
import { INITIAL_CUSTOMERS, DEFAULT_TEMPLATES, INTERNET_PACKAGES } from '../data';

// ----------------------------------------------------
// Collections Reference
// ----------------------------------------------------
const CUSTOMERS_COL = 'customers';
const TEMPLATES_COL = 'templates';
const PACKAGES_COL = 'packages';
const NOTIFICATIONS_COL = 'notifications';
const SETTINGS_COL = 'settings';

// ----------------------------------------------------
// Helper: Convert Firestore data safely
// ----------------------------------------------------
const mapDoc = <T>(docSnap: any): T => {
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
  } as T;
};

// ----------------------------------------------------
// 1. Customers Service
// ----------------------------------------------------
export async function getCustomers(): Promise<Customer[]> {
  try {
    const colRef = collection(db, CUSTOMERS_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed initial customers
      console.log('Seeding initial customers to Firestore...');
      const batch = writeBatch(db);
      for (const cust of INITIAL_CUSTOMERS) {
        const docRef = doc(db, CUSTOMERS_COL, cust.id);
        batch.set(docRef, cust);
      }
      await batch.commit();
      return INITIAL_CUSTOMERS;
    }
    return snap.docs.map(docSnap => mapDoc<Customer>(docSnap));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return INITIAL_CUSTOMERS;
  }
}

export async function saveCustomer(customer: Customer): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COL, customer.id);
    await setDoc(docRef, customer, { merge: true });
  } catch (error) {
    console.error('Error saving customer:', error);
  }
}

export async function deleteCustomerFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COL, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting customer:', error);
  }
}

// ----------------------------------------------------
// 2. Templates Service
// ----------------------------------------------------
export async function getTemplates(): Promise<MessageTemplate[]> {
  try {
    const colRef = collection(db, TEMPLATES_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('Seeding initial templates to Firestore...');
      const batch = writeBatch(db);
      for (const t of DEFAULT_TEMPLATES) {
        const docRef = doc(db, TEMPLATES_COL, t.id);
        batch.set(docRef, t);
      }
      await batch.commit();
      return DEFAULT_TEMPLATES;
    }
    return snap.docs.map(docSnap => mapDoc<MessageTemplate>(docSnap));
  } catch (error) {
    console.error('Error fetching templates:', error);
    return DEFAULT_TEMPLATES;
  }
}

export async function saveTemplatesToDb(templates: MessageTemplate[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const t of templates) {
      const docRef = doc(db, TEMPLATES_COL, t.id);
      batch.set(docRef, t, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.error('Error saving templates:', error);
  }
}

// ----------------------------------------------------
// 3. Packages Service
// ----------------------------------------------------
export async function getPackages(): Promise<InternetPackage[]> {
  try {
    const colRef = collection(db, PACKAGES_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('Seeding initial packages to Firestore...');
      const batch = writeBatch(db);
      for (const pkg of INTERNET_PACKAGES) {
        const docRef = doc(db, PACKAGES_COL, pkg.name);
        batch.set(docRef, pkg);
      }
      await batch.commit();
      return INTERNET_PACKAGES;
    }
    return snap.docs.map(docSnap => docSnap.data() as InternetPackage);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return INTERNET_PACKAGES;
  }
}

export async function savePackageToDb(pkg: InternetPackage): Promise<void> {
  try {
    const docRef = doc(db, PACKAGES_COL, pkg.name);
    await setDoc(docRef, pkg);
  } catch (error) {
    console.error('Error saving package:', error);
  }
}

export async function deletePackageFromDb(name: string): Promise<void> {
  try {
    const docRef = doc(db, PACKAGES_COL, name);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting package:', error);
  }
}

// ----------------------------------------------------
// 4. Notifications Service
// ----------------------------------------------------
export async function getNotifications(): Promise<PaymentNotification[]> {
  try {
    const colRef = collection(db, NOTIFICATIONS_COL);
    const q = query(colRef, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      const ts = data.timestamp;
      const timestamp = ts && typeof ts.toDate === 'function' ? ts.toDate() : (ts ? new Date(ts) : new Date());
      return {
        ...data,
        id: docSnap.id,
        timestamp,
      } as PaymentNotification;
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function addNotificationToDb(notif: PaymentNotification): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COL, notif.id);
    const serialized = {
      ...notif,
      timestamp: notif.timestamp instanceof Date ? notif.timestamp.toISOString() : notif.timestamp
    };
    await setDoc(docRef, serialized);
  } catch (error) {
    console.error('Error adding notification:', error);
  }
}

export async function updateNotificationRead(id: string, read: boolean): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COL, id);
    await setDoc(docRef, { read }, { merge: true });
  } catch (error) {
    console.error('Error updating notification:', error);
  }
}

export async function deleteNotificationFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COL, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

// ----------------------------------------------------
// 5. System Settings Service
// ----------------------------------------------------
export interface AppSettings {
  brandName: string;
  brandSuffix: string;
  logoColor: string;
  logoType: 'wifi-classic' | 'wifi-modern' | 'wifi-shield' | 'wifi-globe' | 'custom';
  customLogoData: string | null;
  adminUsername: string;
  adminPassword: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  brandName: 'KOMINDO',
  brandSuffix: 'NETWORK',
  logoColor: '#2563eb', // Blue-600
  logoType: 'wifi-classic',
  customLogoData: null,
  adminUsername: 'admin',
  adminPassword: 'admin',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const colRef = collection(db, SETTINGS_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('Seeding initial settings to Firestore...');
      const docRef = doc(db, SETTINGS_COL, 'app_config');
      await setDoc(docRef, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const docSnap = snap.docs.find(d => d.id === 'app_config');
    return docSnap ? (docSnap.data() as AppSettings) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettingsToDb(settings: Partial<AppSettings>): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COL, 'app_config');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function resetAllDataToDefaults(currentCustomers: Customer[], currentPackages: InternetPackage[], currentNotifications: PaymentNotification[]): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Reset settings
    const settingsRef = doc(db, SETTINGS_COL, 'app_config');
    batch.set(settingsRef, DEFAULT_SETTINGS);

    // Delete existing customers & write initial ones
    for (const c of currentCustomers) {
      batch.delete(doc(db, CUSTOMERS_COL, c.id));
    }
    for (const c of INITIAL_CUSTOMERS) {
      batch.set(doc(db, CUSTOMERS_COL, c.id), c);
    }

    // Reset templates
    for (const t of DEFAULT_TEMPLATES) {
      batch.set(doc(db, TEMPLATES_COL, t.id), t);
    }

    // Delete existing packages & write initial ones
    for (const p of currentPackages) {
      batch.delete(doc(db, PACKAGES_COL, p.name));
    }
    for (const p of INTERNET_PACKAGES) {
      batch.set(doc(db, PACKAGES_COL, p.name), p);
    }

    // Delete existing notifications
    for (const n of currentNotifications) {
      batch.delete(doc(db, NOTIFICATIONS_COL, n.id));
    }

    await batch.commit();
  } catch (error) {
    console.error('Error resetting all data:', error);
    throw error;
  }
}

