import React, { useState } from 'react';
import { 
  GitCommitVertical, 
  Search, 
  Layers, 
  ArrowRight, 
  DollarSign, 
  FileText,
  Printer
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency, formatDate } from '../../utils/currency';

export const LedgerView: React.FC = () => {
  const { ledgerMap, activeExercise } = useAccounting();
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>('TODAS');
  const [viewStyle, setViewStyle] = useState<'T_ACCOUNTS' | 'TABULAR'>('T_ACCOUNTS');

  const allLedgers = Array.from(ledgerMap.values()).filter(l => l.movements.length > 0);

  const displayedLedgers = selectedAccountCode === 'TODAS' 
    ? allLedgers 
    : allLedgers.filter(l => l.account.code === selectedAccountCode);

  return (
    <div className="space-y-6">
      
      {/* Cabecera y Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitCommitVertical className="w-5 h-5 text-indigo-400" />
            Libro Mayor General
          </h2>
          <p className="text-xs text-slate-400">
            Descentralización y control analítico de movimientos y saldos por cuenta contable
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de Cuenta */}
          <select
            value={selectedAccountCode}
            onChange={(e) => setSelectedAccountCode(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="TODAS">Todas las Cuentas con Movimiento ({allLedgers.length})</option>
            {allLedgers.map(l => (
              <option key={l.account.code} value={l.account.code}>
                {l.account.code} - {l.account.name}
              </option>
            ))}
          </select>

          {/* Toggle de Estilo: Cuentas T vs Tabular */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewStyle('T_ACCOUNTS')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                viewStyle === 'T_ACCOUNTS' 
                  ? 'bg-indigo-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Esquemas "T"
            </button>
            <button
              onClick={() => setViewStyle('TABULAR')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                viewStyle === 'TABULAR' 
                  ? 'bg-indigo-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabular Analítico
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Cuentas "T" o Vista Tabular */}
      {displayedLedgers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <GitCommitVertical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No hay movimientos en el Mayor</h3>
          <p className="text-xs text-slate-500">Registra operaciones comerciales para alimentar las cuentas contables.</p>
        </div>
      ) : viewStyle === 'T_ACCOUNTS' ? (
        /* VISTA DE ESQUEMAS EN "T" (didáctica universitaria) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedLedgers.map((ledger) => {
            const debits = ledger.movements.filter(m => m.debit > 0);
            const credits = ledger.movements.filter(m => m.credit > 0);
            const maxRows = Math.max(debits.length, credits.length, 1);

            return (
              <div 
                key={ledger.account.code}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado de la Cuenta T */}
                  <div className="border-b-2 border-indigo-500 pb-2 mb-2 text-center">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                      {ledger.account.code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">
                      {ledger.account.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {ledger.account.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Cuerpo de la "T" (Izquierda: Debe | Derecha: Haber) */}
                  <div className="grid grid-cols-2 divide-x-2 divide-slate-800 text-xs font-mono min-h-[140px]">
                    
                    {/* Columna Izquierda: DEBE */}
                    <div className="pr-2 space-y-1">
                      <div className="text-[10px] uppercase text-blue-400 font-bold tracking-wider text-center border-b border-slate-800/60 pb-1">
                        DEBE
                      </div>
                      {debits.map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] py-0.5">
                          <span className="text-slate-500 text-[10px]">As.{d.entryNumber}</span>
                          <span className="text-blue-300 font-medium">{formatCurrency(d.debit)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Columna Derecha: HABER */}
                    <div className="pl-2 space-y-1">
                      <div className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider text-center border-b border-slate-800/60 pb-1">
                        HABER
                      </div>
                      {credits.map((c, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] py-0.5">
                          <span className="text-slate-500 text-[10px]">As.{c.entryNumber}</span>
                          <span className="text-emerald-300 font-medium">{formatCurrency(c.credit)}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Pie de la Cuenta T: Sumas y Saldo Final */}
                <div className="mt-4 pt-2 border-t-2 border-slate-800 font-mono text-xs">
                  <div className="grid grid-cols-2 divide-x-2 divide-slate-800 pb-2">
                    <div className="pr-2 text-right font-bold text-white">
                      {formatCurrency(ledger.totalDebit)}
                    </div>
                    <div className="pl-2 text-right font-bold text-white">
                      {formatCurrency(ledger.totalCredit)}
                    </div>
                  </div>

                  <div className={`p-2 rounded-xl text-center font-bold text-xs border ${
                    ledger.balanceNature === 'DEUDOR' 
                      ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' 
                      : ledger.balanceNature === 'ACREEDOR' 
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {ledger.balanceNature === 'CERO' ? (
                      <span>Cuenta Saldada ($ 0,00)</span>
                    ) : (
                      <span>
                        Saldo {ledger.balanceNature}: {formatCurrency(ledger.balance)}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA TABULAR ANALÍTICA */
        <div className="space-y-6">
          {displayedLedgers.map((ledger) => (
            <div key={ledger.account.code} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold">
                    {ledger.account.code}
                  </span>
                  <h3 className="text-base font-bold text-white">{ledger.account.name}</h3>
                  <span className="text-xs text-slate-400">({ledger.account.type})</span>
                </div>
                <div className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
                  Saldo {ledger.balanceNature}: <span className="text-indigo-300">{formatCurrency(ledger.balance)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Asiento</th>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Comprobante</th>
                      <th className="py-2 px-3 font-sans">Glosa / Concepto</th>
                      <th className="py-2 px-3 text-right">Debe ($)</th>
                      <th className="py-2 px-3 text-right">Haber ($)</th>
                      <th className="py-2 px-3 text-right">Saldo Acumulado ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {ledger.movements.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-indigo-400">#{m.entryNumber}</td>
                        <td className="py-2 px-3 text-slate-400">{formatDate(m.date)}</td>
                        <td className="py-2 px-3 text-white">{m.voucherNumber}</td>
                        <td className="py-2 px-3 font-sans text-slate-300 truncate max-w-xs">{m.gloss}</td>
                        <td className="py-2 px-3 text-right text-blue-300">
                          {m.debit > 0 ? formatCurrency(m.debit) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-300">
                          {m.credit > 0 ? formatCurrency(m.credit) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {formatCurrency(m.runningBalance)} <span className="text-[10px] text-slate-400 font-normal">({m.balanceNature[0]})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-800 font-bold text-white bg-slate-950/60">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 uppercase font-sans text-right">Totales:</td>
                      <td className="py-2.5 px-3 text-right text-blue-300">{formatCurrency(ledger.totalDebit)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-300">{formatCurrency(ledger.totalCredit)}</td>
                      <td className="py-2.5 px-3 text-right text-indigo-300">{formatCurrency(ledger.balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
