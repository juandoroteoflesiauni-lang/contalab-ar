import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Copy, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  RotateCcw, 
  Upload, 
  Download,
  Calendar,
  Building,
  Sparkles
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { AccountingExercise, ValuationMethod } from '../../types/accounting';
import { formatDate } from '../../utils/currency';
import { exportExerciseToJSON } from '../../utils/exporter';

interface ExercisesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExercisesModal: React.FC<ExercisesModalProps> = ({ isOpen, onClose }) => {
  const { 
    exercises, 
    activeExercise, 
    selectExercise, 
    createExercise, 
    updateExercise, 
    duplicateExercise, 
    deleteExercise, 
    importExercise,
    resetAllExercises 
  } = useAccounting();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cuit, setCuit] = useState('');
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-03-31');
  const [currency, setCurrency] = useState('ARS ($)');
  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>('PEPS');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingId(null);
    setName(`Ejercicio Práctico #${exercises.length + 1}`);
    setDescription('Resolución de caso de inventario permanente y devengamiento de CMV');
    setCompanyName('Nueva Empresa Comercial S.A.');
    setCuit('30-12345678-9');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setCurrency('ARS ($)');
    setValuationMethod('PEPS');
    setIsEditing(true);
  };

  const handleStartEdit = (ex: AccountingExercise) => {
    setEditingId(ex.id);
    setName(ex.name);
    setDescription(ex.description);
    setCompanyName(ex.companyName);
    setCuit(ex.cuit || '');
    setStartDate(ex.startDate);
    setEndDate(ex.endDate);
    setCurrency(ex.currency);
    setValuationMethod(ex.valuationMethod);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const existing = exercises.find(e => e.id === editingId);
      if (existing) {
        updateExercise({
          ...existing,
          name,
          description,
          companyName,
          cuit,
          startDate,
          endDate,
          currency,
          valuationMethod
        });
      }
    } else {
      createExercise({
        name,
        description,
        companyName,
        cuit,
        startDate,
        endDate,
        currency,
        valuationMethod
      });
    }

    setIsEditing(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importExercise(content);
      if (ok) {
        alert('Ejercicio importado con éxito.');
      } else {
        alert('Error: El archivo no contiene un formato de ejercicio válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <FolderGit2 className="w-5 h-5 text-indigo-400" />
          Administrador de Ejercicios Contables
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Crea, edita, duplica o cambia entre distintos casos prácticos independientes
        </p>

        {isEditing ? (
          /* Formulario de Crear / Editar */
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Ejercicio *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Método de Valuación Inicial</label>
                <select
                  value={valuationMethod}
                  onChange={(e) => setValuationMethod(e.target.value as ValuationMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="PEPS">PEPS (Primero Entrado, Primero Salido)</option>
                  <option value="UEPS">UEPS (Último Entrado, Primero Salido)</option>
                  <option value="PPP">PPP (Precio Promedio Ponderado)</option>
                  <option value="ESPECIFICA">Identificación Específica (Serial/Lote)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Razón Social / Empresa</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">CUIT</label>
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="30-xxxxxxxx-x"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha Cierre</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Moneda</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Descripción / Enunciado del Ejercicio</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                {editingId ? 'Guardar Cambios' : 'Crear Ejercicio'}
              </button>
            </div>
          </form>
        ) : (
          /* Lista de Ejercicios Disponibles */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Ejercicio</span>
              </button>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition border border-slate-700">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Importar JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={resetAllExercises}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-medium transition border border-slate-700"
                  title="Restaurar ejercicios oficiales de cátedra"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Cátedra</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {exercises.map((ex) => {
                const isActive = activeExercise.id === ex.id;

                return (
                  <div
                    key={ex.id}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isActive 
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div 
                      onClick={() => selectExercise(ex.id)}
                      className="cursor-pointer flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white hover:text-indigo-300">
                          {ex.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-mono font-semibold">
                            ACTIVO
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {ex.valuationMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {ex.companyName} • {ex.products.length} productos • {ex.operations.length} operaciones
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => exportExerciseToJSON(ex)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Exportar respaldo JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => duplicateExercise(ex.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Duplicar ejercicio"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(ex)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Editar metadatos"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteExercise(ex.id)}
                        disabled={exercises.length <= 1}
                        className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 disabled:opacity-30 transition"
                        title="Eliminar ejercicio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
