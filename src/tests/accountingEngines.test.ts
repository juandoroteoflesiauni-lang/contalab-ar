import { describe, it, expect } from 'vitest';
import { Product, Operation, AccountingExercise } from '../types/accounting';
import { calculateProductInventory, compareAllMethods } from '../core/inventoryEngine';
import { generateJournalEntries } from '../core/journalEngine';
import { generateLedger, generateTrialBalance } from '../core/ledgerEngine';
import { DEFAULT_ACCOUNTS } from '../data/defaultAccounts';
import { FacultyInventoryRow } from '../types/practice';
import { recalculateInventorySheet } from '../utils/inventorySheetCalculator';

describe('Motor de Valuación de Inventarios - Caso de Prueba Contable', () => {
  const sampleProduct: Product = {
    id: 'test_prod_1',
    code: 'TEST-01',
    name: 'Artículo de Prueba',
    description: 'Producto para validación de cálculos',
    category: 'General',
    unitOfMeasure: 'Unidades',
    initialQuantity: 100,
    initialUnitCost: 500.00
  };

  const sampleOperations: Operation[] = [
    {
      id: 'op_buy_1',
      exerciseId: 'test_ex',
      date: '2026-03-02',
      voucherType: 'Factura A',
      voucherNumber: '0001-00000001',
      type: 'COMPRA',
      counterpart: 'Proveedor Mayorista',
      paymentMethod: 'CUENTA_CORRIENTE',
      applyIva: false,
      additionalAttributableExpense: 3000, // 3000 / 150 = $20 por unidad extra
      items: [
        {
          productId: 'test_prod_1',
          quantity: 150,
          unitPrice: 600.00,
          subtotal: 90000.00
        }
      ],
      createdAt: 1000
    },
    {
      id: 'op_sell_1',
      exerciseId: 'test_ex',
      date: '2026-03-08',
      voucherType: 'Factura B',
      voucherNumber: '0001-00000002',
      type: 'VENTA',
      counterpart: 'Cliente Final',
      paymentMethod: 'CONTADO_EFECTIVO',
      applyIva: false,
      items: [
        {
          productId: 'test_prod_1',
          quantity: 120,
          unitPrice: 1100.00,
          subtotal: 132000.00
        }
      ],
      createdAt: 2000
    }
  ];

  it('1. PEPS (FIFO): Consume las capas más antiguas primero', () => {
    // 100 un @ 500 = $50.000 (inicial)
    // 150 un @ 620 = $93.000 (compra con flete)
    // Venta de 120 un:
    // Capa 1: 100 un * 500 = 50.000
    // Capa 2: 20 un * 620 = 12.400
    // Total CMV PEPS = 62.400
    // Existencia final: 130 un * 620 = 80.600
    const state = calculateProductInventory(sampleProduct, sampleOperations, 'PEPS');
    expect(state.totalCMV).toBe(62400);
    expect(state.endingUnits).toBe(130);
    expect(state.endingCost).toBe(80600);
  });

  it('2. UEPS (LIFO): Consume las capas más recientes primero', () => {
    // Venta de 120 un:
    // Capa más reciente (150 un @ 620): toma 120 * 620 = 74.400
    // Total CMV UEPS = 74.400
    // Existencia final: 100 @ 500 (50.000) + 30 @ 620 (18.600) = 68.600
    const state = calculateProductInventory(sampleProduct, sampleOperations, 'UEPS');
    expect(state.totalCMV).toBe(74400);
    expect(state.endingUnits).toBe(130);
    expect(state.endingCost).toBe(68600);
    // En inflación, CMV UEPS > CMV PEPS
    expect(state.totalCMV).toBeGreaterThan(62400);
  });

  it('3. PPP (Precio Promedio Ponderado móvil): Calcula el promedio exacto', () => {
    // Costo promedio previo a la venta: (50.000 + 93.000) / 250 = 143.000 / 250 = $572,00
    // Venta de 120 un @ 572 = 68.640
    // Total CMV PPP = 68.640
    // Existencia final: 130 un @ 572 = 74.360
    const state = calculateProductInventory(sampleProduct, sampleOperations, 'PPP');
    expect(state.totalCMV).toBe(68640);
    expect(state.endingUnits).toBe(130);
    expect(state.endingCost).toBe(74360);
  });

  it('4. Identificación Específica: asigna el costo individual seleccionado', () => {
    const specificProduct: Product = {
      id: 'prod_spec',
      code: 'SPEC-01',
      name: 'Equipo Específico',
      description: 'Prueba de seriales',
      category: 'Tecnología',
      unitOfMeasure: 'Unidad',
      initialQuantity: 2,
      initialUnitCost: 10000,
      isSpecificIdentification: true,
      units: [
        { id: 'SN-A', cost: 10000, isSold: false, purchaseDate: '2026-03-01', purchaseVoucher: 'Inicial' },
        { id: 'SN-B', cost: 12000, isSold: false, purchaseDate: '2026-03-01', purchaseVoucher: 'Inicial' }
      ]
    };

    const specOps: Operation[] = [
      {
        id: 'op_spec_sell',
        exerciseId: 'test_ex',
        date: '2026-03-05',
        voucherType: 'Factura B',
        voucherNumber: '0001-00000099',
        type: 'VENTA',
        counterpart: 'Cliente VIP',
        paymentMethod: 'CONTADO_EFECTIVO',
        items: [
          {
            productId: 'prod_spec',
            quantity: 1,
            unitPrice: 20000,
            subtotal: 20000,
            specificUnitIds: ['SN-B'] // Se vende la unidad con costo 12.000
          }
        ],
        createdAt: 3000
      }
    ];

    const state = calculateProductInventory(specificProduct, specOps, 'ESPECIFICA');
    expect(state.totalCMV).toBe(12000);
    expect(state.endingUnits).toBe(1);
  });

  it('5. Partida Doble en Libro Diario: Total Debe === Total Haber en todos los asientos', () => {
    const entries = generateJournalEntries(
      sampleOperations,
      [sampleProduct],
      DEFAULT_ACCOUNTS,
      'PEPS'
    );

    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(entry => {
      expect(entry.isBalanced).toBe(true);
      expect(entry.totalDebit).toBeCloseTo(entry.totalCredit, 2);
    });
  });

  it('6. Balance de Sumas y Saldos: Igualdad fundamental de comprobación', () => {
    const entries = generateJournalEntries(
      sampleOperations,
      [sampleProduct],
      DEFAULT_ACCOUNTS,
      'PEPS'
    );
    const ledger = generateLedger(entries, DEFAULT_ACCOUNTS);
    const trialBalance = generateTrialBalance(ledger);

    expect(trialBalance.isSumsBalanced).toBe(true);
    expect(trialBalance.isBalancesBalanced).toBe(true);
    expect(trialBalance.totalDebitSum).toBeCloseTo(trialBalance.totalCreditSum, 2);
    expect(trialBalance.totalDebitBalance).toBeCloseTo(trialBalance.totalCreditBalance, 2);
  });

  it('7. Fletes y Costos Atribuibles (RT 17): Se incorporan al costo unitario del bien', () => {
    // Compra 150 un a $600 + $3000 de flete = $93.000 / 150 = $620/un
    const state = calculateProductInventory(sampleProduct, [sampleOperations[0]], 'PEPS');
    // Saldo inicial 100 @ 500 ($50.000) + Compra 150 @ 620 ($93.000) = $143.000
    expect(state.endingCost).toBe(143000);
    expect(state.endingUnits).toBe(250);
  });

  it('8. Devoluciones de Venta y de Compra: Reingreso de stock y reversión coherente', () => {
    const opsWithReturns: Operation[] = [
      sampleOperations[0], // Compra 150 @ 620
      sampleOperations[1], // Venta 120 (CMV PEPS = 62.400)
      {
        id: 'op_dev_v',
        exerciseId: 'test_ex',
        date: '2026-03-10',
        voucherType: 'Nota de Crédito B',
        voucherNumber: '0001-00000010',
        type: 'DEVOLUCION_VENTA',
        counterpart: 'Cliente Final',
        paymentMethod: 'CONTADO_EFECTIVO',
        items: [{ productId: 'test_prod_1', quantity: 10, unitPrice: 620, subtotal: 6200 }],
        createdAt: 2500
      }
    ];

    const state = calculateProductInventory(sampleProduct, opsWithReturns, 'PEPS');
    // Venta sacó 120, devolución reingresó 10. Saldo final = 100 + 150 - 120 + 10 = 140
    expect(state.endingUnits).toBe(140);
    // CMV total se redujo en $6.200 (62.400 - 6.200 = 56.200)
    expect(state.totalCMV).toBe(56200);
  });

  it('9. Ajustes por Faltante y Sobrante físico de inventario', () => {
    const opsWithAdj: Operation[] = [
      {
        id: 'op_adj_f',
        exerciseId: 'test_ex',
        date: '2026-03-15',
        voucherType: 'Minuta Contable',
        voucherNumber: 'MC-01',
        type: 'AJUSTE_FALTANTE',
        counterpart: 'Control Físico',
        paymentMethod: 'CONTADO_EFECTIVO',
        items: [{ productId: 'test_prod_1', quantity: 5, unitPrice: 0, subtotal: 0 }],
        createdAt: 4000
      }
    ];

    const state = calculateProductInventory(sampleProduct, opsWithAdj, 'PEPS');
    // Saldo inicial 100 - 5 faltante = 95 un
    expect(state.endingUnits).toBe(95);
    expect(state.endingCost).toBe(47500); // 95 * 500
  });

  it('10. Planilla al Costo de Cátedra: Recálculo en 3 bloques (Entrada, Salida, Saldo)', () => {
    const rows: FacultyInventoryRow[] = [
      {
        id: 'r1',
        date: '2026-03-01',
        concept: 'Existencia inicial',
        type: 'INICIAL',
        inUnits: 100,
        inUnitPrice: 500,
        inTotal: 50000,
        outUnits: 0,
        outUnitPrice: 0,
        outTotal: 0,
        balanceUnits: 0,
        balanceUnitPrice: 0,
        balanceTotal: 0
      },
      {
        id: 'r2',
        date: '2026-03-05',
        concept: 'Compra s/Factura A',
        type: 'COMPRA',
        inUnits: 150,
        inUnitPrice: 620,
        inTotal: 93000,
        outUnits: 0,
        outUnitPrice: 0,
        outTotal: 0,
        balanceUnits: 0,
        balanceUnitPrice: 0,
        balanceTotal: 0
      },
      {
        id: 'r3',
        date: '2026-03-10',
        concept: 'Venta s/Factura B',
        type: 'VENTA',
        inUnits: 0,
        inUnitPrice: 0,
        inTotal: 0,
        outUnits: 120,
        outUnitPrice: 0,
        outTotal: 0,
        balanceUnits: 0,
        balanceUnitPrice: 0,
        balanceTotal: 0
      }
    ];

    // Prueba en PEPS: la venta de 120 consume 100 @ 500 ($50.000) + 20 @ 620 ($12.400) = $62.400
    const pepsResult = recalculateInventorySheet(rows, 'PEPS');
    expect(pepsResult[2].outTotal).toBe(62400);
    expect(pepsResult[2].balanceUnits).toBe(130);
    expect(pepsResult[2].balanceTotal).toBe(80600);

    // Prueba en UEPS: la venta de 120 consume 120 @ 620 = $74.400
    const uepsResult = recalculateInventorySheet(rows, 'UEPS');
    expect(uepsResult[2].outTotal).toBe(74400);
    expect(uepsResult[2].balanceUnits).toBe(130);
    expect(uepsResult[2].balanceTotal).toBe(68600);

    // Prueba en PPP: saldo previo = (50.000 + 93.000)/250 = 572. Venta 120 * 572 = 68.640
    const pppResult = recalculateInventorySheet(rows, 'PPP');
    expect(pppResult[2].outTotal).toBe(68640);
    expect(pppResult[2].balanceUnits).toBe(130);
    expect(pppResult[2].balanceTotal).toBe(74360);
  });
});


