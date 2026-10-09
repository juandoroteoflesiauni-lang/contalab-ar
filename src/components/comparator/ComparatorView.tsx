import React from 'react';
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  Info,
  Scale,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency, formatQuantity } from '../../utils/currency';

export const ComparatorView: React.FC = () => {
  const { 
    methodComparisons, 
    activeMethod, 
    setActiveMethod,
    activeExercise
  } = useAccounting();

  // Encontrar valores máximos y mínimos para resaltar
  const cmvValues = methodComparisons.map(m => m.totalCMV);
  const minCMV = Math.min(...cmvValues);
  const maxCMV = Math.max(...cmvValues);

  const profitValues = methodComparisons.map(m => m.grossProfit);
  const maxProfit = Math.max(...profitValues);
  const minProfit = Math.min(...profitValues);

  const endingInvValues = methodComparisons.map(m => m.endingInventoryValue);
  const maxEndingInv = Math.max(...endingInvValues);
  const minEndingInv = Math.min(...endingInvValues);

  return (
    <div className="space-y-6">
      
      {/* Cabecera */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Simulador Multimétodo 4 en 1
          </span>
          <span className="text-xs text-slate-400">
            {activeExercise.companyName}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-indigo-400" />
          Matriz Comparativa de Métodos de Valuación
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">
          Análisis del impacto financiero y patrimonial de valuar el mismo conjunto de operaciones por 
          <strong> PEPS (FIFO)</strong>, <strong>UEPS (LIFO)</strong>, <strong>PPP (Móvil)</strong> e <strong>Identificación Específica</strong>.
        </p>
      </div>

      {/* Matriz 4 Columnas Lado a Lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {methodComparisons.map((item) => {
          const isSelected = activeMethod === item.method;
          const isLowestCMV = item.totalCMV === minCMV && minCMV !== maxCMV;
          const isHighestCMV = item.totalCMV === maxCMV && minCMV !== maxCMV;
          const isHighestProfit = item.grossProfit === maxProfit && maxProfit !== minProfit;
          const isHighestEnding = item.endingInventoryValue === maxEndingInv && maxEndingInv !== minEndingInv;

          const methodColor = 
            item.method === 'PEPS' ? 'border-blue-500/50 bg-blue-950/10' :
            item.method === 'UEPS' ? 'border-amber-500/50 bg-amber-950/10' :
            item.method === 'PPP' ? 'border-emerald-500/50 bg-emerald-950/10' :
            'border-purple-500/50 bg-purple-950/10';

          return (
            <div
              key={item.method}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-lg relative ${
                isSelected 
                  ? `${methodColor} ring-2 ring-indigo-500 shadow-indigo-500/10` 
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-lg font-black text-white tracking-tight">
                      {item.method}
                    </span>
                    <div className="text-[11px] text-slate-400 line-clamp-1 font-medium">
                      {item.method === 'PEPS' && 'FIFO - 1º Entrado, 1º Salido'}
                      {item.method === 'UEPS' && 'LIFO - Último Entrado, 1º Salido'}
                      {item.method === 'PPP' && 'Promedio Ponderado Móvil'}
                      {item.method === 'ESPECIFICA' && 'Costo Histórico Individual'}
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white shadow-sm">
                      ACTIVO
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveMethod(item.method)}
                      className="text-[11px] text-indigo-400 hover:text-white hover:underline font-medium"
                    >
                      Activar
                    </button>
                  )}
                </div>

                {/* Métricas Contables Clave */}
                <div className="space-y-3 pt-2 font-mono text-xs">
                  
                  {/* CMV */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-sans flex items-center justify-between">
                      <span>Costo Mercaderías (CMV)</span>
                      {isLowestCMV && <span className="text-emerald-400 text-[10px] font-bold font-mono">MENOR CMV</span>}
                      {isHighestCMV && <span className="text-rose-400 text-[10px] font-bold font-mono">MAYOR CMV</span>}
                    </div>
                    <div className="text-lg font-bold text-rose-400 mt-0.5">
                      {formatCurrency(item.totalCMV)}
                    </div>
                  </div>

                  {/* Resultado Bruto */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-sans flex items-center justify-between">
                      <span>Resultado Bruto</span>
                      {isHighestProfit && <span className="text-emerald-400 text-[10px] font-bold font-mono">MAYOR UTILIDAD</span>}
                    </div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">
                      {formatCurrency(item.grossProfit)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Margen: {item.grossMarginPercentage.toFixed(1)}%
                    </div>
                  </div>

                  {/* Inventario Final */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-sans flex items-center justify-between">
                      <span>Valuación Stock Final</span>
                      {isHighestEnding && <span className="text-cyan-400 text-[10px] font-bold font-mono">VALUACIÓN MÁS ALTA</span>}
                    </div>
                    <div className="text-lg font-bold text-cyan-400 mt-0.5">
                      {formatCurrency(item.endingInventoryValue)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                      {formatQuantity(item.endingInventoryUnits)} unidades
                    </div>
                  </div>

                </div>

                {/* Nota Pedagógica Breve */}
                <div className="mt-4 text-[11px] text-slate-400 leading-relaxed font-sans border-t border-slate-800/80 pt-3">
                  {item.pedagogicalNote}
                </div>
              </div>

              {/* Botón Seleccionar */}
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <button
                  onClick={() => setActiveMethod(item.method)}
                  disabled={isSelected}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition ${
                    isSelected 
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 cursor-default' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isSelected ? '✓ Método Activo' : `Aplicar ${item.method}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel Pedagógico Teórico: Comportamiento ante Inflación y Normas Contables */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Fundamentos Teóricos para el Estudiante de Contador Público (SIC)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
          
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-blue-300 flex items-center gap-1.5">
              <span>PEPS y la Inflación</span>
            </h4>
            <p>
              Al salir primero las unidades compradas más antiguas (a costos históricos más bajos), el <strong>CMV resulta menor</strong>. Esto arroja un <strong>Resultado Bruto mayor</strong> y un inventario final valuado a costos recientes, más cercanos al costo de reposición.
            </p>
            <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
              <strong>Efecto impositivo:</strong> Puede generar mayor impuesto a las ganancias nominal sobre utilidades por tenencia implícitas.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>UEPS y Normas Profesionales</span>
            </h4>
            <p>
              Al consumir las compras más caras y recientes, el <strong>CMV es mayor</strong> y la ganancia bruta disminuye. Sin embargo, el inventario final queda valuado a capas antiguas y desactualizadas.
            </p>
            <div className="text-[11px] text-amber-400 border-t border-slate-800/60 pt-2">
              <strong>Estado legal en Argentina:</strong> Prohibido por la <strong>RT 17 (FACPCE)</strong> y por las normas internacionales <strong>NIC 2 (IASB)</strong>.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>PPP y Neutralidad Operativa</span>
            </h4>
            <p>
              El Precio Promedio Ponderado móvil pondera cada nueva compra. Neutraliza los picos de precios, amortigua el impacto de compras atípicas y es computacionalmente más simple de auditar.
            </p>
            <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
              <strong>Uso habitual:</strong> Método de mayor adopción en sistemas ERP comerciales por su estabilidad y neutralidad contable.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
