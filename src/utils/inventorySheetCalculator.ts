import { FacultyInventoryRow, InventoryCostMethod } from '../types/practice';
import { round2, round4 } from './currency';

interface Layer {
  units: number;
  unitCost: number;
}

/**
 * Recalcula cronológicamente todas las filas de la Planilla de Inventario Permanente
 * aplicando la lógica estricta de PEPS, UEPS, PPP o Identificación Específica según la cátedra.
 */
export function recalculateInventorySheet(
  rows: FacultyInventoryRow[],
  method: InventoryCostMethod
): FacultyInventoryRow[] {
  let layers: Layer[] = [];
  let currentBalanceUnits = 0;
  let currentBalanceTotal = 0;
  let currentBalanceUnitCost = 0;

  return rows.map((row) => {
    const isOutflow = row.outUnits > 0 || row.type === 'VENTA';
    const isDevCompra = row.type === 'DEV_COMPRA';
    const isDevVenta = row.type === 'DEV_VENTA';

    let inUnits = Number(row.inUnits) || 0;
    let inUnitPrice = Number(row.inUnitPrice) || 0;
    let inTotal = Number(row.inTotal) || 0;

    let outUnits = Number(row.outUnits) || 0;
    let outUnitPrice = Number(row.outUnitPrice) || 0;
    let outTotal = Number(row.outTotal) || 0;

    let balanceUnits = 0;
    let balanceUnitPrice = 0;
    let balanceTotal = 0;

    const costLayersConsumed: { units: number; unitCost: number; subtotal: number }[] = [];

    // 1. Manejo de Entrada (Compra, Saldo Inicial, Devolución de compra restando)
    if (!isOutflow && !isDevVenta) {
      if (isDevCompra) {
        // Devolución de compra: resta de inventario a costo de compra
        inTotal = round2(inUnits * inUnitPrice);
        currentBalanceUnits = Math.max(0, currentBalanceUnits - inUnits);
        currentBalanceTotal = Math.max(0, round2(currentBalanceTotal - inTotal));
        currentBalanceUnitCost = currentBalanceUnits > 0 ? round4(currentBalanceTotal / currentBalanceUnits) : 0;

        // Reducir capas
        let rem = inUnits;
        for (let i = layers.length - 1; i >= 0 && rem > 0; i--) {
          const take = Math.min(layers[i].units, rem);
          layers[i].units -= take;
          rem -= take;
        }
        layers = layers.filter(l => l.units > 0);
      } else {
        // Entrada normal (Compra o Existencia Inicial)
        inTotal = round2(inUnits * inUnitPrice);
        currentBalanceUnits += inUnits;
        currentBalanceTotal = round2(currentBalanceTotal + inTotal);

        if (method === 'PPP') {
          currentBalanceUnitCost = currentBalanceUnits > 0 ? round4(currentBalanceTotal / currentBalanceUnits) : inUnitPrice;
        } else {
          currentBalanceUnitCost = currentBalanceUnits > 0 ? round4(currentBalanceTotal / currentBalanceUnits) : inUnitPrice;
          layers.push({ units: inUnits, unitCost: inUnitPrice });
        }
      }

      outUnits = 0;
      outUnitPrice = 0;
      outTotal = 0;
    }
    // 2. Manejo de Salida (Venta, Devolución de venta)
    else {
      inUnits = 0;
      inUnitPrice = 0;
      inTotal = 0;

      if (isDevVenta) {
        // Devolución de venta: reingreso a stock restando en salida
        const restoreCost = outUnitPrice > 0 ? outUnitPrice : currentBalanceUnitCost;
        outTotal = round2(outUnits * restoreCost);
        currentBalanceUnits += outUnits;
        currentBalanceTotal = round2(currentBalanceTotal + outTotal);
        currentBalanceUnitCost = currentBalanceUnits > 0 ? round4(currentBalanceTotal / currentBalanceUnits) : restoreCost;

        layers.unshift({ units: outUnits, unitCost: restoreCost });
      } else {
        // Venta estándar según el método
        if (method === 'PPP') {
          // PPP: Se valúa al costo promedio móvil vigente inmediatamente antes de la venta
          outUnitPrice = currentBalanceUnitCost;
          outTotal = round2(outUnits * outUnitPrice);

          currentBalanceUnits = Math.max(0, currentBalanceUnits - outUnits);
          currentBalanceTotal = Math.max(0, round2(currentBalanceTotal - outTotal));
          currentBalanceUnitCost = currentBalanceUnits > 0 ? currentBalanceUnitCost : 0;

          costLayersConsumed.push({
            units: outUnits,
            unitCost: outUnitPrice,
            subtotal: outTotal
          });
        } 
        else if (method === 'PEPS') {
          // PEPS: Primero Entrado, Primero Salido (capas más antiguas primero)
          let remToTake = outUnits;
          let calculatedOutTotal = 0;

          for (const layer of layers) {
            if (layer.units <= 0 || remToTake <= 0) continue;
            const take = Math.min(layer.units, remToTake);
            const sub = round2(take * layer.unitCost);
            layer.units -= take;
            remToTake -= take;
            calculatedOutTotal = round2(calculatedOutTotal + sub);

            costLayersConsumed.push({
              units: take,
              unitCost: layer.unitCost,
              subtotal: sub
            });
          }

          layers = layers.filter(l => l.units > 0);
          outTotal = calculatedOutTotal;
          outUnitPrice = outUnits > 0 ? round4(outTotal / outUnits) : 0;

          currentBalanceUnits = Math.max(0, currentBalanceUnits - outUnits);
          currentBalanceTotal = Math.max(0, round2(currentBalanceTotal - outTotal));
          currentBalanceUnitCost = currentBalanceUnits > 0 ? round4(currentBalanceTotal / currentBalanceUnits) : 0;
        } 
        else if (method === 'UEPS') {
          // UEPS: Último Entrado, Primero Salido (capas más recientes primero)
          let remToTake = outUnits;
          let calculatedOutTotal = 0;

          for (let i = layers.length - 1; i >= 0 && remToTake > 0; i--) {
            const layer = layers[i];
            if (layer.units <= 0) continue;
            const take = Math.min(layer.units, remToTake);
            const sub = round2(take * layer.unitCost);
            layer.units -= take;
            remToTake -= take;
            calculatedOutTotal = round2(calculatedOutTotal + sub);

            costLayersConsumed.push({
              units: take,
              unitCost: layer.unitCost,
              subtotal: sub
            });
          }

          layers = layers.filter(l => l.units > 0);
          outTotal = calculatedOutTotal;
          outUnitPrice = outUnits > 0 ? round4(outTotal / outUnits) : 0;

          currentBalanceUnits = Math.max(0, currentBalanceUnits - outUnits);
          currentBalanceTotal = Math.max(0, round2(currentBalanceTotal - outTotal));
          currentBalanceUnitCost = currentBalanceUnits > 0 ? round4(currentBalanceTotal / currentBalanceUnits) : 0;
        } 
        else {
          // Identificación Específica: si usuario ingresó precio unitario manual lo respeta, sino costo actual
          const uCost = row.outUnitPrice > 0 ? row.outUnitPrice : currentBalanceUnitCost;
          outUnitPrice = uCost;
          outTotal = round2(outUnits * outUnitPrice);

          currentBalanceUnits = Math.max(0, currentBalanceUnits - outUnits);
          currentBalanceTotal = Math.max(0, round2(currentBalanceTotal - outTotal));
          currentBalanceUnitCost = currentBalanceUnits > 0 ? round4(currentBalanceTotal / currentBalanceUnits) : 0;

          costLayersConsumed.push({
            units: outUnits,
            unitCost: outUnitPrice,
            subtotal: outTotal
          });
        }
      }
    }

    balanceUnits = currentBalanceUnits;
    balanceTotal = currentBalanceTotal;
    balanceUnitPrice = currentBalanceUnitCost;

    return {
      ...row,
      inUnits,
      inUnitPrice,
      inTotal,
      outUnits,
      outUnitPrice,
      outTotal,
      balanceUnits,
      balanceUnitPrice,
      balanceTotal,
      costLayersConsumed
    };
  });
}
