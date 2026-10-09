import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Download, 
  HelpCircle, 
  RotateCcw, 
  FolderGit2, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { ValuationMethod } from '../../types/accounting';
import { formatCurrency } from '../../utils/currency';

interface HeaderProps {
  onOpenExercises: () => void;
  onOpenExport: () => void;
  onOpenStudyMode: () => void;
  onOpenTests: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExercises,
  onOpenExport,
  onOpenStudyMode,
  onOpenTests
}) => {
  const { 
    activeExercise, 
    activeMethod, 
    setActiveMethod, 
    inventoryCalculation,
    trialBalance
  } = useAccounting();

  const methods: { id: ValuationMethod; label: string; badge: string; color: string }[] = [
    { id: 'PEPS', label: 'PEPS (FIFO)', badge: '1º Entrado, 1º Salido', color: 'from-blue-600 to-cyan-600' },
    { id: 'UEPS', label: 'UEPS (LIFO)', badge: 'Último Entrado, 1º Salido', color: 'from-amber-600 to-orange-600' },
    { id: 'PPP', label: 'PPP (Promedio)', badge: 'Precio Promedio Ponderado', color: 'from-emerald-600 to-teal-600' },
    { id: 'ESPECIFICA', label: 'Específica', badge: 'Identificación Directa', color: 'from-purple-600 to-indigo-600' },
  ];

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 lg:px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Lado Izquierdo: Info de Ejercicio y Empresa */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                ContaLab AR
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  SIC Universitario
                </span>
              </h1>
              <span className="text-slate-600">•</span>
              <button 
                onClick={onOpenExercises}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition border border-slate-700 font-medium"
                title="Cambiar o gestionar ejercicios"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="max-w-[200px] truncate">{activeExercise.name}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {activeExercise.companyName} {activeExercise.cuit ? `(CUIT ${activeExercise.cuit})` : ''}
            </p>
          </div>
        </div>

        {/* Centro: Selector rápido de método de valuación */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 overflow-x-auto">
          {methods.map(m => {
            const isActive = activeMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMethod(m.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive 
                    ? `bg-gradient-to-r ${m.color} text-white shadow-md shadow-black/40 font-semibold` 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={m.badge}
              >
                <Layers className="w-3 h-3" />
                <span>{m.label}</span>
                {m.id === 'UEPS' && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-amber-200 uppercase font-mono">
                    académico
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lado Derecho: Indicadores de cuadre y botones de acción */}
        <div className="flex items-center gap-2">
          {/* Indicador de partida doble */}
          <div 
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              trialBalance.isSumsBalanced 
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' 
                : 'bg-rose-950/40 text-rose-400 border-rose-800/50 animate-pulse'
            }`}
            title={trialBalance.isSumsBalanced ? 'Libro Diario cuadrado (Debe = Haber)' : 'Diferencia en partida doble'}
          >
            {trialBalance.isSumsBalanced ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Partida Doble: Cuadrada</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Descuadre: ${trialBalance.sumsDifference.toFixed(2)}</span>
              </>
            )}
          </div>

          {/* Botón Auditoría / Tests */}
          <button
            onClick={onOpenTests}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition shadow-sm"
            title="Verificar suite de pruebas contables"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Auditoría</span>
          </button>

          {/* Botón Modo Estudio */}
          <button
            onClick={onOpenStudyMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition shadow-sm"
            title="Explicación didáctica paso a paso de operaciones"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Modo Estudio</span>
          </button>

          {/* Botón Exportar */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 text-xs font-medium border border-emerald-500/30 transition shadow-sm"
            title="Exportar a Excel, CSV o PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>

      </div>

      {/* Advertencia Pedagógica cuando UEPS está activo */}
      {activeMethod === 'UEPS' && (
        <div className="mt-2 text-xs py-1.5 px-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Aviso Académico (UEPS/LIFO):</strong> Este método se incluye exclusivamente con fines de estudio comparativo. En Argentina, la <strong>RT 17 FACPCE</strong> y las <strong>NIIF (NIC 2)</strong> no admiten UEPS por distorsionar la valuación del inventario final en contextos inflacionarios.
            </span>
          </div>
          <button 
            onClick={() => setActiveMethod('PEPS')}
            className="underline hover:text-amber-100 font-medium shrink-0 text-[11px]"
          >
            Cambiar a PEPS
          </button>
        </div>
      )}
    </header>
  );
};
