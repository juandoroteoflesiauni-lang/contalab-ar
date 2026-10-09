import React, { useState, useEffect, useMemo } from 'react';
import { 
  PenTool, 
  BookOpen, 
  GitCommitVertical, 
  Calculator, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Save, 
  FileSpreadsheet, 
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  ManualJournalRow, 
  ManualLedgerAccount, 
  ManualLedgerMovement, 
  CostSheet, 
  CostSheetRow, 
  PracticeData 
} from '../../types/practice';
import { DEFAULT_PRACTICE_DATA } from '../../data/defaultPracticeData';
import { formatCurrency, round2, generateId, formatDate } from '../../utils/currency';

const PRACTICE_STORAGE_KEY = 'contalab_practica_contable_v1';

export const PracticeView: React.FC = () => {
  // Pestaña activa dentro de Práctica Contable
  const [activePracticeTab, setActivePracticeTab] = useState<'journal' | 'ledger' | 'costs'>('journal');

  // Estado unificado de práctica persistido en localStorage
  const [practiceData, setPracticeData] = useState<PracticeData>(() => {
    try {
      const saved = localStorage.getItem(PRACTICE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.journalRows && parsed.ledgerAccounts && parsed.costSheets) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error cargando práctica de localStorage:', e);
    }
    return DEFAULT_PRACTICE_DATA;
  });

  // Guardar en localStorage automáticamente ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(practiceData));
    } catch (e) {
      console.error('Error guardando práctica en localStorage:', e);
    }
  }, [practiceData]);

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas reiniciar los datos de la práctica a los ejercicios iniciales de ejemplo? Se sobrescribirán tus registros manuales actuales.')) {
      setPracticeData(DEFAULT_PRACTICE_DATA);
    }
  };

  /* =========================================================================================
     1. HERRAMIENTA: LIBRO DIARIO MANUAL
     ========================================================================================= */
  // Totales calculados en tiempo real
  const journalTotals = useMemo(() => {
    const totalDebit = round2(practiceData.journalRows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0));
    const totalCredit = round2(practiceData.journalRows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0));
    const difference = round2(Math.abs(totalDebit - totalCredit));
    const isBalanced = difference === 0 && practiceData.journalRows.length > 0;
    return { totalDebit, totalCredit, difference, isBalanced };
  }, [practiceData.journalRows]);

  const handleAddJournalRow = (entryNum?: number) => {
    const nextEntryNum = entryNum || (practiceData.journalRows.length > 0 
      ? Math.max(...practiceData.journalRows.map(r => r.entryNumber || 1)) + 1 
      : 1);

    const newRow: ManualJournalRow = {
      id: generateId('pj_row'),
      entryNumber: nextEntryNum,
      date: new Date().toISOString().slice(0, 10),
      accountCode: '1.1.01',
      accountName: 'Caja',
      detail: '',
      debit: 0,
      credit: 0
    };

    setPracticeData(prev => ({
      ...prev,
      journalRows: [...prev.journalRows, newRow]
    }));
  };

  const handleUpdateJournalRow = (id: string, field: keyof ManualJournalRow, value: any) => {
    setPracticeData(prev => ({
      ...prev,
      journalRows: prev.journalRows.map(row => {
        if (row.id === id) {
          return {
            ...row,
            [field]: (field === 'debit' || field === 'credit' || field === 'entryNumber') 
              ? Number(value) || 0 
              : value
          };
        }
        return row;
      })
    }));
  };

  const handleDeleteJournalRow = (id: string) => {
    setPracticeData(prev => ({
      ...prev,
      journalRows: prev.journalRows.filter(r => r.id !== id)
    }));
  };

  /* =========================================================================================
     2. HERRAMIENTA: LIBRO MAYOR MANUAL
     ========================================================================================= */
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>(() => {
    return practiceData.ledgerAccounts[0]?.id || '';
  });

  // Cuenta activa de mayor
  const activeLedgerAccount = useMemo(() => {
    return practiceData.ledgerAccounts.find(a => a.id === selectedLedgerAccountId) || practiceData.ledgerAccounts[0];
  }, [practiceData.ledgerAccounts, selectedLedgerAccountId]);

  // Cálculo dinámico de movimientos con saldo acumulado
  const calculatedMovements = useMemo(() => {
    if (!activeLedgerAccount) return [];
    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    return activeLedgerAccount.movements.map(m => {
      totalDebit = round2(totalDebit + (Number(m.debit) || 0));
      totalCredit = round2(totalCredit + (Number(m.credit) || 0));

      const rawDiff = round2(totalDebit - totalCredit);
      const balanceNature: 'DEUDOR' | 'ACREEDOR' | 'CERO' = 
        rawDiff > 0 ? 'DEUDOR' : rawDiff < 0 ? 'ACREEDOR' : 'CERO';

      runningBalance = Math.abs(rawDiff);

      return {
        ...m,
        runningBalance,
        balanceNature
      };
    });
  }, [activeLedgerAccount]);

  const ledgerAccountSummary = useMemo(() => {
    if (!activeLedgerAccount) return { totalDebit: 0, totalCredit: 0, balance: 0, nature: 'CERO' };
    const totalDebit = round2(activeLedgerAccount.movements.reduce((s, m) => s + (Number(m.debit) || 0), 0));
    const totalCredit = round2(activeLedgerAccount.movements.reduce((s, m) => s + (Number(m.credit) || 0), 0));
    const raw = round2(totalDebit - totalCredit);
    return {
      totalDebit,
      totalCredit,
      balance: Math.abs(raw),
      nature: raw > 0 ? 'DEUDOR' : raw < 0 ? 'ACREEDOR' : 'CERO'
    };
  }, [activeLedgerAccount]);

  const handleAddLedgerAccount = () => {
    const accCode = prompt('Ingresa el código de la nueva cuenta (ej: 1.1.02):', '1.1.02');
    if (!accCode) return;
    const accName = prompt('Ingresa el nombre de la cuenta (ej: Banco Cuenta Corriente):', 'Banco Cuenta Corriente');
    if (!accName) return;

    const newAccount: ManualLedgerAccount = {
      id: generateId('acc'),
      accountCode: accCode.trim(),
      accountName: accName.trim(),
      movements: []
    };

    setPracticeData(prev => ({
      ...prev,
      ledgerAccounts: [...prev.ledgerAccounts, newAccount]
    }));
    setSelectedLedgerAccountId(newAccount.id);
  };

  const handleDeleteLedgerAccount = (accountId: string) => {
    if (practiceData.ledgerAccounts.length <= 1) {
      alert('Debes conservar al menos una cuenta en el Mayor.');
      return;
    }
    if (window.confirm('¿Deseas eliminar esta cuenta del Libro Mayor manual?')) {
      const remaining = practiceData.ledgerAccounts.filter(a => a.id !== accountId);
      setPracticeData(prev => ({
        ...prev,
        ledgerAccounts: remaining
      }));
      setSelectedLedgerAccountId(remaining[0].id);
    }
  };

  const handleAddLedgerMovement = () => {
    if (!activeLedgerAccount) return;
    const newMovement: ManualLedgerMovement = {
      id: generateId('mov'),
      date: new Date().toISOString().slice(0, 10),
      detail: 'Detalle del movimiento',
      entryRef: `Asiento Nº ${activeLedgerAccount.movements.length + 1}`,
      debit: 0,
      credit: 0
    };

    setPracticeData(prev => ({
      ...prev,
      ledgerAccounts: prev.ledgerAccounts.map(acc => {
        if (acc.id === activeLedgerAccount.id) {
          return {
            ...acc,
            movements: [...acc.movements, newMovement]
          };
        }
        return acc;
      })
    }));
  };

  const handleUpdateLedgerMovement = (movId: string, field: keyof ManualLedgerMovement, value: any) => {
    if (!activeLedgerAccount) return;
    setPracticeData(prev => ({
      ...prev,
      ledgerAccounts: prev.ledgerAccounts.map(acc => {
        if (acc.id === activeLedgerAccount.id) {
          return {
            ...acc,
            movements: acc.movements.map(m => {
              if (m.id === movId) {
                return {
                  ...m,
                  [field]: (field === 'debit' || field === 'credit') ? Number(value) || 0 : value
                };
              }
              return m;
            })
          };
        }
        return acc;
      })
    }));
  };

  const handleDeleteLedgerMovement = (movId: string) => {
    if (!activeLedgerAccount) return;
    setPracticeData(prev => ({
      ...prev,
      ledgerAccounts: prev.ledgerAccounts.map(acc => {
        if (acc.id === activeLedgerAccount.id) {
          return {
            ...acc,
            movements: acc.movements.filter(m => m.id !== movId)
          };
        }
        return acc;
      })
    }));
  };

  /* =========================================================================================
     3. HERRAMIENTA: PLANILLAS DE COSTOS
     ========================================================================================= */
  const [selectedCostSheetId, setSelectedCostSheetId] = useState<string>(() => {
    return practiceData.costSheets[0]?.id || '';
  });

  const activeCostSheet = useMemo(() => {
    return practiceData.costSheets.find(s => s.id === selectedCostSheetId) || practiceData.costSheets[0];
  }, [practiceData.costSheets, selectedCostSheetId]);

  const costSheetGrandTotal = useMemo(() => {
    if (!activeCostSheet) return 0;
    return round2(activeCostSheet.rows.reduce((sum, r) => sum + (Number(r.total) || 0), 0));
  }, [activeCostSheet]);

  const handleAddCostSheet = () => {
    const title = prompt('Ingresa el título de la nueva planilla de costos:', 'Nueva Planilla de Costos');
    if (!title) return;
    const description = prompt('Descripción del cálculo o caso:', 'Cálculo de componentes del costo');

    const newSheet: CostSheet = {
      id: generateId('sheet'),
      title: title.trim(),
      description: description?.trim() || '',
      rows: [
        {
          id: generateId('c_row'),
          concept: 'Componente / Concepto de costo',
          quantity: 1,
          unitCost: 0,
          total: 0,
          notes: ''
        }
      ]
    };

    setPracticeData(prev => ({
      ...prev,
      costSheets: [...prev.costSheets, newSheet]
    }));
    setSelectedCostSheetId(newSheet.id);
  };

  const handleDeleteCostSheet = (sheetId: string) => {
    if (practiceData.costSheets.length <= 1) {
      alert('Debes conservar al menos una planilla de costos.');
      return;
    }
    if (window.confirm('¿Deseas eliminar esta planilla de costos?')) {
      const remaining = practiceData.costSheets.filter(s => s.id !== sheetId);
      setPracticeData(prev => ({
        ...prev,
        costSheets: remaining
      }));
      setSelectedCostSheetId(remaining[0].id);
    }
  };

  const handleAddCostRow = () => {
    if (!activeCostSheet) return;
    const newRow: CostSheetRow = {
      id: generateId('c_row'),
      concept: 'Nuevo concepto de costo',
      quantity: 1,
      unitCost: 0,
      total: 0,
      notes: ''
    };

    setPracticeData(prev => ({
      ...prev,
      costSheets: prev.costSheets.map(s => {
        if (s.id === activeCostSheet.id) {
          return {
            ...s,
            rows: [...s.rows, newRow]
          };
        }
        return s;
      })
    }));
  };

  const handleUpdateCostRow = (rowId: string, field: keyof CostSheetRow, value: any) => {
    if (!activeCostSheet) return;
    setPracticeData(prev => ({
      ...prev,
      costSheets: prev.costSheets.map(s => {
        if (s.id === activeCostSheet.id) {
          return {
            ...s,
            rows: s.rows.map(r => {
              if (r.id === rowId) {
                const updated = { ...r, [field]: value };
                if (field === 'quantity' || field === 'unitCost') {
                  const qty = field === 'quantity' ? Number(value) || 0 : r.quantity;
                  const unit = field === 'unitCost' ? Number(value) || 0 : r.unitCost;
                  updated.total = round2(qty * unit);
                } else if (field === 'total') {
                  updated.total = Number(value) || 0;
                }
                return updated;
              }
              return r;
            })
          };
        }
        return s;
      })
    }));
  };

  const handleDeleteCostRow = (rowId: string) => {
    if (!activeCostSheet) return;
    setPracticeData(prev => ({
      ...prev,
      costSheets: prev.costSheets.map(s => {
        if (s.id === activeCostSheet.id) {
          return {
            ...s,
            rows: s.rows.filter(r => r.id !== rowId)
          };
        }
        return s;
      })
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera Principal de la Sección de Práctica Contable */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-indigo-400" />
              Taller de Práctica Manual
            </span>
            <span className="text-xs text-slate-400">
              Espacio independiente de práctica libre
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Práctica Contable
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-1">
            Resuelve tus propios ejercicios contables de forma práctica y ordenada. Incluye <strong>Libro Diario</strong> con balance automático, <strong>Libro Mayor</strong> con saldos acumulados y <strong>Planillas de Costos</strong> con importes calculados en vivo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardado automático</span>
          </div>
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            title="Restaurar ejercicios prácticos de ejemplo"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación entre las 3 Herramientas dentro de la misma página */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActivePracticeTab('journal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activePracticeTab === 'journal'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Libro Diario Manual</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-indigo-200 font-mono">
            {practiceData.journalRows.length} filas
          </span>
        </button>

        <button
          onClick={() => setActivePracticeTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activePracticeTab === 'ledger'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GitCommitVertical className="w-4 h-4" />
          <span>2. Libro Mayor Manual</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-indigo-200 font-mono">
            {practiceData.ledgerAccounts.length} cuentas
          </span>
        </button>

        <button
          onClick={() => setActivePracticeTab('costs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activePracticeTab === 'costs'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>3. Planillas de Costos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-indigo-200 font-mono">
            {practiceData.costSheets.length} planillas
          </span>
        </button>
      </div>

      {/* =========================================================================================
          VISTA 1: LIBRO DIARIO MANUAL
          ========================================================================================= */}
      {activePracticeTab === 'journal' && (
        <div className="space-y-4">
          
          {/* Tarjeta de Control y Resumen de Totales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Total Sumas al Debe</span>
              <div className="text-xl font-bold text-blue-300 font-mono mt-0.5">
                {formatCurrency(journalTotals.totalDebit)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Total Sumas al Haber</span>
              <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">
                {formatCurrency(journalTotals.totalCredit)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Estado de Balance</span>
                <div className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${
                  journalTotals.isBalanced ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {journalTotals.isBalanced ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Asientos Cuadrados ✓</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Diferencia: {formatCurrency(journalTotals.difference)}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleAddJournalRow()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Fila</span>
              </button>
            </div>
          </div>

          {/* Tabla Editable del Libro Diario */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <th className="py-3 px-3 w-16 text-center">As. Nº</th>
                  <th className="py-3 px-3 w-32">Fecha</th>
                  <th className="py-3 px-3 w-28">Código</th>
                  <th className="py-3 px-3 w-48">Cuenta Contable</th>
                  <th className="py-3 px-3">Detalle / Explicación</th>
                  <th className="py-3 px-3 w-32 text-right">Debe ($)</th>
                  <th className="py-3 px-3 w-32 text-right">Haber ($)</th>
                  <th className="py-3 px-2 w-12 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                {practiceData.journalRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      No hay filas cargadas. Haz clic en "Agregar Fila" para comenzar tu asiento contable.
                    </td>
                  </tr>
                ) : (
                  practiceData.journalRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition group">
                      
                      {/* Nº de Asiento */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={row.entryNumber}
                          onChange={(e) => handleUpdateJournalRow(row.id, 'entryNumber', e.target.value)}
                          className="w-12 px-1.5 py-1 text-center font-bold text-indigo-400 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      {/* Fecha */}
                      <td className="py-2 px-2">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => handleUpdateJournalRow(row.id, 'date', e.target.value)}
                          className="w-full px-2 py-1 text-slate-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-[11px]"
                        />
                      </td>

                      {/* Código de Cuenta */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="1.1.01"
                          value={row.accountCode}
                          onChange={(e) => handleUpdateJournalRow(row.id, 'accountCode', e.target.value)}
                          className="w-full px-2 py-1 text-slate-400 font-semibold rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>

                      {/* Nombre de la Cuenta */}
                      <td className="py-2 px-2 font-sans">
                        <input
                          type="text"
                          placeholder="Nombre de cuenta..."
                          value={row.accountName}
                          onChange={(e) => handleUpdateJournalRow(row.id, 'accountName', e.target.value)}
                          className="w-full px-2 py-1 text-white font-medium rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>

                      {/* Detalle / Glosa */}
                      <td className="py-2 px-2 font-sans">
                        <input
                          type="text"
                          placeholder="Concepto del movimiento..."
                          value={row.detail}
                          onChange={(e) => handleUpdateJournalRow(row.id, 'detail', e.target.value)}
                          className="w-full px-2 py-1 text-slate-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>

                      {/* Debe */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.debit || ''}
                          onChange={(e) => handleUpdateJournalRow(row.id, 'debit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1 text-right font-bold text-blue-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                        />
                      </td>

                      {/* Haber */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.credit || ''}
                          onChange={(e) => handleUpdateJournalRow(row.id, 'credit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1 text-right font-bold text-emerald-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </td>

                      {/* Eliminar Fila */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleDeleteJournalRow(row.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition opacity-80 group-hover:opacity-100"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>

              {/* Fila de Totales */}
              <tfoot className="bg-slate-950 text-white font-bold font-mono border-t-2 border-slate-800 text-xs">
                <tr>
                  <td colSpan={5} className="py-3 px-3 uppercase font-sans text-right">
                    Totales Calculados:
                  </td>
                  <td className="py-3 px-2 text-right text-blue-300">
                    {formatCurrency(journalTotals.totalDebit)}
                  </td>
                  <td className="py-3 px-2 text-right text-emerald-300">
                    {formatCurrency(journalTotals.totalCredit)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              Puedes editar directamente cualquier celda. Todos los cálculos se actualizan de forma instantánea.
            </span>
            <button
              onClick={() => handleAddJournalRow()}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar otra partida
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================================
          VISTA 2: LIBRO MAYOR MANUAL
          ========================================================================================= */}
      {activePracticeTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* Barra de Selección y Creación de Cuentas */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400">
                <GitCommitVertical className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase font-mono">Cuenta en Mayor</label>
                <select
                  value={selectedLedgerAccountId}
                  onChange={(e) => setSelectedLedgerAccountId(e.target.value)}
                  className="mt-0.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  {practiceData.ledgerAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountCode} - {acc.accountName} ({acc.movements.length} movs.)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddLedgerAccount}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Cuenta</span>
              </button>

              {activeLedgerAccount && (
                <button
                  onClick={() => handleDeleteLedgerAccount(activeLedgerAccount.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition border border-slate-700"
                  title="Eliminar cuenta actual"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta de Resumen de la Cuenta */}
          {activeLedgerAccount && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">Total Debe Acumulado</span>
                <div className="text-base font-bold text-blue-300 mt-0.5">
                  {formatCurrency(ledgerAccountSummary.totalDebit)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">Total Haber Acumulado</span>
                <div className="text-base font-bold text-emerald-300 mt-0.5">
                  {formatCurrency(ledgerAccountSummary.totalCredit)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">Saldo de la Cuenta</span>
                <div className="text-base font-bold text-white mt-0.5">
                  {formatCurrency(ledgerAccountSummary.balance)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">Naturaleza del Saldo</span>
                <div className={`text-sm font-bold mt-0.5 ${
                  ledgerAccountSummary.nature === 'DEUDOR' 
                    ? 'text-blue-400' 
                    : ledgerAccountSummary.nature === 'ACREEDOR' 
                      ? 'text-emerald-400' 
                      : 'text-slate-400'
                }`}>
                  {ledgerAccountSummary.nature}
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Movimientos de la Cuenta */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <th className="py-3 px-3 w-32">Fecha</th>
                  <th className="py-3 px-3 w-36">Referencia Asiento</th>
                  <th className="py-3 px-3">Detalle del Movimiento</th>
                  <th className="py-3 px-3 w-32 text-right">Debe ($)</th>
                  <th className="py-3 px-3 w-32 text-right">Haber ($)</th>
                  <th className="py-3 px-3 w-36 text-right">Saldo Acumulado</th>
                  <th className="py-3 px-2 w-12 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                {calculatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      No hay movimientos registrados para esta cuenta. Haz clic en "Agregar Movimiento".
                    </td>
                  </tr>
                ) : (
                  calculatedMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-800/40 transition group">
                      
                      {/* Fecha */}
                      <td className="py-2 px-2">
                        <input
                          type="date"
                          value={mov.date}
                          onChange={(e) => handleUpdateLedgerMovement(mov.id, 'date', e.target.value)}
                          className="w-full px-2 py-1 text-slate-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-[11px]"
                        />
                      </td>

                      {/* Referencia Asiento */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="Asiento Nº 1"
                          value={mov.entryRef}
                          onChange={(e) => handleUpdateLedgerMovement(mov.id, 'entryRef', e.target.value)}
                          className="w-full px-2 py-1 text-indigo-300 font-semibold rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>

                      {/* Detalle */}
                      <td className="py-2 px-2 font-sans">
                        <input
                          type="text"
                          placeholder="Concepto o comprobante..."
                          value={mov.detail}
                          onChange={(e) => handleUpdateLedgerMovement(mov.id, 'detail', e.target.value)}
                          className="w-full px-2 py-1 text-white rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </td>

                      {/* Debe */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={mov.debit || ''}
                          onChange={(e) => handleUpdateLedgerMovement(mov.id, 'debit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1 text-right font-bold text-blue-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                        />
                      </td>

                      {/* Haber */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={mov.credit || ''}
                          onChange={(e) => handleUpdateLedgerMovement(mov.id, 'credit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1 text-right font-bold text-emerald-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </td>

                      {/* Saldo Acumulado (calculado automáticamente) */}
                      <td className="py-2 px-3 text-right font-bold text-white">
                        <span>{formatCurrency(mov.runningBalance)}</span>
                        <span className={`text-[10px] ml-1 font-sans ${
                          mov.balanceNature === 'DEUDOR' ? 'text-blue-400' : mov.balanceNature === 'ACREEDOR' ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          ({mov.balanceNature[0]})
                        </span>
                      </td>

                      {/* Eliminar Movimiento */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleDeleteLedgerMovement(mov.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition opacity-80 group-hover:opacity-100"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>

              <tfoot className="bg-slate-950 text-white font-bold font-mono border-t-2 border-slate-800 text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-3 uppercase font-sans text-right">
                    Totales de la Cuenta:
                  </td>
                  <td className="py-3 px-2 text-right text-blue-300">
                    {formatCurrency(ledgerAccountSummary.totalDebit)}
                  </td>
                  <td className="py-3 px-2 text-right text-emerald-300">
                    {formatCurrency(ledgerAccountSummary.totalCredit)}
                  </td>
                  <td className="py-3 px-3 text-right text-indigo-300">
                    Saldo {ledgerAccountSummary.nature}: {formatCurrency(ledgerAccountSummary.balance)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleAddLedgerMovement}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Movimiento a esta Cuenta</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================================
          VISTA 3: PLANILLAS DE COSTOS
          ========================================================================================= */}
      {activePracticeTab === 'costs' && (
        <div className="space-y-4">
          
          {/* Selector y Creación de Planillas de Costos */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-600/10 text-cyan-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase font-mono">Planilla de Costos Activa</label>
                <select
                  value={selectedCostSheetId}
                  onChange={(e) => setSelectedCostSheetId(e.target.value)}
                  className="mt-0.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-cyan-500 max-w-sm truncate"
                >
                  {practiceData.costSheets.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddCostSheet}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Planilla</span>
              </button>

              {activeCostSheet && (
                <button
                  onClick={() => handleDeleteCostSheet(activeCostSheet.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition border border-slate-700"
                  title="Eliminar planilla actual"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Descripción y Total General */}
          {activeCostSheet && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">{activeCostSheet.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeCostSheet.description || 'Planilla contable de costeo y determinación de importes.'}</p>
              </div>
              <div className="font-mono text-right bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-sans block">Total Costo Determinado</span>
                <span className="text-lg font-bold text-cyan-400">{formatCurrency(costSheetGrandTotal)}</span>
              </div>
            </div>
          )}

          {/* Tabla Editable de Costos */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <th className="py-3 px-3">Concepto / Componente del Costo</th>
                  <th className="py-3 px-3 w-28 text-right">Cantidad</th>
                  <th className="py-3 px-3 w-36 text-right">Costo Unitario ($)</th>
                  <th className="py-3 px-3 w-36 text-right">Importe Parcial / Total ($)</th>
                  <th className="py-3 px-3 w-48 font-sans">Observaciones / Nota</th>
                  <th className="py-3 px-2 w-12 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                {!activeCostSheet || activeCostSheet.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      No hay conceptos en esta planilla. Haz clic en "Agregar Concepto".
                    </td>
                  </tr>
                ) : (
                  activeCostSheet.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition group">
                      
                      {/* Concepto */}
                      <td className="py-2 px-2 font-sans">
                        <input
                          type="text"
                          placeholder="Materia prima, flete, arancel, etc."
                          value={row.concept}
                          onChange={(e) => handleUpdateCostRow(row.id, 'concept', e.target.value)}
                          className="w-full px-2 py-1 text-white font-medium rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      </td>

                      {/* Cantidad */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="any"
                          value={row.quantity}
                          onChange={(e) => handleUpdateCostRow(row.id, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 text-right text-slate-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs font-bold"
                        />
                      </td>

                      {/* Costo Unitario */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="any"
                          value={row.unitCost}
                          onChange={(e) => handleUpdateCostRow(row.id, 'unitCost', e.target.value)}
                          className="w-full px-2 py-1 text-right text-slate-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      </td>

                      {/* Importe Parcial / Total (calculado o editable) */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="any"
                          value={row.total}
                          onChange={(e) => handleUpdateCostRow(row.id, 'total', e.target.value)}
                          className="w-full px-2 py-1 text-right font-bold text-cyan-300 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      </td>

                      {/* Observaciones */}
                      <td className="py-2 px-2 font-sans">
                        <input
                          type="text"
                          placeholder="Nota contable..."
                          value={row.notes || ''}
                          onChange={(e) => handleUpdateCostRow(row.id, 'notes', e.target.value)}
                          className="w-full px-2 py-1 text-slate-400 rounded-lg bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-[11px]"
                        />
                      </td>

                      {/* Eliminar Fila */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleDeleteCostRow(row.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition opacity-80 group-hover:opacity-100"
                          title="Eliminar concepto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>

              <tfoot className="bg-slate-950 text-white font-bold font-mono border-t-2 border-slate-800 text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-3 uppercase font-sans text-right">
                    Costo Total Acumulado:
                  </td>
                  <td className="py-3 px-2 text-right text-cyan-400 text-sm">
                    {formatCurrency(costSheetGrandTotal)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between items-center pt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Al modificar Cantidad o Costo Unitario, el importe se calcula automáticamente (Cantidad × Costo Unitario).
            </span>
            <button
              onClick={handleAddCostRow}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shadow-md shadow-cyan-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Concepto</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
