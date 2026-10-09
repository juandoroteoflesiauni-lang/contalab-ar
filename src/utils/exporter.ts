import * as XLSX from 'xlsx';
import { 
  AccountingExercise, 
  KardexRow, 
  JournalEntry, 
  TrialBalanceRow, 
  MethodComparisonResult 
} from '../types/accounting';
import { formatDate } from './currency';

/**
 * Exporta el ejercicio completo a un libro de Excel (.xlsx) con pestañas profesionales
 */
export function exportExerciseToExcel(
  exercise: AccountingExercise,
  kardexRows: KardexRow[],
  journalEntries: JournalEntry[],
  trialBalanceRows: TrialBalanceRow[],
  comparisons: MethodComparisonResult[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Pestaña: Resumen del Ejercicio
  const summaryData = [
    ['SISTEMAS DE INFORMACIÓN CONTABLE - INFORME GENERAL'],
    ['Empresa:', exercise.companyName],
    ['CUIT:', exercise.cuit || 'S/D'],
    ['Ejercicio:', exercise.name],
    ['Período:', `${formatDate(exercise.startDate)} al ${formatDate(exercise.endDate)}`],
    ['Método Activo:', exercise.valuationMethod],
    ['Moneda:', exercise.currency],
    [],
    ['Total Operaciones Registradas:', exercise.operations.length],
    ['Productos Administrados:', exercise.products.length]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // 2. Pestaña: Ficha de Stock (Kardex)
  const kardexHeaders = [
    'Fecha', 'Comprobante', 'Detalle', 'Tipo',
    'Entrada Cant', 'Entrada Costo Unit', 'Entrada Total',
    'Salida Cant', 'Salida Costo Unit', 'Salida Total',
    'Saldo Cant', 'Saldo Costo Unit', 'Saldo Total'
  ];
  const kardexData = kardexRows.map(k => [
    formatDate(k.date),
    k.voucherNumber,
    k.detail,
    k.type,
    k.inQuantity || '',
    k.inUnitCost || '',
    k.inTotalCost || '',
    k.outQuantity || '',
    k.outUnitCost || '',
    k.outTotalCost || '',
    k.balanceQuantity,
    k.balanceUnitCost,
    k.balanceTotalCost
  ]);
  const wsKardex = XLSX.utils.aoa_to_sheet([kardexHeaders, ...kardexData]);
  XLSX.utils.book_append_sheet(wb, wsKardex, 'Kardex (Stock)');

  // 3. Pestaña: Libro Diario
  const journalHeaders = ['Nº Asiento', 'Fecha', 'Comprobante', 'Código Cuenta', 'Cuenta Contable', 'Tipo', 'Debe ($)', 'Haber ($)', 'Glosa / Concepto'];
  const journalData: any[] = [];
  journalEntries.forEach(entry => {
    entry.lines.forEach((line, idx) => {
      journalData.push([
        idx === 0 ? entry.entryNumber : '',
        idx === 0 ? formatDate(entry.date) : '',
        idx === 0 ? entry.voucherNumber : '',
        line.accountCode,
        line.accountName,
        line.accountType,
        line.debit || '',
        line.credit || '',
        idx === 0 ? entry.gloss : ''
      ]);
    });
  });
  const wsJournal = XLSX.utils.aoa_to_sheet([journalHeaders, ...journalData]);
  XLSX.utils.book_append_sheet(wb, wsJournal, 'Libro Diario');

  // 4. Pestaña: Balance de Sumas y Saldos
  const tbHeaders = ['Código', 'Cuenta Contable', 'Clasificación', 'Total Debe', 'Total Haber', 'Saldo Deudor', 'Saldo Acreedor'];
  const tbData = trialBalanceRows.map(r => [
    r.accountCode,
    r.accountName,
    r.accountType,
    r.totalDebit,
    r.totalCredit,
    r.debitBalance || '',
    r.creditBalance || ''
  ]);
  const wsTB = XLSX.utils.aoa_to_sheet([tbHeaders, ...tbData]);
  XLSX.utils.book_append_sheet(wb, wsTB, 'Sumas y Saldos');

  // 5. Pestaña: Comparativa de Métodos
  const compHeaders = ['Método', 'Ventas Totales ($)', 'CMV Total ($)', 'Inventario Final ($)', 'Resultado Bruto ($)', 'Margen Bruto %'];
  const compData = comparisons.map(c => [
    c.name,
    c.totalSales,
    c.totalCMV,
    c.endingInventoryValue,
    c.grossProfit,
    `${c.grossMarginPercentage.toFixed(2)} %`
  ]);
  const wsComp = XLSX.utils.aoa_to_sheet([compHeaders, ...compData]);
  XLSX.utils.book_append_sheet(wb, wsComp, 'Comparativa Métodos');

  // Guardar archivo
  const filename = `${exercise.name.replace(/[^a-zA-Z0-9]/g, '_')}_Contable.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exporta el Kardex a formato CSV estándar
 */
export function exportKardexToCSV(kardexRows: KardexRow[], filename = 'Kardex.csv') {
  const headers = ['Fecha;Comprobante;Detalle;Entrada_Cant;Entrada_Unit;Entrada_Total;Salida_Cant;Salida_Unit;Salida_Total;Saldo_Cant;Saldo_Unit;Saldo_Total'];
  const rows = kardexRows.map(k => [
    formatDate(k.date),
    `"${k.voucherNumber}"`,
    `"${k.detail}"`,
    k.inQuantity || 0,
    k.inUnitCost || 0,
    k.inTotalCost || 0,
    k.outQuantity || 0,
    k.outUnitCost || 0,
    k.outTotalCost || 0,
    k.balanceQuantity,
    k.balanceUnitCost,
    k.balanceTotalCost
  ].join(';'));

  const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta el ejercicio completo a un archivo JSON para respaldo o compartir entre estudiantes
 */
export function exportExerciseToJSON(exercise: AccountingExercise) {
  const jsonStr = JSON.stringify(exercise, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${exercise.name.replace(/[^a-zA-Z0-9]/g, '_')}_Backup.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
