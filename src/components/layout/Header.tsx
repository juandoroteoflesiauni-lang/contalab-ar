import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Download, 
  HelpCircle, 
  RotateCcw, 
  FolderGit2, 
  AlertTriangle,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { ValuationMethod } from '../../types/accounting';
import { formatCurrency } from '../../utils/currency';

interface HeaderProps {
  onOpenExercises: () => void;
  onOpenExport: () => void;
  onOpenStudyMode: () => void;
  onOpenTests: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExercises,
  onOpenExport,
  onOpenStudyMode,
  onOpenTests,
  isSidebarCollapsed,
  onToggleSidebarCollapse
}) => {
  const { 
    activeExercise, 
    activeMethod, 
    setActiveMethod, 
    inventoryCalculation,
    trialBalance
  } = useAccounting();

  const methods: { id: ValuationMethod; label: string; badge: string; color: string }[] = [
    { id: 'PEPS', label: 'PEPS (FIFO)', badge: '1º Entrado, 1º Salido', color: 'bg-white' },
    { id: 'UEPS', label: 'UEPS (LIFO)', badge: 'Último Entrado, 1º Salido', color: 'bg-white' },
    { id: 'PPP', label: 'PPP (Promedio)', badge: 'Precio Promedio Ponderado', color: 'bg-white' },
    { id: 'ESPECIFICA', label: 'Específica', badge: 'Identificación Directa', color: 'bg-white' },
  ];

  return (
    <header className="bg-[#0a0a0b]/80 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.06] sticky top-0 z-30 px-4 lg:px-6 py-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02),0_8px_24px_-12px_rgba(0,0,0,0.8)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Lado Izquierdo: Info de Ejercicio y Empresa */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebarCollapse && (
            <button
              onClick={onToggleSidebarCollapse}
              className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition duration-200"
              title={isSidebarCollapsed ? "Expandir barra lateral" : "Contraer barra lateral (aprovechar pantalla completa)"}
              aria-label={isSidebarCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}
          <div className="relative w-9 h-9 rounded-[10px] bg-gradient-to-b from-white to-slate-300 flex items-center justify-center text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_-6px_rgba(255,255,255,0.25)] shrink-0">
            <BookOpen className="w-[18px] h-[18px]" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
                ContaLab AR
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.08] font-medium tracking-wide uppercase">
                  SIC Universitario
                </span>
              </h1>
              <span className="text-slate-700">/</span>
              <button 
                onClick={onOpenExercises}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition duration-200 font-medium"
                title="Cambiar o gestionar ejercicios"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[200px] truncate">{activeExercise.name}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {activeExercise.companyName} {activeExercise.cuit ? `(CUIT ${activeExercise.cuit})` : ''}
            </p>
          </div>
        </div>

        {/* Centro: Selector rápido de método de valuación */}
        <div
          className="flex items-center gap-0.5 bg-black/50 p-1 rounded-xl border border-white/[0.07] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] overflow-x-auto"
          role="tablist"
          aria-label="Método de valuación"
        >
          {methods.map(m => {
            const isActive = activeMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMethod(m.id)}
                role="tab"
                aria-selected={isActive}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  isActive 
                    ? `${m.color} text-slate-950 font-semibold shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_4px_12px_-4px_rgba(0,0,0,0.9)]` 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
                }`}
                title={m.badge}
              >
                <Layers className={`w-3 h-3 ${isActive ? 'opacity-70' : 'opacity-50'}`} />
                <span>{m.label}</span>
                {m.id === 'UEPS' && (
                  <span className={`text-[9px] px-1 py-px rounded uppercase font-mono tracking-wide ${
                    isActive ? 'bg-slate-950/10 text-amber-800' : 'bg-amber-500/10 text-amber-300/90'
                  }`}>
                    académico
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lado Derecho: Indicadores de cuadre y botones de acción */}
        <div className="flex items-center gap-1.5">
          {/* Indicador de partida doble */}
          <div 
            className={`hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${
              trialBalance.isSumsBalanced 
                ? 'bg-emerald-500/[0.06] text-emerald-300 border-emerald-500/15' 
                : 'bg-rose-500/[0.08] text-rose-300 border-rose-500/25 animate-pulse'
            }`}
            title={trialBalance.isSumsBalanced ? 'Libro Diario cuadrado (Debe = Haber)' : 'Diferencia en partida doble'}
          >
            {trialBalance.isSumsBalanced ? (
              <>
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping [animation-duration:2.4s]" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
                <span>Partida Doble: Cuadrada</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Descuadre: ${trialBalance.sumsDifference.toFixed(2)}</span>
              </>
            )}
          </div>

          <div className="hidden xl:block w-px h-5 bg-white/[0.08] mx-1" />

          {/* Botón Auditoría / Tests */}
          <button
            onClick={onOpenTests}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-medium border border-transparent hover:border-white/[0.08] transition duration-200"
            title="Verificar suite de pruebas contables"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Auditoría</span>
          </button>

          {/* Botón Modo Estudio */}
          <button
            onClick={onOpenStudyMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-medium border border-transparent hover:border-white/[0.08] transition duration-200"
            title="Explicación didáctica paso a paso de operaciones"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Modo Estudio</span>
          </button>

          {/* Botón Exportar */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 hover:text-white text-xs font-medium border border-white/[0.1] hover:border-white/[0.16] transition duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            title="Exportar a Excel, CSV o PDF"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>

      </div>

      {/* Advertencia Pedagógica cuando UEPS está activo */}
      {activeMethod === 'UEPS' && (
        <div className="mt-2.5 text-[11px] py-2 px-3 rounded-lg bg-amber-500/[0.05] border border-amber-500/15 text-amber-200/90 flex items-center justify-between gap-3 animate-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="leading-relaxed">
              <strong className="text-amber-200 font-semibold">Aviso Académico (UEPS/LIFO):</strong> Este método se incluye exclusivamente con fines de estudio comparativo. En Argentina, la <strong>RT 17 FACPCE</strong> y las <strong>NIIF (NIC 2)</strong> no admiten UEPS por distorsionar la valuación del inventario final en contextos inflacionarios.
            </span>
          </div>
          <button 
            onClick={() => setActiveMethod('PEPS')}
            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-100 transition duration-200"
          >
            Cambiar a PEPS
          </button>
        </div>
      )}
    </header>
  );
};
