import { 
  Operation, 
  Product, 
  ValuationMethod, 
  KardexRow, 
  InventoryLayer, 
  MethodComparisonResult
} from '../types/accounting';
import { round2, round4, generateId } from '../utils/currency';

export interface ProductInventoryState {
  productId: string;
  productName: string;
  productCode: string;
  kardex: KardexRow[];
  totalCMV: number;
  totalSalesUnits: number;
  totalSalesRevenue: number;
  totalPurchasesUnits: number;
  totalPurchasesCost: number;
  endingUnits: number;
  endingCost: number;
  activeLayers: InventoryLayer[];
}

export interface InventoryCalculationResult {
  method: ValuationMethod;
  productStates: Map<string, ProductInventoryState>;
  totalExerciseCMV: number;
  totalExerciseSales: number;
  totalExercisePurchases: number;
  totalExerciseEndingInventory: number;
  grossProfit: number;
}

/**
 * Ordena las operaciones cronológicamente de forma determinista
 */
export function sortOperationsChronologically(operations: Operation[]): Operation[] {
  return [...operations].sort((a, b) => {
    // 1. Fecha
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    // 2. Si la fecha es igual, Apertura va primero
    if (a.type === 'APERTURA') return -1;
    if (b.type === 'APERTURA') return 1;
    // 3. Compras antes de Ventas el mismo día para asegurar stock disponible
    if (a.type === 'COMPRA' && b.type === 'VENTA') return -1;
    if (a.type === 'VENTA' && b.type === 'COMPRA') return 1;
    // 4. Fallback a createdAt
    return a.createdAt - b.createdAt;
  });
}

/**
 * Calcula el inventario permanente (Kardex, CMV y Capas) para un producto y método determinado
 */
