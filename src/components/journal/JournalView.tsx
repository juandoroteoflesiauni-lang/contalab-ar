import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  FileSpreadsheet, 
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Printer
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency, formatDate } from '../../utils/currency';

export const JournalView: React.FC = () => {
  const { 
    journalEntries, 
    activeExercise, 
    activeMethod,
    trialBalance
  } = useAccounting();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'TRADICIONAL' | 'TARJETAS'>('TRADICIONAL');

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = 
      entry.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.gloss.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.lines.some(l => 
        l.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.accountCode.includes(searchTerm)
      );
    return matchesSearch;
  });

  const totalJournalDebit = journalEntries.reduce((sum, e) => sum + e.totalDebit, 0);
  const totalJournalCredit = journalEntries.reduce((sum, e) => sum + e.totalCredit, 0);

  return (
    <div className="space-y-6">
      
      {/* Cabecera y Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Libro Diario General
          </h2>
          <p className="text-xs text-slate-400">
            Registro cronológico formal de asientos por el principio universal de partida doble
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Toggle de formato de visualización */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('TRADICIONAL')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'TRADICIONAL' 
                  ? 'bg-indigo-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Formato Tabular Clásico
            </button>
            <button
              onClick={() => setViewMode('TARJETAS')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'TARJETAS' 
                  ? 'bg-indigo-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vista de Asientos
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition no-print"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Barra de Auditoría de Partida Doble */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Total Asientos al Debe</span>
          <div className="text-lg font-bold text-white font-mono mt-0.5">
            {formatCurrency(totalJournalDebit)}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Total Asientos al Haber</span>
          <div className="text-lg font-bold text-white font-mono mt-0.5">
            {formatCurrency(totalJournalCredit)}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Estado de Balance</span>
            <div className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${
              trialBalance.isSumsBalanced ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {trialBalance.isSumsBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cuadrado al 100%</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Diferencia: {formatCurrency(trialBalance.sumsDifference)}</span>
                </>
              )}
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
            {journalEntries.length} Asientos
          </span>
        </div>
      </div>

      {/* Buscador de Asientos */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por cuenta, glosa o comprobante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Contenido: Formato Tabular Tradicional Universitario */}
      {viewMode === 'TRADICIONAL' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Nº</th>
                <th className="py-3 px-3 w-24">Fecha</th>
                <th className="py-3 px-3">Cuentas Contables y Glosa</th>
                <th className="py-3 px-3 w-24">Código</th>
                <th className="py-3 px-3 w-32 text-right">Debe ($)</th>
                <th className="py-3 px-3 w-32 text-right">Haber ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron asientos contables.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <React.Fragment key={entry.id}>
                    {/* Encabezado del Asiento */}
                    <tr className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-t-2 border-slate-800">
                      <td className="py-1.5 px-3 text-center font-bold text-indigo-400">
                        #{entry.entryNumber}
                      </td>
                      <td className="py-1.5 px-3">{formatDate(entry.date)}</td>
                      <td colSpan={4} className="py-1.5 px-3 text-slate-300">
                        Comprobante: <strong className="text-white">{entry.voucherNumber}</strong>
                      </td>
                    </tr>

                    {/* Líneas de Cuentas (Partidas) */}
                    {entry.lines.map((line) => {
                      const isDebit = line.debit > 0;
                      return (
                        <tr key={line.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-2 px-3 text-center text-slate-600 font-mono"></td>
                          <td className="py-2 px-3 text-slate-600"></td>
                          <td className="py-2 px-3">
                            <div className={`${isDebit ? 'font-semibold text-white pl-0' : 'pl-8 text-slate-300 flex items-center gap-1.5'}`}>
                              {!isDebit && <span className="text-indigo-400 text-[11px] font-mono">a</span>}
                              <span>{line.accountName}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                            {line.accountCode}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-blue-300">
                            {line.debit > 0 ? formatCurrency(line.debit) : ''}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-emerald-300">
                            {line.credit > 0 ? formatCurrency(line.credit) : ''}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Glosa o Explicación del Asiento */}
                    <tr className="bg-slate-950/20 text-slate-400 text-[11px] italic">
                      <td></td>
                      <td></td>
                      <td colSpan={2} className="py-1.5 px-3">
                        <span className="text-slate-500 font-mono">Concepto:</span> {entry.gloss}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-white border-t border-slate-800/50">
                        {formatCurrency(entry.totalDebit)}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-white border-t border-slate-800/50">
                        {formatCurrency(entry.totalCredit)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vista en Tarjetas */
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Asiento Nº {entry.entryNumber}
                  </span>
                  <span className="text-slate-400">{formatDate(entry.date)}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-mono">{entry.voucherNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cuadrado</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {entry.lines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">{line.accountCode}</span>
                      <span className={line.debit > 0 ? 'font-semibold text-white' : 'pl-4 text-slate-300'}>
                        {line.debit === 0 && <span className="text-indigo-400 mr-1.5">a</span>}
                        {line.accountName}
                      </span>
                    </div>
                    <div className="font-mono">
                      {line.debit > 0 ? (
                        <span className="text-blue-300 font-medium">{formatCurrency(line.debit)}</span>
                      ) : (
                        <span className="text-emerald-300 font-medium">{formatCurrency(line.credit)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span>{entry.gloss}</span>
                <span className="font-mono text-slate-300 not-italic">
                  Total: {formatCurrency(entry.totalDebit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
