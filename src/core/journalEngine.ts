import { 
  Operation, 
  Product, 
  JournalEntry, 
  Account, 
  AccountType,
  JournalEntryLine,
  ValuationMethod
} from '../types/accounting';
import { round2, generateId } from '../utils/currency';
import { calculateExerciseInventory, sortOperationsChronologically } from './inventoryEngine';

/**
 * Busca una cuenta en el plan de cuentas por código o nombre aproximado, o devuelve un fallback
 */
function findAccount(accounts: Account[], code: string, fallbackName: string, fallbackType: AccountType): { code: string; name: string; type: AccountType } {
  const found = accounts.find(a => a.code === code);
  if (found) {
    return { code: found.code, name: found.name, type: found.type };
  }
  // Buscar por nombre
  const byName = accounts.find(a => a.name.toLowerCase().includes(fallbackName.toLowerCase()));
  if (byName) {
    return { code: byName.code, name: byName.name, type: byName.type };
  }
  return { code, name: fallbackName, type: fallbackType };
}

/**
 * Genera el Libro Diario completo a partir de las operaciones y el método de valuación activo
 */
export function generateJournalEntries(
  operations: Operation[],
  products: Product[],
  accounts: Account[],
  method: ValuationMethod
): JournalEntry[] {
  const sortedOps = sortOperationsChronologically(operations);
  const exerciseState = calculateExerciseInventory(products, sortedOps, method);
  const entries: JournalEntry[] = [];
  let entryCounter = 1;

  // Cuentas contables clave
  const accCaja = findAccount(accounts, '1.1.01', 'Caja', 'ACTIVO');
  const accBanco = findAccount(accounts, '1.1.02', 'Banco Cuenta Corriente', 'ACTIVO');
  const accDeudoresVentas = findAccount(accounts, '1.1.03', 'Deudores por Ventas', 'ACTIVO');
  const accDocCobrar = findAccount(accounts, '1.1.04', 'Documentos a Cobrar', 'ACTIVO');
  const accMercaderias = findAccount(accounts, '1.1.05', 'Mercaderías', 'ACTIVO');
  const accIvaCF = findAccount(accounts, '1.1.06', 'IVA Crédito Fiscal', 'ACTIVO');
  const accProveedores = findAccount(accounts, '2.1.01', 'Proveedores', 'PASIVO');
  const accDocPagar = findAccount(accounts, '2.1.02', 'Documentos a Pagar', 'PASIVO');
  const accIvaDF = findAccount(accounts, '2.1.03', 'IVA Débito Fiscal', 'PASIVO');
  const accCapital = findAccount(accounts, '3.1.01', 'Capital Social', 'PATRIMONIO_NETO');
  const accVentas = findAccount(accounts, '4.1.01', 'Ventas de Mercaderías', 'RESULTADO_POSITIVO');
  const accSobrantes = findAccount(accounts, '4.1.02', 'Sobrantes de Inventario', 'RESULTADO_POSITIVO');
  const accCMV = findAccount(accounts, '5.1.01', 'Costo de Mercaderías Vendidas (CMV)', 'RESULTADO_NEGATIVO');
  const accFaltantes = findAccount(accounts, '5.1.02', 'Faltantes de Inventario', 'RESULTADO_NEGATIVO');

  for (const op of sortedOps) {
    const lines: JournalEntryLine[] = [];

    // Helper para determinar cuenta financiera de cobro o pago
    const getCounterpartAccount = (isSales: boolean) => {
      switch (op.paymentMethod) {
        case 'CONTADO_EFECTIVO': return accCaja;
        case 'BANCO_TRANSFERENCIA': return accBanco;
        case 'DOCUMENTO': return isSales ? accDocCobrar : accDocPagar;
        case 'CUENTA_CORRIENTE':
        default:
          return isSales ? accDeudoresVentas : accProveedores;
      }
    };

    switch (op.type) {
      case 'APERTURA': {
        const totalInit = op.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        if (totalInit > 0) {
          lines.push({
            id: generateId('line'),
            accountCode: accMercaderias.code,
            accountName: accMercaderias.name,
            accountType: accMercaderias.type,
            debit: round2(totalInit),
            credit: 0
          });
          lines.push({
            id: generateId('line'),
            accountCode: accCapital.code,
            accountName: accCapital.name,
            accountType: accCapital.type,
            debit: 0,
            credit: round2(totalInit)
          });

          entries.push(createJournalEntry(op, entryCounter++, `Por asiento de apertura de inventario s/${op.voucherType} Nº ${op.voucherNumber}`, lines));
        }
        break;
      }

      case 'COMPRA': {
        const baseTotal = op.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
        let goodsCost = baseTotal;

        // Fletes o gastos adicionales activables
        if (op.additionalAttributableExpense && op.additionalAttributableExpense > 0) {
          goodsCost = round2(goodsCost + op.additionalAttributableExpense);
        }

        // Descuentos comerciales
        if (op.discountPercentage && op.discountPercentage > 0) {
          const disc = round2(goodsCost * (op.discountPercentage / 100));
          goodsCost = round2(goodsCost - disc);
        }

        const applyIva = !!op.applyIva;
        const ivaRate = (op.ivaRate || 21) / 100;
        const ivaAmount = applyIva ? round2(goodsCost * ivaRate) : 0;
        const totalToPay = round2(goodsCost + ivaAmount);

        // Debe: Mercaderías
        lines.push({
          id: generateId('line'),
          accountCode: accMercaderias.code,
          accountName: accMercaderias.name,
          accountType: accMercaderias.type,
          debit: goodsCost,
          credit: 0
        });

        // Debe: IVA Crédito Fiscal (si aplica)
        if (applyIva && ivaAmount > 0) {
          lines.push({
            id: generateId('line'),
            accountCode: accIvaCF.code,
            accountName: accIvaCF.name,
            accountType: accIvaCF.type,
            debit: ivaAmount,
            credit: 0
          });
        }

        // Haber: Proveedores / Caja / Banco
        const counterpartAcc = getCounterpartAccount(false);
        lines.push({
          id: generateId('line'),
          accountCode: counterpartAcc.code,
          accountName: counterpartAcc.name,
          accountType: counterpartAcc.type,
          debit: 0,
          credit: totalToPay
        });

        const gloss = `Por compra de mercaderías s/${op.voucherType} Nº ${op.voucherNumber} a ${op.counterpart} (${op.paymentMethod.replace(/_/g, ' ').toLowerCase()})`;
        entries.push(createJournalEntry(op, entryCounter++, gloss, lines));
        break;
      }

      case 'VENTA': {
        // En inventario permanente se registra:
        // 1) Asiento de Ingreso por Venta
        // 2) Asiento de Costo de Mercaderías Vendidas (CMV)
        const salesRevenue = op.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
        const applyIva = !!op.applyIva;
        const ivaRate = (op.ivaRate || 21) / 100;
        const ivaAmount = applyIva ? round2(salesRevenue * ivaRate) : 0;
        const totalToCollect = round2(salesRevenue + ivaAmount);

        // 1) Asiento de Venta
        const counterpartAcc = getCounterpartAccount(true);
        const linesVenta: JournalEntryLine[] = [
          {
            id: generateId('line'),
            accountCode: counterpartAcc.code,
            accountName: counterpartAcc.name,
            accountType: counterpartAcc.type,
            debit: totalToCollect,
            credit: 0
          },
          {
            id: generateId('line'),
            accountCode: accVentas.code,
            accountName: accVentas.name,
            accountType: accVentas.type,
            debit: 0,
            credit: salesRevenue
          }
        ];

        if (applyIva && ivaAmount > 0) {
          linesVenta.push({
            id: generateId('line'),
            accountCode: accIvaDF.code,
            accountName: accIvaDF.name,
            accountType: accIvaDF.type,
            debit: 0,
            credit: ivaAmount
          });
        }

        entries.push(createJournalEntry(
          op, 
          entryCounter++, 
          `Por venta de mercaderías s/${op.voucherType} Nº ${op.voucherNumber} a ${op.counterpart}`, 
          linesVenta
        ));

        // 2) Asiento de CMV
        // Buscamos el costo de salida calculado en el kardex para esta operación exacta
        let opCMV = 0;
        for (const item of op.items) {
          const prodState = exerciseState.productStates.get(item.productId);
          if (prodState) {
            const kardexRow = prodState.kardex.find(k => k.operationId === op.id);
            if (kardexRow) {
              opCMV = round2(opCMV + kardexRow.outTotalCost);
            }
          }
        }

        if (opCMV > 0) {
          const linesCMV: JournalEntryLine[] = [
            {
              id: generateId('line'),
              accountCode: accCMV.code,
              accountName: accCMV.name,
              accountType: accCMV.type,
              debit: opCMV,
              credit: 0
            },
            {
              id: generateId('line'),
              accountCode: accMercaderias.code,
              accountName: accMercaderias.name,
              accountType: accMercaderias.type,
              debit: 0,
              credit: opCMV
            }
          ];

          entries.push(createJournalEntry(
            op, 
            entryCounter++, 
            `Por devengamiento del Costo de Mercaderías Vendidas (CMV método ${method}) s/${op.voucherType} Nº ${op.voucherNumber}`, 
            linesCMV
          ));
        }
        break;
      }

      case 'DEVOLUCION_COMPRA': {
        const refundTotal = op.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
        const counterpartAcc = getCounterpartAccount(false);
        lines.push({
          id: generateId('line'),
          accountCode: counterpartAcc.code,
          accountName: counterpartAcc.name,
          accountType: counterpartAcc.type,
          debit: round2(refundTotal),
          credit: 0
        });
        lines.push({
          id: generateId('line'),
          accountCode: accMercaderias.code,
          accountName: accMercaderias.name,
          accountType: accMercaderias.type,
          debit: 0,
          credit: round2(refundTotal)
        });

        entries.push(createJournalEntry(
          op, 
          entryCounter++, 
          `Por devolución de mercaderías a proveedor ${op.counterpart} s/${op.voucherType} Nº ${op.voucherNumber}`, 
          lines
        ));
        break;
      }

      case 'DEVOLUCION_VENTA': {
        const salesTotal = op.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
        const counterpartAcc = getCounterpartAccount(true);

        // 1) Anulación de venta
        const linesDevVenta: JournalEntryLine[] = [
          {
            id: generateId('line'),
            accountCode: accVentas.code,
            accountName: accVentas.name,
            accountType: accVentas.type,
            debit: round2(salesTotal),
            credit: 0
          },
          {
            id: generateId('line'),
            accountCode: counterpartAcc.code,
            accountName: counterpartAcc.name,
            accountType: counterpartAcc.type,
            debit: 0,
            credit: round2(salesTotal)
          }
        ];
        entries.push(createJournalEntry(op, entryCounter++, `Por devolución de venta de ${op.counterpart} s/${op.voucherType} Nº ${op.voucherNumber}`, linesDevVenta));

        // 2) Reingreso a stock y reversión de CMV
        let restockCost = 0;
        for (const item of op.items) {
          const prodState = exerciseState.productStates.get(item.productId);
          if (prodState) {
            const kardexRow = prodState.kardex.find(k => k.operationId === op.id);
            if (kardexRow) {
              restockCost = round2(restockCost + kardexRow.inTotalCost);
            }
          }
        }
        if (restockCost > 0) {
          const linesReingreso: JournalEntryLine[] = [
            {
              id: generateId('line'),
              accountCode: accMercaderias.code,
              accountName: accMercaderias.name,
              accountType: accMercaderias.type,
              debit: restockCost,
              credit: 0
            },
            {
              id: generateId('line'),
              accountCode: accCMV.code,
              accountName: accCMV.name,
              accountType: accCMV.type,
              debit: 0,
              credit: restockCost
            }
          ];
          entries.push(createJournalEntry(op, entryCounter++, `Por reingreso a stock de mercaderías devueltas s/${op.voucherType} Nº ${op.voucherNumber}`, linesReingreso));
        }
        break;
      }

      case 'AJUSTE_FALTANTE': {
        let lossCost = 0;
        for (const item of op.items) {
          const prodState = exerciseState.productStates.get(item.productId);
          if (prodState) {
            const kardexRow = prodState.kardex.find(k => k.operationId === op.id);
            if (kardexRow) {
              lossCost = round2(lossCost + kardexRow.outTotalCost);
            }
          }
        }
        if (lossCost > 0) {
          lines.push({
            id: generateId('line'),
            accountCode: accFaltantes.code,
            accountName: accFaltantes.name,
            accountType: accFaltantes.type,
            debit: lossCost,
            credit: 0
          });
          lines.push({
            id: generateId('line'),
            accountCode: accMercaderias.code,
            accountName: accMercaderias.name,
            accountType: accMercaderias.type,
            debit: 0,
            credit: lossCost
          });
          entries.push(createJournalEntry(op, entryCounter++, `Por ajuste de faltante en recuento físico s/${op.voucherType} Nº ${op.voucherNumber}`, lines));
        }
        break;
      }

      case 'AJUSTE_SOBRANTE': {
        let gainCost = 0;
        for (const item of op.items) {
          const prodState = exerciseState.productStates.get(item.productId);
          if (prodState) {
            const kardexRow = prodState.kardex.find(k => k.operationId === op.id);
            if (kardexRow) {
              gainCost = round2(gainCost + kardexRow.inTotalCost);
            }
          }
        }
        if (gainCost > 0) {
          lines.push({
            id: generateId('line'),
            accountCode: accMercaderias.code,
            accountName: accMercaderias.name,
            accountType: accMercaderias.type,
            debit: gainCost,
            credit: 0
          });
          lines.push({
            id: generateId('line'),
            accountCode: accSobrantes.code,
            accountName: accSobrantes.name,
            accountType: accSobrantes.type,
            debit: 0,
            credit: gainCost
          });
          entries.push(createJournalEntry(op, entryCounter++, `Por ajuste de sobrante en recuento físico s/${op.voucherType} Nº ${op.voucherNumber}`, lines));
        }
        break;
      }
    }
  }

  return entries;
}

/**
 * Crea y valida un asiento contable verificando la estricta partida doble
 */
function createJournalEntry(
  op: Operation,
  entryNumber: number,
  gloss: string,
  lines: JournalEntryLine[]
): JournalEntry {
  const totalDebit = round2(lines.reduce((s, l) => s + l.debit, 0));
  const totalCredit = round2(lines.reduce((s, l) => s + l.credit, 0));
  const difference = round2(Math.abs(totalDebit - totalCredit));
  const isBalanced = difference === 0;

  return {
    id: generateId('entry'),
    exerciseId: op.exerciseId,
    operationId: op.id,
    entryNumber,
    date: op.date,
    voucherNumber: op.voucherNumber,
    gloss,
    lines,
    totalDebit,
    totalCredit,
    isBalanced,
    difference
  };
}