export function calculateProductInventory(
  product: Product,
  allOperations: Operation[],
  method: ValuationMethod
): ProductInventoryState {
  const sortedOps = sortOperationsChronologically(allOperations);
  const kardex: KardexRow[] = [];
  
  let currentLayers: InventoryLayer[] = [];
  let balanceQty = 0;
  let balanceTotalCost = 0;
  let balanceUnitCost = 0;

  let totalCMV = 0;
  let totalSalesUnits = 0;
  let totalSalesRevenue = 0;
  let totalPurchasesUnits = 0;
  let totalPurchasesCost = 0;

  // 1. Inicializar con existencia inicial si el producto tiene
  if (product.initialQuantity > 0) {
    if (product.isSpecificIdentification && product.units && product.units.length > 0) {
      // Para identificación específica con unidades individuales detalladas
      const activeUnits = product.units.filter(u => !u.isSold);
      const totalUnitsCost = activeUnits.reduce((sum, u) => sum + u.cost, 0);
      balanceQty = activeUnits.length;
      balanceTotalCost = round2(totalUnitsCost);
      balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;

      for (const u of activeUnits) {
        currentLayers.push({
          id: generateId(`layer_unit_${u.id}`),
          date: u.purchaseDate || 'Inicio',
          voucherNumber: u.purchaseVoucher || 'Saldo Inicial',
          originalQuantity: 1,
          availableQuantity: 1,
          unitCost: u.cost,
          totalCost: u.cost,
          specificUnitIds: [u.id]
        });
      }

      kardex.push({
        id: generateId('kdx'),
        date: 'Inicio',
        operationId: 'init',
        voucherNumber: 'Inventario Inicial',
        detail: `Existencia inicial: ${activeUnits.length} unidades con identificación individual`,
        type: 'APERTURA',
        inQuantity: balanceQty,
        inUnitCost: balanceUnitCost,
        inTotalCost: balanceTotalCost,
        outQuantity: 0,
        outUnitCost: 0,
        outTotalCost: 0,
        balanceQuantity: balanceQty,
        balanceUnitCost: balanceUnitCost,
        balanceTotalCost: balanceTotalCost,
        activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers)),
        pppCalculationFormula: `Existencia inicial con seriales: $ ${balanceTotalCost}`
      });
    } else {
      const initQty = product.initialQuantity;
      const initUnitCost = round2(product.initialUnitCost);
      const initTotalCost = round2(initQty * initUnitCost);

      balanceQty = initQty;
      balanceTotalCost = initTotalCost;
      balanceUnitCost = initUnitCost;

      const initialLayer: InventoryLayer = {
        id: generateId('layer_init'),
        date: 'Inicio',
        voucherNumber: 'Saldo Inicial',
        originalQuantity: initQty,
        availableQuantity: initQty,
        unitCost: initUnitCost,
        totalCost: initTotalCost,
        specificUnitIds: product.units?.filter(u => !u.isSold).map(u => u.id) || []
      };
      currentLayers.push(initialLayer);

      kardex.push({
        id: generateId('kdx'),
        date: 'Inicio',
        operationId: 'init',
        voucherNumber: 'Inventario Inicial',
        detail: 'Existencia inicial según inventario físico',
        type: 'APERTURA',
        inQuantity: initQty,
        inUnitCost: initUnitCost,
        inTotalCost: initTotalCost,
        outQuantity: 0,
        outUnitCost: 0,
        outTotalCost: 0,
        balanceQuantity: balanceQty,
        balanceUnitCost: balanceUnitCost,
        balanceTotalCost: balanceTotalCost,
        activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers)),
        pppCalculationFormula: `Existencia inicial: ${initQty} un. a $ ${initUnitCost} = $ ${initTotalCost}`
      });
    }
  }

  // 2. Procesar cada operación cronológica que afecte a este producto
  for (const op of sortedOps) {
    const item = op.items.find(i => i.productId === product.id);
    if (!item && op.type !== 'APERTURA') continue;

    const qty = item?.quantity || 0;
    const price = item?.unitPrice || 0;

    switch (op.type) {
      case 'APERTURA': {
        // Si no se incluyó en la inicialización o se registró como operación formal
        if (product.initialQuantity === 0 && qty > 0) {
          const inTotal = round2(qty * price);
          balanceQty += qty;
          balanceTotalCost = round2(balanceTotalCost + inTotal);
          balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;

          const layer: InventoryLayer = {
            id: generateId('layer_op_init'),
            date: op.date,
            voucherNumber: op.voucherNumber,
            originalQuantity: qty,
            availableQuantity: qty,
            unitCost: price,
            totalCost: inTotal
          };
          currentLayers.push(layer);

          kardex.push({
            id: generateId('kdx'),
            date: op.date,
            operationId: op.id,
            voucherNumber: op.voucherNumber,
            detail: `Asiento de Apertura - ${op.notes || 'Saldo inicial'}`,
            type: 'APERTURA',
            inQuantity: qty,
            inUnitCost: price,
            inTotalCost: inTotal,
            outQuantity: 0,
            outUnitCost: 0,
            outTotalCost: 0,
            balanceQuantity: balanceQty,
            balanceUnitCost: balanceUnitCost,
            balanceTotalCost: balanceTotalCost,
            activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers))
          });
        }
        break;
      }

      case 'COMPRA': {
        // En compras con costo atribuible (ej. Fletes RT 17), se incorpora al costo
        let effectiveUnitCost = price;
        let inTotal = round2(qty * price);

        if (op.additionalAttributableExpense && op.additionalAttributableExpense > 0) {
          // Si la operación tiene gastos adicionales de adquisición
          const addedPerUnit = op.additionalAttributableExpense / (qty || 1);
          effectiveUnitCost = round4(price + addedPerUnit);
          inTotal = round2(inTotal + op.additionalAttributableExpense);
        }

        if (op.discountPercentage && op.discountPercentage > 0) {
          const discountAmt = round2(inTotal * (op.discountPercentage / 100));
          inTotal = round2(inTotal - discountAmt);
          effectiveUnitCost = round4(inTotal / qty);
        }

        totalPurchasesUnits += qty;
        totalPurchasesCost = round2(totalPurchasesCost + inTotal);

        const prevBalanceQty = balanceQty;
        const prevBalanceCost = balanceTotalCost;

        balanceQty += qty;
        balanceTotalCost = round2(balanceTotalCost + inTotal);

        let pppFormula = '';
        if (method === 'PPP') {
          balanceUnitCost = round4(balanceTotalCost / balanceQty);
          pppFormula = `PPP = ($ ${prevBalanceCost.toFixed(2)} + $ ${inTotal.toFixed(2)}) / (${prevBalanceQty} + ${qty}) = $ ${balanceUnitCost.toFixed(4)}`;
        } else {
          balanceUnitCost = round4(balanceTotalCost / balanceQty);
        }

        const newLayer: InventoryLayer = {
          id: generateId('layer'),
          date: op.date,
          voucherNumber: op.voucherNumber,
          originalQuantity: qty,
          availableQuantity: qty,
          unitCost: effectiveUnitCost,
          totalCost: inTotal,
          specificUnitIds: item?.specificUnitIds || []
        };
        currentLayers.push(newLayer);

        kardex.push({
          id: generateId('kdx'),
          date: op.date,
          operationId: op.id,
          voucherNumber: op.voucherNumber,
          detail: `Compra s/${op.voucherType} a ${op.counterpart}`,
          type: 'COMPRA',
          inQuantity: qty,
          inUnitCost: effectiveUnitCost,
          inTotalCost: inTotal,
          outQuantity: 0,
          outUnitCost: 0,
          outTotalCost: 0,
          balanceQuantity: balanceQty,
          balanceUnitCost: balanceUnitCost,
          balanceTotalCost: balanceTotalCost,
          activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers)),
          pppCalculationFormula: pppFormula
        });
        break;
      }

      case 'VENTA': {
        totalSalesUnits += qty;
        totalSalesRevenue = round2(totalSalesRevenue + (qty * price));

        let outTotal = 0;
        let outUnitCost = 0;
        const consumedLayers: KardexRow['consumedLayers'] = [];

        if (method === 'PPP') {
          // PPP: Se valúa al costo promedio vigente inmediatamente antes de la salida
          outUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;
          outTotal = round2(qty * outUnitCost);

          balanceQty -= qty;
          balanceTotalCost = round2(balanceTotalCost - outTotal);
          // Si el saldo queda en 0, el costo unitario es 0
          balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;

          consumedLayers.push({
            layerId: 'ppp_pool',
            date: op.date,
            quantity: qty,
            unitCost: outUnitCost,
            subtotal: outTotal
          });
        } 
        else if (method === 'PEPS') {
          // PEPS: Primero Entrado, Primero Salido (FIFO) - capas más antiguas primero
          let remainingQtyToConsume = qty;

          for (let i = 0; i < currentLayers.length && remainingQtyToConsume > 0; i++) {
            const layer = currentLayers[i];
            if (layer.availableQuantity <= 0) continue;

            const take = Math.min(layer.availableQuantity, remainingQtyToConsume);
            const sliceCost = round2(take * layer.unitCost);

            layer.availableQuantity -= take;
            layer.totalCost = round2(layer.availableQuantity * layer.unitCost);
            remainingQtyToConsume -= take;
            outTotal = round2(outTotal + sliceCost);

            consumedLayers.push({
              layerId: layer.id,
              date: layer.date,
              quantity: take,
              unitCost: layer.unitCost,
              subtotal: sliceCost
            });
          }

          balanceQty -= qty;
          balanceTotalCost = round2(balanceTotalCost - outTotal);
          balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;
          outUnitCost = qty > 0 ? round4(outTotal / qty) : 0;
        } 
        else if (method === 'UEPS') {
          // UEPS: Último Entrado, Primero Salido (LIFO) - capas más recientes primero
          let remainingQtyToConsume = qty;

          for (let i = currentLayers.length - 1; i >= 0 && remainingQtyToConsume > 0; i--) {
            const layer = currentLayers[i];
            if (layer.availableQuantity <= 0) continue;

            const take = Math.min(layer.availableQuantity, remainingQtyToConsume);
            const sliceCost = round2(take * layer.unitCost);

            layer.availableQuantity -= take;
            layer.totalCost = round2(layer.availableQuantity * layer.unitCost);
            remainingQtyToConsume -= take;
            outTotal = round2(outTotal + sliceCost);

            consumedLayers.push({
              layerId: layer.id,
              date: layer.date,
              quantity: take,
              unitCost: layer.unitCost,
              subtotal: sliceCost
            });
          }

          balanceQty -= qty;
          balanceTotalCost = round2(balanceTotalCost - outTotal);
          balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;
          outUnitCost = qty > 0 ? round4(outTotal / qty) : 0;
        }
        else if (method === 'ESPECIFICA') {
          // Identificación Específica: asignación directa del costo real individual
          if (item?.specificUnitIds && item.specificUnitIds.length > 0) {
            // Se seleccionaron unidades específicas
            for (const unitId of item.specificUnitIds) {
              // Buscar en las capas la unidad
              const foundLayer = currentLayers.find(l => l.specificUnitIds?.includes(unitId) && l.availableQuantity > 0);
              const uCost = foundLayer ? foundLayer.unitCost : (product.units?.find(u => u.id === unitId)?.cost || balanceUnitCost);
              
              if (foundLayer) {
                foundLayer.availableQuantity -= 1;
                foundLayer.totalCost = round2(foundLayer.availableQuantity * foundLayer.unitCost);
              }

              const sliceCost = round2(uCost);
              outTotal = round2(outTotal + sliceCost);

              consumedLayers.push({
                layerId: unitId,
                date: op.date,
                quantity: 1,
                unitCost: uCost,
                subtotal: sliceCost
              });
            }
          } else {
            // Si no se asignaron IDs individuales explícitos, se usa el costo de la capa más antigua como fallback seguro
            let remaining = qty;
            for (const layer of currentLayers) {
              if (layer.availableQuantity <= 0 || remaining <= 0) continue;
              const take = Math.min(layer.availableQuantity, remaining);
              const sliceCost = round2(take * layer.unitCost);
              layer.availableQuantity -= take;
              layer.totalCost = round2(layer.availableQuantity * layer.unitCost);
              remaining -= take;
              outTotal = round2(outTotal + sliceCost);
              consumedLayers.push({
                layerId: layer.id,
                date: layer.date,
                quantity: take,
                unitCost: layer.unitCost,
                subtotal: sliceCost
              });
            }
          }

          balanceQty -= qty;
          balanceTotalCost = round2(balanceTotalCost - outTotal);
          balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;
          outUnitCost = qty > 0 ? round4(outTotal / qty) : 0;
        }

        totalCMV = round2(totalCMV + outTotal);

        kardex.push({
          id: generateId('kdx'),
          date: op.date,
          operationId: op.id,
          voucherNumber: op.voucherNumber,
          detail: `Venta s/${op.voucherType} a ${op.counterpart}`,
          type: 'VENTA',
          inQuantity: 0,
          inUnitCost: 0,
          inTotalCost: 0,
          outQuantity: qty,
          outUnitCost: outUnitCost,
          outTotalCost: outTotal,
          balanceQuantity: balanceQty,
          balanceUnitCost: balanceUnitCost,
          balanceTotalCost: balanceTotalCost,
          consumedLayers,
          activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers))
        });
        break;
      }

      case 'DEVOLUCION_COMPRA': {
        // Devolución de mercadería al proveedor: baja de stock al costo de adquisición
        const outTotal = round2(qty * price);
        balanceQty -= qty;
        balanceTotalCost = round2(balanceTotalCost - outTotal);
        balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;

        // Disminuir de la capa más reciente o específica
        let remaining = qty;
        for (let i = currentLayers.length - 1; i >= 0 && remaining > 0; i--) {
          const layer = currentLayers[i];
          const take = Math.min(layer.availableQuantity, remaining);
          layer.availableQuantity -= take;
          layer.totalCost = round2(layer.availableQuantity * layer.unitCost);
          remaining -= take;
        }

        kardex.push({
          id: generateId('kdx'),
          date: op.date,
          operationId: op.id,
          voucherNumber: op.voucherNumber,
          detail: `Devolución de Compra al proveedor ${op.counterpart}`,
          type: 'DEVOLUCION_COMPRA',
          inQuantity: 0,
          inUnitCost: 0,
          inTotalCost: 0,
          outQuantity: qty,
          outUnitCost: price,
          outTotalCost: outTotal,
          balanceQuantity: balanceQty,
          balanceUnitCost: balanceUnitCost,
          balanceTotalCost: balanceTotalCost,
          activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers))
        });
        break;
      }

      case 'DEVOLUCION_VENTA': {
        // Devolución del cliente: reingreso de mercaderías al stock
        // Se reingresa al costo que salió (reversión de CMV)
        const reUnitCost = price > 0 ? price : balanceUnitCost;
        const inTotal = round2(qty * reUnitCost);

        balanceQty += qty;
        balanceTotalCost = round2(balanceTotalCost + inTotal);
        balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;

        // Reintegrar capa
        const restoredLayer: InventoryLayer = {
          id: generateId('layer_ret'),
          date: op.date,
          voucherNumber: op.voucherNumber,
          originalQuantity: qty,
          availableQuantity: qty,
          unitCost: reUnitCost,
          totalCost: inTotal
        };
        // En PEPS se reincorpora al inicio o final según política; la práctica habitual la incorpora como disponible
        currentLayers.unshift(restoredLayer);

        totalCMV = round2(totalCMV - inTotal); // Reduce el CMV acumulado

        kardex.push({
          id: generateId('kdx'),
          date: op.date,
          operationId: op.id,
          voucherNumber: op.voucherNumber,
          detail: `Devolución de Venta del cliente ${op.counterpart} (Reingreso a stock)`,
          type: 'DEVOLUCION_VENTA',
          inQuantity: qty,
          inUnitCost: reUnitCost,
          inTotalCost: inTotal,
          outQuantity: 0,
          outUnitCost: 0,
          outTotalCost: 0,
          balanceQuantity: balanceQty,
          balanceUnitCost: balanceUnitCost,
          balanceTotalCost: balanceTotalCost,
          activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers))
        });
        break;
      }

      case 'AJUSTE_FALTANTE': {
        // Faltante de mercadería detectado en recuento físico: salida a costo de valuación
        let outUnitCost = balanceUnitCost;
        let outTotal = round2(qty * outUnitCost);

        if (method === 'PEPS' || method === 'UEPS') {
          // Consume capas igual que una salida
          let rem = qty;
          outTotal = 0;
          const layersToIterate = method === 'PEPS' ? currentLayers : [...currentLayers].reverse();
          for (const layer of layersToIterate) {
            if (layer.availableQuantity <= 0 || rem <= 0) continue;
            const take = Math.min(layer.availableQuantity, rem);
            const sub = round2(take * layer.unitCost);
            layer.availableQuantity -= take;
            layer.totalCost = round2(layer.availableQuantity * layer.unitCost);
            rem -= take;
            outTotal = round2(outTotal + sub);
          }
          outUnitCost = qty > 0 ? round4(outTotal / qty) : balanceUnitCost;
        }

        balanceQty -= qty;
        balanceTotalCost = round2(balanceTotalCost - outTotal);
        balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;

        kardex.push({
          id: generateId('kdx'),
          date: op.date,
          operationId: op.id,
          voucherNumber: op.voucherNumber,
          detail: `Ajuste por Faltante de Inventario (Recuento físico)`,
          type: 'AJUSTE_FALTANTE',
          inQuantity: 0,
          inUnitCost: 0,
          inTotalCost: 0,
          outQuantity: qty,
          outUnitCost: outUnitCost,
          outTotalCost: outTotal,
          balanceQuantity: balanceQty,
          balanceUnitCost: balanceUnitCost,
          balanceTotalCost: balanceTotalCost,
          activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers))
        });
        break;
      }

      case 'AJUSTE_SOBRANTE': {
        // Sobrante detectado: entrada valuada al costo promedio o de última compra
        const inUnitCost = balanceUnitCost > 0 ? balanceUnitCost : price;
        const inTotal = round2(qty * inUnitCost);

        balanceQty += qty;
        balanceTotalCost = round2(balanceTotalCost + inTotal);
        balanceUnitCost = balanceQty > 0 ? round4(balanceTotalCost / balanceQty) : 0;

        const newLayer: InventoryLayer = {
          id: generateId('layer_surplus'),
          date: op.date,
          voucherNumber: op.voucherNumber,
          originalQuantity: qty,
          availableQuantity: qty,
          unitCost: inUnitCost,
          totalCost: inTotal
        };
        currentLayers.push(newLayer);

        kardex.push({
          id: generateId('kdx'),
          date: op.date,
          operationId: op.id,
          voucherNumber: op.voucherNumber,
          detail: `Ajuste por Sobrante de Inventario (Recuento físico)`,
          type: 'AJUSTE_SOBRANTE',
          inQuantity: qty,
          inUnitCost: inUnitCost,
          inTotalCost: inTotal,
          outQuantity: 0,
          outUnitCost: 0,
          outTotalCost: 0,
          balanceQuantity: balanceQty,
          balanceUnitCost: balanceUnitCost,
          balanceTotalCost: balanceTotalCost,
          activeLayersSnapshot: JSON.parse(JSON.stringify(currentLayers))
        });
        break;
      }
    }
  }

  return {
    productId: product.id,
    productName: product.name,
    productCode: product.code,
    kardex,
    totalCMV: round2(totalCMV),
    totalSalesUnits,
    totalSalesRevenue: round2(totalSalesRevenue),
    totalPurchasesUnits,
    totalPurchasesCost: round2(totalPurchasesCost),
    endingUnits: balanceQty,
    endingCost: round2(balanceTotalCost),
    activeLayers: currentLayers.filter(l => l.availableQuantity > 0)
  };
}

