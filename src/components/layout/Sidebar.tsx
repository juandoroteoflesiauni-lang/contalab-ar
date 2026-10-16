import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  FileSpreadsheet, 
  BookOpen, 
  GitCommitVertical, 
  Scale, 
  GitCompare, 
  GraduationCap, 
  CheckCheck,
  ChevronRight,
  Sparkles,
  PenTool,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';

export type ActiveTab = 
  | 'dashboard'
  | 'practice'
  | 'products'
  | 'operations'
  | 'kardex'
  | 'journal'
  | 'ledger'
  | 'trialBalance'
  | 'comparator'
  | 'studyMode'
  | 'tests';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { activeExercise } = useAccounting();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Panel Principal',
      description: 'KPIs, resumen y evolución',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'practice' as ActiveTab,
      label: 'Práctica Contable',
      description: 'Diario, Mayor y Costos manuales',
      icon: PenTool,
      badge: 'Taller'
    },
    {
      id: 'products' as ActiveTab,
      label: 'Productos y Stock',
      description: 'Catálogo y saldos físicos',
      icon: Package,
      badge: `${activeExercise.products.length}`
    },
    {
      id: 'operations' as ActiveTab,
      label: 'Operaciones',
      description: 'Compras, ventas y ajustes',
      icon: Receipt,
      badge: `${activeExercise.operations.length}`
    },
    {
      id: 'kardex' as ActiveTab,
      label: 'Ficha de Stock (Kardex)',
      description: 'Movimientos permanentes',
      icon: FileSpreadsheet,
      badge: activeExercise.valuationMethod
    },
    {
      id: 'journal' as ActiveTab,
      label: 'Libro Diario',
      description: 'Asientos por partida doble',
      icon: BookOpen,
      badge: null
    },
    {
      id: 'ledger' as ActiveTab,
      label: 'Libro Mayor',
      description: 'Cuentas T y saldos',
      icon: GitCommitVertical,
      badge: null
    },
    {
      id: 'trialBalance' as ActiveTab,
      label: 'Sumas y Saldos',
      description: 'Balance de comprobación',
      icon: Scale,
      badge: 'Auditoría'
    },
    {
      id: 'comparator' as ActiveTab,
      label: 'Comparador 4 Métodos',
      description: 'PEPS vs UEPS vs PPP vs Espec.',
      icon: GitCompare,
      badge: '4 en 1'
    },
    {
      id: 'studyMode' as ActiveTab,
      label: 'Modo Estudio',
      description: 'Paso a paso didáctico',
      icon: GraduationCap,
      badge: 'Educativo'
    },
    {
      id: 'tests' as ActiveTab,
      label: 'Pruebas Contables',
      description: 'Auditoría automatizada',
      icon: CheckCheck,
      badge: '9 Tests'
    }
  ];

  // Agrupación puramente visual (el orden y las acciones de navItems no cambian)
  const groupOf: Record<ActiveTab, string> = {
    dashboard: 'General',
    practice: 'General',
    products: 'Registros',
    operations: 'Registros',
    kardex: 'Registros',
    journal: 'Libros Contables',
    ledger: 'Libros Contables',
    trialBalance: 'Libros Contables',
    comparator: 'Análisis y Estudio',
    studyMode: 'Análisis y Estudio',
    tests: 'Análisis y Estudio'
  };

  return (
    <>
      {/* Backdrop para móviles */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Barra lateral */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 lg:z-10
        ${isCollapsed ? 'lg:w-[76px]' : 'lg:w-72'} w-72 h-screen lg:h-[calc(100vh-61px)]
        bg-[#0a0a0b]/95 lg:bg-[#0a0a0b]/55 backdrop-blur-xl border-r border-white/[0.06]
        flex flex-col justify-between
        transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,0.8,0.24,1)] flex-shrink-0
        ${isMobileOpen ? 'translate-x-0 shadow-[24px_0_60px_-20px_rgba(0,0,0,0.9)]' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Lista de navegación */}
        <nav className="px-3 pt-4 pb-3 overflow-y-auto overflow-x-hidden flex-1" aria-label="Módulos de estudio">
          <div className={`px-2.5 pb-3 flex items-center justify-between ${isCollapsed ? 'lg:justify-center' : ''}`}>
            {isCollapsed ? (
              <span className="hidden lg:inline text-[10px] text-slate-500 font-mono tracking-widest">SIC</span>
            ) : null}
            <span className={`eyebrow ${isCollapsed ? 'lg:hidden' : ''}`}>Módulos de Estudio</span>
            <span className={`text-[10px] font-mono text-slate-600 px-1.5 py-0.5 rounded border border-white/[0.06] ${isCollapsed ? 'lg:hidden' : ''}`}>v1.0 AR</span>
          </div>

          <div className="space-y-0.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const group = groupOf[item.id];
            const showGroup = index === 0 || groupOf[navItems[index - 1].id] !== group;

            return (
              <React.Fragment key={item.id}>
                {showGroup && (
                  <div className={index === 0 ? '' : 'pt-3'}>
                    <div className={`px-2.5 pb-1.5 text-[10px] font-medium text-slate-600 uppercase tracking-[0.12em] ${isCollapsed ? 'lg:hidden' : ''}`}>
                      {group}
                    </div>
                    {isCollapsed && index !== 0 && (
                      <div className="hidden lg:block mx-3 mb-2 h-px bg-white/[0.06]" />
                    )}
                  </div>
                )}
              <button
                title={`${item.label} • ${item.description}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  relative w-full text-left px-2 py-2 rounded-xl transition-all duration-200
                  flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} group
                  ${isActive 
                    ? 'bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_0_1px_rgba(255,255,255,0.06)]' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.035]'
                  }
                `}
              >
                {/* Indicador activo */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full bg-white transition-all duration-300 ${
                    isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
                  }`}
                />

                <div className={`flex items-center min-w-0 ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_-4px_rgba(255,255,255,0.25)]' 
                      : 'bg-white/[0.03] border border-white/[0.06] text-slate-500 group-hover:text-slate-200 group-hover:border-white/[0.1]'
                    }
                  `}>
                    <Icon className="w-4 h-4" strokeWidth={isActive ? 2.25 : 1.9} />
                  </div>
                  
                  <div className={`min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                    <div className="text-[13px] font-medium tracking-tight whitespace-nowrap">{item.label}</div>
                    <div className={`text-[10.5px] line-clamp-1 transition-colors ${isActive ? 'text-slate-400' : 'text-slate-600 group-hover:text-slate-500'}`}>{item.description}</div>
                  </div>
                </div>

                <div className={`items-center gap-1 pl-2 ${isCollapsed ? 'lg:hidden flex' : 'flex'}`}>
                  {item.badge && (
                    <span className={`
                      text-[10px] font-mono px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors
                      ${isActive 
                        ? 'bg-white/[0.1] text-slate-200 border border-white/[0.12]' 
                        : 'bg-white/[0.025] text-slate-500 border border-white/[0.06]'
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 transition-all duration-200 ${isActive ? 'text-slate-300 translate-x-0.5' : 'text-slate-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </div>
              </button>
              </React.Fragment>
            );
          })}
          </div>
        </nav>

        {/* Tarjeta inferior y botón de contraer */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          {!isCollapsed && (
            <div className="p-3 rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Criterio Profesional</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                En inventario permanente, cada venta genera simultáneamente el <strong className="text-slate-300 font-medium">asiento de venta</strong> y el <strong className="text-slate-300 font-medium">asiento de CMV</strong>.
              </p>
            </div>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-full py-2 px-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] text-xs font-medium transition duration-200 border border-transparent hover:border-white/[0.06]"
              title={isCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
              aria-label={isCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-2">
                  <PanelLeftClose className="w-4 h-4" />
                  <span>Contraer menú</span>
                </div>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
