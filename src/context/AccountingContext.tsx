import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  AccountingExercise, 
  Product, 
  Operation, 
  ValuationMethod, 
  JournalEntry, 
  TrialBalanceRow,
  MethodComparisonResult
} from '../types/accounting';
import { SAMPLE_EXERCISES } from '../data/sampleExercises';
import { calculateExerciseInventory, compareAllMethods } from '../core/inventoryEngine';
import { generateJournalEntries } from '../core/journalEngine';
import { generateLedger, generateTrialBalance, TrialBalanceSummary } from '../core/ledgerEngine';
import { generateId } from '../utils/currency';

interface AccountingContextType {
  exercises: AccountingExercise[];
  activeExercise: AccountingExercise;
  activeProductId: string;
  setActiveProductId: (id: string) => void;
  activeMethod: ValuationMethod;
  setActiveMethod: (method: ValuationMethod) => void;
  
  // Ejercicios CRUD
  selectExercise: (id: string) => void;
  createExercise: (exercise: Partial<AccountingExercise>) => void;
  updateExercise: (exercise: AccountingExercise) => void;
  duplicateExercise: (id: string) => void;
  deleteExercise: (id: string) => void;
  importExercise: (jsonData: string) => boolean;
  resetAllExercises: () => void;

  // Productos CRUD
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  // Operaciones CRUD
  addOperation: (operation: Omit<Operation, 'id' | 'createdAt' | 'exerciseId'>) => void;
  updateOperation: (operation: Operation) => void;
  deleteOperation: (operationId: string) => void;

