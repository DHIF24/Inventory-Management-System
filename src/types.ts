export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: UserRole;
}

export interface Product {
  id?: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  quantity: number;
  minStock: number;
  price: number;
  supplier: string;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
  userId: string;
}

export interface Category {
  id?: string;
  name: string;
  color: string;
  userId: string;
}

export type TransactionType = 'entrée' | 'sortie' | 'ajustement';

export interface Transaction {
  id?: string;
  productId: string;
  productName: string;
  type: TransactionType;
  quantity: number;
  note: string;
  date: any; // Firestore Timestamp or Date
  userId: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
