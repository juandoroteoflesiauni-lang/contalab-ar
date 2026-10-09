import React from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Receipt, 
  Layers, 
  ArrowUpRight, 
  PlusCircle, 
  BarChart3, 
  Sparkles,
  Percent,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/currency';
import { ActiveTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewOperation: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewOperation
}) => {
  const { 
    activeExercise, 
    activeMethod, 
    inventoryCalculation, 
    methodComparisons,
    trialBalance
  } = useAccounting();

  // Métricas agregadas
  let totalUnitsAvailable = 0;
  inventoryCalculation.productStates.forEach(p => {
    totalUnitsAvailable += p.endingUnits;
  });

  const grossProfit = inventoryCalculation.grossProfit;
  const grossMargin = inventoryCalculation.totalExerciseSales > 0 
    ? (grossProfit / inventoryCalculation.totalExerciseSales) * 100 
    : 0;

  // Comparativa de CMV con los otros métodos para el insight box
  const pepsComp = methodComparisons.find(m => m.method === 'PEPS');
  const uepsComp = methodComparisons.find(m => m.method === 'UEPS');
  const pppComp = methodComparisons.find(m => m.method === 'PPP');

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Acción Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Método Activo: {activeMethod}
            </span>
            <span className="text-xs text-slate-400">
              Período: {formatDate(activeExercise.startDate)} - {formatDate(activeExercise.endDate)}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Panel de Control Contable
          </h2>
          <p className="text-sm text-slate-400 max-w-xl">
            Monitoreo en tiempo real de inventarios, costo de mercaderías vendidas (CMV), rentabilidad bruta y partidas contables según normas argentinas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewOperation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Operación</span>
          </button>
          <button
            onClick={() => onNavigateTab('kardex')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Ver Kardex</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Principales (8 Indicadores obligatorios) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Valor Total del Inventario */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition shadow-sm group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Inventario Final</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(inventoryCalculation.totalExerciseEndingInventory)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>{formatQuantity(totalUnitsAvailable)} unidades disponibles</span>
            <span className="text-cyan-400 font-medium">{activeMethod}</span>
          </div>
        </div>

        {/* 2. Ventas Acumuladas */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition shadow-sm group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Ventas Totales</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
            {formatCurrency(inventoryCalculation.totalExerciseSales)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Ingreso por ventas</span>
            <span className="text-emerald-500/80 font-medium">Cuenta 4.1.01</span>
          </div>
        </div>

        {/* 3. Costo de Mercaderías Vendidas (CMV) */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition shadow-sm group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">CMV Acumulado</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight">
            {formatCurrency(inventoryCalculation.totalExerciseCMV)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Costo de salidas</span>
            <span className="text-rose-400 font-medium">Cuenta 5.1.01</span>
          </div>
        </div>

        {/* 4. Resultado Bruto */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition shadow-sm group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Resultado Bruto</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${grossProfit >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
            {formatCurrency(grossProfit)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Margen: {grossMargin.toFixed(1)}%</span>
            <span className="text-indigo-400 font-medium">Ventas - CMV</span>
          </div>
        </div>

        {/* 5. Compras Acumuladas */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Compras Acumuladas</span>
            <ShoppingCart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatCurrency(inventoryCalculation.totalExercisePurchases)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Incorporaciones brutas al activo
          </div>
        </div>

        {/* 6. Unidades en Inventario */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Stock Físico</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatQuantity(totalUnitsAvailable)} un.
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Saldo de existencias actual
          </div>
        </div>

        {/* 7. Productos Registrados */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Catálogo Activo</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {activeExercise.products.length} productos
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Fichas de stock permanente
          </div>
        </div>

        {/* 8. Cantidad de Operaciones */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Operaciones</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {activeExercise.operations.length} asientos
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Comprobantes procesados
          </div>
        </div>

      </div>

      {/* Sección Gráfica y Resumen Económico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Comparativa Didáctica Instantánea de Métodos */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Impacto del Método de Valuación en el CMV y Resultado
              </h3>
              <p className="text-xs text-slate-400">
                Comparación directa de los cuatro métodos sobre las mismas operaciones de este ejercicio
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('comparator')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Ver matriz completa <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {methodComparisons.map((m) => {
              const isCurrent = activeMethod === m.method;
              const maxVal = Math.max(...methodComparisons.map(x => x.totalCMV || 1));
              const cmvPercent = maxVal > 0 ? (m.totalCMV / maxVal) * 100 : 0;

              return (
                <div 
                  key={m.method}
                  className={`p-3.5 rounded-xl border transition ${
                    isCurrent 
                      ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm' 
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{m.method}</span>
                      <span className="text-slate-400 text-[11px] hidden sm:inline">{m.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-semibold border border-indigo-500/30">
                          SELECCIONADO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-slate-400">CMV: <strong className="text-rose-400">{formatCurrency(m.totalCMV)}</strong></span>
                      <span className="text-slate-400">R. Bruto: <strong className="text-emerald-400">{formatCurrency(m.grossProfit)}</strong></span>
                    </div>
                  </div>

                  {/* Barra comparativa visual */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.method === 'PEPS' ? 'bg-blue-500' :
                        m.method === 'UEPS' ? 'bg-amber-500' :
                        m.method === 'PPP' ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.max(cmvPercent, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Efecto Inflacionario Clave:</strong>
              {' '}En períodos de aumentos constantes de precios de compra, <strong>PEPS</strong> genera el CMV más bajo (mayor ganancia bruta e inventario final a valores más actuales), mientras que <strong>UEPS</strong> reporta el mayor CMV (menor utilidad bruta). <strong>PPP</strong> amortigua el efecto ubicándose en el punto medio.
            </div>
          </div>
        </div>

        {/* Columna Derecha: Estado de Partida Doble y Acciones */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Auditoría del Libro Diario
            </h3>
            <p className="text-xs text-slate-400">
              Verificación matemática de balance en partida doble
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Sumas al Debe:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(trialBalance.totalDebitSum)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Sumas al Haber:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(trialBalance.totalCreditSum)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Diferencia Contable:</span>
                <span className={`font-mono font-bold ${trialBalance.sumsDifference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(trialBalance.sumsDifference)}
                </span>
              </div>
            </div>

            <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              trialBalance.isSumsBalanced 
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' 
                : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
            }`}>
              <div className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />
              <span>
                {trialBalance.isSumsBalanced 
                  ? 'Libro Diario perfectamente balanceado (Debe = Haber).' 
                  : 'Existe un descuadre en los asientos contables.'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigateTab('journal')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <span>Consultar Asientos en Libro Diario</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button
              onClick={() => onNavigateTab('trialBalance')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <span>Ver Balance de Sumas y Saldos</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Tabla Resumen de Últimas Operaciones */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-400" />
              Últimas Operaciones Comerciales
            </h3>
            <p className="text-xs text-slate-400">
              Comprobantes registrados en el ejercicio
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('operations')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            Ver todas ({activeExercise.operations.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeExercise.operations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No hay operaciones registradas aún. Haz clic en "Nueva Operación" para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Comprobante</th>
                  <th className="py-2.5 px-3">Contraparte</th>
                  <th className="py-2.5 px-3">Medio de Pago</th>
                  <th className="py-2.5 px-3 text-right">Importe Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {activeExercise.operations.slice(-5).reverse().map((op) => {
                  const total = op.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

                  const badgeColors: Record<string, string> = {
                    COMPRA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    VENTA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    DEVOLUCION_COMPRA: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    DEVOLUCION_VENTA: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    AJUSTE_FALTANTE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    AJUSTE_SOBRANTE: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                    APERTURA: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
                  };

                  return (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{formatDate(op.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColors[op.type] || 'bg-slate-800 text-slate-400'}`}>
                          {op.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-white">
                        {op.voucherType} Nº {op.voucherNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{op.counterpart}</td>
                      <td className="py-2.5 px-3 text-slate-400">{op.paymentMethod.replace(/_/g, ' ')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
