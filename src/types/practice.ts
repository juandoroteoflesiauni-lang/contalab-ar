// Tipos para el módulo de Práctica Contable (Metodología Universitaria SIC)

export type TAccountCategory = 'ACTIVO' | 'PASIVO' | 'PATRIMONIO_NETO' | 'RESULTADOS';

export interface TMovement {
  id: string;
  amount: number;
  ref?: string; // ej: "(1)" o "As. 1"
}

export interface TAccount {
  id: string;
  category: TAccountCategory;
  name: string;
  code?: string;
  debits: TMovement[];
  credits: TMovement[];
}

export type InventoryCostMethod = 'PEPS' | 'UEPS' | 'PPP' | 'ESPECIFICA';

export type InventoryMovementType = 
  | 'INICIAL' 
  | 'COMPRA' 
  | 'VENTA' 
  | 'DEV_COMPRA' 
  | 'DEV_VENTA' 
  | 'AJUSTE';

export interface FacultyInventoryRow {
  id: string;
  date: string;
  concept: string;
  type: InventoryMovementType;
  
  // Entrada
  inUnits: number;
  inUnitPrice: number;
  inTotal: number;

  // Salida
  outUnits: number;
  outUnitPrice: number;
  outTotal: number;

  // Saldo
  balanceUnits: number;
  balanceUnitPrice: number;
  balanceTotal: number;

  notes?: string;
  costLayersConsumed?: { units: number; unitCost: number; subtotal: number }[];
}

export interface FacultyInventorySheet {
  id: string;
  title: string;
  productName: string;
  unitOfMeasure: string;
  method: InventoryCostMethod;
  rows: FacultyInventoryRow[];
}

export interface GenericCostRow {
  id: string;
  concept: string;
  quantity: number;
  unitCost: number;
  total: number;
  notes?: string;
}

export interface GenericCostSheet {
  id: string;
  title: string;
  description?: string;
  rows: GenericCostRow[];
}

export interface ManualJournalRow {
  id: string;
  entryNumber: number;
  date: string;
  accountCode: string;
  accountName: string;
  detail: string;
  debit: number;
  credit: number;
}

export interface PracticeData {
  journalRows: ManualJournalRow[];
  tAccounts: TAccount[];
  inventorySheets: FacultyInventorySheet[];
  genericCostSheets: GenericCostSheet[];
}
