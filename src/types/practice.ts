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

export interface ManualJournalLine {
  id: string;
  accountName: string;
  detail: string;
  debit: number;
  credit: number;
  date?: string; // Fecha diferida u optativa para esta partida dentro del asiento
}

export interface ManualJournalEntry {
  id: string;
  entryNumber: number;
  date: string; // Fecha principal de la operación / compra
  hasDeferredDates?: boolean; // Permite activar fechas diferidas entre partidas de este asiento
  lines: ManualJournalLine[];
  reviewStatus?: 'CORRECT' | 'INCORRECT' | null; // Tilde verde (CORRECT) o tilde roja (INCORRECT)
  reviewNotes?: string; // Anotaciones de por qué se hizo mal / correcciones
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
  journalEntries: ManualJournalEntry[];
  journalRows?: ManualJournalRow[]; // Compatibilidad hacia atrás
  tAccounts: TAccount[];
  inventorySheets: FacultyInventorySheet[];
  genericCostSheets: GenericCostSheet[];
}

