import React, { useState } from 'react';
import { AccountingProvider } from './context/AccountingContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { OperationsView } from './components/operations/OperationsView';
import { KardexView } from './components/kardex/KardexView';
import { JournalView } from './components/journal/JournalView';
import { LedgerView } from './components/ledger/LedgerView';
import { TrialBalanceView } from './components/trialBalance/TrialBalanceView';
import { ComparatorView } from './components/comparator/ComparatorView';
import { StudyModeView } from './components/studyMode/StudyModeView';
import { TestRunnerView } from './components/tests/TestRunnerView';
import { PracticeView } from './components/practice/PracticeView';
import { ExercisesModal } from './components/exercises/ExercisesModal';
import { ExportModal } from './components/export/ExportModal';
import { AmbientBackground } from './components/layout/AmbientBackground';
import { Menu, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExercisesModalOpen, setIsExercisesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewOpModalExternalOpen, setIsNewOpModalExternalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('contalab_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('contalab_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="relative isolate min-h-screen text-slate-100 font-sans">
      {/* Fondo ambiental monocromo (decorativo) */}
      <AmbientBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
      
      {/* Botón flotante para menú móvil */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3.5 rounded-full bg-white text-slate-950 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-white/20 hover:bg-slate-50 transition duration-200"
          aria-label="Abrir menú"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Cabecera Principal */}
      <Header
        onOpenExercises={() => setIsExercisesModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenStudyMode={() => setActiveTab('studyMode')}
        onOpenTests={() => setActiveTab('tests')}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={handleToggleSidebarCollapse}
      />

      {/* Contenedor con Sidebar y Vista Principal adaptado al 100% del monitor */}
      <div className="flex-1 flex w-full min-w-0">
        {/* Barra Lateral de Navegación */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />

        {/* Área de Contenido Principal a pantalla completa */}
        <main className="flex-1 p-3 md:p-5 lg:p-7 w-full min-w-0 overflow-x-hidden min-h-[calc(100vh-61px)]">
          {/* key por pestaña: dispara la transición de entrada al cambiar de sección */}
          <div key={activeTab} className="view-transition">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNewOperation={() => setIsNewOpModalExternalOpen(true)}
            />
          )}

          {activeTab === 'practice' && <PracticeView />}

          {activeTab === 'products' && (
            <ProductsView
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'operations' && (
            <OperationsView
              isModalOpenExternal={isNewOpModalExternalOpen}
              onCloseModalExternal={() => setIsNewOpModalExternalOpen(false)}
            />
          )}

          {activeTab === 'kardex' && <KardexView />}

          {activeTab === 'journal' && <JournalView />}

          {activeTab === 'ledger' && <LedgerView />}

          {activeTab === 'trialBalance' && <TrialBalanceView />}

          {activeTab === 'comparator' && <ComparatorView />}

          {activeTab === 'studyMode' && <StudyModeView />}

          {activeTab === 'tests' && <TestRunnerView />}
          </div>
        </main>
      </div>

      {/* Modales Globales */}
      <ExercisesModal
        isOpen={isExercisesModalOpen}
        onClose={() => setIsExercisesModalOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Modal flotante de nueva operación si se invoca desde otra pantalla */}
      {isNewOpModalExternalOpen && activeTab !== 'operations' && (
        <OperationsView
          isModalOpenExternal={isNewOpModalExternalOpen}
          onCloseModalExternal={() => setIsNewOpModalExternalOpen(false)}
        />
      )}

      {/* Footer educativo */}
      <footer className="border-t border-white/[0.06] bg-black/40 backdrop-blur-sm py-5 px-4 text-[11px] text-slate-500 no-print">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 max-w-full">
          <p className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-white text-slate-950 text-[9px] font-bold">C</span>
            <span className="text-slate-300 font-medium">ContaLab AR</span>
            <span className="text-slate-700">/</span>
            <span>Desarrollado para estudiantes de la carrera de <strong className="text-slate-400 font-medium">Contador Público</strong> (Sistemas de Información Contable)</span>
          </p>
          <p className="text-slate-600 text-center md:text-right">
            Cumple con la <strong className="text-slate-500 font-medium">RT 17 FACPCE</strong> y principios de inventario permanente • PEPS, UEPS (académico), PPP e Identificación Específica
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AccountingProvider>
      <MainApp />
    </AccountingProvider>
  );
}
