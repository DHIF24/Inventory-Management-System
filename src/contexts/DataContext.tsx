import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { Product, Category, Transaction, OperationType, TransactionType } from '../types';

interface DataContextType {
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  loadingData: boolean;
  addProduct: (product: Omit<Product, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'userId'>) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, 'id' | 'userId'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createStockTransaction: (
    productId: string,
    type: TransactionType,
    qty: number,
    note: string
  ) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setCategories([]);
      setTransactions([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    // Filter queries by current userId to comply with Firestore Rules secure indexing!
    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    );

    const categoriesQuery = query(
      collection(db, 'categories'),
      where('userId', '==', currentUser.uid)
    );

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid)
    );

    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        setLoadingData(false);
      }
    };

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      const pList: Product[] = [];
      snapshot.forEach((doc) => {
        pList.push({ id: doc.id, ...doc.data() } as Product);
      });
      // Sort products by name
      pList.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(pList);
      if (loadingData) checkAllLoaded();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const cList: Category[] = [];
      snapshot.forEach((doc) => {
        cList.push({ id: doc.id, ...doc.data() } as Category);
      });
      cList.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(cList);
      if (loadingData) checkAllLoaded();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const tList: Transaction[] = [];
      snapshot.forEach((doc) => {
        tList.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      // Sort transactions descending by date
      tList.sort((a, b) => {
        const timeA = a.date?.seconds || new Date(a.date).getTime() || 0;
        const timeB = b.date?.seconds || new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });
      setTransactions(tList);
      if (loadingData) checkAllLoaded();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    // Timeout loading state just in case snapshot callbacks are slow
    const timer = setTimeout(() => {
      setLoadingData(false);
    }, 2000);

    return () => {
      unsubProducts();
      unsubCategories();
      unsubTransactions();
      clearTimeout(timer);
    };
  }, [currentUser]);

  // CRUD PRODUCTS
  const addProduct = async (p: Omit<Product, 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    const newId = doc(collection(db, 'products')).id;
    const productRef = doc(db, 'products', newId);
    
    const timestamp = new Date().toISOString();
    const newProduct: Product = {
      ...p,
      userId: currentUser.uid,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      await setDoc(productRef, newProduct);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `products/${newId}`);
    }
  };

  const updateProduct = async (id: string, p: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    const productRef = doc(db, 'products', id);

    try {
      // Get existing product to preserve createdAt and userId
      const existingDoc = await getDoc(productRef);
      if (!existingDoc.exists()) throw new Error('Product not found');
      
      const existingData = existingDoc.data() as Product;
      
      const updatedProduct: Product = {
        ...p,
        userId: currentUser.uid,
        createdAt: existingData.createdAt,
        updatedAt: new Date().toISOString()
      };

      await setDoc(productRef, updatedProduct);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!currentUser) return;
    const productRef = doc(db, 'products', id);
    try {
      await deleteDoc(productRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  // CRUD CATEGORIES
  const addCategory = async (c: Omit<Category, 'userId'>) => {
    if (!currentUser) return;
    const newId = doc(collection(db, 'categories')).id;
    const catRef = doc(db, 'categories', newId);
    const newCat = {
      ...c,
      userId: currentUser.uid
    };
    try {
      await setDoc(catRef, newCat);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `categories/${newId}`);
    }
  };

  const updateCategory = async (id: string, c: Omit<Category, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const catRef = doc(db, 'categories', id);
    const updatedCat = {
      ...c,
      userId: currentUser.uid
    };
    try {
      await setDoc(catRef, updatedCat);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!currentUser) return;
    const catRef = doc(db, 'categories', id);
    try {
      await deleteDoc(catRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `categories/${id}`);
    }
  };

  // INVENTORY ATOMIC TRANSACTIONS
  const createStockTransaction = async (
    productId: string,
    type: TransactionType,
    qty: number,
    note: string
  ) => {
    if (!currentUser) return;
    
    const productRef = doc(db, 'products', productId);
    const transId = doc(collection(db, 'transactions')).id;
    const transactionRef = doc(db, 'transactions', transId);

    try {
      await runTransaction(db, async (trans) => {
        const prodDoc = await trans.get(productRef);
        if (!prodDoc.exists()) {
          throw new Error('Product not found in this transaction context');
        }

        const currentProd = prodDoc.data() as Product;
        let newQuantity = currentProd.quantity;

        if (type === 'entrée') {
          newQuantity += qty;
        } else if (type === 'sortie') {
          newQuantity = Math.max(0, newQuantity - qty);
        } else if (type === 'ajustement') {
          newQuantity = qty; // Direct write for fine tuning adjustments
        }

        const transactionObj: Transaction = {
          productId,
          productName: currentProd.name,
          type,
          quantity: qty,
          note: note || 'Ajustement de stock de routine',
          date: new Date().toISOString(),
          userId: currentUser.uid
        };

        // 1. Log transaction
        trans.set(transactionRef, transactionObj);

        // 2. Update product content with new stock level and updatedAt
        trans.update(productRef, {
          quantity: newQuantity,
          updatedAt: new Date().toISOString()
        });
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `transactions/${transId}`);
    }
  };

  const value = {
    products,
    categories,
    transactions,
    loadingData,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    createStockTransaction
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
