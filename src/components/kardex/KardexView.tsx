import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Layers, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Sparkles, 
  Package, 
  ArrowRight,
  Printer,
  History
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/currency';
import { exportKardexToCSV } from '../../utils/exporter';

export const KardexView: React.FC = () => {
  const { 
    activeExercise, 
    activeProductId, 
    setActiveProductId, 
    activeMethod, 
    setActiveMethod,
    inventoryCalculation 
  } = useAccounting();

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const selectedProduct = activeExercise.products.find(p => p.id === activeProductId) || activeExercise.products[0];
  const productState = selectedProduct ? inventoryCalculation.productStates.get(selectedProduct.id) : null;
  const kardexRows = productState?.kardex || [];

  const handleDownloadCSV = () => {
    if (selectedProduct && kardexRows.length > 0) {
      exportKardexToCSV(kardexRows, `Kardex_${selectedProduct.code}_${activeMethod}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleExpand = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  if (!selectedProduct) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
        <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No hay productos en este ejercicio</h3>
        <p className="text-xs text-slate-500">Crea un producto primero para ver su Ficha de Stock Permanente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Barra de Control: Selector de Producto, Método y Exportación */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        {/* Selector de Producto */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-mono">Ficha de Stock Permanente</label>
            <select
              value={selectedProduct.id}
              onChange={(e) => setActiveProductId(e.target.value)}
              className="mt-0.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
            >
              {activeExercise.products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name} ({p.unitOfMeasure})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Método Activo y Acciones */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['PEPS', 'UEPS', 'PPP', 'ESPECIFICA'] as const).map(m => (
              <button
                key={m}
                onClick={() => setActiveMethod(m)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  activeMethod === m 
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Descargar Ficha en CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition no-print"
            title="Imprimir Ficha"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Imprimir</span>
          </button>
        </div>

      </div>

      {/* Tarjeta de Resumen del Producto para este método */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Stock Disponible</span>
          <div className="text-lg font-bold text-white font-mono mt-0.5">
            {formatQuantity(productState?.endingUnits)} {selectedProduct.unitOfMeasure}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Valuación Existencias</span>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
            {formatCurrency(productState?.endingCost)}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono">CMV Total ({activeMethod})</span>
          <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
            {formatCurrency(productState?.totalCMV)}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Capas Activas Vigentes</span>
          <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
            {productState?.activeLayers.length || 0} capa(s)
          </div>
        </div>
      </div>

      {/* Tabla Oficial de Inventario Permanente (Kardex) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          {/* Encabezado Doble Nivel Contable */}
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800 text-[11px]">
              <th colSpan={4} className="py-2.5 px-3 border-r border-slate-800 text-center bg-slate-950/80">
                Información de la Operación
              </th>
              <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-center bg-blue-950/20 text-blue-300">
                Entradas (Incorporaciones)
              </th>
              <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-center bg-rose-950/20 text-rose-300">
                Salidas (CMV)
              </th>
              <th colSpan={3} className="py-2.5 px-3 text-center bg-emerald-950/20 text-emerald-300">
                Existencias (Saldos Permanentes)
              </th>
              <th className="py-2.5 px-2 text-center bg-slate-950">Info</th>
            </tr>
            <tr className="bg-slate-950/90 text-slate-400 text-[10px] font-mono border-b border-slate-800 uppercase">
              <th className="py-2 px-3">Fecha</th>
              <th className="py-2 px-3">Comprobante</th>
              <th className="py-2 px-3">Detalle</th>
              <th className="py-2 px-2 border-r border-slate-800">Tipo</th>

              {/* Entradas */}
              <th className="py-2 px-2.5 text-right bg-blue-950/10">Cant.</th>
              <th className="py-2 px-2.5 text-right bg-blue-950/10">Costo Unit.</th>
              <th className="py-2 px-2.5 text-right border-r border-slate-800 bg-blue-950/10 font-bold text-blue-300">Total</th>

              {/* Salidas */}
              <th className="py-2 px-2.5 text-right bg-rose-950/10">Cant.</th>
              <th className="py-2 px-2.5 text-right bg-rose-950/10">Costo Unit.</th>
              <th className="py-2 px-2.5 text-right border-r border-slate-800 bg-rose-950/10 font-bold text-rose-300">Total</th>

              {/* Existencias */}
              <th className="py-2 px-2.5 text-right bg-emerald-950/10">Cant.</th>
              <th className="py-2 px-2.5 text-right bg-emerald-950/10">Costo Unit.</th>
              <th className="py-2 px-2.5 text-right bg-emerald-950/10 font-bold text-emerald-300">Total</th>

              <th className="py-2 px-2 text-center">Capas</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 text-xs">
            {kardexRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-slate-500 font-sans">
                  No hay movimientos registrados para este producto.
                </td>
              </tr>
            ) : (
              kardexRows.map((row) => {
                const isExpanded = expandedRowId === row.id;
                const hasDetails = (row.consumedLayers && row.consumedLayers.length > 0) || row.pppCalculationFormula;

                return (
                  <React.Fragment key={row.id}>
                    <tr className={`hover:bg-slate-800/40 transition ${isExpanded ? 'bg-indigo-950/20' : ''}`}>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{formatDate(row.date)}</td>
                      <td className="py-2.5 px-3 text-white font-medium whitespace-nowrap">{row.voucherNumber}</td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate font-sans">{row.detail}</td>
                      <td className="py-2.5 px-2 border-r border-slate-800 text-[10px] text-slate-400">
                        {row.type}
                      </td>

                      {/* Entradas */}
                      <td className="py-2.5 px-2.5 text-right text-blue-200">
                        {row.inQuantity ? formatQuantity(row.inQuantity) : '-'}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-slate-400">
                        {row.inUnitCost ? formatCurrency(row.inUnitCost) : '-'}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-blue-300 border-r border-slate-800">
                        {row.inTotalCost ? formatCurrency(row.inTotalCost) : '-'}
                      </td>

                      {/* Salidas */}
                      <td className="py-2.5 px-2.5 text-right text-rose-200">
                        {row.outQuantity ? formatQuantity(row.outQuantity) : '-'}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-slate-400">
                        {row.outUnitCost ? formatCurrency(row.outUnitCost) : '-'}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-rose-300 border-r border-slate-800">
                        {row.outTotalCost ? formatCurrency(row.outTotalCost) : '-'}
                      </td>

                      {/* Existencias */}
                      <td className="py-2.5 px-2.5 text-right font-bold text-white">
                        {formatQuantity(row.balanceQuantity)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-slate-300">
                        {formatCurrency(row.balanceUnitCost)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-emerald-400">
                        {formatCurrency(row.balanceTotalCost)}
                      </td>

                      {/* Botón de Expansión Didáctica */}
                      <td className="py-2.5 px-2 text-center">
                        {hasDetails ? (
                          <button
                            onClick={() => toggleExpand(row.id)}
                            className="p-1 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition"
                            title="Ver desglose pedagógico de capas o fórmula"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Fila Expandida: Desglose de Capas Consumidas o Fórmula PPP */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80 border-y border-indigo-900/40">
                        <td colSpan={14} className="p-4">
                          <div className="space-y-3 font-sans">
                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              <span>Explicación Paso a Paso del Movimiento ({activeMethod})</span>
                            </div>

                            {/* Si es PPP y tiene fórmula */}
                            {row.pppCalculationFormula && (
                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
                                <span className="text-slate-400 font-sans block text-[11px] mb-1">Fórmula aplicada para el costo promedio ponderado móvil:</span>
                                {row.pppCalculationFormula}
                              </div>
                            )}

                            {/* Desglose de Capas Consumidas (PEPS / UEPS / Específica) */}
                            {row.consumedLayers && row.consumedLayers.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-xs text-slate-400 font-medium">Capas de inventario consumidas para determinar el CMV de esta salida:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {row.consumedLayers.map((layer, idx) => (
                                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                                      <div className="text-slate-400 flex items-center justify-between">
                                        <span>Tramo #{idx + 1} ({formatDate(layer.date)})</span>
                                        <span className="text-[10px] text-indigo-400 font-mono">{layer.layerId}</span>
                                      </div>
                                      <div className="font-mono text-white flex items-center justify-between">
                                        <span>{layer.quantity} un. × {formatCurrency(layer.unitCost)}</span>
                                        <span className="font-bold text-rose-300">{formatCurrency(layer.subtotal)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Snapshot de Capas Remanentes */}
                            {row.activeLayersSnapshot && row.activeLayersSnapshot.length > 0 && (
                              <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
                                <span>Capas remanentes en stock tras esta operación:</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {row.activeLayersSnapshot.map((l, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                                      {l.availableQuantity} un. a {formatCurrency(l.unitCost)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
