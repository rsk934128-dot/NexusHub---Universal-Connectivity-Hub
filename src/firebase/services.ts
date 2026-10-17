import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './config';
import { Contact, InteractionLog, SyncPacket, ChannelType, Payment, CustomModule } from '../types';

// Profile sync
export async function syncUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();
  try {
    await setDoc(
      userRef,
      {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Nexus User',
        photoURL: user.photoURL || '',
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

// Contacts Realtime Subscription
export function subscribeToContacts(
  userId: string,
  onUpdate: (contacts: Contact[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = `users/${userId}/contacts`;
  const contactsQuery = query(collection(db, 'users', userId, 'contacts'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    contactsQuery,
    (snapshot) => {
      const contacts: Contact[] = [];
      snapshot.forEach((docSnap) => {
        contacts.push({ id: docSnap.id, ...(docSnap.data() as Omit<Contact, 'id'>) });
      });
      onUpdate(contacts);
    },
    (error) => {
      console.error('Snapshot error for contacts:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Add Contact
export async function createContact(
  userId: string,
  contactData: Omit<Contact, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = `users/${userId}/contacts`;
  const contactRef = doc(collection(db, 'users', userId, 'contacts'));
  const now = new Date().toISOString();

  const newContact: Contact = {
    id: contactRef.id,
    ownerId: userId,
    name: contactData.name.trim(),
    phone: contactData.phone.trim(),
    fbUsername: contactData.fbUsername?.trim() || '',
    telegramUsername: contactData.telegramUsername?.trim() || '',
    email: contactData.email?.trim() || '',
    category: contactData.category?.trim() || 'General',
    organization: contactData.organization?.trim() || '',
    notes: contactData.notes?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(contactRef, newContact);
    return contactRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${contactRef.id}`);
  }
}

// Update Contact
export async function updateContact(
  userId: string,
  contactId: string,
  updates: Partial<Omit<Contact, 'id' | 'ownerId' | 'createdAt'>>
): Promise<void> {
  const path = `users/${userId}/contacts/${contactId}`;
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  const now = new Date().toISOString();

  try {
    await updateDoc(contactRef, {
      ...updates,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete Contact
export async function deleteContact(userId: string, contactId: string): Promise<void> {
  const path = `users/${userId}/contacts/${contactId}`;
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  try {
    await deleteDoc(contactRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bulk Import
export async function bulkImportContacts(
  userId: string,
  contactsToImport: Array<Omit<Contact, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>
): Promise<number> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  let count = 0;

  for (const item of contactsToImport) {
    if (!item.name || !item.phone) continue;
    const contactRef = doc(collection(db, 'users', userId, 'contacts'));
    const newContact: Contact = {
      id: contactRef.id,
      ownerId: userId,
      name: item.name.trim(),
      phone: item.phone.trim(),
      fbUsername: item.fbUsername?.trim() || '',
      telegramUsername: item.telegramUsername?.trim() || '',
      email: item.email?.trim() || '',
      category: item.category?.trim() || 'Imported',
      organization: item.organization?.trim() || '',
      notes: item.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };
    batch.set(contactRef, newContact);
    count++;
  }

  if (count > 0) {
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/contacts (batch)`);
    }
  }
  return count;
}

// Subscribe to Interaction Logs
export function subscribeToLogs(
  userId: string,
  onUpdate: (logs: InteractionLog[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = `users/${userId}/logs`;
  const logsQuery = query(collection(db, 'users', userId, 'logs'), orderBy('timestamp', 'desc'));

  return onSnapshot(
    logsQuery,
    (snapshot) => {
      const logs: InteractionLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<InteractionLog, 'id'>) });
      });
      onUpdate(logs);
    },
    (error) => {
      console.error('Snapshot error for logs:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Record an interaction
export async function recordInteraction(
  userId: string,
  data: {
    contactId?: string;
    contactName: string;
    channel: ChannelType;
    messageSummary?: string;
  }
): Promise<string> {
  const path = `users/${userId}/logs`;
  const logRef = doc(collection(db, 'users', userId, 'logs'));
  const now = new Date().toISOString();

  const newLog: InteractionLog = {
    id: logRef.id,
    ownerId: userId,
    contactId: data.contactId || '',
    contactName: data.contactName,
    channel: data.channel,
    messageSummary: data.messageSummary || '',
    timestamp: now,
  };

  try {
    await setDoc(logRef, newLog);
    return logRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${logRef.id}`);
  }
}

// Subscribe to Sync Packets (Remote device events)
export function subscribeToSyncPackets(
  userId: string,
  onUpdate: (packets: SyncPacket[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = `users/${userId}/syncPackets`;
  const packetsQuery = query(collection(db, 'users', userId, 'syncPackets'), orderBy('timestamp', 'desc'));

  return onSnapshot(
    packetsQuery,
    (snapshot) => {
      const packets: SyncPacket[] = [];
      snapshot.forEach((docSnap) => {
        packets.push({ id: docSnap.id, ...(docSnap.data() as Omit<SyncPacket, 'id'>) });
      });
      onUpdate(packets);
    },
    (error) => {
      console.error('Snapshot error for syncPackets:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Add a simulated or received sync packet
export async function addSyncPacket(
  userId: string,
  packet: {
    deviceId: string;
    appName: string;
    sender: string;
    content?: string;
  }
): Promise<string> {
  const path = `users/${userId}/syncPackets`;
  const packetRef = doc(collection(db, 'users', userId, 'syncPackets'));
  const now = new Date().toISOString();

  const newPacket: SyncPacket = {
    id: packetRef.id,
    ownerId: userId,
    deviceId: packet.deviceId,
    appName: packet.appName,
    sender: packet.sender,
    content: packet.content || '',
    timestamp: now,
  };

  try {
    await setDoc(packetRef, newPacket);
    return packetRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${packetRef.id}`);
  }
}

// Delete sync packet
export async function deleteSyncPacket(userId: string, packetId: string): Promise<void> {
  const path = `users/${userId}/syncPackets/${packetId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'syncPackets', packetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subscribe to Payments / Financial Transactions
export function subscribeToPayments(
  userId: string,
  onUpdate: (payments: Payment[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = `users/${userId}/payments`;
  const paymentsQuery = query(collection(db, 'users', userId, 'payments'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    paymentsQuery,
    (snapshot) => {
      const payments: Payment[] = [];
      snapshot.forEach((docSnap) => {
        payments.push({ id: docSnap.id, ...(docSnap.data() as Omit<Payment, 'id'>) });
      });
      onUpdate(payments);
    },
    (error) => {
      console.error('Snapshot error for payments:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Record a Payment
export async function recordPayment(
  userId: string,
  data: Omit<Payment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = `users/${userId}/payments`;
  const paymentRef = doc(collection(db, 'users', userId, 'payments'));
  const now = new Date().toISOString();

  const newPayment: Payment = {
    id: paymentRef.id,
    ownerId: userId,
    contactId: data.contactId || '',
    contactName: data.contactName.trim(),
    amount: Number(data.amount),
    currency: data.currency || 'BDT',
    gateway: data.gateway || 'sslcommerz',
    paymentMethod: data.paymentMethod || 'bKash',
    status: data.status || 'completed',
    transactionRef: data.transactionRef || `TRX-${Date.now().toString(36).toUpperCase()}`,
    purpose: data.purpose?.trim() || 'General Payment',
    notes: data.notes?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(paymentRef, newPayment);
    return paymentRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${paymentRef.id}`);
  }
}

// Update Payment status
export async function updatePaymentStatus(
  userId: string,
  paymentId: string,
  status: Payment['status'],
  notes?: string
): Promise<void> {
  const path = `users/${userId}/payments/${paymentId}`;
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'users', userId, 'payments', paymentId), {
      status,
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete Payment
export async function deletePayment(userId: string, paymentId: string): Promise<void> {
  const path = `users/${userId}/payments/${paymentId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'payments', paymentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bulk Import Payments
export async function bulkImportPayments(
  userId: string,
  paymentsToImport: Array<Omit<Payment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>
): Promise<number> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  let count = 0;

  for (const item of paymentsToImport) {
    const paymentRef = doc(collection(db, 'users', userId, 'payments'));
    const newPayment: Payment = {
      id: paymentRef.id,
      ownerId: userId,
      contactId: item.contactId || '',
      contactName: item.contactName.trim(),
      amount: Number(item.amount),
      currency: item.currency || 'BDT',
      gateway: item.gateway || 'sslcommerz',
      paymentMethod: item.paymentMethod || 'bKash',
      status: item.status || 'completed',
      transactionRef: item.transactionRef || `TRX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      purpose: item.purpose?.trim() || 'Payment',
      notes: item.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };
    batch.set(paymentRef, newPayment);
    count++;
  }

  if (count > 0) {
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/payments (batch)`);
    }
  }
  return count;
}

// Subscribe to Custom Dynamic Modules
export function subscribeToCustomModules(
  userId: string,
  onUpdate: (modules: CustomModule[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = `users/${userId}/customModules`;
  const modulesQuery = query(collection(db, 'users', userId, 'customModules'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    modulesQuery,
    (snapshot) => {
      const modules: CustomModule[] = [];
      snapshot.forEach((docSnap) => {
        modules.push({ id: docSnap.id, ...(docSnap.data() as Omit<CustomModule, 'id'>) });
      });
      onUpdate(modules);
    },
    (error) => {
      console.error('Snapshot error for customModules:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Save or Update Custom Module
export async function saveCustomModule(
  userId: string,
  moduleData: Omit<CustomModule, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const path = `users/${userId}/customModules`;
  const now = new Date().toISOString();
  const moduleRef = moduleData.id
    ? doc(db, 'users', userId, 'customModules', moduleData.id)
    : doc(collection(db, 'users', userId, 'customModules'));

  const payload: CustomModule = {
    id: moduleRef.id,
    ownerId: userId,
    title: moduleData.title.trim(),
    description: moduleData.description?.trim() || '',
    code: moduleData.code,
    icon: moduleData.icon || 'Code',
    category: moduleData.category || 'Productivity',
    enabled: moduleData.enabled !== undefined ? moduleData.enabled : true,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(moduleRef, payload, { merge: true });
    return moduleRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${moduleRef.id}`);
  }
}

// Toggle Custom Module enabled status
export async function toggleCustomModuleStatus(
  userId: string,
  moduleId: string,
  enabled: boolean
): Promise<void> {
  const path = `users/${userId}/customModules/${moduleId}`;
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'users', userId, 'customModules', moduleId), {
      enabled,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete Custom Module
export async function deleteCustomModule(userId: string, moduleId: string): Promise<void> {
  const path = `users/${userId}/customModules/${moduleId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'customModules', moduleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
