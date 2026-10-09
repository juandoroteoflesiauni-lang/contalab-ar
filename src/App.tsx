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
import { Menu, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExercisesModalOpen, setIsExercisesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewOpModalExternalOpen, setIsNewOpModalExternalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Botón flotante para menú móvil */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3.5 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 hover:bg-indigo-500 transition"
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
      />

      {/* Contenedor con Sidebar y Vista Principal */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Barra Lateral de Navegación */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        {/* Área de Contenido Principal */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden min-h-[calc(100vh-61px)]">
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
      <footer className="border-t border-slate-900 bg-slate-950/80 text-center py-4 text-xs text-slate-500 no-print">
        <p>
          ContaLab AR • Desarrollado para estudiantes de la carrera de <strong>Contador Público</strong> (Sistemas de Información Contable)
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Cumple con la <strong>RT 17 FACPCE</strong> y principios de inventario permanente • PEPS, UEPS (académico), PPP e Identificación Específica
        </p>
      </footer>
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