  // Cálculos derivados en tiempo real
  inventoryCalculation: ReturnType<typeof calculateExerciseInventory>;
  journalEntries: JournalEntry[];
  ledgerMap: ReturnType<typeof generateLedger>;
  trialBalance: TrialBalanceSummary;
  methodComparisons: MethodComparisonResult[];
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const STORAGE_KEY = 'contalab_ar_exercises_v1';
const ACTIVE_EX_KEY = 'contalab_ar_active_ex_id_v1';

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Carga inicial desde localStorage
  const [exercises, setExercises] = useState<AccountingExercise[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error cargando ejercicios de localStorage:', e);
    }
    return SAMPLE_EXERCISES;
  });

  const [activeExerciseId, setActiveExerciseId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_EX_KEY);
      if (saved && exercises.some(e => e.id === saved)) {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return exercises[0]?.id || SAMPLE_EXERCISES[0].id;
  });

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }, [exercises]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_EX_KEY, activeExerciseId);
    } catch (e) {
      // ignore
    }
  }, [activeExerciseId]);

  // Ejercicio activo actual
  const activeExercise = useMemo(() => {
    return exercises.find(e => e.id === activeExerciseId) || exercises[0] || SAMPLE_EXERCISES[0];
  }, [exercises, activeExerciseId]);

  // Producto activo para el Kardex
  const [activeProductId, setActiveProductId] = useState<string>(() => {
    return activeExercise.products[0]?.id || '';
  });

  // Si cambia de ejercicio, sincronizar producto activo
  useEffect(() => {
    if (activeExercise.products.length > 0) {
      if (!activeExercise.products.some(p => p.id === activeProductId)) {
        setActiveProductId(activeExercise.products[0].id);
      }
    } else {
      setActiveProductId('');
    }
  }, [activeExercise, activeProductId]);

  const activeMethod = activeExercise.valuationMethod;

  // Cambiar método de valuación
  const setActiveMethod = (method: ValuationMethod) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === activeExercise.id) {
        return {
          ...ex,
          valuationMethod: method,
          updatedAt: Date.now()
        };
      }
      return ex;
    }));
  };

  // 2. Operaciones de Ejercicios
  const selectExercise = (id: string) => {
    if (exercises.some(e => e.id === id)) {
      setActiveExerciseId(id);
    }
  };

  const createExercise = (data: Partial<AccountingExercise>) => {
    const newEx: AccountingExercise = {
      id: generateId('ex'),
      name: data.name || 'Nuevo Ejercicio Contable',
      description: data.description || '',
      companyName: data.companyName || 'Empresa de Prueba S.A.',
      cuit: data.cuit || '30-11223344-5',
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      endDate: data.endDate || new Date().toISOString().slice(0, 10),
      currency: data.currency || 'ARS ($)',
      valuationMethod: data.valuationMethod || 'PEPS',
      accounts: data.accounts && data.accounts.length > 0 ? data.accounts : [...SAMPLE_EXERCISES[0].accounts],
      products: data.products || [],
      operations: data.operations || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setExercises(prev => [...prev, newEx]);
    setActiveExerciseId(newEx.id);
  };

  const updateExercise = (updated: AccountingExercise) => {
    setExercises(prev => prev.map(e => e.id === updated.id ? { ...updated, updatedAt: Date.now() } : e));
  };

  const duplicateExercise = (id: string) => {
    const source = exercises.find(e => e.id === id);
    if (!source) return;

    const copy: AccountingExercise = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateId('ex_copy'),
      name: `${source.name} (Copia)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setExercises(prev => [...prev, copy]);
    setActiveExerciseId(copy.id);
  };

  const deleteExercise = (id: string) => {
    if (exercises.length <= 1) {
      alert('No puedes eliminar el único ejercicio existente.');
      return;
    }
    const remaining = exercises.filter(e => e.id !== id);
    setExercises(remaining);
    if (activeExerciseId === id) {
      setActiveExerciseId(remaining[0].id);
    }
  };

  const importExercise = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.name && Array.isArray(parsed.products) && Array.isArray(parsed.operations)) {
        parsed.id = generateId('imported_ex');
        parsed.name = `${parsed.name} (Importado)`;
        parsed.updatedAt = Date.now();
        setExercises(prev => [...prev, parsed]);
        setActiveExerciseId(parsed.id);
        return true;
      }
    } catch (e) {
      console.error('Error importando JSON:', e);
    }
    return false;
  };

  const resetAllExercises = () => {
    if (window.confirm('¿Deseas restaurar los casos de práctica originales de cátedra? Tus modificaciones se resetearán.')) {
      setExercises(SAMPLE_EXERCISES);
      setActiveExerciseId(SAMPLE_EXERCISES[0].id);
    }
  };

  // 3. Productos CRUD
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: generateId('prod')
    };

    setExercises(prev => prev.map(ex => {
      if (ex.id === activeExercise.id) {
        return {
          ...ex,
          products: [...ex.products, newProd],
          updatedAt: Date.now()
        };
      }
      return ex;
    }));

    setActiveProductId(newProd.id);
  };

  const updateProduct = (updated: Product) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === activeExercise.id) {
        return {
          ...ex,
          products: ex.products.map(p => p.id === updated.id ? updated : p),
          updatedAt: Date.now()
        };
      }
      return ex;
    }));
  };

  const deleteProduct = (prodId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === activeExercise.id) {
        return {
          ...ex,
          products: ex.products.filter(p => p.id !== prodId),
          // Eliminar items de operaciones que dependían de este producto
          operations: ex.operations.map(op => ({
            ...op,
            items: op.items.filter(i => i.productId !== prodId)
          })).filter(op => op.items.length > 0 || op.type === 'APERTURA'),
          updatedAt: Date.now()
        };
      }
      return ex;
    }));
  };

  // 4. Operaciones CRUD
  const addOperation = (opData: Omit<Operation, 'id' | 'createdAt' | 'exerciseId'>) => {
    const newOp: Operation = {
      ...opData,
      id: generateId('op'),
      exerciseId: activeExercise.id,
      createdAt: Date.now()
    };

    setExercises(prev => prev.map(ex => {
      if (ex.id === activeExercise.id) {
        return {
          ...ex,
          operations: [...ex.operations, newOp],
          updatedAt: Date.now()
        };
      }
      return ex;
    }));
  };

  const updateOperation = (updated: Operation) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === activeExercise.id) {
        return {
          ...ex,
          operations: ex.operations.map(o => o.id === updated.id ? updated : o),
          updatedAt: Date.now()
        };
      }
      return ex;
    }));
  };

  const deleteOperation = (opId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === activeExercise.id) {
        return {
          ...ex,
          operations: ex.operations.filter(o => o.id !== opId),
          updatedAt: Date.now()
        };
      }
      return ex;
    }));
  };

  // 5. Motor de cálculo reactivo
  const inventoryCalculation = useMemo(() => {
    return calculateExerciseInventory(
      activeExercise.products,
      activeExercise.operations,
      activeExercise.valuationMethod
    );
  }, [activeExercise]);

  const journalEntries = useMemo(() => {
    return generateJournalEntries(
      activeExercise.operations,
      activeExercise.products,
      activeExercise.accounts,
      activeExercise.valuationMethod
    );
  }, [activeExercise]);

  const ledgerMap = useMemo(() => {
    return generateLedger(journalEntries, activeExercise.accounts);
  }, [journalEntries, activeExercise.accounts]);

  const trialBalance = useMemo(() => {
    return generateTrialBalance(ledgerMap);
  }, [ledgerMap]);

  const methodComparisons = useMemo(() => {
    return compareAllMethods(activeExercise.products, activeExercise.operations);
  }, [activeExercise.products, activeExercise.operations]);

  return (
    <AccountingContext.Provider
      value={{
        exercises,
        activeExercise,
        activeProductId,
        setActiveProductId,
        activeMethod,
        setActiveMethod,
        selectExercise,
        createExercise,
        updateExercise,
        duplicateExercise,
        deleteExercise,
        importExercise,
        resetAllExercises,
        addProduct,
        updateProduct,
        deleteProduct,
        addOperation,
        updateOperation,
        deleteOperation,
        inventoryCalculation,
        journalEntries,
        ledgerMap,
        trialBalance,
        methodComparisons
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting debe utilizarse dentro de un AccountingProvider');
  }
  return context;
};
