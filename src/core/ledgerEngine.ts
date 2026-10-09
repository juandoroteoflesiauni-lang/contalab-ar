import { 
  JournalEntry, 
  Account, 
  AccountLedger, 
  LedgerMovement, 
  TrialBalanceRow 
} from '../types/accounting';
import { round2 } from '../utils/currency';

export interface TrialBalanceSummary {
  rows: TrialBalanceRow[];
  totalDebitSum: number;
  totalCreditSum: number;
  totalDebitBalance: number;
  totalCreditBalance: number;
  isSumsBalanced: boolean;
  isBalancesBalanced: boolean;
  sumsDifference: number;
  balancesDifference: number;
}

/**
 * Genera el Libro Mayor completo por cuenta a partir de los asientos del Libro Diario
 */
export function generateLedger(
  journalEntries: JournalEntry[],
  accounts: Account[]
): Map<string, AccountLedger> {
  const ledgerMap = new Map<string, AccountLedger>();

  // Inicializar mayores para todas las cuentas conocidas o utilizadas
  const activeAccountCodes = new Set<string>();
  for (const entry of journalEntries) {
    for (const line of entry.lines) {
      activeAccountCodes.add(line.accountCode);
    }
  }

  // Preparar estructura para cada cuenta activa
  for (const code of activeAccountCodes) {
    const acc = accounts.find(a => a.code === code) || {
      code,
      name: journalEntries.flatMap(e => e.lines).find(l => l.accountCode === code)?.accountName || code,
      type: journalEntries.flatMap(e => e.lines).find(l => l.accountCode === code)?.accountType || 'ACTIVO'
    };

    ledgerMap.set(code, {
      account: acc,
      totalDebit: 0,
      totalCredit: 0,
      balance: 0,
      balanceNature: 'CERO',
      movements: []
    });
  }

  // Recorrer los asientos cronológicos e imputar a cada mayor
  for (const entry of journalEntries) {
    for (const line of entry.lines) {
      const ledger = ledgerMap.get(line.accountCode);
      if (!ledger) continue;

      ledger.totalDebit = round2(ledger.totalDebit + line.debit);
      ledger.totalCredit = round2(ledger.totalCredit + line.credit);

      // Calcular saldo acumulado
      const rawBalance = round2(ledger.totalDebit - ledger.totalCredit);
      let balanceNature: 'DEUDOR' | 'ACREEDOR' | 'CERO' = 'CERO';
      let runningBalance = Math.abs(rawBalance);

      if (rawBalance > 0) {
        balanceNature = 'DEUDOR';
      } else if (rawBalance < 0) {
        balanceNature = 'ACREEDOR';
      }

      const movement: LedgerMovement = {
        entryNumber: entry.entryNumber,
        date: entry.date,
        voucherNumber: entry.voucherNumber,
        gloss: entry.gloss,
        debit: line.debit,
        credit: line.credit,
        runningBalance,
        balanceNature
      };

      ledger.movements.push(movement);
      ledger.balance = runningBalance;
      ledger.balanceNature = balanceNature;
    }
  }

  return ledgerMap;
}

/**
 * Genera el Balance de Comprobación de Sumas y Saldos
 */
export function generateTrialBalance(
  ledgerMap: Map<string, AccountLedger>
): TrialBalanceSummary {
  const rows: TrialBalanceRow[] = [];
  let totalDebitSum = 0;
  let totalCreditSum = 0;
  let totalDebitBalance = 0;
  let totalCreditBalance = 0;

  // Ordenar por código de cuenta
  const sortedCodes = Array.from(ledgerMap.keys()).sort();

  for (const code of sortedCodes) {
    const ledger = ledgerMap.get(code)!;
    // Omitir cuentas sin ningún movimiento
    if (ledger.totalDebit === 0 && ledger.totalCredit === 0) continue;

    let debitBal = 0;
    let creditBal = 0;

    if (ledger.totalDebit > ledger.totalCredit) {
      debitBal = round2(ledger.totalDebit - ledger.totalCredit);
    } else if (ledger.totalCredit > ledger.totalDebit) {
      creditBal = round2(ledger.totalCredit - ledger.totalDebit);
    }

    totalDebitSum = round2(totalDebitSum + ledger.totalDebit);
    totalCreditSum = round2(totalCreditSum + ledger.totalCredit);
    totalDebitBalance = round2(totalDebitBalance + debitBal);
    totalCreditBalance = round2(totalCreditBalance + creditBal);

    rows.push({
      accountCode: ledger.account.code,
      accountName: ledger.account.name,
      accountType: ledger.account.type,
      totalDebit: ledger.totalDebit,
      totalCredit: ledger.totalCredit,
      debitBalance: debitBal,
      creditBalance: creditBal
    });
  }

  const sumsDifference = round2(Math.abs(totalDebitSum - totalCreditSum));
  const balancesDifference = round2(Math.abs(totalDebitBalance - totalCreditBalance));

  return {
    rows,
    totalDebitSum,
    totalCreditSum,
    totalDebitBalance,
    totalCreditBalance,
    isSumsBalanced: sumsDifference === 0,
    isBalancesBalanced: balancesDifference === 0,
    sumsDifference,
    balancesDifference
  };
}
