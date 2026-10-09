// Tipos fundamentales para el sistema contable educativo

export type ValuationMethod = 'PEPS' | 'UEPS' | 'PPP' | 'ESPECIFICA';

export type OperationType = 
  | 'APERTURA'
  | 'COMPRA' 
  | 'VENTA' 
  | 'DEVOLUCION_COMPRA' 
  | 'DEVOLUCION_VENTA' 
  | 'GASTO_ADQUISICION' 
  | 'AJUSTE_FALTANTE' 
  | 'AJUSTE_SOBRANTE';

export type PaymentMethod = 
  | 'CONTADO_EFECTIVO' 
  | 'BANCO_TRANSFERENCIA' 
  | 'CUENTA_CORRIENTE' 
  | 'DOCUMENTO';

export type AccountType = 'ACTIVO' | 'PASIVO' | 'PATRIMONIO_NETO' | 'RESULTADO_POSITIVO' | 'RESULTADO_NEGATIVO';

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  isCustom?: boolean;
}

export interface InventoryItemUnit {
  id: string; // Serial / Lote
  cost: number;
  isSold: boolean;
  purchaseDate: string;
  purchaseVoucher: string;
  saleDate?: string;
  saleVoucher?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  initialQuantity: number;
  initialUnitCost: number;
  // Para identificación específica:
  isSpecificIdentification?: boolean;
  units?: InventoryItemUnit[];
}

export interface OperationItem {
  productId: string;
  quantity: number;
  unitPrice: number; // Precio de compra o de venta según corresponda
  subtotal: number;
  // Para identificación específica:
  specificUnitIds?: string[]; // IDs de las unidades seleccionadas para la venta o compradas
}

export interface Operation {
  id: string;
  exerciseId: string;
  date: string; // YYYY-MM-DD
  voucherType: string; // ej: Factura A, Factura B, Remito R, Minuta Contable
  voucherNumber: string;
  type: OperationType;
  counterpart: string; // ej: Proveedor "Distribuidora Central S.R.L.", Cliente "Juan Pérez"
  paymentMethod: PaymentMethod;
  notes?: string;
  items: OperationItem[];
  // Opciones impositivas y financieras
  applyIva?: boolean;
  ivaRate?: number; // 21, 10.5, etc.
  additionalAttributableExpense?: number; // Gastos sobre compra activables (flete, seguro)
  discountPercentage?: number; // Descuento comercial
  createdAt: number;
}

export interface InventoryLayer {
  id: string;
  date: string;
  voucherNumber: string;
  originalQuantity: number;
  availableQuantity: number;
  unitCost: number;
  totalCost: number;
  specificUnitIds?: string[];
}

export interface KardexRow {
  id: string;
  date: string;
  operationId: string;
  voucherNumber: string;
  detail: string;
  type: OperationType;
  
  // Entradas
  inQuantity: number;
  inUnitCost: number;
  inTotalCost: number;

  // Salidas
  outQuantity: number;
  outUnitCost: number;
  outTotalCost: number;

  // Existencias
  balanceQuantity: number;
  balanceUnitCost: number; // En PPP es el costo promedio; en PEPS/UEPS es el costo promedio ponderado de las capas vigentes
  balanceTotalCost: number;

  // Capas consumidas o resultantes (para modo estudio)
  consumedLayers?: {
    layerId: string;
    date: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }[];
  activeLayersSnapshot?: InventoryLayer[];
  pppCalculationFormula?: string;
}

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  exerciseId: string;
  operationId: string;
  entryNumber: number;
  date: string;
  voucherNumber: string;
  gloss: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  difference: number;
}

export interface LedgerMovement {
  entryNumber: number;
  date: string;
  voucherNumber: string;
  gloss: string;
  debit: number;
  credit: number;
  runningBalance: number;
  balanceNature: 'DEUDOR' | 'ACREEDOR' | 'CERO';
}

export interface AccountLedger {
  account: Account;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  balanceNature: 'DEUDOR' | 'ACREEDOR' | 'CERO';
  movements: LedgerMovement[];
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  totalDebit: number;
  totalCredit: number;
  debitBalance: number;
  creditBalance: number;
}

export interface AccountingExercise {
  id: string;
  name: string;
  description: string;
  companyName: string;
  cuit?: string;
  startDate: string;
  endDate: string;
  currency: string; // ej: ARS ($)
  valuationMethod: ValuationMethod;
  products: Product[];
  operations: Operation[];
  accounts: Account[];
  createdAt: number;
  updatedAt: number;
}

export interface MethodComparisonResult {
  method: ValuationMethod;
  name: string;
  totalSales: number;
  totalPurchases: number;
  totalCMV: number;
  endingInventoryValue: number;
  endingInventoryUnits: number;
  grossProfit: number; // Ventas - CMV
  grossMarginPercentage: number; // (Gross Profit / Ventas) * 100
  pedagogicalNote: string;
  kardexRows: KardexRow[];
}
