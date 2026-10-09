// Tipos para el módulo de Práctica Contable Manual

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

export interface ManualLedgerMovement {
  id: string;
  date: string;
  detail: string;
  entryRef: string; // ej: "Asiento Nº 1"
  debit: number;
  credit: number;
}

export interface ManualLedgerAccount {
  id: string;
  accountCode: string;
  accountName: string;
  movements: ManualLedgerMovement[];
}

export interface CostSheetRow {
  id: string;
  concept: string;
  quantity: number;
  unitCost: number;
  total: number; // cantidad * unitCost o valor directo
  notes?: string;
}

export interface CostSheet {
  id: string;
  title: string;
  description: string;
  rows: CostSheetRow[];
}

export interface PracticeData {
  journalRows: ManualJournalRow[];
  ledgerAccounts: ManualLedgerAccount[];
  costSheets: CostSheet[];
}
