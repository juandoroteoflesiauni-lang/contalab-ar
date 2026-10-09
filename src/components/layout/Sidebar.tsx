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

  return (
    <>
      {/* Backdrop para móviles */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Barra lateral */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 lg:z-10
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72 h-screen lg:h-[calc(100vh-61px)]
        bg-slate-900/95 lg:bg-slate-900/50 border-r border-slate-800/80
        flex flex-col justify-between
        transition-all duration-200 ease-in-out flex-shrink-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Lista de navegación */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1">
          <div className={`px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between ${isCollapsed ? 'lg:justify-center' : ''}`}>
            {isCollapsed ? (
              <span className="hidden lg:inline text-[10px] text-indigo-400 font-mono">SIC</span>
            ) : (
              <span>Módulos de Estudio</span>
            )}
            {!isCollapsed && <span className="text-[10px] text-indigo-400 font-normal">v1.0 AR</span>}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                title={`${item.label} • ${item.description}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full text-left px-2.5 py-2.5 rounded-xl transition-all duration-150
                  flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} group
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-600/30 to-indigo-500/10 text-white border border-indigo-500/40 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                  }
                `}
              >
                <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700/80'
                    }
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className={isCollapsed ? 'lg:hidden' : 'block'}>
                    <div className="text-xs font-semibold tracking-tight whitespace-nowrap">{item.label}</div>
                    <div className="text-[10px] text-slate-500 group-hover:text-slate-400 line-clamp-1">{item.description}</div>
                  </div>
                </div>

                <div className={`items-center gap-1.5 ${isCollapsed ? 'lg:hidden flex' : 'flex'}`}>
                  {item.badge && (
                    <span className={`
                      text-[10px] font-mono px-1.5 py-0.5 rounded-full font-medium
                      ${isActive 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-indigo-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Tarjeta inferior y botón de contraer */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-full py-2 px-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition border border-slate-800"
              title={isCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
              ) : (
                <div className="flex items-center gap-2">
                  <PanelLeftClose className="w-4 h-4" />
                  <span>Contraer menú</span>
                </div>
              )}
            </button>
          )}

          {!isCollapsed && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/40 text-xs">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Criterio Profesional</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                En inventario permanente, cada venta genera simultáneamente el <strong>asiento de venta</strong> y el <strong>asiento de CMV</strong>.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
