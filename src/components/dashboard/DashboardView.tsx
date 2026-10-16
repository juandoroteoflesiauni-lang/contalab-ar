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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#111113]/70 backdrop-blur-md p-6 rounded-2xl border border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/[0.15]">
              Método Activo: {activeMethod}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Período: {formatDate(activeExercise.startDate)} - {formatDate(activeExercise.endDate)}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Panel de Control Contable
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed mt-1">
            Monitoreo en tiempo real de inventarios, costo de mercaderías vendidas (CMV), rentabilidad bruta y partidas contables según normas argentinas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewOperation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-semibold text-xs tracking-tight transition duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>Nueva Operación</span>
          </button>
          <button
            onClick={() => onNavigateTab('kardex')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 font-medium text-xs border border-white/[0.1] transition duration-200"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Ver Kardex</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Principales (8 Indicadores obligatorios) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Valor Total del Inventario */}
        <div className="p-4 rounded-xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 shadow-sm group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Inventario Final</span>
            <div className="p-2 rounded-lg bg-white/[0.05] text-slate-300 group-hover:text-white transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(inventoryCalculation.totalExerciseEndingInventory)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>{formatQuantity(totalUnitsAvailable)} unidades</span>
            <span className="text-slate-300 font-mono text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">{activeMethod}</span>
          </div>
        </div>

        {/* 2. Ventas Acumuladas */}
        <div className="p-4 rounded-xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 shadow-sm group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ventas Totales</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(inventoryCalculation.totalExerciseSales)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Ingreso por ventas</span>
            <span className="text-emerald-400/90 font-mono text-[10px]">Cta. 4.1.01</span>
          </div>
        </div>

        {/* 3. Costo de Mercaderías Vendidas (CMV) */}
        <div className="p-4 rounded-xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 shadow-sm group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">CMV Acumulado</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-105 transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(inventoryCalculation.totalExerciseCMV)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Costo de salidas</span>
            <span className="text-rose-400/90 font-mono text-[10px]">Cta. 5.1.01</span>
          </div>
        </div>

        {/* 4. Resultado Bruto */}
        <div className="p-4 rounded-xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 shadow-sm group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Resultado Bruto</span>
            <div className="p-2 rounded-lg bg-white/[0.06] text-slate-200 group-hover:scale-105 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${grossProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatCurrency(grossProfit)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Margen: <strong className="text-slate-200 font-mono">{grossMargin.toFixed(1)}%</strong></span>
            <span className="text-slate-400 font-mono text-[10px]">Ventas - CMV</span>
          </div>
        </div>

        {/* 5. Compras Acumuladas */}
        <div className="p-4 rounded-xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Compras Acumuladas</span>
            <div className="p-2 rounded-lg bg-white/[0.05] text-slate-300">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatCurrency(inventoryCalculation.totalExercisePurchases)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Incorporaciones brutas
          </div>
        </div>

        {/* 6. Unidades en Inventario */}
        <div className="p-4 rounded-xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Stock Físico</span>
            <div className="p-2 rounded-lg bg-white/[0.05] text-slate-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatQuantity(totalUnitsAvailable)} un.
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Existencias en almacén
          </div>
        </div>

        {/* 7. Productos Registrados */}
        <div className="p-4 rounded-xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Catálogo Activo</span>
            <div className="p-2 rounded-lg bg-white/[0.05] text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {activeExercise.products.length} productos
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Fichas permanentes
          </div>
        </div>

        {/* 8. Cantidad de Operaciones */}
        <div className="p-4 rounded-xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.15] transition-all duration-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Operaciones</span>
            <div className="p-2 rounded-lg bg-white/[0.05] text-slate-300">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {activeExercise.operations.length} asientos
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Comprobantes registrados
          </div>
        </div>

      </div>

      {/* Sección Gráfica y Resumen Económico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Comparativa Didáctica Instantánea de Métodos */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.08] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-300" />
                Impacto del Método de Valuación en el CMV y Resultado
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparación directa de los cuatro métodos sobre las mismas operaciones de este ejercicio
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('comparator')}
              className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition"
            >
              Ver matriz completa <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {methodComparisons.map((m) => {
              const isCurrent = activeMethod === m.method;
              const maxVal = Math.max(...methodComparisons.map(x => x.totalCMV || 1));
              const cmvPercent = maxVal > 0 ? (m.totalCMV / maxVal) * 100 : 0;

              return (
                <div 
                  key={m.method}
                  className={`p-3.5 rounded-xl border transition-all duration-200 ${
                    isCurrent 
                      ? 'bg-white/[0.08] border-white/[0.2] shadow-sm' 
                      : 'bg-black/30 border-white/[0.05] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{m.method}</span>
                      <span className="text-slate-400 text-[11px] hidden sm:inline">{m.name}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-white text-black rounded font-bold font-mono tracking-wider uppercase">
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span className="text-slate-400">CMV: <strong className="text-rose-400 font-semibold">{formatCurrency(m.totalCMV)}</strong></span>
                      <span className="text-slate-400">R. Bruto: <strong className="text-emerald-400 font-semibold">{formatCurrency(m.grossProfit)}</strong></span>
                    </div>
                  </div>

                  {/* Barra comparativa visual sobria */}
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCurrent ? 'bg-white' : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.max(cmvPercent, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-slate-400 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-slate-200 font-medium">Efecto Inflacionario Clave:</strong>
              {' '}En períodos de aumentos constantes de precios de compra, <strong>PEPS</strong> genera el CMV más bajo (mayor ganancia bruta e inventario final a valores más actuales), mientras que <strong>UEPS</strong> reporta el mayor CMV (menor utilidad bruta). <strong>PPP</strong> amortigua el efecto ubicándose en el punto medio.
            </div>
          </div>
        </div>

        {/* Columna Derecha: Estado de Partida Doble y Acciones */}
        <div className="p-5 rounded-2xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.08] shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
              <Receipt className="w-4 h-4 text-slate-300" />
              Auditoría del Libro Diario
            </h3>
            <p className="text-xs text-slate-400">
              Verificación matemática de balance en partida doble
            </p>

            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Sumas al Debe:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(trialBalance.totalDebitSum)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Sumas al Haber:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(trialBalance.totalCreditSum)}</span>
              </div>
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Diferencia Contable:</span>
                <span className={`font-mono font-bold ${trialBalance.sumsDifference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(trialBalance.sumsDifference)}
                </span>
              </div>
            </div>

            <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              trialBalance.isSumsBalanced 
                ? 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-300' 
                : 'bg-rose-500/[0.08] border-rose-500/25 text-rose-300'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
              <span className="text-[11px] leading-relaxed">
                {trialBalance.isSumsBalanced 
                  ? 'Libro Diario perfectamente balanceado (Debe = Haber).' 
                  : 'Existe un descuadre en los asientos contables.'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/[0.06]">
            <button
              onClick={() => onNavigateTab('journal')}
              className="w-full py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium flex items-center justify-center gap-2 border border-white/[0.08] transition"
            >
              <span>Consultar Asientos en Libro Diario</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigateTab('trialBalance')}
              className="w-full py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium flex items-center justify-center gap-2 border border-white/[0.08] transition"
            >
              <span>Ver Balance de Sumas y Saldos</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Tabla Resumen de Últimas Operaciones */}
      <div className="p-5 rounded-2xl bg-[#111113]/70 backdrop-blur-md border border-white/[0.08] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-300" />
              Últimas Operaciones Comerciales
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprobantes registrados en el ejercicio
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('operations')}
            className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition"
          >
            Ver todas ({activeExercise.operations.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeExercise.operations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No hay operaciones registradas aún. Haz clic en "Nueva Operación" para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Fecha</th>
                  <th className="py-2.5 px-3 font-semibold">Tipo</th>
                  <th className="py-2.5 px-3 font-semibold">Comprobante</th>
                  <th className="py-2.5 px-3 font-semibold">Contraparte</th>
                  <th className="py-2.5 px-3 font-semibold">Medio de Pago</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Importe Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-slate-300">
                {activeExercise.operations.slice(-5).reverse().map((op) => {
                  const total = op.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

                  const badgeColors: Record<string, string> = {
                    COMPRA: 'bg-white/[0.06] text-slate-200 border-white/[0.12]',
                    VENTA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    DEVOLUCION_COMPRA: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    DEVOLUCION_VENTA: 'bg-white/[0.06] text-slate-300 border-white/[0.12]',
                    AJUSTE_FALTANTE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    AJUSTE_SOBRANTE: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                    APERTURA: 'bg-white/[0.04] text-slate-400 border-white/[0.08]',
                  };

                  return (
                    <tr key={op.id} className="hover:bg-white/[0.03] transition-colors duration-150">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{formatDate(op.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${badgeColors[op.type] || 'bg-white/[0.05] text-slate-400 border-white/[0.08]'}`}>
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