/**
 * Calcula todo el ejercicio para un método de valuación
 */
export function calculateExerciseInventory(
  products: Product[],
  operations: Operation[],
  method: ValuationMethod
): InventoryCalculationResult {
  const productStates = new Map<string, ProductInventoryState>();
  let totalExerciseCMV = 0;
  let totalExerciseSales = 0;
  let totalExercisePurchases = 0;
  let totalExerciseEndingInventory = 0;

  for (const prod of products) {
    const state = calculateProductInventory(prod, operations, method);
    productStates.set(prod.id, state);
    totalExerciseCMV = round2(totalExerciseCMV + state.totalCMV);
    totalExerciseSales = round2(totalExerciseSales + state.totalSalesRevenue);
    totalExercisePurchases = round2(totalExercisePurchases + state.totalPurchasesCost);
    totalExerciseEndingInventory = round2(totalExerciseEndingInventory + state.endingCost);
  }

  const grossProfit = round2(totalExerciseSales - totalExerciseCMV);

  return {
    method,
    productStates,
    totalExerciseCMV,
    totalExerciseSales,
    totalExercisePurchases,
    totalExerciseEndingInventory,
    grossProfit
  };
}

/**
 * Comparación simultánea de los cuatro métodos sobre el mismo conjunto de operaciones
 */
