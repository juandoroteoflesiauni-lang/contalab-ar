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
  Info,
  Edit2,
  DollarSign,
  PlusCircle,
  HelpCircle,
  ArrowDownRight,
  Printer
} from 'lucide-react';
import { 
  TAccount, 
  TAccountCategory, 
  TMovement, 
  FacultyInventorySheet, 
  FacultyInventoryRow, 
  InventoryCostMethod,
  InventoryMovementType,
  GenericCostSheet,
  GenericCostRow,
  ManualJournalRow,
  ManualJournalEntry,
  ManualJournalLine,
  PracticeData 
} from '../../types/practice';
import { DEFAULT_PRACTICE_DATA } from '../../data/defaultPracticeData';
import { formatCurrency, formatQuantity, round2, round4, generateId, formatDate } from '../../utils/currency';
import { recalculateInventorySheet } from '../../utils/inventorySheetCalculator';

const PRACTICE_STORAGE_KEY = 'contalab_practica_contable_v2';

export const PracticeView: React.FC = () => {
  // Pestaña principal dentro de Práctica Contable
  const [activePracticeTab, setActivePracticeTab] = useState<'journal' | 'tAccounts' | 'costs'>('tAccounts');

  // Sub-pestaña dentro de Planillas de Costos
  const [costToolTab, setCostToolTab] = useState<'inventory' | 'generic'>('inventory');

  // Estado unificado persistido en localStorage
  const [practiceData, setPracticeData] = useState<PracticeData>(() => {
    try {
      localStorage.removeItem('contalab_practica_contable_v1'); // Limpiar datos de demostración anteriores
      const saved = localStorage.getItem(PRACTICE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tAccounts && parsed.inventorySheets) {
          // Migración transparente de journalRows a journalEntries agrupadas
          if (!parsed.journalEntries) {
            if (Array.isArray(parsed.journalRows) && parsed.journalRows.length > 0) {
              const map = new Map<number, ManualJournalEntry>();
              for (const r of parsed.journalRows) {
                const eNum = r.entryNumber || 1;
                if (!map.has(eNum)) {
                  map.set(eNum, {
                    id: generateId('pj_entry'),
                    entryNumber: eNum,
                    date: r.date || new Date().toISOString().slice(0, 10),
                    lines: []
                  });
                }
                const entry = map.get(eNum)!;
                entry.lines.push({
                  id: r.id || generateId('pj_line'),
                  accountName: r.accountName || '',
                  detail: r.detail || '',
                  debit: Number(r.debit) || 0,
                  credit: Number(r.credit) || 0
                });
              }
              parsed.journalEntries = Array.from(map.values());
            } else {
              parsed.journalEntries = [];
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error cargando práctica de localStorage:', e);
    }
    return DEFAULT_PRACTICE_DATA;
  });

  // Guardado automático en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(practiceData));
    } catch (e) {
      console.error('Error guardando práctica en localStorage:', e);
    }
  }, [practiceData]);

  const handleResetClean = () => {
    if (window.confirm('¿Deseas reiniciar y vaciar todas las herramientas de práctica contable para empezar desde cero?')) {
      setPracticeData(DEFAULT_PRACTICE_DATA);
    }
  };

  /* =========================================================================================
     1. LIBRO MAYOR: CUENTAS EN "T" (4 Secciones Verticales: Activo, Pasivo, PN, Resultados)
     ========================================================================================= */
  const categories: { id: TAccountCategory; label: string; color: string; badge: string }[] = [
    { id: 'ACTIVO', label: 'Activo', color: 'border-blue-500/60 bg-blue-950/20 text-blue-300', badge: 'Saldo Deudor habitual' },
    { id: 'PASIVO', label: 'Pasivo', color: 'border-amber-500/60 bg-amber-950/20 text-amber-300', badge: 'Saldo Acreedor habitual' },
    { id: 'PATRIMONIO_NETO', label: 'Patrimonio Neto', color: 'border-purple-500/60 bg-purple-950/20 text-purple-300', badge: 'Saldo Acreedor habitual' },
    { id: 'RESULTADOS', label: 'Resultados (R+ / R-)', color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300', badge: 'Ingresos y Costos' },
  ];

  const handleAddTAccount = (category: TAccountCategory) => {
    const newAccount: TAccount = {
      id: generateId('t_acc'),
      category,
      name: 'Nueva Cuenta',
      code: undefined,
      debits: [],
      credits: []
    };

    setPracticeData(prev => ({
      ...prev,
      tAccounts: [...prev.tAccounts, newAccount]
    }));
  };

  const handleDeleteTAccount = (accountId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta cuenta en T? Se borrarán sus movimientos asociados.')) {
      setPracticeData(prev => ({
        ...prev,
        tAccounts: prev.tAccounts.filter(a => a.id !== accountId)
      }));
    }
  };

  const handleUpdateTAccountMeta = (accountId: string, newName: string, newCode?: string) => {
    setPracticeData(prev => ({
      ...prev,
      tAccounts: prev.tAccounts.map(a => a.id === accountId ? { ...a, name: newName, code: newCode } : a)
    }));
  };

  const handleDeleteTMovement = (accountId: string, side: 'debit' | 'credit', movementId: string) => {
    setPracticeData(prev => ({
      ...prev,
      tAccounts: prev.tAccounts.map(acc => {
        if (acc.id === accountId) {
          return {
            ...acc,
            debits: side === 'debit' ? acc.debits.filter(m => m.id !== movementId) : acc.debits,
            credits: side === 'credit' ? acc.credits.filter(m => m.id !== movementId) : acc.credits
          };
        }
        return acc;
      })
    }));
  };

  // Estados para inserción y edición rápida inline en Cuentas en T (sin popups bloqueantes)
  const [inlineAdding, setInlineAdding] = useState<{ accountId: string; side: 'debit' | 'credit' } | null>(null);
  const [inlineAmount, setInlineAmount] = useState('');
  const [inlineRef, setInlineRef] = useState('');

  const [editingMovement, setEditingMovement] = useState<{ accountId: string; side: 'debit' | 'credit'; movId: string; amount: string } | null>(null);

  const handleConfirmInlineMovement = (accountId: string, side: 'debit' | 'credit') => {
    const cleanStr = inlineAmount.trim().replace(/,/g, '.');
    const parsed = Number(cleanStr);
    if (!isNaN(parsed) && parsed > 0) {
      const newMov: TMovement = {
        id: generateId('t_mov'),
        amount: parsed,
        ref: inlineRef.trim() || undefined
      };
      setPracticeData(prev => ({
        ...prev,
        tAccounts: prev.tAccounts.map(acc => {
          if (acc.id === accountId) {
            return {
              ...acc,
              debits: side === 'debit' ? [...acc.debits, newMov] : acc.debits,
              credits: side === 'credit' ? [...acc.credits, newMov] : acc.credits
            };
          }
          return acc;
        })
      }));
    }
    setInlineAdding(null);
    setInlineAmount('');
    setInlineRef('');
  };

  const handleConfirmEditMovement = (accountId: string, side: 'debit' | 'credit', movId: string) => {
    if (!editingMovement) return;
    const cleanStr = editingMovement.amount.trim().replace(/,/g, '.');
    const parsed = Number(cleanStr);
    if (!isNaN(parsed) && parsed > 0) {
      setPracticeData(prev => ({
        ...prev,
        tAccounts: prev.tAccounts.map(acc => {
          if (acc.id === accountId) {
            const updateMov = (m: TMovement) => m.id === movId ? { ...m, amount: parsed } : m;
            return {
              ...acc,
              debits: side === 'debit' ? acc.debits.map(updateMov) : acc.debits,
              credits: side === 'credit' ? acc.credits.map(updateMov) : acc.credits
            };
          }
          return acc;
        })
      }));
    }
    setEditingMovement(null);
  };

  /* =========================================================================================
     2. PLANILLAS DE COSTOS: FORMATO DE CÁTEDRA (Imagen 4)
     ========================================================================================= */
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  const activeFacultySheet = practiceData.inventorySheets[activeSheetIndex] || practiceData.inventorySheets[0];

  const handleAddFacultySheet = () => {
    const newSheet: FacultyInventorySheet = {
      id: generateId('sheet_inv'),
      title: `Planilla de Inventario #${practiceData.inventorySheets.length + 1}`,
      productName: 'Mercadería',
      unitOfMeasure: 'Unidad',
      method: 'PEPS',
      rows: []
    };

    setPracticeData(prev => ({
      ...prev,
      inventorySheets: [...prev.inventorySheets, newSheet]
    }));
    setActiveSheetIndex(practiceData.inventorySheets.length);
  };

  const handleDeleteFacultySheet = (sheetId: string) => {
    if (practiceData.inventorySheets.length <= 1) {
      alert('Debes conservar al menos una planilla de inventario permanente.');
      return;
    }
    if (window.confirm('¿Deseas eliminar esta planilla de inventario permanente?')) {
      const remaining = practiceData.inventorySheets.filter(s => s.id !== sheetId);
      setPracticeData(prev => ({
        ...prev,
        inventorySheets: remaining
      }));
      setActiveSheetIndex(0);
    }
  };

  const handleChangeSheetMethod = (method: InventoryCostMethod) => {
    if (!activeFacultySheet) return;
    const recalculatedRows = recalculateInventorySheet(activeFacultySheet.rows, method);

    setPracticeData(prev => ({
      ...prev,
      inventorySheets: prev.inventorySheets.map(s => 
        s.id === activeFacultySheet.id ? { ...s, method, rows: recalculatedRows } : s
      )
    }));
  };

  const handleAddFacultyRow = (type: InventoryMovementType = 'COMPRA') => {
    if (!activeFacultySheet) return;
    const today = new Date().toISOString().slice(0, 10);
    const conceptDefault = 
      type === 'INICIAL' ? 'Existencia inicial según recuento' :
      type === 'COMPRA' ? 'Compra s/Factura A' :
      type === 'VENTA' ? 'Venta s/Factura B' :
      type === 'DEV_COMPRA' ? 'Devolución de compra a proveedor' :
      type === 'DEV_VENTA' ? 'Devolución de venta de cliente' : 'Ajuste de inventario';

    const newRow: FacultyInventoryRow = {
      id: generateId('inv_row'),
      date: today,
      concept: conceptDefault,
      type,
      inUnits: type === 'COMPRA' || type === 'INICIAL' ? 100 : 0,
      inUnitPrice: type === 'COMPRA' || type === 'INICIAL' ? 500 : 0,
      inTotal: 0,
      outUnits: type === 'VENTA' ? 50 : 0,
      outUnitPrice: 0,
      outTotal: 0,
      balanceUnits: 0,
      balanceUnitPrice: 0,
      balanceTotal: 0
    };

    const updatedRows = recalculateInventorySheet([...activeFacultySheet.rows, newRow], activeFacultySheet.method);

    setPracticeData(prev => ({
      ...prev,
      inventorySheets: prev.inventorySheets.map(s => 
        s.id === activeFacultySheet.id ? { ...s, rows: updatedRows } : s
      )
    }));
  };

  const handleUpdateFacultyRow = (rowId: string, field: keyof FacultyInventoryRow, value: any) => {
    if (!activeFacultySheet) return;
    const updatedRows = activeFacultySheet.rows.map(r => {
      if (r.id === rowId) {
        return { ...r, [field]: value };
      }
      return r;
    });

    const recalculated = recalculateInventorySheet(updatedRows, activeFacultySheet.method);

    setPracticeData(prev => ({
      ...prev,
      inventorySheets: prev.inventorySheets.map(s => 
        s.id === activeFacultySheet.id ? { ...s, rows: recalculated } : s
      )
    }));
  };

  const handleDeleteFacultyRow = (rowId: string) => {
    if (!activeFacultySheet) return;
    const filtered = activeFacultySheet.rows.filter(r => r.id !== rowId);
    const recalculated = recalculateInventorySheet(filtered, activeFacultySheet.method);

    setPracticeData(prev => ({
      ...prev,
      inventorySheets: prev.inventorySheets.map(s => 
        s.id === activeFacultySheet.id ? { ...s, rows: recalculated } : s
      )
    }));
  };

  // Métricas del inventario permanente de cátedra
  const sheetSummary = useMemo(() => {
    if (!activeFacultySheet || activeFacultySheet.rows.length === 0) {
      return { endingUnits: 0, endingTotal: 0, totalCMV: 0, totalPurchases: 0 };
    }
    const lastRow = activeFacultySheet.rows[activeFacultySheet.rows.length - 1];
    const endingUnits = lastRow ? lastRow.balanceUnits : 0;
    const endingTotal = lastRow ? lastRow.balanceTotal : 0;
    const totalCMV = round2(activeFacultySheet.rows.reduce((sum, r) => sum + (r.outTotal || 0), 0));
    const totalPurchases = round2(activeFacultySheet.rows.reduce((sum, r) => sum + (r.inTotal || 0), 0));

    return { endingUnits, endingTotal, totalCMV, totalPurchases };
  }, [activeFacultySheet]);

  /* =========================================================================================
     3. OTRAS PLANILLAS DE COSTOS (Genéricas / RT 17)
     ========================================================================================= */
  const activeGenericSheet = practiceData.genericCostSheets[0];

  const handleAddGenericRow = () => {
    if (!activeGenericSheet) return;
    const newRow: GenericCostRow = {
      id: generateId('gen_row'),
      concept: 'Concepto de costo',
      quantity: 1,
      unitCost: 0,
      total: 0,
      notes: ''
    };

    setPracticeData(prev => ({
      ...prev,
      genericCostSheets: prev.genericCostSheets.map(s => 
        s.id === activeGenericSheet.id ? { ...s, rows: [...s.rows, newRow] } : s
      )
    }));
  };

  const handleUpdateGenericRow = (rowId: string, field: keyof GenericCostRow, value: any) => {
    if (!activeGenericSheet) return;
    setPracticeData(prev => ({
      ...prev,
      genericCostSheets: prev.genericCostSheets.map(s => {
        if (s.id === activeGenericSheet.id) {
          return {
            ...s,
            rows: s.rows.map(r => {
              if (r.id === rowId) {
                const updated = { ...r, [field]: value };
                if (field === 'quantity' || field === 'unitCost') {
                  const qty = field === 'quantity' ? Number(value) || 0 : r.quantity;
                  const unit = field === 'unitCost' ? Number(value) || 0 : r.unitCost;
                  updated.total = round2(qty * unit);
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

  const handleDeleteGenericRow = (rowId: string) => {
    if (!activeGenericSheet) return;
    setPracticeData(prev => ({
      ...prev,
      genericCostSheets: prev.genericCostSheets.map(s => 
        s.id === activeGenericSheet.id ? { ...s, rows: s.rows.filter(r => r.id !== rowId) } : s
      )
    }));
  };

  const genericGrandTotal = useMemo(() => {
    if (!activeGenericSheet) return 0;
    return round2(activeGenericSheet.rows.reduce((sum, r) => sum + (r.total || 0), 0));
  }, [activeGenericSheet]);

  /* =========================================================================================
     4. LIBRO DIARIO MANUAL (AGRUPADO POR ASIENTO Y FECHA COMPARTIDA)
     ========================================================================================= */
  const journalTotals = useMemo(() => {
    const entries = practiceData.journalEntries || [];
    let totalDebit = 0;
    let totalCredit = 0;
    let totalLinesCount = 0;

    entries.forEach(entry => {
      entry.lines.forEach(l => {
        totalDebit += Number(l.debit) || 0;
        totalCredit += Number(l.credit) || 0;
        totalLinesCount++;
      });
    });

    totalDebit = round2(totalDebit);
    totalCredit = round2(totalCredit);
    const difference = round2(Math.abs(totalDebit - totalCredit));
    const isBalanced = difference === 0 && totalLinesCount > 0;
    return { 
      totalDebit, 
      totalCredit, 
      difference, 
      isBalanced, 
      entriesCount: entries.length, 
      linesCount: totalLinesCount 
    };
  }, [practiceData.journalEntries]);

  // Crear un nuevo asiento con fecha independiente y líneas iniciales
  const handleAddNewEntry = () => {
    const entries = practiceData.journalEntries || [];
    const nextEntry = entries.length > 0 
      ? Math.max(...entries.map(e => e.entryNumber || 1)) + 1 
      : 1;

    const newEntry: ManualJournalEntry = {
      id: generateId('pj_entry'),
      entryNumber: nextEntry,
      date: new Date().toISOString().slice(0, 10),
      lines: [
        {
          id: generateId('pj_line'),
          accountName: '',
          detail: '',
          debit: 0,
          credit: 0
        },
        {
          id: generateId('pj_line'),
          accountName: '',
          detail: '',
          debit: 0,
          credit: 0
        }
      ]
    };

    setPracticeData(prev => ({
      ...prev,
      journalEntries: [...(prev.journalEntries || []), newEntry]
    }));
  };

  // Modificar la fecha única compartida de un asiento específico (NO altera ningún otro asiento)
  const handleUpdateEntryDate = (entryId: string, newDate: string) => {
    setPracticeData(prev => ({
      ...prev,
      journalEntries: (prev.journalEntries || []).map(entry => 
        entry.id === entryId ? { ...entry, date: newDate } : entry
      )
    }));
  };

  // Agregar una línea contable adicional al mismo asiento
  const handleAddLineToEntry = (entryId: string) => {
    const newLine: ManualJournalLine = {
      id: generateId('pj_line'),
      accountName: '',
      detail: '',
      debit: 0,
      credit: 0
    };

    setPracticeData(prev => ({
      ...prev,
      journalEntries: (prev.journalEntries || []).map(entry => 
        entry.id === entryId ? { ...entry, lines: [...entry.lines, newLine] } : entry
      )
    }));
  };

  // Actualizar un campo de una línea específica dentro de un asiento
  const handleUpdateEntryLine = (entryId: string, lineId: string, field: keyof ManualJournalLine, value: any) => {
    setPracticeData(prev => ({
      ...prev,
      journalEntries: (prev.journalEntries || []).map(entry => {
        if (entry.id !== entryId) return entry;
        return {
          ...entry,
          lines: entry.lines.map(line => {
            if (line.id !== lineId) return line;
            return {
              ...line,
              [field]: (field === 'debit' || field === 'credit') ? Number(value) || 0 : value
            };
          })
        };
      })
    }));
  };

  // Eliminar una línea contable de un asiento
  const handleDeleteEntryLine = (entryId: string, lineId: string) => {
    setPracticeData(prev => ({
      ...prev,
      journalEntries: (prev.journalEntries || []).map(entry => {
        if (entry.id !== entryId) return entry;
        return {
          ...entry,
          lines: entry.lines.filter(line => line.id !== lineId)
        };
      })
    }));
  };

  // Eliminar un asiento completo con todas sus líneas
  const handleDeleteEntry = (entryId: string, entryNumber: number) => {
    if (window.confirm(`¿Estás seguro de eliminar el Asiento Nº ${entryNumber} y todas sus cuentas asociadas?`)) {
      setPracticeData(prev => ({
        ...prev,
        journalEntries: (prev.journalEntries || []).filter(entry => entry.id !== entryId)
      }));
    }
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
              Sistemas de Información Contable (SIC)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Práctica Contable
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-1">
            Espacio de trabajo para resolver ejercicios con <strong>Libro Mayor en cuentas en “T”</strong> clasificadas por rubro, <strong>Planilla al Costo de cátedra</strong> (Entrada, Salida y Saldo) y <strong>Libro Diario manual</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardado automático</span>
          </div>
          <button
            onClick={handleResetClean}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            title="Limpiar y reiniciar registros de práctica"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Vaciar Tablero</span>
          </button>
        </div>
      </div>

      {/* Pestañas Principales dentro de Práctica Contable */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActivePracticeTab('tAccounts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activePracticeTab === 'tAccounts'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GitCommitVertical className="w-4 h-4" />
          <span>1. Libro Mayor: Cuentas en “T”</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-indigo-200 font-mono">
            {practiceData.tAccounts.length} cuentas
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
          <span>2. Planilla al Costo (Inventario Permanente)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-indigo-200 font-mono">
            {activeFacultySheet?.rows.length || 0} movs.
          </span>
        </button>

        <button
          onClick={() => setActivePracticeTab('journal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activePracticeTab === 'journal'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>3. Libro Diario Manual</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-indigo-200 font-mono">
            {practiceData.journalEntries?.length || 0} asientos
          </span>
        </button>
      </div>

      {/* =========================================================================================
          HERRAMIENTA 1: LIBRO MAYOR CON CUENTAS EN "T" (4 Secciones Verticales)
          ========================================================================================= */}
      {activePracticeTab === 'tAccounts' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 no-print">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitCommitVertical className="w-4 h-4 text-indigo-400" />
                Espacio de Trabajo Visual: Cuentas en “T”
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Organizado en cuatro secciones según la clasificación contable: <strong>Activo</strong>, <strong>Pasivo</strong>, <strong>Patrimonio Neto</strong> y <strong>Resultados</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
                title="Descargar o imprimir Libro Mayor en PDF"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Descargar / Imprimir PDF</span>
              </button>
            </div>
          </div>

          {/* Encabezado formal exclusivo para el PDF impreso del Mayor */}
          <div className="hidden print:block mb-4 pb-2 border-b-2 border-slate-900">
            <h1 className="text-xl font-extrabold text-black uppercase tracking-tight">Libro Mayor: Cuentas en “T”</h1>
            <div className="flex justify-between items-center text-xs text-slate-700 mt-1">
              <span>Sistemas de Información Contable • Universidad</span>
              <span>Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}</span>
            </div>
          </div>

          {/* Grid de 4 Secciones Verticales (Activo, Pasivo, PN, Resultados) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
            {categories.map((cat) => {
              const categoryAccounts = practiceData.tAccounts.filter(a => a.category === cat.id);

              return (
                <div 
                  key={cat.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4 shadow-lg min-h-[500px] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Encabezado de la Sección */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                          <span>{cat.label}</span>
                        </h4>
                        <span className="text-[10px] text-slate-400">{cat.badge}</span>
                      </div>
                      <button
                        onClick={() => handleAddTAccount(cat.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-semibold border border-indigo-500/30 transition shadow-sm print:hidden"
                        title={`Agregar nueva cuenta en T en ${cat.label}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nueva T</span>
                      </button>
                    </div>

                    {/* Cuentas en T de esta Sección */}
                    {categoryAccounts.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800/80 rounded-xl p-4 print:hidden">
                        <p>Sin cuentas en {cat.label}.</p>
                        <button
                          onClick={() => handleAddTAccount(cat.id)}
                          className="mt-2 text-indigo-400 hover:text-indigo-300 font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Crear cuenta
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {categoryAccounts.map((account) => {
                          const totalDebit = round2(account.debits.reduce((s, m) => s + (Number(m.amount) || 0), 0));
                          const totalCredit = round2(account.credits.reduce((s, m) => s + (Number(m.amount) || 0), 0));
                          const balance = round2(Math.abs(totalDebit - totalCredit));
                          const nature: 'DEUDOR' | 'ACREEDOR' | 'SALDADA' = 
                            totalDebit > totalCredit ? 'DEUDOR' : totalCredit > totalDebit ? 'ACREEDOR' : 'SALDADA';

                          return (
                            <div 
                              key={account.id}
                              className="rounded-xl border border-slate-700/80 bg-slate-950 p-3 shadow-md space-y-2 group transition hover:border-indigo-500/60 print:bg-white print:border-black print:border-2 print:shadow-none"
                            >
                              {/* Nombre de la Cuenta (Parte Superior de la T) */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-800 print:border-black pb-1.5">
                                <div className="flex-1">
                                  <span className="hidden print:block font-extrabold text-black text-sm tracking-tight">
                                    {account.name || 'Sin Nombre'}
                                  </span>
                                  <input
                                    type="text"
                                    value={account.name}
                                    onChange={(e) => handleUpdateTAccountMeta(account.id, e.target.value, account.code)}
                                    placeholder="Nombre de la cuenta..."
                                    className="w-full bg-transparent text-xs font-bold text-white focus:outline-none focus:text-indigo-300 tracking-tight print:hidden"
                                  />
                                  {account.code && (
                                    <span className="text-[10px] text-slate-500 font-mono print:text-black">
                                      {account.code}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteTAccount(account.id)}
                                  className="text-slate-600 hover:text-rose-400 p-1 rounded transition opacity-60 group-hover:opacity-100 print:hidden"
                                  title="Eliminar cuenta en T"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Barra Horizontal Superior de la "T" Contable Tradicional */}
                              <div className="border-b-2 border-slate-200 print:border-black text-[10px] font-mono uppercase tracking-wider flex justify-between px-2 pb-0.5 text-slate-300 print:text-black font-bold">
                                <span>DEBE</span>
                                <span>HABER</span>
                              </div>

                              {/* Cuerpo de la "T" (Separador Vertical Central) */}
                              <div className="grid grid-cols-2 divide-x-2 divide-slate-200 print:divide-black text-xs font-mono min-h-[90px]">
                                
                                {/* Columna Izquierda: DEBE */}
                                <div className="pr-1.5 space-y-1">
                                  {account.debits.map((mov) => {
                                    const isEditing = editingMovement?.accountId === account.id && editingMovement.side === 'debit' && editingMovement.movId === mov.id;

                                    return (
                                      <div 
                                        key={mov.id}
                                        className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded hover:bg-slate-900 group/mov print:text-black"
                                      >
                                        <span className="text-slate-500 print:text-black font-semibold text-[10px]">{mov.ref ? `(${mov.ref})` : ''}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="hidden print:block font-bold text-black text-xs font-mono">
                                            {formatCurrency(mov.amount)}
                                          </span>
                                          <div className="print:hidden flex items-center gap-1">
                                            {isEditing ? (
                                              <div className="flex items-center gap-1">
                                                <input
                                                  type="number"
                                                  step="any"
                                                  autoFocus
                                                  value={editingMovement.amount}
                                                  onChange={(e) => setEditingMovement({ ...editingMovement, amount: e.target.value })}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleConfirmEditMovement(account.id, 'debit', mov.id);
                                                    if (e.key === 'Escape') setEditingMovement(null);
                                                  }}
                                                  className="w-16 px-1 py-0.2 bg-slate-900 text-blue-300 font-bold rounded border border-blue-500 text-xs text-right focus:outline-none"
                                                />
                                                <button
                                                  onClick={() => handleConfirmEditMovement(account.id, 'debit', mov.id)}
                                                  className="text-emerald-400 hover:text-emerald-300 font-bold text-xs"
                                                  title="Confirmar"
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  onClick={() => setEditingMovement(null)}
                                                  className="text-slate-500 hover:text-white text-xs"
                                                  title="Cancelar"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => setEditingMovement({ accountId: account.id, side: 'debit', movId: mov.id, amount: mov.amount.toString() })}
                                                className="text-blue-300 hover:underline font-semibold"
                                                title="Clic para editar importe"
                                              >
                                                {formatCurrency(mov.amount)}
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleDeleteTMovement(account.id, 'debit', mov.id)}
                                              className="text-slate-600 hover:text-rose-400 opacity-0 group-hover/mov:opacity-100 transition text-[9px]"
                                              title="Eliminar"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Inserción Rápida Inline o Botón + Debe */}
                                  <div className="print:hidden">
                                    {inlineAdding?.accountId === account.id && inlineAdding.side === 'debit' ? (
                                      <div className="p-1 rounded bg-blue-950/40 border border-blue-500/50 space-y-1 my-1">
                                        <input
                                          type="number"
                                          step="any"
                                          autoFocus
                                          placeholder="$ Monto"
                                          value={inlineAmount}
                                          onChange={(e) => setInlineAmount(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleConfirmInlineMovement(account.id, 'debit');
                                            if (e.key === 'Escape') setInlineAdding(null);
                                          }}
                                          className="w-full px-1.5 py-0.5 bg-slate-950 text-blue-200 font-bold rounded border border-slate-700 text-xs focus:outline-none focus:border-blue-400 text-right"
                                        />
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            placeholder="Ref. (opc)"
                                            value={inlineRef}
                                            onChange={(e) => setInlineRef(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleConfirmInlineMovement(account.id, 'debit');
                                              if (e.key === 'Escape') setInlineAdding(null);
                                            }}
                                            className="w-full px-1 py-0.5 bg-slate-950 text-slate-300 rounded border border-slate-700 text-[10px] focus:outline-none"
                                          />
                                          <button
                                            onClick={() => handleConfirmInlineMovement(account.id, 'debit')}
                                            className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                                          >
                                            ✓
                                          </button>
                                          <button
                                            onClick={() => setInlineAdding(null)}
                                            className="px-1 text-slate-400 hover:text-white text-[10px]"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setInlineAdding({ accountId: account.id, side: 'debit' });
                                          setInlineAmount('');
                                          setInlineRef('');
                                        }}
                                        className="w-full mt-1 py-0.5 text-[10px] text-slate-500 hover:text-blue-300 hover:bg-slate-900 rounded border border-dashed border-slate-800 transition"
                                      >
                                        + Debe
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Columna Derecha: HABER */}
                                <div className="pl-1.5 space-y-1">
                                  {account.credits.map((mov) => {
                                    const isEditing = editingMovement?.accountId === account.id && editingMovement.side === 'credit' && editingMovement.movId === mov.id;

                                    return (
                                      <div 
                                        key={mov.id}
                                        className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded hover:bg-slate-900 group/mov print:text-black"
                                      >
                                        <span className="text-slate-500 print:text-black font-semibold text-[10px]">{mov.ref ? `(${mov.ref})` : ''}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="hidden print:block font-bold text-black text-xs font-mono">
                                            {formatCurrency(mov.amount)}
                                          </span>
                                          <div className="print:hidden flex items-center gap-1">
                                            {isEditing ? (
                                              <div className="flex items-center gap-1">
                                                <input
                                                  type="number"
                                                  step="any"
                                                  autoFocus
                                                  value={editingMovement.amount}
                                                  onChange={(e) => setEditingMovement({ ...editingMovement, amount: e.target.value })}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleConfirmEditMovement(account.id, 'credit', mov.id);
                                                    if (e.key === 'Escape') setEditingMovement(null);
                                                  }}
                                                  className="w-16 px-1 py-0.2 bg-slate-900 text-emerald-300 font-bold rounded border border-emerald-500 text-xs text-right focus:outline-none"
                                                />
                                                <button
                                                  onClick={() => handleConfirmEditMovement(account.id, 'credit', mov.id)}
                                                  className="text-emerald-400 hover:text-emerald-300 font-bold text-xs"
                                                  title="Confirmar"
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  onClick={() => setEditingMovement(null)}
                                                  className="text-slate-500 hover:text-white text-xs"
                                                  title="Cancelar"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => setEditingMovement({ accountId: account.id, side: 'credit', movId: mov.id, amount: mov.amount.toString() })}
                                                className="text-emerald-300 hover:underline font-semibold"
                                                title="Clic para editar importe"
                                              >
                                                {formatCurrency(mov.amount)}
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleDeleteTMovement(account.id, 'credit', mov.id)}
                                              className="text-slate-600 hover:text-rose-400 opacity-0 group-hover/mov:opacity-100 transition text-[9px]"
                                              title="Eliminar"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Inserción Rápida Inline o Botón + Haber */}
                                  <div className="print:hidden">
                                    {inlineAdding?.accountId === account.id && inlineAdding.side === 'credit' ? (
                                      <div className="p-1 rounded bg-emerald-950/40 border border-emerald-500/50 space-y-1 my-1">
                                        <input
                                          type="number"
                                          step="any"
                                          autoFocus
                                          placeholder="$ Monto"
                                          value={inlineAmount}
                                          onChange={(e) => setInlineAmount(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleConfirmInlineMovement(account.id, 'credit');
                                            if (e.key === 'Escape') setInlineAdding(null);
                                          }}
                                          className="w-full px-1.5 py-0.5 bg-slate-950 text-emerald-200 font-bold rounded border border-slate-700 text-xs focus:outline-none focus:border-emerald-400 text-right"
                                        />
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            placeholder="Ref. (opc)"
                                            value={inlineRef}
                                            onChange={(e) => setInlineRef(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleConfirmInlineMovement(account.id, 'credit');
                                              if (e.key === 'Escape') setInlineAdding(null);
                                            }}
                                            className="w-full px-1 py-0.5 bg-slate-950 text-slate-300 rounded border border-slate-700 text-[10px] focus:outline-none"
                                          />
                                          <button
                                            onClick={() => handleConfirmInlineMovement(account.id, 'credit')}
                                            className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                                          >
                                            ✓
                                          </button>
                                          <button
                                            onClick={() => setInlineAdding(null)}
                                            className="px-1 text-slate-400 hover:text-white text-[10px]"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setInlineAdding({ accountId: account.id, side: 'credit' });
                                          setInlineAmount('');
                                          setInlineRef('');
                                        }}
                                        className="w-full mt-1 py-0.5 text-[10px] text-slate-500 hover:text-emerald-300 hover:bg-slate-900 rounded border border-dashed border-slate-800 transition"
                                      >
                                        + Haber
                                      </button>
                                    )}
                                  </div>
                                </div>

                              </div>

                              {/* Pie de la Cuenta en T: Totales y Saldo Calculado */}
                              <div className="border-t-2 border-slate-200 print:border-black pt-1.5 font-mono text-xs">
                                <div className="grid grid-cols-2 divide-x-2 divide-slate-200 print:divide-black pb-1.5 text-[11px]">
                                  <div className="pr-1 text-right font-bold text-blue-300 print:text-black">
                                    {formatCurrency(totalDebit)}
                                  </div>
                                  <div className="pl-1 text-right font-bold text-emerald-300 print:text-black">
                                    {formatCurrency(totalCredit)}
                                  </div>
                                </div>

                                <div className={`p-1.5 rounded-lg text-center font-bold text-[11px] border print:bg-slate-100 print:text-black print:border-black ${
                                  nature === 'DEUDOR' 
                                    ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' 
                                    : nature === 'ACREEDOR' 
                                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' 
                                      : 'bg-slate-900 text-slate-400 border-slate-800'
                                }`}>
                                  {nature === 'SALDADA' ? (
                                    <span>Cuenta Saldada ($ 0,00)</span>
                                  ) : (
                                    <span>Saldo {nature}: {formatCurrency(balance)}</span>
                                  )}
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 text-center print:hidden">
                    <button
                      onClick={() => handleAddTAccount(cat.id)}
                      className="w-full py-1.5 text-xs text-slate-400 hover:text-white rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition"
                    >
                      + Agregar otra cuenta en {cat.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* =========================================================================================
          HERRAMIENTA 2: PLANILLA AL COSTO (FORMATO DE CÁTEDRA - Imagen 4)
          ========================================================================================= */}
      {activePracticeTab === 'costs' && (
        <div className="space-y-5">
          
          {/* Sub-selector entre Planilla de Cátedra y Otras Planillas */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCostToolTab('inventory')}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition ${
                  costToolTab === 'inventory' 
                    ? 'bg-cyan-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Planilla al Costo (Inventario Permanente - Cátedra)
              </button>
              <button
                onClick={() => setCostToolTab('generic')}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition ${
                  costToolTab === 'generic' 
                    ? 'bg-cyan-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Otras Planillas de Costos (RT 17 / Reacondicionamiento)
              </button>
            </div>

            {costToolTab === 'inventory' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm no-print"
                  title="Descargar o imprimir Planilla al Costo en PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Descargar / Imprimir PDF</span>
                </button>
                <button
                  onClick={handleAddFacultySheet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition no-print"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Planilla</span>
                </button>
                {activeFacultySheet && (
                  <button
                    onClick={() => handleDeleteFacultySheet(activeFacultySheet.id)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition no-print"
                    title="Eliminar planilla actual"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* VISTA A: PLANILLA DE CÁTEDRA (Imagen 4) */}
          {costToolTab === 'inventory' && activeFacultySheet && (
            <div className="space-y-4">
              
              {/* Encabezado formal exclusivo para el PDF impreso de la Planilla */}
              <div className="hidden print:block mb-4 pb-2 border-b-2 border-slate-900">
                <h1 className="text-xl font-extrabold text-black uppercase tracking-tight">Planilla al Costo — Inventario Permanente ({activeFacultySheet.method})</h1>
                <div className="flex justify-between items-center text-xs text-slate-700 mt-1">
                  <span>Producto: {activeFacultySheet.productName} • Unidad de Medida: {activeFacultySheet.unitOfMeasure}</span>
                  <span>Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}</span>
                </div>
              </div>

              {/* Encabezado Formal de la Planilla según Imagen 4 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                      PLANILLA AL COSTO — Método de Inventario Permanente: {activeFacultySheet.method}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>Producto / Bien: <strong className="text-slate-200">{activeFacultySheet.productName}</strong></span>
                      <span>•</span>
                      <span>Unidad de Medida: <strong className="text-slate-200">{activeFacultySheet.unitOfMeasure}</strong></span>
                    </div>
                  </div>

                  {/* Selector del Método de Valuación (PEPS, UEPS, PPP, Identificación Específica) */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 no-print">
                    {(['PEPS', 'UEPS', 'PPP', 'ESPECIFICA'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => handleChangeSheetMethod(m)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                          activeFacultySheet.method === m 
                            ? 'bg-cyan-600 text-white shadow-sm' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tarjetas de Resumen en Vivo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Stock en Saldo Final</span>
                    <div className="text-base font-bold text-white mt-0.5">
                      {formatQuantity(sheetSummary.endingUnits)} {activeFacultySheet.unitOfMeasure}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Valuación Inventario Final</span>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">
                      {formatCurrency(sheetSummary.endingTotal)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Total Salidas (CMV)</span>
                    <div className="text-base font-bold text-rose-400 mt-0.5">
                      {formatCurrency(sheetSummary.totalCMV)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Total Entradas (Compras)</span>
                    <div className="text-base font-bold text-blue-300 mt-0.5">
                      {formatCurrency(sheetSummary.totalPurchases)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Carga Rápida de Operaciones */}
              <div className="flex items-center gap-2 flex-wrap no-print">
                <button
                  onClick={() => handleAddFacultyRow('COMPRA')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Entrada (Compra / Ingreso)</span>
                </button>
                <button
                  onClick={() => handleAddFacultyRow('VENTA')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Salida (Venta / CMV)</span>
                </button>
                <button
                  onClick={() => handleAddFacultyRow('DEV_COMPRA')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 transition"
                  title="Devolución de compras (restando en Entrada)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Devolución Compra</span>
                </button>
                <button
                  onClick={() => handleAddFacultyRow('DEV_VENTA')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-medium border border-slate-700 transition"
                  title="Devolución de ventas (restando en Salida)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Devolución Venta</span>
                </button>
              </div>

              {/* TABLA DE 11 COLUMNAS AGRUPADAS EN 3 BLOQUES (IMAGEN 4) */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    {/* Fila Superior: Agrupación en Entrada, Salida y Saldo */}
                    <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800 text-center">
                      <th colSpan={2} className="py-2.5 px-3 border-r border-slate-800">
                        Operación
                      </th>
                      <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-blue-300 bg-blue-950/30 font-extrabold tracking-wider">
                        Entrada
                      </th>
                      <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-rose-300 bg-rose-950/30 font-extrabold tracking-wider">
                        Salida
                      </th>
                      <th colSpan={3} className="py-2.5 px-3 text-emerald-300 bg-emerald-950/30 font-extrabold tracking-wider">
                        Saldo
                      </th>
                      <th className="py-2.5 px-2 w-10 print:hidden"></th>
                    </tr>

                    {/* Fila Inferior de Columnas Específicas */}
                    <tr className="bg-slate-950/90 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <th className="py-2 px-3 w-28">Fecha</th>
                      <th className="py-2 px-3 w-48 border-r border-slate-800 font-sans">Concepto</th>

                      {/* Entrada */}
                      <th className="py-2 px-2.5 text-right bg-blue-950/15">Unid</th>
                      <th className="py-2 px-2.5 text-right bg-blue-950/15">P. U.</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-800 bg-blue-950/15 font-bold text-blue-300">Total</th>

                      {/* Salida */}
                      <th className="py-2 px-2.5 text-right bg-rose-950/15">Unid</th>
                      <th className="py-2 px-2.5 text-right bg-rose-950/15">P. U.</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-800 bg-rose-950/15 font-bold text-rose-300">Total</th>

                      {/* Saldo */}
                      <th className="py-2 px-2.5 text-right bg-emerald-950/15">Unid</th>
                      <th className="py-2 px-2.5 text-right bg-emerald-950/15">P. U.</th>
                      <th className="py-2 px-2.5 text-right bg-emerald-950/15 font-bold text-emerald-300">Total</th>

                      <th className="py-2 px-2 text-center print:hidden">Acción</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                    {activeFacultySheet.rows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-10 text-center text-slate-500 font-sans">
                          No hay operaciones cargadas en la planilla. Haz clic en <strong>+ Entrada</strong> o <strong>+ Salida</strong> para comenzar.
                        </td>
                      </tr>
                    ) : (
                      activeFacultySheet.rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-800/40 transition group">
                          
                          {/* Fecha */}
                          <td className="py-2 px-2">
                            <span className="hidden print:block font-mono text-black font-semibold text-xs">
                              {row.date || '—'}
                            </span>
                            <input
                              type="date"
                              value={row.date}
                              onChange={(e) => handleUpdateFacultyRow(row.id, 'date', e.target.value)}
                              className="w-full px-2 py-1 text-slate-300 rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-[11px] print:hidden"
                            />
                          </td>

                          {/* Concepto */}
                          <td className="py-2 px-2 border-r border-slate-800 font-sans">
                            <span className="hidden print:block font-bold text-black text-xs">
                              {row.concept || '—'}
                            </span>
                            <input
                              type="text"
                              value={row.concept}
                              onChange={(e) => handleUpdateFacultyRow(row.id, 'concept', e.target.value)}
                              placeholder="Compra, Venta, etc."
                              className="w-full px-2 py-1 text-white font-medium rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs print:hidden"
                            />
                          </td>

                          {/* Entrada: Unidades */}
                          <td className="py-2 px-1.5 bg-blue-950/5">
                            <span className="hidden print:block text-right font-mono font-bold text-black text-xs">
                              {row.inUnits > 0 ? formatQuantity(row.inUnits) : '—'}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={row.inUnits || ''}
                              onChange={(e) => handleUpdateFacultyRow(row.id, 'inUnits', e.target.value)}
                              placeholder="0"
                              disabled={row.outUnits > 0 && row.type === 'VENTA'}
                              className="w-20 px-2 py-1 text-right text-blue-200 font-bold rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-blue-500 text-xs disabled:opacity-30 print:hidden"
                            />
                          </td>

                          {/* Entrada: P. U. */}
                          <td className="py-2 px-1.5 bg-blue-950/5">
                            <span className="hidden print:block text-right font-mono text-black text-xs">
                              {row.inUnitPrice > 0 ? formatCurrency(row.inUnitPrice) : '—'}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={row.inUnitPrice || ''}
                              onChange={(e) => handleUpdateFacultyRow(row.id, 'inUnitPrice', e.target.value)}
                              placeholder="0.00"
                              disabled={row.outUnits > 0 && row.type === 'VENTA'}
                              className="w-24 px-2 py-1 text-right text-slate-300 rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-blue-500 text-xs disabled:opacity-30 print:hidden"
                            />
                          </td>

                          {/* Entrada: Total */}
                          <td className="py-2 px-2 text-right border-r border-slate-800 bg-blue-950/5 font-bold text-blue-300 whitespace-nowrap min-w-[95px]">
                            {row.inTotal > 0 ? formatCurrency(row.inTotal) : '-'}
                          </td>

                          {/* Salida: Unidades */}
                          <td className="py-2 px-1.5 bg-rose-950/5">
                            <span className="hidden print:block text-right font-mono font-bold text-black text-xs">
                              {row.outUnits > 0 ? formatQuantity(row.outUnits) : '—'}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={row.outUnits || ''}
                              onChange={(e) => handleUpdateFacultyRow(row.id, 'outUnits', e.target.value)}
                              placeholder="0"
                              disabled={row.inUnits > 0 && row.type !== 'VENTA' && row.type !== 'DEV_VENTA'}
                              className="w-20 px-2 py-1 text-right text-rose-200 font-bold rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-rose-500 text-xs disabled:opacity-30 print:hidden"
                            />
                          </td>

                          {/* Salida: P. U. (Calculado automáticamente por el método o editable) */}
                          <td className="py-2 px-2 text-right bg-rose-950/5 text-slate-300 whitespace-nowrap min-w-[85px]">
                            {row.outUnitPrice > 0 ? formatCurrency(row.outUnitPrice) : '-'}
                          </td>

                          {/* Salida: Total (CMV calculado) */}
                          <td className="py-2 px-2 text-right border-r border-slate-800 bg-rose-950/5 font-bold text-rose-300 whitespace-nowrap min-w-[95px]">
                            {row.outTotal > 0 ? formatCurrency(row.outTotal) : '-'}
                          </td>

                          {/* Saldo: Unidades */}
                          <td className="py-2 px-2 text-right bg-emerald-950/5 font-bold text-white whitespace-nowrap min-w-[70px]">
                            {formatQuantity(row.balanceUnits)}
                          </td>

                          {/* Saldo: P. U. */}
                          <td className="py-2 px-2 text-right bg-emerald-950/5 text-slate-300 whitespace-nowrap min-w-[85px]">
                            {formatCurrency(row.balanceUnitPrice)}
                          </td>

                          {/* Saldo: Total */}
                          <td className="py-2 px-2 text-right bg-emerald-950/5 font-bold text-emerald-300 whitespace-nowrap min-w-[95px]">
                            {formatCurrency(row.balanceTotal)}
                          </td>

                          {/* Eliminar Fila */}
                          <td className="py-2 px-2 text-center print:hidden">
                            <button
                              onClick={() => handleDeleteFacultyRow(row.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition opacity-60 group-hover:opacity-100"
                              title="Eliminar operación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Fila de Totales de Control */}
                  <tfoot className="bg-slate-950 text-white font-bold font-mono border-t-2 border-slate-800 text-xs">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 uppercase font-sans text-right border-r border-slate-800">
                        Totales:
                      </td>
                      <td colSpan={2} className="py-3 px-2 text-right text-slate-400 font-sans">Total Entradas:</td>
                      <td className="py-3 px-2 text-right text-blue-300 border-r border-slate-800">
                        {formatCurrency(sheetSummary.totalPurchases)}
                      </td>
                      <td colSpan={2} className="py-3 px-2 text-right text-slate-400 font-sans">Total Salidas (CMV):</td>
                      <td className="py-3 px-2 text-right text-rose-300 border-r border-slate-800">
                        {formatCurrency(sheetSummary.totalCMV)}
                      </td>
                      <td colSpan={2} className="py-3 px-2 text-right text-slate-400 font-sans">Saldo Final:</td>
                      <td className="py-3 px-2 text-right text-emerald-300">
                        {formatCurrency(sheetSummary.endingTotal)}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Nota Explicativa Didáctica de Cátedra (según Imagen 4) */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/30 space-y-1">
                  <strong className="text-blue-300 block">En las ENTRADAS:</strong>
                  <span>Se detallan las unidades compradas y devoluciones de compras (restando) al precio unitario (costo). Luego se calcula el Total.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 space-y-1">
                  <strong className="text-rose-300 block">En las SALIDAS:</strong>
                  <span>En base al MÉTODO utilizado ({activeFacultySheet.method}), se detallan las unidades vendidas y devoluciones al COSTO correspondiente.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-1">
                  <strong className="text-emerald-300 block">El SALDO:</strong>
                  <span>Demuestra las unidades en STOCK al precio establecido según la valuación vigente tras cada movimiento.</span>
                </div>
              </div>

            </div>
          )}

          {/* VISTA B: OTRAS PLANILLAS DE COSTOS (Genéricas / RT 17) */}
          {costToolTab === 'generic' && activeGenericSheet && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeGenericSheet.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeGenericSheet.description}</p>
                </div>
                <div className="font-mono text-right bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Total Costo Determinado</span>
                  <span className="text-lg font-bold text-cyan-400">{formatCurrency(genericGrandTotal)}</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                      <th className="py-3 px-3">Componente / Concepto del Costo</th>
                      <th className="py-3 px-3 w-28 text-right">Cantidad</th>
                      <th className="py-3 px-3 w-36 text-right">Costo Unitario ($)</th>
                      <th className="py-3 px-3 w-36 text-right">Total ($)</th>
                      <th className="py-3 px-3 w-48 font-sans">Observaciones</th>
                      <th className="py-3 px-2 w-10 text-center print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                    {activeGenericSheet.rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                          Sin conceptos de costo cargados. Haz clic en "Agregar Concepto".
                        </td>
                      </tr>
                    ) : (
                      activeGenericSheet.rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-800/40 transition group">
                          <td className="py-2 px-2 font-sans">
                            <span className="hidden print:block font-bold text-black text-xs">
                              {row.concept || '—'}
                            </span>
                            <input
                              type="text"
                              value={row.concept}
                              onChange={(e) => handleUpdateGenericRow(row.id, 'concept', e.target.value)}
                              placeholder="Flete, Seguro, Embalaje, etc."
                              className="w-full px-2 py-1 text-white font-medium rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs print:hidden"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <span className="hidden print:block text-right font-mono font-bold text-black text-xs">
                              {formatQuantity(row.quantity)}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={row.quantity}
                              onChange={(e) => handleUpdateGenericRow(row.id, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 text-right text-slate-300 rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs font-bold print:hidden"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <span className="hidden print:block text-right font-mono text-black text-xs">
                              {formatCurrency(row.unitCost)}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={row.unitCost}
                              onChange={(e) => handleUpdateGenericRow(row.id, 'unitCost', e.target.value)}
                              className="w-full px-2 py-1 text-right text-slate-300 rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs print:hidden"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-cyan-400 print:text-black">
                            {formatCurrency(row.total)}
                          </td>
                          <td className="py-2 px-2 font-sans">
                            <span className="hidden print:block text-slate-800 text-xs italic">
                              {row.notes || '—'}
                            </span>
                            <input
                              type="text"
                              value={row.notes || ''}
                              onChange={(e) => handleUpdateGenericRow(row.id, 'notes', e.target.value)}
                              placeholder="Observación..."
                              className="w-full px-2 py-1 text-slate-400 rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-cyan-500 text-[11px] print:hidden"
                            />
                          </td>
                          <td className="py-2 px-2 text-center print:hidden">
                            <button
                              onClick={() => handleDeleteGenericRow(row.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
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
                        Costo Total Determinado:
                      </td>
                      <td className="py-3 px-3 text-right text-cyan-400 print:text-black text-sm">
                        {formatCurrency(genericGrandTotal)}
                      </td>
                      <td colSpan={2} className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end pt-1 no-print">
                <button
                  onClick={handleAddGenericRow}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Concepto</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================================
          HERRAMIENTA 3: LIBRO DIARIO MANUAL (AGRUPADO POR ASIENTO Y FECHA COMPARTIDA)
          ========================================================================================= */}
      {activePracticeTab === 'journal' && (
        <div className="space-y-6">
          
          {/* Tarjetas de Resumen Global de Partida Doble */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Total General al Debe</span>
              <div className="text-xl font-bold text-blue-300 font-mono mt-0.5">
                {formatCurrency(journalTotals.totalDebit)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Total General al Haber</span>
              <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">
                {formatCurrency(journalTotals.totalCredit)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Asientos Registrados</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {journalTotals.entriesCount} <span className="text-xs text-slate-400 font-normal">({journalTotals.linesCount} líneas)</span>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Balance General</span>
              <div className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${
                journalTotals.isBalanced ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {journalTotals.isBalanced ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Partida Doble Balanceada ✓</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Diferencia: {formatCurrency(journalTotals.difference)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Barra de Acciones y Explicación */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Asientos Contables Registrados
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cada asiento comparte una <strong>única fecha editable</strong> para todas sus cuentas. Puedes agregar tantas líneas como necesites a un asiento o crear nuevos asientos con fecha independiente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
                title="Descargar reporte del Libro Diario en PDF o imprimir"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Descargar / Imprimir PDF</span>
              </button>
              <button
                onClick={handleAddNewEntry}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Asiento</span>
              </button>
            </div>
          </div>

          {/* Encabezado formal visible solo al Imprimir / Guardar como PDF */}
          <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-extrabold text-black uppercase tracking-tight">Libro Diario Contable</h1>
                <p className="text-xs text-slate-700 font-medium">Sistemas de Información Contable • Registro por Operaciones Asentadas</p>
              </div>
              <div className="text-right text-xs text-slate-800">
                <div className="font-semibold">Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}</div>
                <div className="font-bold text-emerald-800">
                  {journalTotals.isBalanced ? 'Partida Doble Cuadrada (Debe = Haber)' : `Diferencia: ${formatCurrency(journalTotals.difference)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Asientos Contables Agrupados */}
          {(!practiceData.journalEntries || practiceData.journalEntries.length === 0) ? (
            <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">No hay asientos contables registrados</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Comienza creando tu primer asiento contable con su fecha única compartida y agrupa debajo todas las cuentas pertenecientes a esa operación.
                </p>
              </div>
              <button
                onClick={handleAddNewEntry}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Asiento Nº 1</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {practiceData.journalEntries.map((entry) => {
                const entryDebit = round2(entry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0));
                const entryCredit = round2(entry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0));
                const entryDiff = round2(Math.abs(entryDebit - entryCredit));
                const isEntryBalanced = entryDiff === 0 && (entryDebit > 0 || entryCredit > 0);

                return (
                  <div 
                    key={entry.id} 
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden print:border-black print:bg-white print:shadow-none print:break-inside-avoid"
                  >
                    {/* Encabezado del Asiento (Número, Fecha Única Compartida y Estado de Balance) */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800 print:bg-slate-100 print:border-black">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Número de Asiento */}
                        <span className="font-mono font-extrabold px-3 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs flex items-center gap-1.5 print:bg-transparent print:border-black print:text-black">
                          <span>Asiento Nº {entry.entryNumber}</span>
                        </span>

                        {/* Fecha Única Compartida para todas las líneas de este asiento */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 no-print">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Fecha:</span>
                          </label>
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => handleUpdateEntryDate(entry.id, e.target.value)}
                            className="px-2.5 py-1 text-xs font-mono font-semibold text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 no-print"
                          />
                          <span className="hidden print:inline font-mono font-bold text-black text-xs">
                            Fecha: {entry.date ? formatDate(entry.date) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Estado de balance de este asiento + Acciones */}
                      <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border print:border-black print:text-black ${
                          isEntryBalanced 
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 print:bg-slate-50' 
                            : 'bg-amber-950/40 text-amber-300 border-amber-800/40 print:bg-slate-50'
                        }`}>
                          {isEntryBalanced ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                              <span>Cuadrado ({formatCurrency(entryDebit)})</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 print:text-black" />
                              <span>Descuadre: {formatCurrency(entryDiff)}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 no-print">
                          <button
                            onClick={() => handleAddLineToEntry(entry.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-semibold border border-indigo-500/30 transition shadow-sm"
                            title="Agregar cuenta / partida a este asiento"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Línea</span>
                          </button>

                          <button
                            onClick={() => handleDeleteEntry(entry.id, entry.entryNumber)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/40 transition"
                            title={`Eliminar Asiento Nº ${entry.entryNumber}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Cuentas del Asiento */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                            <th className="py-2.5 px-3 min-w-[220px] font-sans">Cuenta Contable</th>
                            <th className="py-2.5 px-3 min-w-[260px] font-sans">Detalle / Glosa</th>
                            <th className="py-2.5 px-3 w-36 text-right">Debe ($)</th>
                            <th className="py-2.5 px-3 w-36 text-right">Haber ($)</th>
                            <th className="py-2.5 px-2 w-10 text-center print:hidden">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                          {entry.lines.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-slate-500 font-sans text-xs">
                                Este asiento no tiene líneas contables. Haz clic en <strong>+ Línea</strong> para comenzar a cargar cuentas.
                              </td>
                            </tr>
                          ) : (
                            entry.lines.map((line) => (
                              <tr key={line.id} className="hover:bg-slate-800/40 transition group">
                                
                                {/* Cuenta Contable */}
                                <td className="py-2 px-3 font-sans">
                                  <span className="hidden print:block font-bold text-black text-sm tracking-tight">
                                    {line.accountName || '—'}
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="Cuenta (ej. Caja, Ventas, Proveedores)..."
                                    value={line.accountName}
                                    onChange={(e) => handleUpdateEntryLine(entry.id, line.id, 'accountName', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-white font-semibold rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs print:hidden"
                                  />
                                </td>

                                {/* Detalle / Glosa */}
                                <td className="py-2 px-3 font-sans">
                                  <span className="hidden print:block text-slate-900 text-xs leading-relaxed italic">
                                    {line.detail || '—'}
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="Detalle o glosa (ej. Por cobranza, Según FC A)..."
                                    value={line.detail}
                                    onChange={(e) => handleUpdateEntryLine(entry.id, line.id, 'detail', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-slate-300 rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs print:hidden"
                                  />
                                </td>

                                {/* Debe ($) */}
                                <td className="py-2 px-3 text-right">
                                  <span className="hidden print:block font-mono font-bold text-black text-sm">
                                    {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={line.debit || ''}
                                    onChange={(e) => handleUpdateEntryLine(entry.id, line.id, 'debit', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-2 py-1.5 text-right font-bold text-blue-300 rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-blue-500 text-xs print:hidden"
                                  />
                                </td>

                                {/* Haber ($) */}
                                <td className="py-2 px-3 text-right">
                                  <span className="hidden print:block font-mono font-bold text-black text-sm">
                                    {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={line.credit || ''}
                                    onChange={(e) => handleUpdateEntryLine(entry.id, line.id, 'credit', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-2 py-1.5 text-right font-bold text-emerald-300 rounded bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs print:hidden"
                                  />
                                </td>

                                {/* Acción (Eliminar línea) */}
                                <td className="py-2 px-2 text-center print:hidden">
                                  <button
                                    onClick={() => handleDeleteEntryLine(entry.id, line.id)}
                                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                                    title="Eliminar partida"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {/* Subtotales del Asiento */}
                        <tfoot className="bg-slate-950/60 font-mono text-xs border-t border-slate-800 print:bg-slate-50 print:border-black">
                          <tr>
                            <td colSpan={2} className="py-2 px-3 font-sans text-right text-slate-400 print:text-black font-semibold text-[11px]">
                              Totales Asiento Nº {entry.entryNumber}:
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-blue-300 print:text-black font-mono">
                              {formatCurrency(entryDebit)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-300 print:text-black font-mono">
                              {formatCurrency(entryCredit)}
                            </td>
                            <td className="print:hidden"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Barra inferior del Asiento para añadir línea rápidamente */}
                    <div className="px-4 py-2 bg-slate-950/30 border-t border-slate-800/60 flex justify-end no-print">
                      <button
                        onClick={() => handleAddLineToEntry(entry.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Agregar otra cuenta a este asiento</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botones al pie del Libro Diario */}
          {practiceData.journalEntries && practiceData.journalEntries.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Guardar / Descargar PDF</span>
              </button>

              <button
                onClick={handleAddNewEntry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Crear Nuevo Asiento (con fecha independiente)</span>
              </button>
            </div>
          )}

          {/* Resumen Final en Impresión PDF */}
          <div className="hidden print:block mt-6 pt-3 border-t-2 border-black font-mono text-xs">
            <div className="flex justify-between items-center font-bold">
              <span>TOTAL GENERAL DEL LIBRO DIARIO:</span>
              <div className="flex gap-8">
                <span>TOTAL DEBE: {formatCurrency(journalTotals.totalDebit)}</span>
                <span>TOTAL HABER: {formatCurrency(journalTotals.totalCredit)}</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
