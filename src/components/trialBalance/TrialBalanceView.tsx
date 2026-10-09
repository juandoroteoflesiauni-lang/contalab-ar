import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Download, 
  Printer, 
  Sparkles,
  Search
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency } from '../../utils/currency';

export const TrialBalanceView: React.FC = () => {
  const { trialBalance, activeExercise } = useAccounting();
  const [filterType, setFilterType] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = trialBalance.rows.filter(row => {
    const matchesFilter = filterType === 'TODAS' || row.accountType === filterType;
    const matchesSearch = 
      row.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.accountCode.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            Balance de Comprobación de Sumas y Saldos
          </h2>
          <p className="text-xs text-slate-400">
            Control de consistencia aritmética y previa a los estados contables de publicación
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition no-print self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-400" />
          <span>Imprimir Balance</span>
        </button>
      </div>

      {/* Tarjetas de Verificación Aritmética */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Verificación 1: Sumas del Debe y del Haber */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          trialBalance.isSumsBalanced 
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
        }`}>
          <div>
            <div className="text-[11px] uppercase font-mono tracking-wider font-semibold">
              1. Igualdad de Sumas (Libro Diario)
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatCurrency(trialBalance.totalDebitSum)} = {formatCurrency(trialBalance.totalCreditSum)}
            </div>
            <div className="text-xs mt-1">
              {trialBalance.isSumsBalanced 
                ? '✓ Sumas balanceadas perfectamente' 
                : `Diferencia de Sumas: ${formatCurrency(trialBalance.sumsDifference)}`}
            </div>
          </div>
          {trialBalance.isSumsBalanced ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0 animate-pulse" />
          )}
        </div>

        {/* Verificación 2: Saldos Deudores y Acreedores */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          trialBalance.isBalancesBalanced 
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
        }`}>
          <div>
            <div className="text-[11px] uppercase font-mono tracking-wider font-semibold">
              2. Igualdad de Saldos (Libro Mayor)
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatCurrency(trialBalance.totalDebitBalance)} = {formatCurrency(trialBalance.totalCreditBalance)}
            </div>
            <div className="text-xs mt-1">
              {trialBalance.isBalancesBalanced 
                ? '✓ Saldos deudores y acreedores idénticos' 
                : `Diferencia de Saldos: ${formatCurrency(trialBalance.balancesDifference)}`}
            </div>
          </div>
          {trialBalance.isBalancesBalanced ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0 animate-pulse" />
          )}
        </div>

      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'TODAS', label: 'Todas las Cuentas' },
            { id: 'ACTIVO', label: 'Activo' },
            { id: 'PASIVO', label: 'Pasivo' },
            { id: 'PATRIMONIO_NETO', label: 'P. Neto' },
            { id: 'RESULTADO_POSITIVO', label: 'R. Positivos' },
            { id: 'RESULTADO_NEGATIVO', label: 'R. Negativos' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
      </div>

      {/* Tabla de 4 Columnas del Balance de Comprobación */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-center font-sans">
                Identificación de la Cuenta
              </th>
              <th colSpan={2} className="py-2.5 px-3 border-r border-slate-800 text-center text-blue-300 bg-blue-950/20 font-sans">
                Sumas
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center text-emerald-300 bg-emerald-950/20 font-sans">
                Saldos
              </th>
            </tr>
            <tr className="bg-slate-950/90 text-slate-400 text-[10px] border-b border-slate-800 uppercase font-sans">
              <th className="py-2 px-3 w-20">Código</th>
              <th className="py-2 px-3">Cuenta Contable</th>
              <th className="py-2 px-3 w-32 border-r border-slate-800">Rubro</th>

              <th className="py-2 px-3 text-right bg-blue-950/10 text-blue-200">Debe ($)</th>
              <th className="py-2 px-3 text-right border-r border-slate-800 bg-blue-950/10 text-blue-200">Haber ($)</th>

              <th className="py-2 px-3 text-right bg-emerald-950/10 text-emerald-200">Deudor ($)</th>
              <th className="py-2 px-3 text-right bg-emerald-950/10 text-emerald-200">Acreedor ($)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  No se encontraron cuentas contables con movimientos.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.accountCode} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 text-indigo-400 font-bold">{row.accountCode}</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-white">{row.accountName}</td>
                  <td className="py-2.5 px-3 border-r border-slate-800 font-sans text-[11px] text-slate-400">
                    {row.accountType.replace(/_/g, ' ')}
                  </td>

                  {/* Sumas */}
                  <td className="py-2.5 px-3 text-right text-blue-300">
                    {row.totalDebit > 0 ? formatCurrency(row.totalDebit) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-800 text-blue-300">
                    {row.totalCredit > 0 ? formatCurrency(row.totalCredit) : '-'}
                  </td>

                  {/* Saldos */}
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {row.debitBalance > 0 ? formatCurrency(row.debitBalance) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {row.creditBalance > 0 ? formatCurrency(row.creditBalance) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Fila de Totales Generales */}
          <tfoot className="bg-slate-950 text-white font-bold border-t-2 border-slate-800 text-xs">
            <tr>
              <td colSpan={3} className="py-3 px-3 uppercase font-sans border-r border-slate-800">
                Totales de Control:
              </td>
              <td className="py-3 px-3 text-right text-blue-300">
                {formatCurrency(trialBalance.totalDebitSum)}
              </td>
              <td className="py-3 px-3 text-right border-r border-slate-800 text-blue-300">
                {formatCurrency(trialBalance.totalCreditSum)}
              </td>
              <td className="py-3 px-3 text-right text-emerald-300">
                {formatCurrency(trialBalance.totalDebitBalance)}
              </td>
              <td className="py-3 px-3 text-right text-emerald-300">
                {formatCurrency(trialBalance.totalCreditBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};
