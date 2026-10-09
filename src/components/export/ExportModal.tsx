import React from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  X, 
  CheckCircle2, 
  Sparkles,
  Database
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { exportExerciseToExcel, exportKardexToCSV, exportExerciseToJSON } from '../../utils/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { 
    activeExercise, 
    inventoryCalculation, 
    journalEntries, 
    trialBalance, 
    methodComparisons,
    activeProductId 
  } = useAccounting();

  if (!isOpen) return null;

  const currentProduct = activeExercise.products.find(p => p.id === activeProductId) || activeExercise.products[0];
  const kardexRows = currentProduct ? inventoryCalculation.productStates.get(currentProduct.id)?.kardex || [] : [];

  const handleExportExcel = () => {
    exportExerciseToExcel(
      activeExercise,
      kardexRows,
      journalEntries,
      trialBalance.rows,
      methodComparisons
    );
    onClose();
  };

  const handleExportCSV = () => {
    if (kardexRows.length > 0) {
      exportKardexToCSV(kardexRows, `${activeExercise.name.replace(/[^a-zA-Z0-9]/g, '_')}_Kardex.csv`);
    }
    onClose();
  };

  const handleExportJSON = () => {
    exportExerciseToJSON(activeExercise);
    onClose();
  };

  const handlePrint = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <Download className="w-5 h-5 text-emerald-400" />
          Exportar Informes Contables
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Descarga o imprime las planillas del ejercicio activo para su entrega o análisis
        </p>

        <div className="space-y-3">
          
          {/* Opción 1: Excel Completo */}
          <button
            onClick={handleExportExcel}
            className="w-full p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Libro de Excel (.xlsx)</div>
                <div className="text-[11px] text-slate-400">
                  Kardex, Libro Diario, Mayor, Sumas y Saldos y Comparativa
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </button>

          {/* Opción 2: CSV Kardex */}
          <button
            onClick={handleExportCSV}
            className="w-full p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Archivo CSV (Ficha de Stock)</div>
                <div className="text-[11px] text-slate-400">
                  Movimientos permanentes del producto activo
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
          </button>

          {/* Opción 3: Impresión / PDF */}
          <button
            onClick={handlePrint}
            className="w-full p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Imprimir / Guardar como PDF</div>
                <div className="text-[11px] text-slate-400">
                  Formato de impresión listo para entrega de trabajos prácticos
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
          </button>

          {/* Opción 4: Respaldo JSON */}
          <button
            onClick={handleExportJSON}
            className="w-full p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Copia de Seguridad (.json)</div>
                <div className="text-[11px] text-slate-400">
                  Respaldo completo para importar en otra computadora
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
          </button>

        </div>
      </div>
    </div>
  );
};