export function compareAllMethods(
  products: Product[],
  operations: Operation[]
): MethodComparisonResult[] {
  const methods: ValuationMethod[] = ['PEPS', 'UEPS', 'PPP', 'ESPECIFICA'];

  const methodDetails: Record<ValuationMethod, { name: string; note: string }> = {
    PEPS: {
      name: 'PEPS (Primero Entrado, Primero Salido / FIFO)',
      note: 'En contextos inflacionarios, valúa las salidas a los costos más antiguos y el inventario final a los costos más recientes (más cercanos a reposición). Tiende a reportar un CMV menor y un Resultado Bruto más elevado.'
    },
    UEPS: {
      name: 'UEPS (Último Entrado, Primero Salido / LIFO) [Uso Académico]',
      note: 'Asigna a las ventas los costos de las compras más recientes, reduciendo el Resultado Bruto y aproximando el CMV a valores corrientes. IMPORTANTE: En Argentina no está admitido por las Normas Contables Profesionales (RT 17 FACPCE) ni por las NIIF (NIC 2), pero se estudia para comprender el efecto comparativo en los resultados.'
    },
    PPP: {
      name: 'PPP (Precio Promedio Ponderado Móvil)',
      note: 'Suaviza las oscilaciones de precios ponderando cada entrada. Es el método más utilizado en la práctica por su equilibrio, neutralidad y facilidad de control administrativo en sistemas computarizados.'
    },
    ESPECIFICA: {
      name: 'Identificación Específica (Costo Real Individual)',
      note: 'Asigna el costo histórico exacto de cada unidad individual vendida. Es el método ideal para bienes de alto valor unitario, bienes no intercambiables entre sí o con trazabilidad por número de serie (ej. maquinaria, vehículos, joyas, lotes exclusivos).'
    }
  };

  return methods.map(method => {
    const calc = calculateExerciseInventory(products, operations, method);
    const mainProduct = products[0];
    const kardexRows = mainProduct && calc.productStates.has(mainProduct.id) 
      ? calc.productStates.get(mainProduct.id)!.kardex 
      : [];

    const grossMargin = calc.totalExerciseSales > 0 
      ? round2((calc.grossProfit / calc.totalExerciseSales) * 100) 
      : 0;

    let endingUnits = 0;
    calc.productStates.forEach(s => { endingUnits += s.endingUnits; });

    return {
      method,
      name: methodDetails[method].name,
      totalSales: calc.totalExerciseSales,
      totalPurchases: calc.totalExercisePurchases,
      totalCMV: calc.totalExerciseCMV,
      endingInventoryValue: calc.totalExerciseEndingInventory,
      endingInventoryUnits: endingUnits,
      grossProfit: calc.grossProfit,
      grossMarginPercentage: grossMargin,
      pedagogicalNote: methodDetails[method].note,
      kardexRows
    };
  });
}
